// Gemini API 연동 핵심 모듈
// 미래역량AI연구소 학습 플랫폼

const GEMINI_API_KEY = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.GEMINI_API_KEY) || 'YOUR_GEMINI_API_KEY';
const GEMINI_MODEL   = 'gemini-1.5-flash';
const GEMINI_BASE    = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.GEMINI_API_BASE)
  || 'https://generativelanguage.googleapis.com/v1beta';

// ─────────────────────────────────────────────
// 내부 유틸
// ─────────────────────────────────────────────

/**
 * Gemini REST API를 호출합니다.
 * Rate Limit(429) 발생 시 최대 3회 재시도합니다.
 *
 * @param {Array}  contents  - Gemini contents 배열
 * @param {number} retry     - 현재 재시도 횟수
 * @returns {Promise<string>} 모델 응답 텍스트
 */
async function _callGeminiAPI(contents, retry = 0) {
  const key = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.GEMINI_API_KEY)
    || GEMINI_API_KEY;

  if (!key || key === 'YOUR_GEMINI_API_KEY') {
    throw new Error('[Gemini] API 키가 설정되지 않았습니다. APP_CONFIG.GEMINI_API_KEY를 확인하세요.');
  }

  const url = `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${key}`;

  let response;
  try {
    response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature:     0.7,
          topK:            40,
          topP:            0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });
  } catch (networkErr) {
    throw new Error(`[Gemini] 네트워크 오류: ${networkErr.message}`);
  }

  // Rate Limit 재시도
  if (response.status === 429) {
    if (retry >= 3) throw new Error('[Gemini] Rate Limit 초과. 잠시 후 다시 시도하세요.');
    const wait = (retry + 1) * 2000; // 2s, 4s, 6s
    console.warn(`[Gemini] Rate Limit. ${wait / 1000}초 후 재시도 (${retry + 1}/3)...`);
    await new Promise((r) => setTimeout(r, wait));
    return _callGeminiAPI(contents, retry + 1);
  }

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`[Gemini] API 오류 ${response.status}: ${errBody}`);
  }

  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('[Gemini] 응답에서 텍스트를 추출할 수 없습니다.');
  return text.trim();
}

// ─────────────────────────────────────────────
// 공개 함수
// ─────────────────────────────────────────────

/**
 * Gemini에게 질문합니다.
 *
 * @param {string} prompt   - 사용자 질문
 * @param {string} context  - 추가 컨텍스트 (선택)
 * @returns {Promise<string>}
 */
async function askGemini(prompt, context = '') {
  const systemPrompt = `당신은 미래역량AI연구소의 AI 학습 도우미입니다.
학습자가 AI, ChatGPT, 프롬프트 엔지니어링, 자동화 등에 대해 질문하면
친절하고 명확하게 한국어로 답변해주세요.
답변은 2~3문단 이내로 간결하게 작성하세요.${context ? `\n\n참고 정보:\n${context}` : ''}`;

  const contents = [
    { role: 'user', parts: [{ text: `${systemPrompt}\n\n질문: ${prompt}` }] },
  ];

  try {
    return await _callGeminiAPI(contents);
  } catch (err) {
    console.error('[askGemini]', err.message);
    return `죄송합니다. 현재 AI 응답을 가져올 수 없습니다. (${err.message})`;
  }
}

/**
 * 영상 제목과 설명을 받아 요약을 생성합니다.
 *
 * @param {string} title       - 영상 제목
 * @param {string} description - 영상 설명
 * @returns {Promise<string>}
 */
async function summarizeVideo(title, description = '') {
  const prompt = `다음 YouTube 영상을 3문장 이내로 요약해주세요.
학습자가 이 영상을 볼지 결정할 수 있도록 핵심 내용을 담아주세요.

제목: ${title}
설명: ${description || '(설명 없음)'}

요약:`;

  const contents = [{ role: 'user', parts: [{ text: prompt }] }];

  try {
    return await _callGeminiAPI(contents);
  } catch (err) {
    console.error('[summarizeVideo]', err.message);
    return '영상 요약을 생성할 수 없습니다.';
  }
}

/**
 * 시청 기록과 전체 영상 목록을 기반으로 영상을 추천합니다.
 *
 * @param {Array<{title:string, category_id:string}>} watchHistory - 시청한 영상 목록
 * @param {Array<{id:string, title:string, category_id:string}>} allVideos - 전체 영상 목록
 * @returns {Promise<{ids: string[], reason: string}>}
 */
async function recommendVideos(watchHistory, allVideos) {
  if (!watchHistory || watchHistory.length === 0) {
    return { ids: [], reason: '시청 기록이 없어 추천을 생성할 수 없습니다.' };
  }

  const historyText = watchHistory
    .slice(0, 10)
    .map((v) => `- ${v.title} (카테고리: ${v.category_id})`)
    .join('\n');

  const videosText = allVideos
    .slice(0, 50)
    .map((v) => `[ID:${v.id}] ${v.title} (카테고리: ${v.category_id})`)
    .join('\n');

  const prompt = `학습자의 시청 기록을 분석하여 다음 영상 목록에서 3개를 추천해주세요.

## 시청 기록
${historyText}

## 추천 후보 영상 (ID: 제목)
${videosText}

## 응답 형식 (JSON만 출력)
{"ids": ["영상ID1", "영상ID2", "영상ID3"], "reason": "추천 이유를 2문장으로"}`;

  const contents = [{ role: 'user', parts: [{ text: prompt }] }];

  try {
    const raw  = await _callGeminiAPI(contents);
    // JSON 파싱 시도
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return { ids: [], reason: raw };
  } catch (err) {
    console.error('[recommendVideos]', err.message);
    return { ids: [], reason: '추천을 생성할 수 없습니다.' };
  }
}

/**
 * RAG 방식의 채팅: 영상 컨텍스트를 주입하여 답변을 생성합니다.
 *
 * @param {string} userMsg      - 사용자 메시지
 * @param {string} videoContext - 영상 정보 컨텍스트
 * @param {Array<{role:string, text:string}>} chatHistory - 이전 대화 기록
 * @returns {Promise<string>}
 */
async function chatWithRAG(userMsg, videoContext = '', chatHistory = []) {
  const systemText = `당신은 미래역량AI연구소의 AI 학습 도우미입니다.
아래의 영상 데이터베이스를 참고하여 학습자의 질문에 답변하세요.
영상을 추천할 때는 제목과 함께 "더 보기: [제목]" 형식으로 알려주세요.
한국어로 친근하게 답변하세요.

## 영상 데이터베이스
${videoContext || '(데이터 없음)'}`;

  // 대화 히스토리 변환 (최근 6개 턴)
  const history = chatHistory.slice(-6).map((msg) => ({
    role:  msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  const contents = [
    { role: 'user',  parts: [{ text: systemText }] },
    { role: 'model', parts: [{ text: '알겠습니다. 영상 데이터베이스를 참고하여 도움을 드리겠습니다.' }] },
    ...history,
    { role: 'user',  parts: [{ text: userMsg }] },
  ];

  try {
    return await _callGeminiAPI(contents);
  } catch (err) {
    console.error('[chatWithRAG]', err.message);
    return `죄송합니다. 현재 응답을 생성할 수 없습니다. (${err.message})`;
  }
}

// 전역 노출
if (typeof window !== 'undefined') {
  window.askGemini       = askGemini;
  window.summarizeVideo  = summarizeVideo;
  window.recommendVideos = recommendVideos;
  window.chatWithRAG     = chatWithRAG;
}
