"""
YouTube 영상 재생시간 일괄 수집 → videos-data.js 업데이트
"""
import json, re, requests, time, sys

API_KEY  = "AIzaSyBr67zJBqDYm6dTN9ZvapRjSKxJe0mCJMQ"
BASE_URL = "https://www.googleapis.com/youtube/v3"

# ── 1. videos-data.js 읽기
with open("videos-data.js", encoding="utf-8") as f:
    raw = f.read()

json_str = re.sub(r"^const VIDEOS_DATA\s*=\s*", "", raw.strip()).rstrip(";")
videos = json.loads(json_str)
print(f"총 영상: {len(videos)}개")

# 이미 duration 있는 것 제외
need = [v for v in videos if not v.get("duration")]
print(f"duration 없는 영상: {len(need)}개 → API 호출 예정")

# ── 2. YouTube API 배치 호출 (50개씩)
duration_map = {}
for i in range(0, len(need), 50):
    batch = need[i:i+50]
    ids   = ",".join(v["id"] for v in batch)
    resp  = requests.get(
        f"{BASE_URL}/videos",
        params={"part": "contentDetails", "id": ids, "key": API_KEY},
        timeout=15,
    )
    if resp.status_code != 200:
        print(f"  [오류] {resp.status_code}: {resp.text[:200]}")
        sys.exit(1)
    for item in resp.json().get("items", []):
        dur = item["contentDetails"]["duration"]   # e.g. PT5M30S
        duration_map[item["id"]] = dur
    print(f"  {i+len(batch)}/{len(need)} 완료")
    time.sleep(0.1)

print(f"수집된 duration: {len(duration_map)}개")

# ── 3. videos 업데이트
for v in videos:
    if v["id"] in duration_map:
        v["duration"] = duration_map[v["id"]]

# ── 4. 저장
out = "const VIDEOS_DATA = " + json.dumps(videos, ensure_ascii=False, separators=(",", ":")) + ";"
with open("videos-data.js", "w", encoding="utf-8") as f:
    f.write(out)
print("videos-data.js 저장 완료")
