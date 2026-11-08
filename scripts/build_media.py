"""원본 사진/영상(Pictures/)을 웹용으로 압축하고 site/media.json 을 생성한다.

- 사진: 긴 변 1600px WebP + 480px 썸네일 (EXIF/GPS 정보는 저장하지 않음)
- 영상: 720p H.264 (faststart) + 포스터 이미지
- 이미 만들어진 파일은 건너뛰므로 폴더를 추가한 뒤 다시 실행해도 된다.

사용법:  python scripts/build_media.py
"""
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Pictures"
SITE = ROOT / "site"
MEDIA = SITE / "media"
TITLES = json.loads((ROOT / "data" / "titles.json").read_text(encoding="utf-8"))
EXCLUDE = set(json.loads((ROOT / "data" / "exclude.json").read_text(encoding="utf-8")))  # 사이트에서 뺄 원본 파일명

for sub in ("photos", "thumbs", "videos", "posters"):
    (MEDIA / sub).mkdir(parents=True, exist_ok=True)


def photo(f: Path, key: str):
    out, thumb = MEDIA / "photos" / f"{key}.webp", MEDIA / "thumbs" / f"{key}.webp"
    im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
    if not out.exists():
        big = im.copy()
        big.thumbnail((1600, 1600))
        big.save(out, "WEBP", quality=80, method=5)
    if not thumb.exists():
        small = im.copy()
        small.thumbnail((560, 560))
        small.save(thumb, "WEBP", quality=74, method=5)
    w, h = Image.open(out).size
    return {"src": f"media/photos/{key}.webp", "thumb": f"media/thumbs/{key}.webp", "w": w, "h": h}


def video(f: Path, key: str):
    out, poster = MEDIA / "videos" / f"{key}.mp4", MEDIA / "posters" / f"{key}.webp"
    if not out.exists():
        subprocess.run([
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(f),
            "-vf", "scale=-2:720", "-c:v", "libx264", "-preset", "slow", "-crf", "28",
            "-maxrate", "2M", "-bufsize", "4M", "-c:a", "aac", "-b:a", "96k",
            "-movflags", "+faststart", str(out)], check=True)
    if not poster.exists():
        tmp = MEDIA / "posters" / f"{key}.tmp.jpg"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "1", "-i", str(f),
                        "-frames:v", "1", "-vf", "scale=960:-2", str(tmp)], check=True)
        Image.open(tmp).convert("RGB").save(poster, "WEBP", quality=78)
        tmp.unlink()
    dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", str(out)], capture_output=True, text=True).stdout
    return {"src": f"media/videos/{key}.mp4", "poster": f"media/posters/{key}.webp",
            "duration": round(float(dur))}


days = []
for d in sorted(p for p in SRC.iterdir() if p.is_dir()):
    date = d.name[:8]
    entry = {"date": f"{date[:4]}-{date[4:6]}-{date[6:8]}",
             "title": TITLES.get(date, TITLES["default"]), "photos": [], "videos": []}
    for f in sorted(d.iterdir()):
        if f.name in EXCLUDE:
            continue
        ext = f.suffix.lower()
        key = f"{date}_{f.stem.split('_', 1)[-1]}"
        if ext in (".jpg", ".jpeg", ".png"):
            entry["photos"].append(photo(f, key))
        elif ext == ".mp4":
            print("video:", f.name, flush=True)
            entry["videos"].append(video(f, key))
    days.append(entry)
    print(entry["date"], len(entry["photos"]), "photos", len(entry["videos"]), "videos", flush=True)

(SITE / "media.json").write_text(json.dumps(days, ensure_ascii=False, indent=1), encoding="utf-8")
size = sum(p.stat().st_size for p in MEDIA.rglob("*") if p.is_file()) / 1024 / 1024
print(f"done. media size: {size:.1f} MB")
