/**
 * chatbot-widget.js
 * 미래역량AI연구소 — 다른 HTML 페이지에 삽입 가능한 채팅 위젯
 *
 * 사용법:
 *   <script src="js/chatbot-widget.js"></script>
 *   <script>initChatbot();</script>
 */

(function (window) {
  'use strict';

  // ─────────────────────────────────────────────
  // 설정
  // ─────────────────────────────────────────────
  const WIDGET_CONFIG = {
    title:       'AI 학습 도우미',
    subtitle:    '미래역량AI연구소',
    placeholder: '질문을 입력하세요...',
    quickQuestions: [
      'AI 입문 영상 추천해줘',
      'GPT 활용법 알려줘',
      '오늘 뭐 볼까?',
      '프롬프트 잘 쓰는 법',
    ],
    themeColor:  '#1E40AF',
    accentColor: '#7C3AED',
    bgColor:     '#0F172A',
  };

  // ─────────────────────────────────────────────
  // 인라인 CSS
  // ─────────────────────────────────────────────
  const WIDGET_CSS = `
    #fcai-chat-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, ${WIDGET_CONFIG.themeColor}, ${WIDGET_CONFIG.accentColor});
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(124,58,237,.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      transition: transform .2s, box-shadow .2s;
    }
    #fcai-chat-fab:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(124,58,237,.7); }
    #fcai-chat-fab svg   { width: 26px; height: 26px; fill: #fff; }

    #fcai-chat-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #EF4444;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      display: none;
    }

    #fcai-chat-panel {
      position: fixed;
      bottom: 92px;
      right: 24px;
      width: 360px;
      max-height: 520px;
      border-radius: 16px;
      background: ${WIDGET_CONFIG.bgColor};
      border: 1px solid rgba(255,255,255,.1);
      box-shadow: 0 16px 48px rgba(0,0,0,.6);
      display: flex;
      flex-direction: column;
      z-index: 9999;
      overflow: hidden;
      transform: translateY(16px) scale(.97);
      opacity: 0;
      pointer-events: none;
      transition: transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s;
    }
    #fcai-chat-panel.open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: auto;
    }

    #fcai-chat-header {
      background: linear-gradient(135deg, ${WIDGET_CONFIG.themeColor}, ${WIDGET_CONFIG.accentColor});
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    #fcai-chat-header h3 {
      margin: 0;
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #fcai-chat-header p {
      margin: 2px 0 0;
      color: rgba(255,255,255,.75);
      font-size: 11px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #fcai-chat-close {
      background: rgba(255,255,255,.15);
      border: none;
      border-radius: 8px;
      color: #fff;
      cursor: pointer;
      padding: 4px 8px;
      font-size: 16px;
      line-height: 1;
      transition: background .15s;
    }
    #fcai-chat-close:hover { background: rgba(255,255,255,.3); }

    #fcai-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,.1) transparent;
    }

    .fcai-msg {
      max-width: 82%;
      padding: 10px 13px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      word-break: break-word;
    }
    .fcai-msg.user {
      align-self: flex-end;
      background: linear-gradient(135deg, ${WIDGET_CONFIG.themeColor}, ${WIDGET_CONFIG.accentColor});
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .fcai-msg.ai {
      align-self: flex-start;
      background: rgba(255,255,255,.07);
      color: #E2E8F0;
      border-bottom-left-radius: 4px;
      border: 1px solid rgba(255,255,255,.08);
    }
    .fcai-msg.typing { color: #94A3B8; font-style: italic; }

    .fcai-video-card {
      background: rgba(30,64,175,.2);
      border: 1px solid rgba(30,64,175,.4);
      border-radius: 8px;
      padding: 8px 10px;
      margin-top: 6px;
    }
    .fcai-video-card a {
      color: #60A5FA;
      text-decoration: none;
      font-size: 12px;
      font-weight: 600;
    }
    .fcai-video-card a:hover { text-decoration: underline; }

    #fcai-quick-btns {
      padding: 8px 12px;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      border-top: 1px solid rgba(255,255,255,.06);
      flex-shrink: 0;
    }
    .fcai-quick-btn {
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 20px;
      color: #CBD5E1;
      cursor: pointer;
      font-size: 11px;
      padding: 4px 10px;
      transition: background .15s, color .15s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .fcai-quick-btn:hover {
      background: rgba(30,64,175,.4);
      color: #fff;
      border-color: ${WIDGET_CONFIG.themeColor};
    }

    #fcai-chat-inputbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-top: 1px solid rgba(255,255,255,.08);
      flex-shrink: 0;
    }
    #fcai-chat-input {
      flex: 1;
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 20px;
      color: #E2E8F0;
      font-size: 13px;
      outline: none;
      padding: 8px 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      transition: border-color .15s;
    }
    #fcai-chat-input::placeholder { color: #64748B; }
    #fcai-chat-input:focus { border-color: ${WIDGET_CONFIG.themeColor}; }
    #fcai-chat-send {
      background: linear-gradient(135deg, ${WIDGET_CONFIG.themeColor}, ${WIDGET_CONFIG.accentColor});
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform .15s, opacity .15s;
    }
    #fcai-chat-send:hover  { transform: scale(1.08); }
    #fcai-chat-send:active { transform: scale(.95); }
    #fcai-chat-send:disabled { opacity: .5; cursor: not-allowed; }
    #fcai-chat-send svg { width: 16px; height: 16px; fill: #fff; }

    @media (max-width: 420px) {
      #fcai-chat-panel {
        bottom: 0;
        right: 0;
        width: 100%;
        max-height: 75vh;
        border-radius: 16px 16px 0 0;
      }
      #fcai-chat-fab { bottom: 16px; right: 16px; }
    }
  `;

  // ─────────────────────────────────────────────
  // DOM 생성
  // ─────────────────────────────────────────────

  function _createWidget() {
    if (document.getElementById('fcai-chat-panel')) return; // 중복 방지

    // 스타일 주입
    const style = document.createElement('style');
    style.textContent = WIDGET_CSS;
    document.head.appendChild(style);

    // FAB 버튼
    const fab = document.createElement('button');
    fab.id = 'fcai-chat-fab';
    fab.setAttribute('aria-label', 'AI 채팅 열기');
    fab.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
      <span id="fcai-chat-badge">1</span>
    `;
    document.body.appendChild(fab);

    // 채팅 패널
    const panel = document.createElement('div');
    panel.id = 'fcai-chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'AI 채팅');
    panel.innerHTML = `
      <div id="fcai-chat-header">
        <div>
          <h3>🤖 ${WIDGET_CONFIG.title}</h3>
          <p>${WIDGET_CONFIG.subtitle}</p>
        </div>
        <button id="fcai-chat-close" aria-label="닫기">✕</button>
      </div>
      <div id="fcai-chat-messages"></div>
      <div id="fcai-quick-btns">
        ${WIDGET_CONFIG.quickQuestions
          .map((q) => `<button class="fcai-quick-btn">${q}</button>`)
          .join('')}
      </div>
      <div id="fcai-chat-inputbar">
        <input id="fcai-chat-input" type="text" placeholder="${WIDGET_CONFIG.placeholder}" autocomplete="off" maxlength="300" />
        <button id="fcai-chat-send" aria-label="전송">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    `;
    document.body.appendChild(panel);

    return { fab, panel };
  }

  // ─────────────────────────────────────────────
  // 채팅 로직
  // ─────────────────────────────────────────────

  let _chatHistory = [];
  let _isOpen      = false;
  let _isLoading   = false;

  function _togglePanel() {
    const panel = document.getElementById('fcai-chat-panel');
    const badge = document.getElementById('fcai-chat-badge');
    if (!panel) return;

    _isOpen = !_isOpen;
    panel.classList.toggle('open', _isOpen);

    if (_isOpen) {
      if (badge) badge.style.display = 'none';
      document.getElementById('fcai-chat-input')?.focus();
      if (document.getElementById('fcai-chat-messages').children.length === 0) {
        _addMessage('ai', '안녕하세요! 미래역량AI연구소 학습 도우미입니다. 무엇이 궁금하신가요? 👋');
      }
    }
  }

  function _addMessage(role, text, videoCards = []) {
    const container = document.getElementById('fcai-chat-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `fcai-msg ${role}`;
    div.innerHTML = _escapeHtml(text).replace(/\n/g, '<br>');

    // 영상 카드 추가
    videoCards.forEach((v) => {
      const card = document.createElement('div');
      card.className = 'fcai-video-card';
      card.innerHTML = `<a href="video.html?id=${v.id}" target="_blank">▶ ${_escapeHtml(v.title)}</a>`;
      div.appendChild(card);
    });

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function _showTyping() {
    return _addMessage('ai typing', '...');
  }

  function _removeTyping(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  async function _sendMessage(text) {
    if (!text || !text.trim() || _isLoading) return;
    text = text.trim();

    _addMessage('user', text);
    _chatHistory.push({ role: 'user', text });

    const sendBtn = document.getElementById('fcai-chat-send');
    if (sendBtn) sendBtn.disabled = true;
    _isLoading = true;

    const typingEl = _showTyping();

    try {
      // 영상 컨텍스트 생성
      const videoContext = await _buildVideoContext();

      // Gemini RAG 호출
      let response = '';
      if (typeof chatWithRAG === 'function') {
        response = await chatWithRAG(text, videoContext, _chatHistory.slice(-6));
      } else if (typeof askGemini === 'function') {
        response = await askGemini(text, videoContext);
      } else {
        response = '죄송합니다. AI 모듈이 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.';
      }

      _removeTyping(typingEl);

      // 영상 카드 파싱 (응답에서 영상 추출)
      const videoCards = _extractVideoCards(response, await _getCachedVideos());
      _addMessage('ai', response, videoCards);
      _chatHistory.push({ role: 'ai', text: response });
    } catch (err) {
      _removeTyping(typingEl);
      _addMessage('ai', `오류가 발생했습니다: ${err.message}`);
      console.error('[chatbot-widget]', err);
    } finally {
      _isLoading = false;
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  async function _buildVideoContext() {
    const videos = await _getCachedVideos();
    if (!videos.length) return '';
    return videos
      .slice(0, 60)
      .map((v) => `[${v.id}] ${v.title} (${v.category_id})`)
      .join('\n');
  }

  async function _getCachedVideos() {
    if (window._widgetVideosCache) return window._widgetVideosCache;
    if (typeof getVideos === 'function') {
      const { data } = await getVideos(null, 1, null).catch(() => ({ data: [] }));
      window._widgetVideosCache = data || [];
      return window._widgetVideosCache;
    }
    return [];
  }

  function _extractVideoCards(responseText, videos) {
    if (!videos.length) return [];
    const mentioned = videos.filter((v) =>
      responseText.includes(v.title?.substring(0, 10))
    );
    return mentioned.slice(0, 3);
  }

  function _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─────────────────────────────────────────────
  // 이벤트 바인딩
  // ─────────────────────────────────────────────

  function _bindEvents() {
    document.getElementById('fcai-chat-fab')?.addEventListener('click', _togglePanel);
    document.getElementById('fcai-chat-close')?.addEventListener('click', _togglePanel);

    const input  = document.getElementById('fcai-chat-input');
    const sendBtn = document.getElementById('fcai-chat-send');

    sendBtn?.addEventListener('click', () => {
      if (!input) return;
      _sendMessage(input.value);
      input.value = '';
    });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        _sendMessage(input.value);
        input.value = '';
      }
    });

    document.querySelectorAll('.fcai-quick-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        _sendMessage(btn.textContent);
      });
    });

    // 패널 바깥 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (!_isOpen) return;
      const panel = document.getElementById('fcai-chat-panel');
      const fab   = document.getElementById('fcai-chat-fab');
      if (panel && !panel.contains(e.target) && fab && !fab.contains(e.target)) {
        _togglePanel();
      }
    });
  }

  // ─────────────────────────────────────────────
  // 공개 API
  // ─────────────────────────────────────────────

  /**
   * 채팅 위젯을 초기화합니다.
   * DOM이 준비된 후 호출하세요.
   *
   * @param {object} options - 커스터마이즈 옵션 (선택)
   */
  function initChatbot(options = {}) {
    Object.assign(WIDGET_CONFIG, options);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        _createWidget();
        _bindEvents();
      });
    } else {
      _createWidget();
      _bindEvents();
    }
  }

  // 전역 노출
  window.initChatbot = initChatbot;

})(window);
