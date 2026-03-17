/**
 * sw.js — Service Worker
 * 미래역량AI연구소 학습 플랫폼
 * 오프라인 캐싱 + Push 알림 수신
 */

const CACHE_VERSION   = 'fcai-v1.0.0';
const STATIC_CACHE    = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE   = `${CACHE_VERSION}-dynamic`;
const MAX_DYNAMIC     = 50;

// 오프라인 캐싱할 정적 파일 목록
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/categories.html',
  '/video.html',
  '/search.html',
  '/login.html',
  '/dashboard.html',
  '/chatbot.html',
  '/js/config.js',
  '/js/categories-data.js',
  '/js/supabase.js',
  '/js/gemini.js',
  '/js/learning-tracker.js',
  '/js/recommendations.js',
  '/js/notifications.js',
  '/js/chatbot-widget.js',
];

// ─────────────────────────────────────────────
// 설치 (캐시 프리로드)
// ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log(`[SW] 설치 중: ${CACHE_VERSION}`);
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        // 실패해도 SW 설치가 멈추지 않도록 개별 처리
        return Promise.allSettled(
          STATIC_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[SW] 캐시 실패: ${url}`, err.message);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ─────────────────────────────────────────────
// 활성화 (구버전 캐시 정리)
// ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log(`[SW] 활성화: ${CACHE_VERSION}`);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => {
            console.log(`[SW] 구버전 캐시 삭제: ${k}`);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─────────────────────────────────────────────
// Fetch 인터셉트 (캐시 우선 + 네트워크 fallback)
// ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 외부 API(Gemini, Supabase, YouTube)는 캐시하지 않음
  const bypassDomains = [
    'generativelanguage.googleapis.com',
    'supabase.co',
    'googleapis.com',
    'rss2json.com',
    'youtube.com',
    'youtu.be',
    'jsdelivr.net',
  ];
  if (bypassDomains.some((d) => url.hostname.includes(d))) {
    return; // 네트워크 그대로 통과
  }

  // GET 요청만 캐시
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      // 네트워크 요청 + 동적 캐시 저장
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }

          const toCache = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, toCache);
            _trimCache(cache, MAX_DYNAMIC);
          });

          return response;
        })
        .catch(() => {
          // 오프라인 fallback
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          return new Response('오프라인 상태입니다.', {
            status:  503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        });
    })
  );
});

// ─────────────────────────────────────────────
// Push 알림 수신
// ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data?.json() || {};
  } catch {
    payload = { title: '미래역량AI연구소', body: event.data?.text() || '새 알림이 있습니다.' };
  }

  const title   = payload.title   || '미래역량AI연구소';
  const options = {
    body:  payload.body  || '새 콘텐츠가 업데이트되었습니다.',
    icon:  payload.icon  || '/images/logo.png',
    badge: payload.badge || '/images/badge.png',
    tag:   payload.tag   || 'fcai-push',
    data:  payload.data  || { url: '/' },
    actions: [
      { action: 'view',    title: '바로 보기' },
      { action: 'dismiss', title: '닫기' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─────────────────────────────────────────────
// 알림 클릭 핸들러
// ─────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // 없으면 새 탭 열기
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// ─────────────────────────────────────────────
// 메시지 핸들러 (페이지 → SW 통신)
// ─────────────────────────────────────────────
self.addEventListener('message', (event) => {
  const { type, hour } = event.data || {};

  if (type === 'SCHEDULE_REMINDER') {
    console.log(`[SW] 학습 리마인더 예약: ${hour}시`);
    // SW에서는 실시간 타이머를 사용할 수 없으므로 응답만 반환
    // (실제 알림은 notifications.js의 setInterval fallback 사용)
    event.source?.postMessage({ type: 'REMINDER_ACK', hour });
  }

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─────────────────────────────────────────────
// 내부 유틸
// ─────────────────────────────────────────────

/**
 * 동적 캐시 크기를 제한합니다.
 * @param {Cache}  cache  - Cache 인스턴스
 * @param {number} maxItems - 최대 항목 수
 */
async function _trimCache(cache, maxItems) {
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
  }
}
