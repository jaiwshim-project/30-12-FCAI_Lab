// AI 추천 시스템
// 미래역량AI연구소 학습 플랫폼

// ─────────────────────────────────────────────
// 내부 유틸
// ─────────────────────────────────────────────

/**
 * 카테고리별 입문 학습 경로 정의
 */
const BEGINNER_PATHS = {
  'ai-basic':   ['AI 기초', '인공지능 개념', '머신러닝 입문'],
  'gpt':        ['ChatGPT 시작', 'GPT 활용법', '챗GPT 기초'],
  'claude':     ['Claude 소개', 'AI 도구 비교', 'Gemini 활용'],
  'prompt':     ['프롬프트 기초', '프롬프트 작성법', '프롬프트 고급'],
  'automation': ['자동화 입문', 'AI 자동화', '생산성 도구'],
  'education':  ['AI 교육 기초', '강의 활용', '학습 도구'],
  'business':   ['AI 비즈니스', '마케팅 자동화', 'AI 창업'],
  'coding':     ['AI 코딩 보조', 'Python 기초', 'AI 개발'],
};

/**
 * Supabase에서 영상 목록을 가져옵니다 (로컬 캐시 포함).
 * @returns {Promise<Array>}
 */
async function _fetchAllVideos() {
  // 캐시 확인 (5분 유효)
  const cached = sessionStorage.getItem('_all_videos_cache');
  const cachedAt = parseInt(sessionStorage.getItem('_all_videos_cache_at') || '0', 10);
  if (cached && Date.now() - cachedAt < 5 * 60 * 1000) {
    return JSON.parse(cached);
  }

  // Supabase에서 로드 시도
  if (typeof getVideos === 'function') {
    const { data } = await getVideos(null, 1, null).catch(() => ({ data: [] }));
    if (data && data.length > 0) {
      sessionStorage.setItem('_all_videos_cache', JSON.stringify(data));
      sessionStorage.setItem('_all_videos_cache_at', String(Date.now()));
      return data;
    }
  }

  return [];
}

// ─────────────────────────────────────────────
// 공개 함수
// ─────────────────────────────────────────────

/**
 * 사용자의 시청 기록을 기반으로 개인화 추천을 생성합니다.
 *
 * @param {string} userId - 사용자 ID (Supabase auth 또는 localStorage)
 * @returns {Promise<{videos: Array, reason: string}>}
 */
