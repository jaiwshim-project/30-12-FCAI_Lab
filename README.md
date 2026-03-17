# 미래역량AI연구소 학습 플랫폼

AI·ChatGPT·프롬프트 등 미래역량 관련 YouTube 영상 2,327개를 제공하는 학습 플랫폼입니다.

## 기술 스택

- **프론트엔드**: Vanilla HTML/CSS/JS (빌드 도구 없음)
- **데이터베이스**: Supabase (PostgreSQL)
- **AI**: Google Gemini 1.5 Flash API
- **배포**: Vercel (정적 사이트)
- **디자인**: 다크 테마 (#0F172A 배경, #1E40AF 블루, #7C3AED 퍼플)

## 설정 방법

### 1. 환경변수 설정

Vercel 대시보드 → Settings → Environment Variables에 아래 값을 입력하세요:

| 변수명              | 설명                        |
|---------------------|-----------------------------|
| `SUPABASE_URL`      | Supabase 프로젝트 URL        |
| `SUPABASE_ANON_KEY` | Supabase anon (public) 키   |
| `GEMINI_API_KEY`    | Google Gemini API 키         |
| `YOUTUBE_API_KEY`   | YouTube Data API v3 키 (설정됨) |

> YouTube API 키: `AIzaSyBr67zJBqDYm6dTN9ZvapRjSKxJe0mCJMQ` (이미 `js/config.js`에 설정됨)

### 2. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase-schema.sql` 실행
3. Project Settings → API에서 URL과 anon key 복사

### 3. 영상 데이터 업로드

```bash
pip install supabase pandas
python upload_to_supabase.py
```

영상 2,327개를 Supabase `videos` 테이블에 업로드합니다.

### 4. Vercel 배포

```bash
npm i -g vercel
vercel --prod
```

또는 GitHub 연결 후 자동 배포.

## 파일 구조

```
├── index.html          # 메인 홈
├── categories.html     # 카테고리 탐색
├── video.html          # 영상 상세
├── search.html         # 검색
├── login.html          # 로그인/회원가입
├── dashboard.html      # 학습 대시보드
├── admin.html          # 관리자
├── chatbot.html        # AI 채팅 (독립 페이지)
├── sw.js               # Service Worker (오프라인 + Push)
├── vercel.json         # Vercel 배포 설정
├── js/
│   ├── config.js           # API 키 및 설정
│   ├── categories-data.js  # 카테고리 정의 + 영상 분류
│   ├── supabase.js         # Supabase 클라이언트 + 데이터 함수
│   ├── gemini.js           # Gemini API 연동 (RAG, 요약, 추천)
│   ├── recommendations.js  # AI 추천 시스템
│   ├── learning-tracker.js # 학습 진도 관리
│   ├── notifications.js    # 알림 시스템 (Web Push + RSS)
│   └── chatbot-widget.js   # 다른 페이지에 삽입 가능한 채팅 위젯
└── videos.csv          # 원본 영상 데이터
```

## 주요 기능

### AI 채팅 (`chatbot.html`)
- Gemini 1.5 Flash 기반 RAG 채팅
- 영상 데이터베이스를 컨텍스트로 주입
- 영상 카드 형태 추천 답변
- 세션 대화 히스토리 유지

### AI 추천 시스템 (`js/recommendations.js`)
- 시청 기록 기반 개인화 추천
- 유사 영상 추천 (카테고리 + 키워드 매칭)
- 조회수/최신 기반 인기 영상
- 입문자 학습 경로 제공

### 학습 진도 (`js/learning-tracker.js`)
- 시청 완료 처리 (Supabase + localStorage fallback)
- 연속 학습일 계산
- 카테고리별 통계

### 알림 시스템 (`js/notifications.js`)
- Web Push API 브라우저 알림
- 매일 학습 리마인더 (시간 설정 가능)
- YouTube RSS 폴링으로 새 영상 알림

### 채팅 위젯 (`js/chatbot-widget.js`)
다른 HTML 페이지에 삽입:
```html
<script src="js/chatbot-widget.js"></script>
<script>initChatbot();</script>
```

## Service Worker 등록

`index.html`에 아래 코드를 추가하면 오프라인 캐싱과 Push 알림이 활성화됩니다:

```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW 등록:', reg.scope))
      .catch(err => console.warn('SW 등록 실패:', err));
  }
</script>
```

## 라이선스

미래역량AI연구소 내부 사용 프로젝트
