-- ============================================================
-- 미래역량AI연구소 학습 플랫폼 — Supabase 스키마
-- Supabase SQL Editor에 붙여넣어 실행하세요.
-- ============================================================

-- ────────────────────────────────────────────
-- 1. categories 테이블
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT    PRIMARY KEY,
  name        TEXT    NOT NULL,
  icon        TEXT,
  video_count INTEGER DEFAULT 0
);

-- 기본 카테고리 데이터 삽입
INSERT INTO categories (id, name, icon, video_count) VALUES
  ('ai-basic',   'AI 기초 & 활용',      '🤖', 0),
  ('gpt',        'ChatGPT & GPT',        '💬', 0),
  ('claude',     'Claude & AI 도구',     '🧠', 0),
  ('prompt',     '프롬프트 엔지니어링', '✍️', 0),
  ('automation', '자동화 & 생산성',      '⚡', 0),
  ('education',  '교육 & 강의',          '📚', 0),
  ('art-docent', '미술 & 도슨트',        '🎨', 0),
  ('business',   '비즈니스 & 마케팅',   '💼', 0),
  ('coding',     '코딩 & 개발',          '💻', 0),
  ('etc',        '기타',                 '📁', 0)
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────────
-- 2. videos 테이블
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id            TEXT       PRIMARY KEY,
  title         TEXT       NOT NULL,
  published_at  DATE,
  view_count    INTEGER    DEFAULT 0,
  like_count    INTEGER    DEFAULT 0,
  comment_count INTEGER    DEFAULT 0,
  description   TEXT,
  url           TEXT,
  category_id   TEXT       REFERENCES categories(id),
  thumbnail_url TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 검색 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_videos_category_id   ON videos (category_id);
CREATE INDEX IF NOT EXISTS idx_videos_published_at  ON videos (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_view_count    ON videos (view_count  DESC);

-- 제목 전문 검색용 인덱스 (ilike 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_videos_title_trgm
  ON videos USING gin (title gin_trgm_ops);


-- ────────────────────────────────────────────
-- 3. learning_progress 테이블
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_progress (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id   TEXT        REFERENCES videos(id)     ON DELETE CASCADE,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  completed  BOOLEAN     DEFAULT FALSE,
  UNIQUE (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user_id  ON learning_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_progress_video_id ON learning_progress (video_id);


-- ────────────────────────────────────────────
-- 4. RLS (Row Level Security) 설정
-- ────────────────────────────────────────────

-- categories: 누구나 읽기 가능
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read"
  ON categories FOR SELECT
  USING (true);

-- videos: 누구나 읽기 가능 / 서비스 키(anon 제외)로만 쓰기 가능
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos_public_read"
  ON videos FOR SELECT
  USING (true);

-- learning_progress: 본인 데이터만 읽기/쓰기 가능
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_own_read"
  ON learning_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "progress_own_insert"
  ON learning_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "progress_own_update"
  ON learning_progress FOR UPDATE
  USING (auth.uid() = user_id);


-- ────────────────────────────────────────────
-- 5. video_count 자동 갱신 트리거
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_category_video_count()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT 또는 UPDATE 시 새 카테고리 카운트 증가
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id) THEN
    UPDATE categories
      SET video_count = video_count + 1
      WHERE id = NEW.category_id;
  END IF;

  -- UPDATE 시 이전 카테고리 카운트 감소
  IF (TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id) THEN
    UPDATE categories
      SET video_count = GREATEST(video_count - 1, 0)
      WHERE id = OLD.category_id;
  END IF;

  -- DELETE 시 카운트 감소
  IF (TG_OP = 'DELETE') THEN
    UPDATE categories
      SET video_count = GREATEST(video_count - 1, 0)
      WHERE id = OLD.category_id;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_video_count ON videos;
CREATE TRIGGER trg_video_count
  AFTER INSERT OR UPDATE OR DELETE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_category_video_count();


-- ────────────────────────────────────────────
-- 6. 전체 카운트 재계산 헬퍼 함수
--    (초기 업로드 후 한 번 실행 권장)
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION recalculate_category_counts()
RETURNS VOID AS $$
BEGIN
  UPDATE categories c
  SET video_count = (
    SELECT COUNT(*)
    FROM videos v
    WHERE v.category_id = c.id
  );
END;
$$ LANGUAGE plpgsql;

-- 초기 실행: SELECT recalculate_category_counts();