async function getPersonalizedRecommendations(userId) {
  try {
    // 시청 기록 로드
    let watchHistory = [];
    if (userId && typeof getProgress === 'function') {
      const { data } = await getProgress(userId).catch(() => ({ data: [] }));
      watchHistory = data || [];
    } else {
      // localStorage fallback
      const local = localStorage.getItem('watch_history');
      watchHistory = local ? JSON.parse(local) : [];
    }

    const allVideos = await _fetchAllVideos();
    if (allVideos.length === 0) {
      return { videos: [], reason: '영상 데이터를 불러올 수 없습니다.' };
    }

    // 시청한 영상 ID 세트
    const watchedIds = new Set(watchHistory.map((h) => h.video_id || h.id));

    // 시청하지 않은 영상만 후보로
    const candidates = allVideos.filter((v) => !watchedIds.has(v.id));

    if (watchHistory.length === 0) {
      // 시청 기록 없으면 최신 인기 영상 반환
      const trending = candidates.slice(0, 6);
      return { videos: trending, reason: '시청 기록이 없어 최신 인기 영상을 추천합니다.' };
    }

    // Gemini API로 추천 이유 생성
    if (typeof recommendVideos === 'function') {
      const watchedVideos = watchHistory
        .slice(0, 10)
        .map((h) => allVideos.find((v) => v.id === (h.video_id || h.id)))
        .filter(Boolean);

      const result = await recommendVideos(watchedVideos, candidates.slice(0, 50));
      const recommendedVideos = result.ids
        .map((id) => candidates.find((v) => v.id === id))
        .filter(Boolean);

      return {
        videos: recommendedVideos.length > 0 ? recommendedVideos : candidates.slice(0, 6),
        reason: result.reason,
      };
    }

    // Gemini 미사용 시 카테고리 기반 추천
    const categoryCount = {};
    watchHistory.forEach((h) => {
      const v = allVideos.find((v) => v.id === (h.video_id || h.id));
      if (v) categoryCount[v.category_id] = (categoryCount[v.category_id] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const recommended = candidates
      .filter((v) => v.category_id === topCategory)
      .slice(0, 6);

    return {
      videos: recommended.length > 0 ? recommended : candidates.slice(0, 6),
      reason: `'${topCategory}' 카테고리를 주로 학습하셨습니다.`,
    };
  } catch (err) {
    console.error('[getPersonalizedRecommendations]', err.message);
    return { videos: [], reason: '추천을 생성할 수 없습니다.' };
  }
}

/**
 * 특정 영상과 유사한 영상을 추천합니다 (카테고리 + 키워드 매칭).
 *
 * @param {string} videoId - 기준 영상 ID
 * @returns {Promise<Array>}
 */
async function getSimilarVideos(videoId) {
  try {
    const allVideos = await _fetchAllVideos();
    const target = allVideos.find((v) => v.id === videoId);
    if (!target) return [];

    // 같은 카테고리 영상 필터
    const sameCat = allVideos.filter(
      (v) => v.id !== videoId && v.category_id === target.category_id
    );

    // 제목 키워드 겹침 점수 계산
    const targetWords = new Set(
      (target.title || '').toLowerCase().split(/[\s,.\-\[\]()]+/).filter((w) => w.length > 1)
    );

    const scored = sameCat.map((v) => {
      const words = (v.title || '').toLowerCase().split(/[\s,.\-\[\]()]+/).filter((w) => w.length > 1);
      const overlap = words.filter((w) => targetWords.has(w)).length;
      return { ...v, _score: overlap };
    });

    scored.sort((a, b) => b._score - a._score);
    return scored.slice(0, 6).map(({ _score, ...v }) => v);
  } catch (err) {
    console.error('[getSimilarVideos]', err.message);
    return [];
  }
}

/**
 * 조회수 + 최신 기준으로 인기 영상을 반환합니다.
 *
 * @param {number} limit - 반환할 영상 수 (기본 8)
 * @returns {Promise<Array>}
 */
async function getTrendingVideos(limit = 8) {
  try {
    const allVideos = await _fetchAllVideos();
    if (allVideos.length === 0) return [];

    // view_count 내림차순, 없으면 published_at 내림차순
    const sorted = [...allVideos].sort((a, b) => {
      const viewDiff = (b.view_count || 0) - (a.view_count || 0);
      if (viewDiff !== 0) return viewDiff;
      return new Date(b.published_at || 0) - new Date(a.published_at || 0);
    });

    return sorted.slice(0, limit);
  } catch (err) {
    console.error('[getTrendingVideos]', err.message);
    return [];
  }
}

/**
 * 입문자 학습 경로를 반환합니다 (카테고리별 키워드 매칭).
 *
 * @returns {Promise<Array<{category: string, icon: string, videos: Array}>>}
 */
async function getBeginnerPath() {
  try {
    const allVideos = await _fetchAllVideos();
    const categories = (typeof CATEGORIES !== 'undefined' && CATEGORIES) || [];

    const paths = [];

    for (const [catId, keywords] of Object.entries(BEGINNER_PATHS)) {
      const catInfo = categories.find((c) => c.id === catId);
      if (!catInfo) continue;

      // 키워드로 입문 영상 필터
      const beginnerVideos = allVideos
        .filter((v) => {
          if (v.category_id !== catId) return false;
          const titleLower = (v.title || '').toLowerCase();
          return keywords.some((kw) => titleLower.includes(kw.toLowerCase()));
        })
        .slice(0, 3);

      // 키워드 매칭 없으면 카테고리 첫 3개
      const videos =
        beginnerVideos.length > 0
          ? beginnerVideos
          : allVideos.filter((v) => v.category_id === catId).slice(0, 3);

      if (videos.length > 0) {
        paths.push({ category: catInfo.name, icon: catInfo.icon, catId, videos });
      }
    }

    return paths;
  } catch (err) {
    console.error('[getBeginnerPath]', err.message);
    return [];
  }
}

// 전역 노출
if (typeof window !== 'undefined') {
  window.getPersonalizedRecommendations = getPersonalizedRecommendations;
  window.getSimilarVideos               = getSimilarVideos;
  window.getTrendingVideos              = getTrendingVideos;
  window.getBeginnerPath                = getBeginnerPath;
}
