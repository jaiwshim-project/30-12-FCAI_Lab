#!/usr/bin/env python3
"""
upload_to_supabase.py
─────────────────────
videos.csv를 읽어 카테고리 자동 분류 후
Supabase REST API로 일괄 업로드합니다.

실행 방법:
  python upload_to_supabase.py

환경변수 (필수):
  SUPABASE_URL         예) https://abcdefg.supabase.co
  SUPABASE_SERVICE_KEY 서비스 롤 키 (anon 키가 아닌 service_role)

옵션:
  BATCH_SIZE  한 번에 upsert할 영상 수 (기본값: 100)
  DRY_RUN     1로 설정하면 실제 업로드 없이 분류 결과만 출력
"""

import csv
import json
import os
import sys
import time
from pathlib import Path

import requests

# ─────────────────────────────────────────────
# 설정
# ─────────────────────────────────────────────
SUPABASE_URL         = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
BATCH_SIZE           = int(os.environ.get("BATCH_SIZE", "100"))
DRY_RUN              = os.environ.get("DRY_RUN", "0") == "1"

CSV_FILE = Path(__file__).parent / "videos.csv"

# ─────────────────────────────────────────────
# 카테고리 정의 및 분류 함수
# ─────────────────────────────────────────────
CATEGORIES = [
    {"id": "ai-basic",   "name": "AI 기초 & 활용",       "keywords": ["AI", "인공지능", "머신러닝", "딥러닝"]},
    {"id": "gpt",        "name": "ChatGPT & GPT",         "keywords": ["GPT", "ChatGPT", "챗GPT"]},
    {"id": "claude",     "name": "Claude & AI 도구",      "keywords": ["클로드", "Claude", "AI도구", "Gemini", "제미나이"]},
    {"id": "prompt",     "name": "프롬프트 엔지니어링",   "keywords": ["프롬프트", "Prompt"]},
    {"id": "automation", "name": "자동화 & 생산성",       "keywords": ["자동화", "챗봇", "봇", "생산성", "자동"]},
    {"id": "education",  "name": "교육 & 강의",            "keywords": ["강의", "교육", "수업", "학습", "튜토리얼", "입문", "기초"]},
    {"id": "art-docent", "name": "미술 & 도슨트",         "keywords": ["도슨트", "미술", "그림", "작품", "전시"]},
    {"id": "business",   "name": "비즈니스 & 마케팅",     "keywords": ["비즈니스", "마케팅", "창업", "사업", "브랜드"]},
    {"id": "coding",     "name": "코딩 & 개발",            "keywords": ["코딩", "개발", "프로그래밍", "파이썬", "Python", "코드"]},
    {"id": "etc",        "name": "기타",                   "keywords": []},
]


def classify_video(title: str) -> str:
    """영상 제목을 받아 카테고리 ID를 반환합니다."""
    if not title:
        return "etc"
    title_lower = title.lower()
    for cat in CATEGORIES:
        if cat["id"] == "etc":
            continue
        for kw in cat["keywords"]:
            if kw.lower() in title_lower:
                return cat["id"]
    return "etc"


