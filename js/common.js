/* ============================================================
   미래역량AI연구소 학습 플랫폼 — common.js
   공통 유틸리티: nav 렌더링 · 모바일 메뉴 · 포맷 함수 · 토스트 · URL 파라미터
   ============================================================ */

'use strict';

/* ────────────────────────────────────────────────────────────
   1. 네비게이션 렌더링
   ──────────────────────────────────────────────────────────── */

/**
 * 모든 페이지 공통 네비게이션 HTML을 반환합니다.
 * @param {string} activePage - 현재 페이지 식별자 ('home' | 'categories' | 'search' | 'dashboard' | 'admin')
 */
function renderNav(activePage = '') {
  const navLinks = [
    { id: 'home',       href: 'index.html',       label: '홈',       icon: '🏠' },
    { id: 'categories', href: 'categories.html',  label: '카테고리',  icon: '📂' },
    { id: 'videos',     href: 'videos-list.html', label: '영상목록',  icon: '📺' },
    { id: 'search',     href: 'search.html',      label: '검색',     icon: '🔍' },
    { id: 'dashboard',  href: 'dashboard.html',   label: '대시보드',  icon: '📊' },
  ];

  const linksHTML = navLinks.map(l => `
    <a href="${l.href}" class="nav-link${activePage === l.id ? ' active' : ''}">
      ${l.label}
    </a>
  `).join('');

  const mobileLinksHTML = navLinks.map(l => `
    <a href="${l.href}" class="mobile-menu-link${activePage === l.id ? ' active' : ''}">
      <span>${l.icon}</span>
      <span>${l.label}</span>
    </a>
  `).join('');

  const navHTML = `
    <nav class="nav-bar" id="mainNav">
      <div class="nav-inner">
        <a href="index.html" class="nav-logo" style="padding:0;">
          <img src="assets/logo.svg" alt="미래역량AI연구소" height="44"
            style="height:44px;width:auto;display:block;"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <div style="display:none;align-items:center;gap:8px;">
            <div class="nav-logo-icon">🎓</div>
            <div>
              <div class="nav-logo-text">미래역량AI연구소</div>
              <div class="nav-logo-sub">AI 학습 플랫폼</div>
            </div>
          </div>
        </a>

        <div class="nav-links">${linksHTML}</div>

        <div class="nav-search">
          <div class="search-bar">
            <span class="search-bar-icon">🔍</span>
            <input
              type="text"
              class="search-bar-input"
              id="navSearchInput"
              placeholder="영상 검색..."
              autocomplete="off"
            />
            <button class="search-bar-clear" id="navSearchClear" aria-label="검색어 지우기">✕</button>
          </div>
        </div>

        <div class="nav-actions">
          <span id="navUserArea">
            <a href="login.html" class="btn btn-sm btn-ghost hidden-mobile">로그인</a>
            <a href="login.html" class="btn btn-sm btn-primary hidden-mobile">시작하기</a>
          </span>
          <button class="nav-hamburger" id="navHamburger" aria-label="메뉴 열기" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>

    <div class="mobile-menu" id="mobileMenu" aria-hidden="true">
      <div class="mobile-menu-links">
        ${mobileLinksHTML}
      </div>
      <div id="mobileUserArea" style="padding:8px 0;">
        <a href="login.html" class="btn btn-primary btn-block" style="margin-bottom:8px;">로그인</a>
        <a href="login.html" class="btn btn-ghost btn-block">회원가입</a>
      </div>
    </div>
  `;

  return navHTML;
}

/**
 * document.body 상단에 nav를 삽입합니다.
 * @param {string} activePage
 */
function injectNav(activePage = '') {
  const existing = document.getElementById('mainNav');
  if (existing) return; // 이미 삽입된 경우 스킵

  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderNav(activePage);
  // prepend (body 가장 앞)
  document.body.insertBefore(wrapper, document.body.firstChild);

  // 이벤트 바인딩
  _bindNavEvents();
}

