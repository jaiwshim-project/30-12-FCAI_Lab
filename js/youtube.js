// YouTube Data API v3 연동 — 채널 전체 영상 수집 및 Supabase 동기화

/**
 * 채널의 모든 영상을 YouTube Data API v3로 가져옵니다.
 * 페이지네이션을 자동 처리하며, 진행 상황을 콜백으로 전달합니다.
 *
 * @param {object}   options
 * @param {function} options.onProgress - ({fetched, total}) 형태로 진행 상황 콜백
 * @param {function} options.onError    - (error) 형태로 에러 콜백
 * @returns {Promise<Array>} 영상 객체 배열
 */
async function fetchChannelVideos({ onProgress = null, onError = null } = {}) {
  const apiKey   = APP_CONFIG.YOUTUBE_API_KEY;
  const channelId = APP_CONFIG.CHANNEL_ID;
  const baseUrl  = APP_CONFIG.YT_API_BASE;

  const allVideos    = [];
  let   pageToken    = null;
  let   totalResults = 0;
  let   fetched      = 0;

  console.log(`[YouTube] 채널 ${channelId} 영상 수집 시작`);

  // ─── Step 1: 채널의 업로드 플레이리스트 ID 조회 ───
  let uploadsPlaylistId = null;
  try {
    const channelRes = await fetch(
      `${baseUrl}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    );
    const channelJson = await channelRes.json();

    if (channelJson.error) {
      throw new Error(`YouTube API 오류: ${channelJson.error.message}`);
    }

    uploadsPlaylistId =
      channelJson.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      throw new Error('업로드 플레이리스트를 찾을 수 없습니다.');
    }
    console.log(`[YouTube] 업로드 플레이리스트 ID: ${uploadsPlaylistId}`);
  } catch (err) {
    console.error('[YouTube] 채널 정보 조회 실패:', err.message);
    if (onError) onError(err);
    return [];
  }

  // ─── Step 2: 플레이리스트 아이템 페이지네이션으로 전체 수집 ───
  do {
    try {
      let url =
        `${baseUrl}/playlistItems` +
        `?part=snippet,contentDetails` +
        `&playlistId=${uploadsPlaylistId}` +
        `&maxResults=50` +
        `&key=${apiKey}`;

      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const res  = await fetch(url);
      const json = await res.json();

      if (json.error) {
        throw new Error(`YouTube API 오류: ${json.error.message}`);
      }

      // 첫 번째 응답에서 전체 결과 수 파악
      if (totalResults === 0 && json.pageInfo) {
        totalResults = json.pageInfo.totalResults || 0;
      }

      const items = json.items || [];

      for (const item of items) {
        const snippet        = item.snippet || {};
        const contentDetails = item.contentDetails || {};
        const videoId        = contentDetails.videoId || snippet.resourceId?.videoId;

        if (!videoId) continue;

        const thumbnails = snippet.thumbnails || {};
        const thumbnail  =
          thumbnails.maxres?.url ||
          thumbnails.high?.url   ||
          thumbnails.medium?.url ||
          thumbnails.default?.url || '';

        allVideos.push({
          id:            videoId,
          title:         snippet.title || '',
          published_at:  snippet.publishedAt
            ? snippet.publishedAt.substring(0, 10)
            : null,
          description:   snippet.description
            ? snippet.description.split('\n')[0].substring(0, 500)
            : '',
          url:           `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail_url: thumbnail,
          // 조회수/좋아요/댓글은 별도 videos.list API 호출 필요 (아래 Step 3)
          view_count:    0,
          like_count:    0,
          comment_count: 0,
          category_id:   classifyVideo(snippet.title || ''),
        });
        fetched++;
      }

      // 진행 상황 콜백
      if (onProgress) {
        onProgress({ fetched, total: totalResults });
      }

      pageToken = json.nextPageToken || null;
    } catch (err) {
      console.error('[YouTube] playlistItems 조회 실패:', err.message);
      if (onError) onError(err);
      break;
    }
  } while (pageToken);

  console.log(`[YouTube] 총 ${allVideos.length}개 영상 수집 완료`);

  // ─── Step 3: 영상 통계 정보 보완 (배치 50개씩) ───
  console.log('[YouTube] 영상 통계 정보(조회수/좋아요/댓글) 수집 중...');
  const BATCH = 50;

  for (let i = 0; i < allVideos.length; i += BATCH) {
    const batch = allVideos.slice(i, i + BATCH);
    const ids   = batch.map((v) => v.id).join(',');

    try {
      const statsUrl =
        `${baseUrl}/videos` +
        `?part=statistics` +
        `&id=${ids}` +
        `&key=${apiKey}`;

      const statsRes  = await fetch(statsUrl);
      const statsJson = await statsRes.json();

      if (statsJson.error) {
        console.warn('[YouTube] statistics API 오류:', statsJson.error.message);
        continue;
      }

      for (const item of statsJson.items || []) {
        const stats = item.statistics || {};
        const target = allVideos.find((v) => v.id === item.id);
        if (target) {
          target.view_count    = parseInt(stats.viewCount    || '0', 10);
          target.like_count    = parseInt(stats.likeCount    || '0', 10);
          target.comment_count = parseInt(stats.commentCount || '0', 10);
        }
      }

      if (onProgress) {
        onProgress({ fetched: Math.min(i + BATCH, allVideos.length), total: allVideos.length, phase: 'stats' });
      }
    } catch (err) {
      console.warn('[YouTube] statistics 조회 실패 (배치 건너뜀):', err.message);
    }
  }

  console.log('[YouTube] 영상 수집 전체 완료');
  return allVideos;
}