# ─────────────────────────────────────────────
# CSV 파싱
# ─────────────────────────────────────────────
def load_csv(path: Path) -> list[dict]:
    """
    videos.csv를 읽어 영상 딕셔너리 목록을 반환합니다.
    컬럼: 영상ID, 제목, 업로드일, 조회수, 좋아요, 댓글수, 설명(첫줄), URL
    """
    videos = []
    with open(path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # 컬럼 이름은 CSV 헤더에 따라 유연하게 처리
            raw_id    = row.get("영상ID") or row.get("video_id") or row.get("id") or ""
            raw_title = row.get("제목")   or row.get("title")    or ""
            raw_date  = row.get("업로드일") or row.get("published_at") or ""
            raw_views = row.get("조회수") or row.get("view_count") or "0"
            raw_likes = row.get("좋아요") or row.get("like_count") or "0"
            raw_cmts  = row.get("댓글수") or row.get("comment_count") or "0"
            raw_desc  = row.get("설명(첫줄)") or row.get("description") or ""
            raw_url   = row.get("URL")   or row.get("url") or ""

            if not raw_id:
                continue

            # 숫자 파싱 (쉼표 제거 후 변환)
            def safe_int(val):
                try:
                    return int(str(val).replace(",", "").strip() or "0")
                except ValueError:
                    return 0

            # 날짜: YYYY-MM-DD 형식만 허용
            pub_date = raw_date.strip()[:10] if raw_date.strip() else None

            video = {
                "id":            raw_id.strip(),
                "title":         raw_title.strip(),
                "published_at":  pub_date,
                "view_count":    safe_int(raw_views),
                "like_count":    safe_int(raw_likes),
                "comment_count": safe_int(raw_cmts),
                "description":   raw_desc.strip()[:500],
                "url":           raw_url.strip(),
                "thumbnail_url": f"https://img.youtube.com/vi/{raw_id.strip()}/hqdefault.jpg",
                "category_id":   classify_video(raw_title.strip()),
            }
            videos.append(video)

    return videos


# ─────────────────────────────────────────────
# Supabase REST API upsert
# ─────────────────────────────────────────────
def upsert_batch(videos: list[dict], attempt: int = 1) -> bool:
    """
    영상 배치를 Supabase REST API로 upsert 합니다.
    실패 시 최대 3회 재시도합니다.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("[오류] SUPABASE_URL 또는 SUPABASE_SERVICE_KEY 환경변수가 설정되지 않았습니다.")
        sys.exit(1)

    url = f"{SUPABASE_URL}/rest/v1/videos"
    headers = {
        "apikey":        SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates",
    }

    try:
        res = requests.post(url, headers=headers, data=json.dumps(videos), timeout=30)

        if res.status_code in (200, 201):
            return True

        # 409 Conflict는 upsert이므로 성공으로 간주
        if res.status_code == 409:
            return True

        print(f"  [경고] HTTP {res.status_code}: {res.text[:200]}")

        if attempt < 3:
            wait = 2 ** attempt  # 지수 백오프: 2초, 4초
            print(f"  {wait}초 후 재시도 ({attempt}/3)...")
            time.sleep(wait)
            return upsert_batch(videos, attempt + 1)

        return False

    except requests.exceptions.RequestException as e:
        print(f"  [오류] 요청 실패: {e}")
        if attempt < 3:
            wait = 2 ** attempt
            print(f"  {wait}초 후 재시도 ({attempt}/3)...")
            time.sleep(wait)
            return upsert_batch(videos, attempt + 1)
        return False


# ─────────────────────────────────────────────
# 진행률 표시
# ─────────────────────────────────────────────
def print_progress(current: int, total: int, bar_width: int = 40) -> None:
    pct     = current / total if total > 0 else 0
    filled  = int(bar_width * pct)
    bar     = "█" * filled + "░" * (bar_width - filled)
    print(f"\r  [{bar}] {current:,} / {total:,} ({pct:.1%})", end="", flush=True)


# ─────────────────────────────────────────────
# 메인 실행
# ─────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  미래역량AI연구소 — videos.csv → Supabase 업로드")
    print("=" * 60)

    # CSV 파일 존재 확인
    if not CSV_FILE.exists():
        print(f"[오류] CSV 파일을 찾을 수 없습니다: {CSV_FILE}")
        sys.exit(1)

    # 환경변수 확인
    if not DRY_RUN:
        if not SUPABASE_URL:
            print("[오류] SUPABASE_URL 환경변수가 설정되지 않았습니다.")
            sys.exit(1)
        if not SUPABASE_SERVICE_KEY:
            print("[오류] SUPABASE_SERVICE_KEY 환경변수가 설정되지 않았습니다.")
            sys.exit(1)
        print(f"  Supabase URL : {SUPABASE_URL}")
    else:
        print("  [DRY_RUN 모드] 실제 업로드를 건너뜁니다.")

    # CSV 로드
    print(f"\n  CSV 파일 읽는 중: {CSV_FILE.name}")
    videos = load_csv(CSV_FILE)
    print(f"  총 {len(videos):,}개 영상 로드 완료\n")

    # 카테고리 분포 출력
    from collections import Counter
    cat_counts = Counter(v["category_id"] for v in videos)
    print("  [카테고리 분류 결과]")
    for cat in CATEGORIES:
        count = cat_counts.get(cat["id"], 0)
        bar   = "■" * min(count // 10, 40)
        print(f"  {cat['id']:15s}: {count:5,}개  {bar}")
    print()

    if DRY_RUN:
        print("  DRY_RUN 완료. 업로드 없이 종료합니다.")
        return

    # Supabase upsert (배치 처리)
    total       = len(videos)
    success_cnt = 0
    fail_cnt    = 0

    print(f"  Supabase에 업로드 중 (배치 크기: {BATCH_SIZE})...\n")
    start_time = time.time()

    for i in range(0, total, BATCH_SIZE):
        batch = videos[i : i + BATCH_SIZE]
        print_progress(i, total)

        ok = upsert_batch(batch)
        if ok:
            success_cnt += len(batch)
        else:
            fail_cnt += len(batch)
            print(f"\n  [실패] offset {i} ~ {i + len(batch) - 1} 배치 업로드 실패")

    # 완료 표시
    print_progress(total, total)
    elapsed = time.time() - start_time

    print(f"\n\n{'=' * 60}")
    print(f"  업로드 완료!")
    print(f"  성공: {success_cnt:,}개  |  실패: {fail_cnt:,}개")
    print(f"  소요 시간: {elapsed:.1f}초")
    print("=" * 60)

    if fail_cnt > 0:
        print(f"\n  [주의] {fail_cnt:,}개 업로드 실패. 로그를 확인하고 재시도하세요.")
        sys.exit(1)


if __name__ == "__main__":
    main()