/** 네비게이션 이벤트 (햄버거, 검색, 스크롤) */
function _bindNavEvents() {
  const hamburger = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const nav = document.getElementById('mainNav');

  // 햄버거 토글
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.contains('open');
      hamburger.classList.toggle('open', !isOpen);
      mobileMenu.classList.toggle('open', !isOpen);
      hamburger.setAttribute('aria-expanded', String(!isOpen));
      mobileMenu.setAttribute('aria-hidden', String(isOpen));
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    // 메뉴 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });
  }

  // 스크롤 시 nav 스타일 변경
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 네비 검색바
  const searchInput = document.getElementById('navSearchInput');
  const searchClear = document.getElementById('navSearchClear');
  if (searchInput && searchClear) {
    searchInput.addEventListener('input', () => {
      searchClear.classList.toggle('visible', searchInput.value.length > 0);
    });
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.classList.remove('visible');
      searchInput.focus();
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        window.location.href = `search.html?q=${encodeURIComponent(searchInput.value.trim())}`;
      }
    });
  }

  // 로그인 상태 확인 및 UI 업데이트
  _updateNavUserUI();
}

/** 로그인 상태에 따라 nav 우측 UI 업데이트 */
function _updateNavUserUI() {
  const user = getCurrentUser();
  const navUserArea = document.getElementById('navUserArea');
  const mobileUserArea = document.getElementById('mobileUserArea');

  if (user) {
    const initials = (user.email || '?')[0].toUpperCase();
    if (navUserArea) {
      navUserArea.innerHTML = `
        <a href="dashboard.html" class="btn btn-sm btn-ghost hidden-mobile" title="대시보드">
          <span style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#1E40AF,#7C3AED);display:inline-flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:white;">${initials}</span>
          <span>대시보드</span>
        </a>
      `;
    }
    if (mobileUserArea) {
      mobileUserArea.innerHTML = `
        <a href="dashboard.html" class="btn btn-primary btn-block" style="margin-bottom:8px;">📊 대시보드</a>
        <button class="btn btn-ghost btn-block" onclick="signOut()">로그아웃</button>
      `;
    }
  }
}

/* ────────────────────────────────────────────────────────────
   1-B. 푸터 렌더링
   ──────────────────────────────────────────────────────────── */

/**
 * 모든 페이지 공통 푸터 HTML을 반환합니다.
 */
function renderFooter() {
  return `
  <footer class="site-footer">
    <div class="footer-inner">
      <div>
        <a href="index.html" class="nav-logo" style="margin-bottom:12px;display:inline-flex;">
          <div class="nav-logo-icon">🎓</div>
          <div>
            <div class="nav-logo-text">미래역량AI연구소</div>
            <div class="nav-logo-sub">AI 학습 플랫폼</div>
          </div>
        </a>
        <p class="footer-brand-desc">2,327개의 AI 강의로 미래역량을 키우는 학습 플랫폼입니다. ChatGPT, Claude, 프롬프트 엔지니어링 등 실전 AI 역량을 키우세요.</p>
      </div>
      <div>
        <div class="footer-heading">카테고리</div>
        <div class="footer-links">
          <a href="categories.html?main=ai-digital" class="footer-link">🤖 AI·디지털 역량</a>
          <a href="categories.html?main=business" class="footer-link">💼 비즈니스·경영</a>
          <a href="categories.html?main=education" class="footer-link">📚 교육·학습</a>
          <a href="categories.html?main=art-culture" class="footer-link">🎨 예술·문화</a>
        </div>
      </div>
      <div>
        <div class="footer-heading">서비스</div>
        <div class="footer-links">
          <a href="videos-list.html" class="footer-link">📺 영상목록</a>
          <a href="search.html" class="footer-link">🔍 검색</a>
          <a href="dashboard.html" class="footer-link">📊 대시보드</a>
          <a href="login.html" class="footer-link">🔐 로그인</a>
        </div>
      </div>
      <div>
        <div class="footer-heading">정보</div>
        <div class="footer-links">
          <a href="https://www.youtube.com/@futurecompetency" target="_blank" rel="noopener" class="footer-link">📺 유튜브 채널</a>
          <a href="admin.html" class="footer-link">⚙️ 관리자</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p style="margin-bottom:4px;">© 2024 미래역량AI연구소. All rights reserved.</p>
      <p>Built with ❤️ using Vanilla JS + Supabase + Gemini</p>
    </div>
  </footer>
  `;
}

/**
 * id="siteFooter" 요소에 공통 푸터를 주입합니다.
 */
function injectFooter() {
  const el = document.getElementById('siteFooter');
  if (el) {
    el.outerHTML = renderFooter();
  } else {
    // fallback: body 끝에 추가
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderFooter();
    document.body.appendChild(wrapper.firstElementChild);
  }
}

