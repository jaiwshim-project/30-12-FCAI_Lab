"""
YouTube 채널 전체 영상 목록 추출기
채널: 미래역량AI연구소 (UCFd8HoNePip4UK16PhgUVOA)
결과: videos.csv
"""

import requests
import csv
import time

API_KEY    = "AIzaSyBr67zJBqDYm6dTN9ZvapRjSKxJe0mCJMQ"
CHANNEL_ID = "UCFd8HoNePip4UK16PhgUVOA"
BASE_URL   = "https://www.googleapis.com/youtube/v3"


def get_uploads_playlist_id():
    url = f"{BASE_URL}/channels"
    params = {
        "part": "contentDetails",
        "id": CHANNEL_ID,
        "key": API_KEY,
    }
    r = requests.get(url, params=params)
    r.raise_for_status()
    data = r.json()
    return data["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]


def get_all_video_ids(playlist_id):
    video_ids = []
    next_page_token = None
    page = 1

    while True:
        url = f"{BASE_URL}/playlistItems"
        params = {
            "part": "contentDetails",
            "playlistId": playlist_id,
            "maxResults": 50,
            "key": API_KEY,
        }
        if next_page_token:
            params["pageToken"] = next_page_token

        r = requests.get(url, params=params)
        r.raise_for_status()
        data = r.json()

        for item in data.get("items", []):
            video_ids.append(item["contentDetails"]["videoId"])

        print(f"  page {page} - total {len(video_ids)}")
        page += 1

        next_page_token = data.get("nextPageToken")
        if not next_page_token:
            break

        time.sleep(0.1)

    return video_ids


def get_video_details(video_ids):
    videos = []
    # 한 번에 최대 50개씩 조회
    for i in range(0, len(video_ids), 50):
        chunk = video_ids[i:i+50]
        url = f"{BASE_URL}/videos"
        params = {
            "part": "snippet,statistics",
            "id": ",".join(chunk),
            "key": API_KEY,
        }
        r = requests.get(url, params=params)
        r.raise_for_status()
        data = r.json()

        for item in data.get("items", []):
            snippet    = item.get("snippet", {})
            statistics = item.get("statistics", {})
            videos.append({
                "영상ID":      item["id"],
                "제목":        snippet.get("title", ""),
                "업로드일":    snippet.get("publishedAt", "")[:10],
                "조회수":      statistics.get("viewCount", "0"),
                "좋아요":      statistics.get("likeCount", "0"),
                "댓글수":      statistics.get("commentCount", "0"),
                "설명(첫줄)":  snippet.get("description", "").split("\n")[0][:100],
                "URL":         f"https://youtu.be/{item['id']}",
            })

        print(f"  상세정보 {min(i+50, len(video_ids))}/{len(video_ids)}개 처리")
        time.sleep(0.1)

    return videos


def save_csv(videos, filename="videos.csv"):
    if not videos:
        print("저장할 데이터가 없습니다.")
        return

    fieldnames = ["영상ID", "제목", "업로드일", "조회수", "좋아요", "댓글수", "설명(첫줄)", "URL"]
    with open(filename, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(videos)

    print(f"\n✅ 저장 완료: {filename} ({len(videos)}개 영상)")


if __name__ == "__main__":
    print("▶ 업로드 플레이리스트 ID 조회 중...")
    playlist_id = get_uploads_playlist_id()
    print(f"  플레이리스트 ID: {playlist_id}\n")

    print("▶ 전체 영상 ID 수집 중...")
    video_ids = get_all_video_ids(playlist_id)
    print(f"  총 {len(video_ids)}개 영상 ID 수집 완료\n")

    print("▶ 영상 상세정보 수집 중...")
    videos = get_video_details(video_ids)

    print("\n▶ CSV 저장 중...")
    save_csv(videos)
