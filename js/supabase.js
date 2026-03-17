// Supabase 클라이언트 초기화 및 주요 데이터 함수

// Supabase JS SDK를 CDN에서 동적 로드합니다.
(function loadSupabaseSDK() {
  if (typeof window === 'undefined') return; // Node 환경에서는 skip

  const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';

  const script = document.createElement('script');
  script.src = SUPABASE_CDN;
  script.onload = () => {
    initSupabaseClient();
  };
  script.onerror = () => {
    console.error('[Supabase] CDN 로드 실패. 네트워크 상태를 확인하세요.');
  };
  document.head.appendChild(script);
})();

// Supabase 클라이언트 인스턴스 (전역)
let _supabaseClient = null;

/**
 * Supabase 클라이언트를 초기화합니다.
 * CDN 스크립트 로드 완료 후 자동으로 호출됩니다.
 */
function initSupabaseClient() {
  const url    = APP_CONFIG.SUPABASE_URL;
  const anonKey = APP_CONFIG.SUPABASE_ANON_KEY;

  if (!url || url === 'YOUR_SUPABASE_URL') {
    console.warn('[Supabase] SUPABASE_URL이 설정되지 않았습니다.');
    return;
  }
  if (!anonKey || anonKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.warn('[Supabase] SUPABASE_ANON_KEY가 설정되지 않았습니다.');
    return;
  }

  _supabaseClient = supabase.createClient(url, anonKey);
  console.log('[Supabase] 클라이언트 초기화 완료');

  // 전역 노출
  window._supabaseClient = _supabaseClient;
}

/**
 * 클라이언트 인스턴스를 반환합니다.
 * 초기화 전 호출 시 null을 반환합니다.
 *
 * @returns {object|null}
 */
function getSupabaseClient() {
  return _supabaseClient;
}

// ─────────────────────────────────────────────
// 영상 관련 함수
// ─────────────────────────────────────────────

/**
 * 영상 목록을 조회합니다.
 * 카테고리, 페이지, 검색어로 필터링할 수 있습니다.
 *
 * @param {string|null} categoryId - 카테고리 ID (null이면 전체)
 * @param {number}      page       - 페이지 번호 (1부터 시작)
 * @param {string|null} searchQuery - 검색어 (null이면 전체)
 * @returns {Promise<{data: Array, count: number, error: object|null}>}
 */
async function getVideos(categoryId = null, page = 1, searchQuery = null) {
  const client = getSupabaseClient();
  if (!client) return { data: [], count: 0, error: new Error('Supabase 클라이언트가 초기화되지 않았습니다.') };

  const pageSize = APP_CONFIG.PAGE_SIZE || 20;
  const from     = (page - 1) * pageSize;
  const to       = from + pageSize - 1;

  let query = client
    .from('videos')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(from, to);

  if (categoryId && categoryId !== 'all') {
    query = query.eq('category_id', categoryId);
  }

  if (searchQuery && searchQuery.trim() !== '') {
    query = query.ilike('title', `%${searchQuery.trim()}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('[Supabase] getVideos 오류:', error.message);
    return { data: [], count: 0, error };
  }

  return { data: data || [], count: count || 0, error: null };
}

/**
 * 특정 영상의 상세 정보를 조회합니다.
 *
 * @param {string} videoId - YouTube 영상 ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
async function getVideo(videoId) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase 클라이언트가 초기화되지 않았습니다.') };

  const { data, error } = await client
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .single();

  if (error) {
    console.error('[Supabase] getVideo 오류:', error.message);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * 카테고리별 영상 수 통계를 조회합니다.
 *
 * @returns {Promise<{data: Array, error: object|null}>}
 */
async function getCategories() {
  const client = getSupabaseClient();
  if (!client) return { data: [], error: new Error('Supabase 클라이언트가 초기화되지 않았습니다.') };

  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('video_count', { ascending: false });

  if (error) {
    console.error('[Supabase] getCategories 오류:', error.message);
    return { data: [], error };
  }

  return { data: data || [], error: null };
}

/**
 * 영상 배열을 Supabase에 배치로 upsert 합니다.
 * id 기준으로 이미 존재하면 업데이트, 없으면 삽입합니다.
 *
 * @param {Array<object>} videos - 업로드할 영상 배열
 * @returns {Promise<{data: Array, error: object|null}>}
 */
async function upsertVideos(videos) {
  const client = getSupabaseClient();
  if (!client) return { data: [], error: new Error('Supabase 클라이언트가 초기화되지 않았습니다.') };

  if (!Array.isArray(videos) || videos.length === 0) {
    return { data: [], error: new Error('업로드할 영상 데이터가 없습니다.') };
  }

  const { data, error } = await client
    .from('videos')
    .upsert(videos, { onConflict: 'id', ignoreDuplicates: false });

  if (error) {
    console.error('[Supabase] upsertVideos 오류:', error.message);
    return { data: [], error };
  }

  return { data: data || [], error: null };
}

// ─────────────────────────────────────────────
// 학습 진도 관련 함수
// ─────────────────────────────────────────────

/**
 * 사용자의 영상 시청 진도를 저장하거나 업데이트합니다.
 *
 * @param {string}  userId    - 사용자 UUID (Supabase auth.uid())
 * @param {string}  videoId   - YouTube 영상 ID
 * @param {boolean} completed - 시청 완료 여부
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
async function saveProgress(userId, videoId, completed = false) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase 클라이언트가 초기화되지 않았습니다.') };

  const record = {
    user_id:    userId,
    video_id:   videoId,
    completed:  completed,
    watched_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from('learning_progress')
    .upsert(record, { onConflict: 'user_id,video_id', ignoreDuplicates: false });

  if (error) {
    console.error('[Supabase] saveProgress 오류:', error.message);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * 사용자의 전체 학습 진도 목록을 조회합니다.
 *
 * @param {string} userId - 사용자 UUID
 * @returns {Promise<{data: Array, error: object|null}>}
 */
async function getProgress(userId) {
  const client = getSupabaseClient();
  if (!client) return { data: [], error: new Error('Supabase 클라이언트가 초기화되지 않았습니다.') };

  const { data, error } = await client
    .from('learning_progress')
    .select('*, videos(title, thumbnail_url, category_id)')
    .eq('user_id', userId)
    .order('watched_at', { ascending: false });

  if (error) {
    console.error('[Supabase] getProgress 오류:', error.message);
    return { data: [], error };
  }

  return { data: data || [], error: null };
}

// 전역 노출
if (typeof window !== 'undefined') {
  window.getSupabaseClient = getSupabaseClient;
  window.getVideos         = getVideos;
  window.getVideo          = getVideo;
  window.getCategories     = getCategories;
  window.upsertVideos      = upsertVideos;
  window.saveProgress      = saveProgress;
  window.getProgress       = getProgress;
}