/* ────────────────────────────────────────────────────────────
   2. 인증 유틸리티 (로컬 세션 기반 간단 구현)
   ──────────────────────────────────────────────────────────── */

/**
 * 현재 로그인된 사용자를 반환합니다. (로컬스토리지 기반)
 * @returns {object|null}
 */
function getCurrentUser() {
  try {
    const raw = localStorage.getItem('fc_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * 로그아웃 처리
 */
function signOut() {
  localStorage.removeItem('fc_user');
  localStorage.removeItem('fc_session');
  showToast('로그아웃되었습니다.', 'info');
  setTimeout(() => { window.location.href = 'index.html'; }, 800);
}

/**
 * 인증이 필요한 페이지에서 호출 — 미로그인 시 login.html 리디렉션
 * @param {string} [redirectTo] - 로그인 후 돌아올 URL
 */
function requireAuth(redirectTo = '') {
  if (!getCurrentUser()) {
    const target = redirectTo || window.location.href;
    window.location.href = `login.html?redirect=${encodeURIComponent(target)}`;
    return false;
  }
  return true;
}

/* ────────────────────────────────────────────────────────────
   3. 숫자 · 날짜 포맷 함수
   ──────────────────────────────────────────────────────────── */

/**
 * 숫자를 한국식 조회수 포맷으로 변환합니다.
 * @param {number|string} n
 * @returns {string} e.g. 1234 → "1.2천", 12345 → "1.2만", 1234567 → "123만"
 */
function formatNumber(n) {
  const num = parseInt(n, 10) || 0;
  if (num >= 100_000_000) return (num / 100_000_000).toFixed(1).replace(/\.0$/, '') + '억';
  if (num >= 10_000)       return (num / 10_000).toFixed(1).replace(/\.0$/, '') + '만';
  if (num >= 1_000)        return (num / 1_000).toFixed(1).replace(/\.0$/, '') + '천';
  return num.toLocaleString('ko-KR');
}

/**
 * ISO 날짜 문자열을 한국식으로 변환합니다.
 * @param {string|Date} d
 * @param {'full'|'short'|'relative'} [format='short']
 * @returns {string}
 */
function formatDate(d, format = 'short') {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';

  if (format === 'relative') {
    const now = Date.now();
    const diff = now - date.getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years  = Math.floor(days / 365);
    if (mins < 1)    return '방금 전';
    if (mins < 60)   return `${mins}분 전`;
    if (hours < 24)  return `${hours}시간 전`;
    if (days < 7)    return `${days}일 전`;
    if (weeks < 5)   return `${weeks}주 전`;
    if (months < 12) return `${months}개월 전`;
    return `${years}년 전`;
  }

  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const day = date.getDate();

  if (format === 'full') {
    return `${y}년 ${m}월 ${day}일`;
  }
  // short: 올해면 월.일, 아니면 연.월.일
  const thisYear = new Date().getFullYear();
  if (y === thisYear) return `${m}.${String(day).padStart(2, '0')}`;
  return `${y}.${String(m).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
}

/**
 * 초(duration)를 "mm:ss" 형식으로 변환합니다.
 * @param {number} seconds
 * @returns {string}
 */
function formatDuration(seconds) {
  const s = parseInt(seconds, 10) || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/* ────────────────────────────────────────────────────────────
   4. 토스트 알림
   ──────────────────────────────────────────────────────────── */

/** 토스트 컨테이너를 body에 삽입 (최초 1회) */
function _ensureToastContainer() {
  if (!document.getElementById('toast-container')) {
    const el = document.createElement('div');
    el.id = 'toast-container';
    document.body.appendChild(el);
  }
  return document.getElementById('toast-container');
}

const TOAST_ICONS = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

/**
 * 화면 우하단에 토스트 알림을 표시합니다.
 * @param {string} message - 메시지 (또는 제목)
 * @param {'success'|'error'|'warning'|'info'} [type='info']
 * @param {string} [detail] - 부가 설명 (선택)
 * @param {number} [duration=3500] - 자동 사라짐 시간 (ms). 0이면 수동 닫기만.
 */
function showToast(message, type = 'info', detail = '', duration = 3500) {
  const container = _ensureToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || 'ℹ️'}</span>
    <div class="toast-body">
      <div class="toast-title">${message}</div>
      ${detail ? `<div class="toast-msg">${detail}</div>` : ''}
    </div>
    <button class="toast-close" aria-label="닫기">✕</button>
  `;

  container.appendChild(toast);

  // 닫기 버튼
  toast.querySelector('.toast-close').addEventListener('click', () => _removeToast(toast));

  // 자동 제거
  if (duration > 0) {
    setTimeout(() => _removeToast(toast), duration);
  }

  return toast;
}

function _removeToast(toastEl) {
  if (!toastEl || !toastEl.parentNode) return;
  toastEl.classList.add('removing');
  setTimeout(() => toastEl.remove(), 250);
}

/* ────────────────────────────────────────────────────────────
   5. URL 파라미터 파싱
   ──────────────────────────────────────────────────────────── */

/**
 * 현재 URL의 쿼리 파라미터를 객체로 반환합니다.
 * @returns {Object<string, string>}
 */
function getUrlParams() {
  const params = {};
  new URLSearchParams(window.location.search).forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

/**
 * 특정 쿼리 파라미터 값을 반환합니다.
 * @param {string} key
 * @param {string} [defaultValue='']
 */
function getUrlParam(key, defaultValue = '') {
  return new URLSearchParams(window.location.search).get(key) ?? defaultValue;
}

/**
 * URL 파라미터를 업데이트하고 pushState로 URL을 변경합니다.
 * @param {Object<string, string|null>} updates - null 값은 파라미터 삭제
 */
function updateUrlParams(updates) {
  const sp = new URLSearchParams(window.location.search);
  Object.entries(updates).forEach(([key, val]) => {
    if (val === null || val === undefined || val === '') {
      sp.delete(key);
    } else {
      sp.set(key, val);
    }
  });
  const newUrl = `${window.location.pathname}${sp.toString() ? '?' + sp.toString() : ''}`;
  window.history.pushState({}, '', newUrl);
}

/* ────────────────────────────────────────────────────────────
   6. DOM 유틸리티
   ──────────────────────────────────────────────────────────── */

/**
 * CSS 선택자로 요소를 찾습니다.
 * @param {string} selector
 * @param {Element|Document} [context=document]
 */
function qs(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * CSS 선택자로 모든 요소를 찾아 배열로 반환합니다.
 */
function qsa(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/**
 * 요소의 HTML을 교체하며 로딩 스피너를 보여줍니다.
 * @param {Element} el
 */
function showLoading(el) {
  if (!el) return;
  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;padding:64px;gap:12px;color:var(--text-muted);">
      <div class="spinner"></div>
      <span>로딩 중...</span>
    </div>
  `;
}

/**
 * 빈 상태 UI를 렌더링합니다.
 */
function renderEmptyState(el, icon = '🎬', title = '콘텐츠가 없습니다', desc = '') {
  if (!el) return;
  el.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <div class="empty-state-title">${title}</div>
      ${desc ? `<div class="empty-state-desc">${desc}</div>` : ''}
    </div>
  `;
}

/* ────────────────────────────────────────────────────────────
   7. 영상 카드 HTML 생성
   ──────────────────────────────────────────────────────────── */

/**
 * 영상 데이터로 카드 HTML 문자열을 생성합니다.
 * @param {object} video - { video_id, title, thumbnail_url, view_count, published_at, category_id }
 * @param {object} [options] - { horizontal: bool, completed: bool }
 */
function renderVideoCard(video, options = {}) {
  const category = (typeof getCategoryById === 'function' && video.category_id)
    ? getCategoryById(video.category_id)
    : null;

  const catBadge = category
    ? `<span class="badge badge-blue">${category.icon} ${category.name}</span>`
    : '';

  const thumb = video.thumbnail_url
    || `https://i.ytimg.com/vi/${video.video_id}/hqdefault.jpg`;

  const completedBadge = options.completed
    ? `<span class="video-card-completed">✓ 완료</span>`
    : '';

  const horizontal = options.horizontal ? ' video-card-horizontal' : '';

  // Udemy-style star rating: 3.5 ~ 5.0 범위에서 조회수 기반 시뮬레이션
  const views = video.view_count || 0;
  const ratingRaw = Math.min(5.0, 3.5 + (views > 0 ? Math.log10(views + 1) * 0.28 : 0));
  const rating = Math.round(ratingRaw * 10) / 10;
  const ratingStr = rating.toFixed(1);
  const fullStars = Math.floor(rating);
  const halfStar = (rating - fullStars) >= 0.4 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  const starsHTML = '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
  const ratingCount = views > 0 ? '(' + formatNumber(Math.floor(views * 0.12 + 1)) + ')' : '(0)';

  return `
    <article class="video-card${horizontal}" onclick="window.location.href='video.html?id=${video.video_id}'" role="link" tabindex="0"
      onkeydown="if(event.key==='Enter')window.location.href='video.html?id=${video.video_id}'">
      <div class="video-card-thumb">
        <img src="${thumb}" alt="${escapeHtml(video.title)}" loading="lazy"
          onerror="this.src='https://i.ytimg.com/vi/${video.video_id}/hqdefault.jpg'">
        <div class="video-card-play"><div class="play-icon">▶</div></div>
        ${completedBadge}
      </div>
      <div class="video-card-body">
        ${catBadge ? '<div class="video-card-category">' + catBadge + '</div>' : ''}
        <h3 class="video-card-title">${escapeHtml(video.title)}</h3>
        <div class="video-card-instructor">미래역량AI연구소</div>
        <div class="video-card-rating">
          <span class="video-card-rating-score">${ratingStr}</span>
          <span class="video-card-stars">${starsHTML}</span>
          <span class="video-card-rating-count">${ratingCount}</span>
        </div>
        <div class="video-card-free">무료</div>
      </div>
    </article>
  `;
}

/**
 * 시리즈 카드 HTML 반환
 */
function renderSeriesCard(series) {
  var thumb = series.thumbnail_url
    || ('https://img.youtube.com/vi/' + series.video_id + '/mqdefault.jpg');
  var epCount = series.episodes.length;
  var totalViews = (series.view_count || 0).toLocaleString();
  var sid = series._seriesId || ('sr' + series.title.replace(/[^a-zA-Z0-9가-힣]/g,'').substring(0,12));

  var catBadge = '';
  if (typeof getCategoryById === 'function' && series.category_id && series.category_id !== 'other') {
    var cat = getCategoryById(series.category_id);
    if (cat) catBadge = '<span class="badge badge-blue">' + cat.icon + ' ' + cat.name + '</span>';
  }

  var episodesHtml = series.episodes.map(function(ep) {
    var epThumb = ep.thumbnail_url
      || ('https://img.youtube.com/vi/' + (ep.video_id || ep.id) + '/mqdefault.jpg');
    var epUrl = ep.url || ('https://youtu.be/' + (ep.video_id || ep.id));
    var views = (ep.view_count || ep.views || 0).toLocaleString();
    return '<a class="episode-item" href="' + epUrl + '" target="_blank" rel="noopener">'
      + '<span class="ep-num">' + ep._episodeNum + '강</span>'
      + '<img class="ep-thumb" src="' + epThumb + '" loading="lazy" onerror="this.style.display=\'none\'">'
      + '<span class="ep-title">' + escapeHtml(ep.title) + '</span>'
      + '<span class="ep-views">👁 ' + views + '</span>'
      + '</a>';
  }).join('');

  return '<div class="series-card">'
    + '<div class="series-card-header" onclick="toggleSeriesCard(\'' + sid + '\')">'
      + '<div class="series-thumb-wrap">'
        + '<img src="' + thumb + '" alt="' + escapeHtml(series.title) + '" loading="lazy">'
        + '<div class="series-ep-count">' + epCount + '강</div>'
      + '</div>'
      + '<div class="series-info">'
        + (catBadge ? '<div class="series-cat">' + catBadge + '</div>' : '')
        + '<h3 class="series-title">' + escapeHtml(series.title) + '</h3>'
        + '<div class="series-meta">총 ' + epCount + '강 &nbsp;·&nbsp; 조회수 합계 ' + totalViews + '</div>'
        + '<button class="series-toggle-btn" id="btn-' + sid + '">▼ 강의 목록 펼치기</button>'
      + '</div>'
    + '</div>'
    + '<div class="series-episodes" id="ep-' + sid + '" style="display:none">'
      + '<div class="episode-list">' + episodesHtml + '</div>'
    + '</div>'
  + '</div>';
}

/**
 * 시리즈 카드 토글
 */
function toggleSeriesCard(sid) {
  var el  = document.getElementById('ep-' + sid);
  var btn = document.getElementById('btn-' + sid);
  if (!el) return;
  var isOpen = el.style.display !== 'none';
  el.style.display = isOpen ? 'none' : 'block';
  if (btn) btn.textContent = isOpen ? '▼ 강의 목록 펼치기' : '▲ 강의 목록 접기';
}

/**
 * 스켈레톤 카드 N개 반환 (로딩 플레이스홀더)
 */
function renderSkeletonCards(count = 8) {
  return Array.from({ length: count }, () => `
    <div class="video-card" aria-busy="true">
      <div class="video-card-thumb skeleton" style="padding-top:56.25%;"></div>
      <div class="video-card-body" style="gap:8px;">
        <div class="skeleton" style="height:14px;width:60%;border-radius:4px;"></div>
        <div class="skeleton" style="height:14px;width:90%;border-radius:4px;"></div>
        <div class="skeleton" style="height:14px;width:75%;border-radius:4px;"></div>
      </div>
    </div>
  `).join('');
}

/* ────────────────────────────────────────────────────────────
   8. 문자열 유틸리티
   ──────────────────────────────────────────────────────────── */

/**
 * XSS 방지를 위한 HTML 이스케이프
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 텍스트에서 검색어 하이라이트 처리 (HTML 반환)
 */
function highlightText(text, query) {
  if (!query || !text) return escapeHtml(text);
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return escapeHtml(text).replace(regex, '<mark style="background:rgba(30,64,175,0.3);color:#93C5FD;border-radius:2px;">$1</mark>');
}

/* ────────────────────────────────────────────────────────────
   9. 로컬스토리지 학습 기록 유틸리티
   ──────────────────────────────────────────────────────────── */

const STORAGE_KEY_WATCH = 'fc_watch_history';
const STORAGE_KEY_COMPLETED = 'fc_completed';

/**
 * 영상 시청 기록 저장
 * @param {string} videoId
 */
function saveWatchHistory(videoId) {
  if (!videoId) return;
  const history = getWatchHistory();
  const filtered = history.filter(id => id !== videoId);
  filtered.unshift(videoId);
  const limited = filtered.slice(0, 50); // 최대 50개
  localStorage.setItem(STORAGE_KEY_WATCH, JSON.stringify(limited));
}

/**
 * 시청 기록 반환 (최신순 videoId 배열)
 */
function getWatchHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_WATCH) || '[]');
  } catch {
    return [];
  }
}

/**
 * 학습 완료 처리
 */
function markCompleted(videoId) {
  if (!videoId) return;
  const completed = getCompleted();
  if (!completed.includes(videoId)) {
    completed.push(videoId);
    localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(completed));
  }
}

/**
 * 완료된 영상 ID 목록 반환
 */
function getCompleted() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_COMPLETED) || '[]');
  } catch {
    return [];
  }
}

