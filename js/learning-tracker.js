// 학습 진도 관리 모듈
// 미래역량AI연구소 학습 플랫폼
// localStorage fallback (Supabase 미연결 시 자동 사용)

const LS_HISTORY_KEY = 'fcai_watch_history';
const LS_STREAK_KEY  = 'fcai_streak';

// ─────────────────────────────────────────────
// 내부 유틸
// ─────────────────────────────────────────────

/**
 * 로컬 스토리지에서 시청 기록을 로드합니다.
 * @returns {Array<{videoId, title, category_id, watchedAt}>}
 */
function _loadLocalHistory() {
  try {
    const raw = localStorage.getItem(LS_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * 로컬 스토리지에 시청 기록을 저장합니다.
 * @param {Array} history
 */
function _saveLocalHistory(history) {
  try {
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.warn('[LearningTracker] localStorage 저장 실패:', err.message);
  }
}

/**
 * 현재 로그인 사용자 ID를 반환합니다.
 * @returns {string|null}
 */
function _getUserId() {
  if (typeof window !== 'undefined' && window._supabaseClient) {
    try {
      const session = window._supabaseClient.auth.getSession();
      return session?.data?.session?.user?.id || null;
    } catch {
      return null;
    }
  }
  return null;
}

// ─────────────────────────────────────────────
// 공개 함수
// ─────────────────────────────────────────────

/**
 * 영상 시청 완료를 처리합니다.
 * Supabase 연결 시 서버에도 저장하고, 항상 localStorage에도 저장합니다.
 *
 * @param {string} videoId   - YouTube 영상 ID
 * @param {object} videoMeta - 영상 메타 정보 { title, category_id }
 * @returns {Promise<void>}
 */
async function markVideoWatched(videoId, videoMeta = {}) {
  if (!videoId) return;

  const now = new Date().toISOString();

  // 로컬 저장
  const history = _loadLocalHistory();
  const existingIdx = history.findIndex((h) => h.videoId === videoId);
  const record = {
    videoId,
    title:       videoMeta.title       || '',
    category_id: videoMeta.category_id || 'etc',
    watchedAt:   now,
    completed:   true,
  };

  if (existingIdx >= 0) {
    history[existingIdx] = record; // 업데이트
  } else {
    history.unshift(record); // 최신 순서 유지
  }
  _saveLocalHistory(history.slice(0, 200)); // 최대 200개 유지

  // 연속 학습일 업데이트
  _updateStreak();

  // Supabase 저장 (연결된 경우)
  const userId = _getUserId();
  if (userId && typeof saveProgress === 'function') {
    try {
      await saveProgress(userId, videoId, true);
    } catch (err) {
      console.warn('[markVideoWatched] Supabase 저장 실패 (로컬만 저장됨):', err.message);
    }
  }
}

/**
 * 시청 기록을 반환합니다.
 * Supabase 연결 시 서버 데이터, 아니면 localStorage 데이터를 반환합니다.
 *
 * @param {number} limit - 최대 반환 수 (기본 50)
 * @returns {Promise<Array>}
 */
async function getWatchHistory(limit = 50) {
  const userId = _getUserId();

  if (userId && typeof getProgress === 'function') {
    try {
      const { data, error } = await getProgress(userId);
      if (!error && data && data.length > 0) {
        return data.slice(0, limit);
      }
    } catch (err) {
      console.warn('[getWatchHistory] Supabase 로드 실패, 로컬 사용:', err.message);
    }
  }

  // localStorage fallback
  return _loadLocalHistory().slice(0, limit);
}

/**
 * 학습 통계를 반환합니다.
 *
 * @returns {Promise<{
 *   totalWatched: number,
 *   totalMinutes: number,
 *   byCategory: Object,
 *   recentActivity: Array,
 *   streak: number
 * }>}
 */
async function getLearningStats() {
  const history = await getWatchHistory(200);

  // 카테고리별 집계
  const byCategory = {};
  history.forEach((h) => {
    const cat = h.category_id || (h.videos?.category_id) || 'etc';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  // 최근 7일 활동
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const recentActivity = history.filter((h) => {
    const watchedAt = new Date(h.watchedAt || h.watched_at || 0);
    return watchedAt >= sevenDaysAgo;
  });

  return {
    totalWatched:   history.length,
    totalMinutes:   history.length * 10, // 영상 평균 10분 추정
    byCategory,
    recentActivity: recentActivity.slice(0, 10),
    streak:         getLearningStreak(),
  };
}

/**
 * 연속 학습일을 반환합니다.
 * @returns {number}
 */
function getLearningStreak() {
  try {
    const raw = localStorage.getItem(LS_STREAK_KEY);
    if (!raw) return 0;
    const { streak, lastDate } = JSON.parse(raw);
    const today = _todayStr();
    const yesterday = _dateStr(new Date(Date.now() - 24 * 3600 * 1000));

    if (lastDate === today || lastDate === yesterday) {
      return streak || 0;
    }
    // 연속이 끊어진 경우
    return 0;
  } catch {
    return 0;
  }
}

/**
 * 특정 영상이 시청되었는지 확인합니다.
 * @param {string} videoId
 * @returns {boolean}
 */
function isVideoWatched(videoId) {
  const history = _loadLocalHistory();
  return history.some((h) => h.videoId === videoId);
}

/**
 * 시청 기록을 초기화합니다 (로컬).
 */
function clearWatchHistory() {
  localStorage.removeItem(LS_HISTORY_KEY);
  localStorage.removeItem(LS_STREAK_KEY);
  console.log('[LearningTracker] 시청 기록이 초기화되었습니다.');
}

// ─────────────────────────────────────────────
// 내부 헬퍼
// ─────────────────────────────────────────────

function _todayStr() {
  return new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

function _dateStr(date) {
  return date.toISOString().split('T')[0];
}

function _updateStreak() {
  try {
    const today = _todayStr();
    const raw = localStorage.getItem(LS_STREAK_KEY);
    let streak = 1;
    let lastDate = today;

    if (raw) {
      const parsed = JSON.parse(raw);
      const yesterday = _dateStr(new Date(Date.now() - 24 * 3600 * 1000));

      if (parsed.lastDate === today) {
        // 오늘 이미 학습함 — 유지
        return;
      } else if (parsed.lastDate === yesterday) {
        // 어제 학습 — 연속 증가
        streak = (parsed.streak || 0) + 1;
      }
      // 그 외는 streak = 1로 리셋
    }

    localStorage.setItem(LS_STREAK_KEY, JSON.stringify({ streak, lastDate }));
  } catch (err) {
    console.warn('[_updateStreak]', err.message);
  }
}

// 전역 노출
if (typeof window !== 'undefined') {
  window.markVideoWatched  = markVideoWatched;
  window.getWatchHistory   = getWatchHistory;
  window.getLearningStats  = getLearningStats;
  window.getLearningStreak = getLearningStreak;
  window.isVideoWatched    = isVideoWatched;
  window.clearWatchHistory = clearWatchHistory;
}
