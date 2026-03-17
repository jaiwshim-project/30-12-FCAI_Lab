// 알림 시스템
// 미래역량AI연구소 학습 플랫폼
// Web Push API + 브라우저 알림 + YouTube RSS 폴링

const NOTIF_PREF_KEY   = 'fcai_notif_prefs';
const NOTIF_SEEN_KEY   = 'fcai_notif_seen';
const YT_CHANNEL_ID    = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.CHANNEL_ID)
  || 'UCFd8HoNePip4UK16PhgUVOA';
const YT_RSS_URL       = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`;
const RSS_PROXY        = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(YT_RSS_URL)}`;

// ─────────────────────────────────────────────
// 권한 요청
// ─────────────────────────────────────────────

/**
 * 브라우저 알림 권한을 요청합니다.
 *
 * @returns {Promise<'granted'|'denied'|'default'>}
 */
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('[Notifications] 이 브라우저는 알림을 지원하지 않습니다.');
    return 'denied';
  }

  if (Notification.permission === 'granted') return 'granted';

  try {
    const permission = await Notification.requestPermission();
    console.log(`[Notifications] 권한: ${permission}`);

    if (permission === 'granted') {
      _showNotification('알림 설정 완료', {
        body: '미래역량AI연구소에서 학습 알림을 받을 준비가 되었습니다.',
        icon: '/images/logo.png',
      });
    }

    return permission;
  } catch (err) {
    console.error('[requestNotificationPermission]', err.message);
    return 'denied';
  }
}

// ─────────────────────────────────────────────
// 학습 리마인더
// ─────────────────────────────────────────────

/**
 * 매일 지정한 시간에 학습 알림을 예약합니다.
 * Service Worker가 없을 경우 setInterval fallback을 사용합니다.
 *
 * @param {number} hour - 알림 시간 (0~23), 기본 20시
 * @returns {Promise<void>}
 */
async function scheduleStudyReminder(hour = 20) {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') {
    console.warn('[scheduleStudyReminder] 알림 권한이 없습니다.');
    return;
  }

  // 설정 저장
  const prefs = _loadPrefs();
  prefs.reminderHour    = hour;
  prefs.reminderEnabled = true;
  _savePrefs(prefs);

  // Service Worker 등록 시도
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg.active) {
        reg.active.postMessage({
          type: 'SCHEDULE_REMINDER',
          hour,
        });
        console.log(`[scheduleStudyReminder] SW에 ${hour}시 알림 예약 전달`);
        return;
      }
    } catch (err) {
      console.warn('[scheduleStudyReminder] SW 사용 불가, fallback 사용:', err.message);
    }
  }

  // setInterval fallback: 1분마다 현재 시각 체크
  _startReminderInterval(hour);
  console.log(`[scheduleStudyReminder] Interval fallback — 매일 ${hour}시 알림 예약됨`);
}

/**
 * 학습 리마인더를 해제합니다.
 */
function cancelStudyReminder() {
  const prefs = _loadPrefs();
  prefs.reminderEnabled = false;
  _savePrefs(prefs);

  if (window._reminderIntervalId) {
    clearInterval(window._reminderIntervalId);
    window._reminderIntervalId = null;
  }

  console.log('[cancelStudyReminder] 학습 알림이 해제되었습니다.');
}

// ─────────────────────────────────────────────
// 새 영상 알림 (YouTube RSS 폴링)
// ─────────────────────────────────────────────

/**
 * YouTube RSS를 폴링하여 새 영상 알림을 표시합니다.
 * 이미 알린 영상은 제외합니다.
 *
 * @returns {Promise<void>}
 */
async function checkNewVideos() {
  if (Notification.permission !== 'granted') return;

  try {
    const response = await fetch(RSS_PROXY);
    if (!response.ok) throw new Error(`RSS fetch 실패: ${response.status}`);

    const json  = await response.json();
    const items = (json.items || []).slice(0, 5); // 최신 5개만 체크

    const seenIds = _loadSeenIds();
    let newCount  = 0;

    for (const item of items) {
      const videoId = item.guid?.split('=').pop() || item.link?.split('=').pop() || item.guid;
      if (!videoId || seenIds.has(videoId)) continue;

      seenIds.add(videoId);
      newCount++;

      if (newCount <= 1) {
        // 첫 번째 새 영상만 알림 표시 (스팸 방지)
        _showNotification('새 영상 업로드!', {
          body:  item.title || '새로운 영상이 업로드되었습니다.',
          icon:  item.thumbnail || '/images/logo.png',
          data:  { url: item.link || `https://youtube.com/watch?v=${videoId}` },
          tag:   `new-video-${videoId}`,
        });
      }
    }

    if (newCount > 0) {
      _saveSeenIds(seenIds);
      console.log(`[checkNewVideos] 새 영상 ${newCount}개 감지`);
    }
  } catch (err) {
    console.warn('[checkNewVideos] RSS 폴링 실패:', err.message);
  }
}

