<p align="left">
  <img src="public/brand/logo.svg" alt="Goodbye Naver Blog logo" width="88" />
</p>

# Goodbye Naver Blog

[![codecov](https://codecov.io/gh/mym0404/goodbye-naver-blog/graph/badge.svg)](https://codecov.io/gh/mym0404/goodbye-naver-blog)

네이버 블로그 공개 글을 스캔해서 Markdown, frontmatter, 로컬 자산, 복구 가능한 `manifest.json`으로 export하는 도구입니다.

![Goodbye Naver Blog Open Graph image](public/brand/og-image.png)

## 내 블로그에 특정 블록이 파싱이 안돼요

1. 해당 Repository를 fork합니다.
2. 내 컴퓨터에 [bun](https://bun.com/docs/installation) 을 준비합니다. 설치 후 `bun --version` 을 실행해봅니다.
3. Coding AI Agent에게 `$ingest-blog {내 블로그 id}` 를 부탁합니다. (현재는 `.agents/skills/ingest-blog` 에 존재하는 스킬입니다.)
4. Parsing failure blocks 들에 대한 Fix가 PR로 올라 올 것입니다. 그 전에 마음에 들게 수정할 수 있습니다.

> [!NOTE]
> 위 Skill이 매끄럽게 작동하지 않을 수 있습니다. 피드백을 주시면 감사하겠습니다.

## Rule-based HTML Parser 는 점점 강해집니다 🚀

다음과 같은 루틴을 통해 이 저장소의 Parser는 점점 진화하고 강해집니다.

[PR List](https://github.com/mym0404/goodbye-naver-blog/pulls?q=is%3Apr+label%3Aai-generated)

- AI는 automation을 통해 스스로 부족하다고 생각하는 부분을 많이 담고 있을 것 같은 Blog를 탐색
- 파싱이 되지 않는 블록들을 Unit으로 나눠 구조화
- 각 Unit마다 다음과 같은 작업 실행
  - 그 블록들에 대한 지원 코드 작성
  - Fixture, Coverage 검증을 통해 회귀 방지
  - PR 생성
- AI는 PR 목록 중 중복되거나 쓸모없다고 판단되는 Task는 과감히 삭제
- PR 을 보고 사람이 판단하여 마크다운 Export Option을 더 다양화하거나 삭제

## 무엇을 할 수 있나요?

- ✅ SE2, SE3, ONE(SE4) 모든 블로그 에디터 타입을 지원
- ✅ 다양한 이미지 처리 옵션
  1. 기존 네이버 블로그 글의 이미지 주소로 남겨두기
  2. 다운로드, 압축 후 로컬 경로로 변환하기
  3. **다운로드, 압축 후 PicList 로 커스텀 Provider 업로드 후 URI 변경하기**
- ✅ 동일한 이미지는 비교 후 **중복 다운로드 하지 않음** (예를 들어, 특정 카테고리의 고정된 썸네일들이 중복 다운로드 되거나 업로드되지 않음)
- ✅ 수백 가지의 Html parsing ruleset 이 점점 강해집니다?
- ✅ 각 블록에 대한 여러 마크다운 Export 옵션
- ✅ Frontmatter 지원
- ✅ 같은 블로그에 있는 다른 글 백링크를 자유 형식으로 변환 가능(예를 들어, 새로운 블로그로 이전한다고 할 때 그 블로그의 https 주소나 상대 경로로 변경 가능)
- ✅ 그 외 다양한 옵션들

> 지원 범위는 공개 글만입니다.

## 빠른 시작

### 요구 사항

- [mise](https://mise.jdx.dev/)

### 설치

```bash
git clone https://github.com/mym0404/goodbye-naver-blog.git
cd goodbye-naver-blog
mise trust
mise install
pnpm install
```

### 실행

```bash
pnpm start
```

브라우저에서 [http://localhost:4173](http://localhost:4173) 을 열면 됩니다.

기본 흐름은 아래와 같습니다.

1. 블로그 ID 또는 URL 입력
2. 공개 글 스캔
3. 카테고리/날짜 범위 선택
4. export 실행
5. `output/` 아래 결과 확인

## 출력 예시

```text
output/
  개발/
    JavaScript/
      2024-01-02-hello-world/
        index.md
  public/
    2a4c...9f.png
  manifest.json
```

## 실제 예시

### SE2 link image

[원문 보기](https://blog.naver.com/mym0404/221504285266)

<img src=".agents/knowledge/reference/assets/readme/mym0404-221504285266-path-1-0-1-0-0-0-naver.png" alt="SE2 link image Naver capture" width="300">

```markdown
![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fcdn-images-1.medium.com%2Fmax%2F1200%2F0*WZM2cHocLncEgg1F.png%22&type=f560_336)
```

### SE2 paragraph

[원문 보기](https://blog.naver.com/mym0404/221504285266)

<img src=".agents/knowledge/reference/assets/readme/mym0404-221504285266-path-1-3-naver.png" alt="SE2 paragraph Naver capture" width="300">

```markdown
우선 아래와 같은 클래스를 하나 만들어준다.
```

### SE2 code block

[원문 보기](https://blog.naver.com/mym0404/221504285266)

<img src=".agents/knowledge/reference/assets/readme/mym0404-221504285266-path-1-7-0-naver.png" alt="SE2 code block Naver capture" width="300">

````markdown
```
class Device {
    // Base width in point, use iPhone 6
    static let base: CGFloat = 375
    static var ratio: CGFloat {
        return UIScreen.main.bounds.width / base
    }
}
```
````

### SE4 link card

[원문 보기](https://blog.naver.com/mym0404/223034929697)

<img src=".agents/knowledge/reference/assets/readme/mym0404-223034929697-path-2-naver.png" alt="SE4 link card Naver capture" width="300">

```markdown
[9942번: 하노이의 네 탑](https://www.acmicpc.net/problem/9942)

9942번 제출 맞힌 사람 숏코딩 재채점 결과 채점 현황 질문 게시판 하노이의 네 탑 다국어 시간 제한 메모리 제한 제출 정답 맞힌 사람 정답 비율 3 초 128 MB 724 204 151 32.059% 문제 하노이의 탑 이라는 유명한 문제가 있다. 하지만 이 문제는 너무 유명한 나머지 이제는 식상하다. 그러니까 이번엔 탑을 3개가 아닌 4개로 늘려서 생각해보자! N개의 원판과 4개의 막대가 있을 때, 즉 보조 막대가 한 개가 아닌 두 개이면 몇 번 움직여서 모든 원판을 끝의 원판으로 옮길 수 있을까? 4개의 막대를 이용해서 N개의...
```

### SE4 image

[원문 보기](https://blog.naver.com/mym0404/223034929697)

<img src=".agents/knowledge/reference/assets/readme/mym0404-223034929697-path-4-naver.png" alt="SE4 image Naver capture" width="300">

```markdown
![](https://mblogthumb-phinf.pstatic.net/MjAyMzAzMDRfMjcz/MDAxNjc3OTM2NjkzMzk1.dBw7P8v6syYqhX6uiGFtZYMxhRNu5AdLgy0ubMXc0o8g.NCYvjxO4oXkJt-ZuBNXDiROJWj-zxI7ibwoKHpoyOKog.PNG.mym0404/image.png?type=w800)
```

### SE4 quote

[원문 보기](https://blog.naver.com/mym0404/222619228134)

<img src=".agents/knowledge/reference/assets/readme/mym0404-222619228134-path-6-naver.png" alt="SE4 quote Naver capture" width="300">

```markdown
> Description & Relation
```

### SE4 formula

[원문 보기](https://blog.naver.com/mym0404/223034929697)

<img src=".agents/knowledge/reference/assets/readme/mym0404-223034929697-path-10-naver.png" alt="SE4 formula Naver capture" width="300">

```markdown
$$
f\left(n\right)=MIN_{1\le k<n}\left\{f\left(k\right)+g\left(n-k\right)+f\left(k\right)\right\}
$$
```

### SE4 code block

[원문 보기](https://blog.naver.com/mym0404/223034929697)

<img src=".agents/knowledge/reference/assets/readme/mym0404-223034929697-path-12-naver.png" alt="SE4 code block Naver capture" width="300">

````markdown
```javascript
const ll mod = 9901;
inline ll md(ll x) { return md(mod, x); }
void solve() {
   int n, t = 1;

   vi g(1000001);
   g[1] = 1;
   for (int i = 2; i <= 1000000; i++) {
      g[i] = md(g[i - 1] * 2 + 1);
   }
   vi f(1000001);
   f[1] = 1;
   f[2] = 3;
   f[3] = 5;
   for (int i = 4; i <= 1000000; i++) {
      int k = i - round(sqrt(i * 2 + 1)) + 1;
      f[i] = md(f[k] * 2 + g[i - k]);
   }
   cin >> n;
   cout << f[n];
}
```
````

### SE4 video

[원문 보기](https://blog.naver.com/mym0404/221302086471)

<img src=".agents/knowledge/reference/assets/readme/mym0404-221302086471-path-2-naver.png" alt="SE4 video Naver capture" width="300">

```markdown
[휴머노이드 첫 Rigging 성공 애니메이션](https://blog.naver.com/mym0404/221302086471)
```

### SE4 table

[원문 보기](https://blog.naver.com/mym0404/221302086471)

<img src=".agents/knowledge/reference/assets/readme/mym0404-221302086471-path-4-naver.png" alt="SE4 table Naver capture" width="300">

```markdown
| ㅗㄷ | 1 | 2 |
| --- | --- | --- |
| 3 | 4 | 5 |
| 6 | 7 | 8 |
```