/**
 * 영상 완료 여부 확인
 */
function isCompleted(videoId) {
  return getCompleted().includes(videoId);
}

/* ────────────────────────────────────────────────────────────
   10. 페이지네이션 렌더링
   ──────────────────────────────────────────────────────────── */

/**
 * 페이지네이션 HTML 생성
 * @param {number} currentPage - 현재 페이지 (1-based)
 * @param {number} totalPages
 * @param {function} onPageChange - (page) => void
 */
function renderPagination(currentPage, totalPages, onPageChange) {
  if (totalPages <= 1) return '<div></div>';

  const pages = [];
  const maxVisible = 7;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end   = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const btnClass = (p) => `page-btn${p === currentPage ? ' active' : ''}`;

  const btns = pages.map(p => {
    if (p === '...') return `<span style="color:var(--text-muted);padding:0 4px;">…</span>`;
    return `<button class="${btnClass(p)}" data-page="${p}">${p}</button>`;
  }).join('');

  const html = `
    <div class="pagination" id="pagination">
      <button class="page-btn" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>← 이전</button>
      ${btns}
      <button class="page-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>다음 →</button>
    </div>
  `;

  // 이벤트 위임은 caller가 처리하도록 HTML만 반환
  // 단, 즉시 바인딩이 필요하면 아래 setTimeout 사용
  setTimeout(() => {
    const el = document.getElementById('pagination');
    if (!el) return;
    el.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.page, 10);
        if (!isNaN(p) && p !== currentPage) onPageChange(p);
      });
    });
  }, 0);

  return html;
}

