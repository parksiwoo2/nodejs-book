### 프로젝트

### MVC 구조

M : model - models안에 스키마 정의, services안에 로직 정의  
V : View - public에 있는 프론트  
C : controller - path 및 권한 제어, 라우팅  

### 설치 및 실행

```npm install```

src폴더 안에서

```node app.js```

### 추가 및 수정할 파일
- /routes에 파일 추가
- /services에 파일 추가
- /public에 html파일 추가
- /public/js에 js파일 추가  
<br>
- app.js에 html파일 경로 설정
- /routes/api.js에 라우트 파일 추가

### 의존성
route -> service -> model  
역으로는 안됨