// 미래역량AI연구소 학습 플랫폼 설정
const APP_CONFIG = {
  YOUTUBE_API_KEY:   'AIzaSyBr67zJBqDYm6dTN9ZvapRjSKxJe0mCJMQ',
  CHANNEL_ID:        'UCFd8HoNePip4UK16PhgUVOA',
  SUPABASE_URL:      (typeof window !== 'undefined' && window.SUPABASE_URL)      || 'YOUR_SUPABASE_URL',
  SUPABASE_ANON_KEY: (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) || 'YOUR_SUPABASE_ANON_KEY',
  GEMINI_API_KEY:    (typeof window !== 'undefined' && window.GEMINI_API_KEY)    || 'YOUR_GEMINI_API_KEY',

  // 페이지네이션 기본값
  PAGE_SIZE: 20,

  // YouTube API 엔드포인트
  YT_API_BASE: 'https://www.googleapis.com/youtube/v3',

  // Gemini API 엔드포인트
  GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta',
};

// 전역 노출 (ES Module 미사용 환경 대응)
if (typeof window !== 'undefined') {
  window.APP_CONFIG = APP_CONFIG;
}
