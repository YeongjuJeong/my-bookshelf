# 나만의 책장

## 1. 프로젝트 소개

**나만의 책장**은 사용자가 읽은 책과 읽고 싶은 책을 온라인 책장 형태로 관리할 수 있는 개인 독서 기록 웹서비스입니다.
사용자는 책 제목, 저자, 페이지 수, 카테고리, 별점, 기억하고 싶은 문장, 감상 등을 입력할 수 있으며, 등록된 책은 책장 화면에서 책등 형태로 시각화됩니다.

책의 페이지 수에 따라 책 두께가 다르게 표시되도록 구현하여 사용자가 자신의 독서 기록을 직관적으로 확인할 수 있도록 하였습니다. 또한 리스트 보기, 검색, 필터, 정렬, 통계, 로그인, 회원가입, 마이페이지 기능을 제공하여 실제 사용 가능한 독서 기록 관리 서비스 구조를 완성하였습니다.

---

## 2. 주요 기능

### 2.1 회원 기능

* 이메일/비밀번호 회원가입
* 이메일/비밀번호 로그인
* Google 계정 로그인
* 로그인 상태 유지
* 로그아웃
* 마이페이지 화면 제공
* 로그인한 사용자별 책장 데이터 저장

### 2.2 책장 기능

* 읽은 책 / 읽고 싶은 책 구분 표시
* 책장 형태의 시각적 UI 제공
* 페이지 수에 따른 책 두께 표시
* 실제 두께 적용 / 해제 기능
* 책 클릭 시 상세 정보 모달 표시

### 2.3 책 관리 기능

* 책 추가
* 책 상세 조회
* 책 정보 수정
* 책 삭제
* 삭제 확인 모달
* 책 색상 선택
* 기억하고 싶은 문장 및 감상 기록

### 2.4 리스트 기능

* 등록된 책을 표 형태로 확인
* 책 제목 또는 저자 검색
* 읽은 책 / 읽고 싶은 책 상태 필터
* 카테고리 필터
* 등록순, 제목순, 페이지순, 별점순 정렬
* 리스트 화면에서 수정 및 삭제 가능

### 2.5 통계 기능

* 총 읽은 책 수 표시
* 총 읽은 페이지 수 표시
* 평균 별점 계산
* 올해 독서 목표 달성률 표시
* 월별 읽은 책 수 그래프
* 카테고리별 독서 비율
* 별점 분포
* 최근 독서 기록 표시

---

## 3. 사용 기술

### Front-end

* React
* Vite
* JavaScript
* Tailwind CSS

### Back-end / Database

* Firebase Authentication
* Firebase Firestore
* Firebase Hosting

### Data Storage

* Firebase Firestore
* localStorage

### Development Tools

* Visual Studio Code
* Firebase Console
* Firebase CLI
* Git / GitHub
* AI 도구: ChatGPT, Copilot

---

## 4. 프로젝트 실행 방법

### 4.1 프로젝트 설치

프로젝트 폴더에서 아래 명령어를 실행합니다.

```bash
npm install
```

### 4.2 환경 변수 설정

본 프로젝트는 Firebase Authentication, Firestore, Google Login 기능을 사용합니다.
Firebase 설정값은 보안 및 제출 안내에 따라 소스코드에 직접 작성하지 않고, 환경 변수 파일을 통해 관리합니다.

프로젝트에는 환경 변수 예시 파일인 `.env.example`이 포함되어 있습니다.
프로젝트를 실행하려면 `.env.example` 파일을 참고하여 최상위 폴더에 `.env` 파일을 새로 생성한 뒤, 본인의 Firebase 설정값을 입력해야 합니다.

`.env.example` 파일 예시는 다음과 같습니다.

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

실제 Firebase 설정값은 Firebase Console에서 확인할 수 있습니다.

보안상 `.env` 파일에는 실제 Firebase 설정값이 포함되므로 GitHub 저장소 및 제출용 압축 파일에는 포함하지 않습니다.
대신 `.env.example` 파일에는 실제 값이 아닌 예시값만 작성하여, 프로젝트 실행에 필요한 환경 변수 이름을 안내합니다.

`.gitignore`에는 다음 항목을 추가하여 실제 환경 변수 파일이 저장소에 올라가지 않도록 설정하였습니다.

```gitignore
.env
.env.local
.env.*.local
```

### 4.3 개발 서버 실행

```bash
npm run dev
```

실행 후 브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:5173/
```

### 4.4 배포용 빌드

```bash
npm run build
```

빌드가 완료되면 `dist` 폴더가 생성됩니다.

### 4.5 Firebase Hosting 배포

```bash
firebase deploy --only hosting
```

---

## 5. 프로젝트 폴더 구조

```text
my-bookshelf/
├── public/
├── src/
│   ├── App.jsx
│   ├── firebase.js
│   ├── index.css
│   └── main.jsx
├── .env.example
├── .gitignore
├── firebase.json
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

## 6. 주요 파일 설명

### `src/App.jsx`

프로젝트의 주요 화면과 기능이 구현된 파일입니다.
책장 화면, 리스트 화면, 통계 화면, 로그인, 회원가입, 마이페이지, 책 추가/수정/삭제 모달 등 핵심 UI와 기능 로직이 포함되어 있습니다.

### `src/firebase.js`

