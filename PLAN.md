# Spark Crew 타임라인 갤러리

FLL(FIRST LEGO League) 대회 **2026-11-28** 대비, 팀원들과 그동안 찍은 사진·영상을 공유하는 웹사이트.

- 사이트: https://sehyunnoh.github.io/spark-crew/
- 저장소: https://github.com/sehyunnoh/spark-crew (Public)
- 상태: **개발·배포 완료** (2026-11-08), 이후 새 사진 추가 시 아래 "운영 방법" 참고

---

## 1. 확정된 요구사항

| 항목 | 내용 |
|---|---|
| 언어 | 한국어 |
| 디자인 | FLL(FIRST) 사이트 분위기 + Spark Crew 로고(핑크·보라·파랑 그라데이션, 번개 노랑) |
| 타임라인 | 왼쪽 세로선에 날짜 노드, 스크롤하면 해당 날짜의 사진·영상이 나타남 |
| 영상 | 캐러셀(좌우 슬라이드), 클릭하면 재생 창 |
| 날짜 태그 | 6/6 → **Picnic**, 11/8 → **리허설**, 그 외 → **연습** |
| 대회 장소 | Western Technical-Commercial School (11월 28일, 지도 링크) |
| 반응형 | 모바일(핸드폰) 우선 고려 |
| 호스팅 | GitHub Pages (Public) |
| 검색 차단 | `<meta name="robots" content="noindex, nofollow">` |
| 제외한 것 | 시즌 자료 링크, D-day/통계 박스, 11/8의 3초짜리 영상 |

## 2. 기술 선택

- **순수 HTML / CSS / JavaScript** (빌드 도구 없음). 단일 페이지이고 데이터가 `media.json` 하나라 Astro 같은 프레임워크가 필요 없음.
- 미디어 압축은 Python(Pillow) + ffmpeg 스크립트로 처리.
- 배포는 GitHub Actions → GitHub Pages (`main`에 push하면 자동 배포).

## 3. 폴더 구조

```
spark-crew/
├─ Pictures/                 # 원본 사진·영상 (Git 제외)
├─ spark crew.png            # 로고 원본
├─ PLAN.md
├─ data/
│  ├─ titles.json            # 날짜별 태그 (기본값 "연습" + 예외)
│  └─ exclude.json           # 사이트에서 뺄 원본 파일명 목록
├─ scripts/
│  └─ build_media.py         # 압축 + site/media.json 생성
├─ .github/workflows/pages.yml
├─ design-preview/           # 초기 디자인 시안 (Git 제외)
└─ site/                     # ← 배포되는 폴더
   ├─ index.html
   ├─ css/style.css
   ├─ js/app.js
   ├─ assets/ (logo.png, og.jpg)
   ├─ media.json
   └─ media/ (photos, thumbs, videos, posters)
```

## 4. 미디어 처리 (`scripts/build_media.py`)

| 대상 | 처리 |
|---|---|
| 사진 | 긴 변 1600px WebP(품질 80) + 560px 썸네일. **EXIF/GPS 정보는 저장하지 않음** |
| 영상 | 720p H.264, CRF 28, 최대 2Mbps, `faststart` + 포스터 이미지 |
| 결과 | 원본 1.36GB → 약 **77MB** (최대 파일 59MB, GitHub 100MB 제한 이내) |

- 이미 만들어진 파일은 건너뛰므로 다시 실행해도 빠름.
- 폴더 이름 앞 8자리(`YYYYMMDD`)가 날짜가 됨 (예: `20260606_picnic` → 2026-06-06).

## 5. 현재 보유 자료

날짜 폴더 15개, 사진 80장, 영상 2개(사이트 노출 기준).

| 날짜 | 태그 | 사진 | 영상 |
|---|---|---|---|
| 5/28 | 연습 | 4 | – |
| 6/6 | Picnic | 12 | – |
| 9/4 · 9/5 · 9/9 · 9/16 · 9/19 · 9/23 · 9/26 | 연습 | 5·4·1·4·4·11·3 | – |
| 10/3 · 10/7 · 10/18 · 10/24 · 11/1 | 연습 | 1·2·15·9·1 | – |
| 11/8 | 리허설 | 4 | 2 (7:45, 0:43) |

## 6. 페이지 구성

1. **헤더**: 로고, 메뉴(타임라인 / FLL 소개 / 대회 장소), "11월 28일 대회" 버튼
2. **히어로**: 로고, "우리가 달려온 스파크의 기록", 버튼 2개
3. **타임라인**: 월 구분 라벨, 날짜 노드(현재 위치 강조), 사진 그리드(최대 6장, 나머지 `+N`), 영상 캐러셀
4. **FLL이란?**: 로봇 게임 / 혁신 프로젝트 / 코어 밸류 카드
5. **대회 장소**: 11.28 토요일, Western Technical-Commercial School, 지도 링크
6. **푸터**: 로고, 상표 안내

인터랙션: 스크롤 등장 애니메이션, 진행선 채움, 사진 라이트박스(키보드·모바일 스와이프), 영상 재생 모달, `prefers-reduced-motion` 존중.

## 7. 운영 방법 (새 사진/영상 추가)

```bash
# 1) Pictures/ 에 새 폴더 추가 (예: 20261128)
# 2) 필요하면 data/titles.json 에 태그 추가 (예: "20261128": "대회")
# 3) 압축 + media.json 갱신
python scripts/build_media.py
# 4) 올리기 (자동 배포)
git add -A && git commit -m "사진 추가" && git push
```

- 특정 파일을 빼고 싶으면 파일명을 `data/exclude.json`에 추가한 뒤 3)부터 다시 실행.
- 영상은 짧게 쓸수록 좋음 (저장소/로딩 용량).

## 8. 유의 사항

- 저장소와 사이트가 **Public**이라 링크를 아는 사람은 누구나 사진(얼굴 포함)을 볼 수 있음. `noindex`는 검색 노출을 요청할 뿐 접근을 막지 않음.
- 나중에 비공개가 필요하면 저장소를 Private으로 바꾸거나(Pages는 유료 플랜 필요), 비밀번호 보호 호스팅으로 이전.
- 디자인 색상은 FIRST 브랜드 색의 근사값(`#0066B3`, `#ED1C24`)이며 공식 값과 다를 수 있음.

## 9. 진행 이력

| 날짜 | 내용 |
|---|---|
| 2026-11-08 | 계획서 작성 → 디자인 시안 → 미디어 압축 → 사이트 개발 → GitHub Pages 배포 |
| 2026-11-08 | 11/8 3초짜리 영상 제외, 검색엔진 수집 차단(noindex) 적용 |