/**
 * 새 영상 폴링을 시작합니다 (주기: 기본 30분).
 *
 * @param {number} intervalMs - 폴링 주기 (ms), 기본 30분
 */
function startNewVideoPolling(intervalMs = 30 * 60 * 1000) {
  if (window._videoPollingId) return; // 이미 실행 중

  checkNewVideos(); // 즉시 1회 실행
  window._videoPollingId = setInterval(checkNewVideos, intervalMs);
  console.log(`[startNewVideoPolling] ${intervalMs / 60000}분 간격으로 폴링 시작`);
}

/**
 * 새 영상 폴링을 중단합니다.
 */
function stopNewVideoPolling() {
  if (window._videoPollingId) {
    clearInterval(window._videoPollingId);
    window._videoPollingId = null;
    console.log('[stopNewVideoPolling] 폴링 중단');
  }
}

// ─────────────────────────────────────────────
// 내부 헬퍼
// ─────────────────────────────────────────────

function _showNotification(title, options = {}) {
  if (Notification.permission !== 'granted') return null;

  const notif = new Notification(title, {
    icon:  options.icon  || '/images/logo.png',
    badge: options.badge || '/images/badge.png',
    body:  options.body  || '',
    tag:   options.tag   || 'fcai-notif',
    data:  options.data  || {},
    ...options,
  });

  notif.onclick = (e) => {
    e.preventDefault();
    const url = notif.data?.url;
    if (url) window.open(url, '_blank');
    notif.close();
  };

  return notif;
}

function _loadPrefs() {
  try {
    const raw = localStorage.getItem(NOTIF_PREF_KEY);
    return raw ? JSON.parse(raw) : { reminderHour: 20, reminderEnabled: false };
  } catch {
    return { reminderHour: 20, reminderEnabled: false };
  }
}

function _savePrefs(prefs) {
  try {
    localStorage.setItem(NOTIF_PREF_KEY, JSON.stringify(prefs));
  } catch {}
}

function _loadSeenIds() {
  try {
    const raw = localStorage.getItem(NOTIF_SEEN_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function _saveSeenIds(set) {
  try {
    const arr = Array.from(set).slice(-100); // 최대 100개 유지
    localStorage.setItem(NOTIF_SEEN_KEY, JSON.stringify(arr));
  } catch {}
}

/** setInterval 기반 리마인더 fallback */
function _startReminderInterval(targetHour) {
  if (window._reminderIntervalId) clearInterval(window._reminderIntervalId);

  let lastFiredDate = null;

  window._reminderIntervalId = setInterval(() => {
    const prefs = _loadPrefs();
    if (!prefs.reminderEnabled) {
      clearInterval(window._reminderIntervalId);
      return;
    }

    const now   = new Date();
    const today = now.toISOString().split('T')[0];

    if (now.getHours() === targetHour && lastFiredDate !== today) {
      lastFiredDate = today;
      _showNotification('학습 시간입니다!', {
        body: '오늘의 AI 학습을 시작해보세요. 작은 습관이 큰 변화를 만듭니다.',
        tag:  'study-reminder',
        data: { url: '/' },
      });
    }
  }, 60 * 1000); // 1분마다 체크
}

// 페이지 로드 시 저장된 리마인더 복원
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const prefs = _loadPrefs();
    if (prefs.reminderEnabled && Notification.permission === 'granted') {
      _startReminderInterval(prefs.reminderHour);
    }
  });
}

// 전역 노출
if (typeof window !== 'undefined') {
  window.requestNotificationPermission = requestNotificationPermission;
  window.scheduleStudyReminder         = scheduleStudyReminder;
  window.cancelStudyReminder           = cancelStudyReminder;
  window.checkNewVideos                = checkNewVideos;
  window.startNewVideoPolling          = startNewVideoPolling;
  window.stopNewVideoPolling           = stopNewVideoPolling;
}
