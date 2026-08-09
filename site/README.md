# ORB-7 — 3D 로봇 랜딩 페이지

스크롤에 따라 3D 로봇이 회전하고, 구간마다 다른 동작과 정보 카드가 나타나는 페이지입니다.

## 파일 구조
```
index.html                  메인 페이지 (이것만 열면 됨)
assets/RobotExpressive.glb  3D 로봇 모델
```
이 두 항목을 저장소 루트에 그대로 두세요. `index.html`은 `assets/RobotExpressive.glb`를
상대경로로 불러오므로 폴더 구조를 유지해야 합니다.

## GitHub Pages 배포
1. 이 폴더의 파일들을 저장소에 올립니다 (index.html이 루트에 있어야 함).
2. 저장소 Settings → Pages → Source를 `main` 브랜치 `/ (root)`로 지정.
3. 몇 분 뒤 `https://<사용자명>.github.io/<저장소명>/` 에서 열립니다.

## 수정하는 곳
- **카메라/동작**: `index.html`의 `<script>` 안 `CONFIG` 블록 (SECTIONS 배열)
- **섹션 문구·정보 카드**: `<body>` 안 `<main>`과 `class="readout"` 부분
- **색상**: `<style>` 상단 `:root`의 `--amber`, `--cyan` 등

## 참고
- 로봇 모델(RobotExpressive.glb)은 CC0 라이선스로 상업적 사용·수정에 제약이 없습니다.
- Three.js 라이브러리는 CDN에서 불러오므로 인터넷 연결이 필요합니다.