Firebase 설정 파일입니다.
Firebase Authentication, Firestore, Google Login Provider를 초기화하고 외부에서 사용할 수 있도록 export합니다.

### `src/index.css`

Tailwind CSS import와 공통 input 스타일이 정의되어 있습니다.

### `src/main.jsx`

React 앱의 진입점입니다.
`App.jsx`를 HTML의 root 요소에 렌더링합니다.

### `.env.example`

Firebase 환경 변수 예시 파일입니다.
실제 Firebase Key 대신 예시 값만 포함합니다.

### `firebase.json`

Firebase Hosting 설정 파일입니다.
Vite 빌드 결과물인 `dist` 폴더를 Hosting public directory로 사용합니다.

---

## 7. 데이터 저장 구조

본 프로젝트는 Firebase Authentication의 사용자 UID를 활용하여 사용자별 책 데이터를 분리하여 저장합니다.

Firestore 데이터 구조는 다음과 같습니다.

```text
users
└── 사용자 UID
    └── books
        └── 책 문서 ID
            ├── title
            ├── author
            ├── pages
            ├── status
            ├── rating
            ├── category
            ├── color
            ├── readDate
            ├── price
            ├── quote
            └── memo
```

로그인한 사용자는 자신의 UID 아래에 있는 `books` 컬렉션의 데이터만 불러옵니다.
책을 추가, 수정, 삭제하면 해당 사용자의 Firestore 데이터가 함께 변경됩니다.

로그아웃 상태에서는 기본 예시 책 데이터가 표시되도록 처리하였습니다.

---

## 8. 화면 구성

본 프로젝트는 다음과 같은 주요 화면으로 구성되어 있습니다.

1. 책장 메인 화면
2. 책 상세 정보 모달
3. 책 추가 화면
4. 책 수정 화면
5. 책 삭제 확인 모달
6. 리스트 보기 화면
7. 통계 화면
8. 로그인 화면
9. 회원가입 화면
10. 마이페이지 화면

---

## 9. 구현한 사용자 흐름

1. 사용자는 회원가입 또는 Google 로그인을 통해 서비스에 접속합니다.
2. 로그인한 사용자는 자신의 책장 데이터를 불러옵니다.
3. 사용자는 책을 추가하고 책 제목, 저자, 페이지 수, 별점, 감상 등을 입력합니다.
4. 추가된 책은 책장 화면과 리스트 화면에 자동으로 반영됩니다.
5. 사용자는 책 상세 정보를 확인하고 수정 또는 삭제할 수 있습니다.
6. 리스트 화면에서 검색, 필터, 정렬을 통해 책을 효율적으로 관리할 수 있습니다.
7. 통계 화면에서 독서량, 평균 별점, 카테고리 비율, 목표 달성률을 확인할 수 있습니다.
8. 로그아웃하면 기본 책장 화면으로 돌아갑니다.

---

## 10. 배포 주소

Firebase Hosting을 사용하여 웹페이지를 배포하였습니다.

```text
호스팅 주소: https://my-bookshelf-1d23c.web.app/
```

---

## 11. GitHub 저장소

```text
GitHub 저장소 주소: https://github.com/YeongjuJeong/my-bookshelf
```

---

## 12. 프로젝트 진행 및 관리

본 프로젝트는 초기 기획 단계에서 Figma를 활용하여 화면을 설계한 뒤, React와 Tailwind CSS를 사용하여 실제 웹 애플리케이션으로 구현하였습니다.

개발 과정에서는 기능을 한 번에 모두 구현하지 않고, 다음과 같은 순서로 단계적으로 진행하였습니다.

1. Vite React 프로젝트 생성
2. Tailwind CSS 설정
3. 책장 메인 화면 구현
4. 책 상세보기 모달 구현
5. 책 추가/수정/삭제 기능 구현
6. localStorage 저장 기능 구현
7. 리스트 검색/필터/정렬 기능 구현
8. 통계 화면 구현
9. Firebase Firestore 연동
10. Firebase Authentication 및 Google 로그인 연동
11. 사용자별 Firestore 데이터 저장 구조 구현
12. Firebase Hosting 배포
13. Firebase Key 환경 변수 처리

---

## 13. AI 활용 내역

본 프로젝트 개발 과정에서 ChatGPT와 GitHub Copilot을 활용하였습니다.

AI 활용 내용은 다음과 같습니다.

* 프로젝트 아이디어 구체화
* 화면 구성 및 사용자 흐름 정리
* React 컴포넌트 구조 설계
* Tailwind CSS 기반 UI 스타일 작성
* 책 추가/수정/삭제 기능 구현 보조
* localStorage 저장 기능 구현 보조
* Firebase Firestore 연동 과정 설명
* Firebase Authentication 및 Google 로그인 구현 보조
* 오류 메시지 분석 및 디버깅
* README 및 보고서 작성 방향 정리
* GitHub Copilot을 활용한 코드 자동완성 및 반복 코드 작성 보조

AI가 제안한 코드는 직접 실행하고 테스트하면서 수정하였으며, 최종적으로 프로젝트 기능이 정상적으로 작동하는지 확인하였습니다.

---

## 14. 참고 자료

* React 공식 문서
* Vite 공식 문서
* Tailwind CSS 공식 문서
* Firebase 공식 문서
* Firebase Authentication 문서
* Firebase Firestore 문서
* Firebase Hosting 문서