/**
 * YouTube에서 채널 영상을 가져와 Supabase에 동기화(upsert)합니다.
 *
 * @param {object}   options
 * @param {function} options.onProgress - ({phase, fetched, total, synced}) 콜백
 * @param {function} options.onError    - (error) 콜백
 * @param {function} options.onComplete - ({total, synced}) 콜백
 * @returns {Promise<{total: number, synced: number}>}
 */
async function syncToSupabase({
  onProgress = null,
  onError    = null,
  onComplete = null,
} = {}) {
  console.log('[Sync] YouTube → Supabase 동기화 시작');

  // 1. YouTube에서 전체 영상 수집
  const videos = await fetchChannelVideos({
    onProgress: (p) => {
      if (onProgress) onProgress({ ...p, phase: p.phase || 'fetch' });
    },
    onError,
  });

  if (videos.length === 0) {
    console.warn('[Sync] 수집된 영상이 없습니다. 동기화를 중단합니다.');
    if (onComplete) onComplete({ total: 0, synced: 0 });
    return { total: 0, synced: 0 };
  }

  // 2. Supabase에 배치 upsert (100개씩)
  const BATCH_SIZE = 100;
  let   synced     = 0;

  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    const batch = videos.slice(i, i + BATCH_SIZE);

    const { data, error } = await upsertVideos(batch);

    if (error) {
      console.error(`[Sync] upsert 실패 (offset ${i}):`, error.message);
      if (onError) onError(error);
      continue;
    }

    synced += batch.length;

    if (onProgress) {
      onProgress({
        phase:  'sync',
        fetched: synced,
        total:  videos.length,
        synced,
      });
    }

    console.log(`[Sync] ${synced} / ${videos.length} 동기화 완료`);
  }

  const result = { total: videos.length, synced };
  console.log(`[Sync] 동기화 완료 — 총 ${result.total}개 중 ${result.synced}개 업서트`);

  if (onComplete) onComplete(result);
  return result;
}

// 전역 노출
if (typeof window !== 'undefined') {
  window.fetchChannelVideos = fetchChannelVideos;
  window.syncToSupabase     = syncToSupabase;
}