/* ────────────────────────────────────────────────────────────
   11. 더미 데이터 (Supabase 미연결 시 Fallback)
   ──────────────────────────────────────────────────────────── */

const DUMMY_VIDEOS = [
  { video_id: 'dQw4w9WgXcQ', title: 'ChatGPT 완전 정복 - 프롬프트 작성의 모든 것', thumbnail_url: '', view_count: 45200, published_at: '2024-11-15', category_id: 'gpt' },
  { video_id: 'abc123def456', title: 'Claude AI로 업무 생산성 10배 높이는 방법', thumbnail_url: '', view_count: 32100, published_at: '2024-11-10', category_id: 'claude' },
  { video_id: 'xyz789abc012', title: '미래역량AI연구소 - AI 기초 완전 정복 강의', thumbnail_url: '', view_count: 28900, published_at: '2024-11-05', category_id: 'ai-basic' },
  { video_id: 'pqr345stu678', title: '자동화 봇 만들기 - Make와 Zapier 실전 가이드', thumbnail_url: '', view_count: 19400, published_at: '2024-10-28', category_id: 'automation' },
  { video_id: 'mno901vwx234', title: '프롬프트 엔지니어링 마스터 클래스', thumbnail_url: '', view_count: 15700, published_at: '2024-10-20', category_id: 'prompt' },
  { video_id: 'efg567hij890', title: 'AI로 그림 그리기 - 미드저니 & 달리 도슨트', thumbnail_url: '', view_count: 12300, published_at: '2024-10-15', category_id: 'art-docent' },
  { video_id: 'klm123nop456', title: '비즈니스 마케팅에 AI 활용하는 5가지 전략', thumbnail_url: '', view_count: 9800, published_at: '2024-10-10', category_id: 'business' },
  { video_id: 'qrs789tuv012', title: '파이썬 코딩을 AI로 3배 빠르게 하는 법', thumbnail_url: '', view_count: 8700, published_at: '2024-10-05', category_id: 'coding' },
  { video_id: 'wxy345zab678', title: 'AI 교육 혁명 - 선생님과 학생을 위한 AI 가이드', thumbnail_url: '', view_count: 7200, published_at: '2024-09-28', category_id: 'education' },
  { video_id: 'cde901fgh234', title: 'GPT-4o 완전 활용 가이드 2024 최신판', thumbnail_url: '', view_count: 6500, published_at: '2024-09-20', category_id: 'gpt' },
  { video_id: 'ijk567lmn890', title: '클로드 소네트 vs GPT-4o 비교 분석', thumbnail_url: '', view_count: 5900, published_at: '2024-09-15', category_id: 'claude' },
  { video_id: 'opq123rst456', title: 'AI 시대 살아남기 - 미래역량 준비 전략', thumbnail_url: '', view_count: 5100, published_at: '2024-09-10', category_id: 'ai-basic' },
].map(v => ({
  ...v,
  thumbnail_url: v.thumbnail_url || `https://i.ytimg.com/vi/${v.video_id}/hqdefault.jpg`,
}));

const DUMMY_CATEGORY_COUNTS = {
  'ai-basic': 312, 'gpt': 485, 'claude': 198, 'prompt': 267,
  'automation': 203, 'education': 341, 'art-docent': 156,
  'business': 189, 'coding': 176, 'etc': 0,
};

/* ────────────────────────────────────────────────────────────
   12. 전역 노출
   ──────────────────────────────────────────────────────────── */
if (typeof window !== 'undefined') {
  Object.assign(window, {
    // nav
    renderNav, injectNav,
    // auth
    getCurrentUser, signOut, requireAuth,
    // 포맷
    formatNumber, formatDate, formatDuration,
    // 토스트
    showToast,
    // URL
    getUrlParams, getUrlParam, updateUrlParams,
    // DOM
    qs, qsa, showLoading, renderEmptyState,
    // 카드
    renderVideoCard, renderSkeletonCards, renderPagination,
    // 문자열
    escapeHtml, highlightText,
    // 학습 기록
    saveWatchHistory, getWatchHistory, markCompleted, getCompleted, isCompleted,
    // 더미 데이터
    DUMMY_VIDEOS, DUMMY_CATEGORY_COUNTS,
  });
}
