---
title: "[정수론] 연립 일차 합동식의 해(2) - 간단하게 해 구하기"
source: https://blog.naver.com/mym0404/222452260477
blogKey: naver
sourceId: mym0404
postId: 222452260477
publishedAt: 2021-07-31T16:43:22+09:00
category: Number Theory
categoryPath:
  - Algorithm
  - Number Theory
---

이전 내용을 먼저 읽고 오자.

![\[정수론\] 연립 합동방정식의 해 (1) - 중국인의 나머지 정리 Chinese Remainder Theorem](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fblogthumb.pstatic.net%2FMjAyMTA3MzBfMTAy%2FMDAxNjI3NjU0OTE1NTU3.NjM1PdKBQSrJV40SLUlp4HBV68q2EAo4bzyGMfuz0EUg.FS225wqlI-odJWtm6TQXmvRieovqgRucNoj7IDDyESIg.JPEG.mym0404%2Falgorithm.jpeg%3Ftype%3Dw2%22&type=ff500_300)
[\[정수론\] 연립 합동방정식의 해 (1) - 중국인의 나머지 정리 Chinese Remainder Theorem](https://blog.naver.com/mym0404/222451585111)
금요일을 잘 마무리했다. 재밌었고 뿌듯했다. 중국인의 나머지 정리(CRT)는 예전부터 공부해보고 싶던 ...

---

법들이 서로소(pairwise coprime)가 아닐 때, 소인수 분해를 한 후에 합동식을 정리해서 중국인의 나머지정리를 이용하여 해를 찾는 방법은 여전히 타당하지만, **소인수 분해과정까지 들어가기 때문에 코드상으로 해를 구하기 까다롭다.**

**그 이유는 소인수분해 문제는 NP 문제이기 때문이다.** 나중에 P-NP 주제에 대해서도 정리하겠다.

[Is the prime factorization problem in NP class? If not, supposing P = NP, would RSA encryption and other such algorithms which rely on ...](https://www.quora.com/Is-the-prime-factorization-problem-in-NP-class-If-not-supposing-P-NP-would-RSA-encryption-and-other-such-algorithms-which-rely-on-prime-factorization-being-hard-be-rendered-ineffective)
Answer: The prime factorization problem is in the NP class, but we don't know if it is NP-hard. In other words, there is currently no proof that prime factorization problem cannot be solved polynomial time (= in P). Subsequently there is no proof that algorithms that rely on prime factorization b...

그러나 최대공약수는 다항시간안에 풀리는 문제이므로 소인수 분해를 안하고 연립 일차 합동식의 해를 구할 수 있으면 편하다.

이 때 좀 더 간단하게 소인수분해 없이 해를 구할 수 있는 방법을 알아보자.

> 연립 합동식이 해를 가지는 필요충분조건

이 때 우리는 모든 합동식에 대해 그 합동식의 모듈러가 서로소가 아닐지라도 해를 구할 수 있는 방법이 있다.

이는 중국인의 나머지 정리라기보단 연립 합동식을 푸는 방식이지만, 중국인의 나머지 정리가 보조적으로 사용되어 해를 찾는 방식이 타당함이 보여진다.

정말 인터넷을 많이 뒤져보다가 관련된 내용이 찾기 어려웠는데 다음과 같은 자료를 발견할 수 있었다.

![전공수학 - 정수론 현대대수학 연립합동방정식의 해 (전공임용수학)](https://i.ytimg.com/vi/cvZtwrRwWFY/hqdefault.jpg)
[전공수학 - 정수론 현대대수학 연립합동방정식의 해 (전공임용수학)](https://www.youtube.com/watch?v=cvZtwrRwWFY)
전공수학 - 정수론 현대대수학 연립합동방정식의 해 (전공임용수학)권태원큐스터디 www.qstudy.kr 강의the number theory 군의정의, 아벨군, 부분군, 원소의 위수, 순환군, 군의직적, 치환, 잉여류, 유한군, 정수론 준동형사상, 동형사상, 정규부분군, 실로우의 정...

유일한 해가 존재할 조건에 대한 **필요충분조건**을 영상에 나온 내용으로 확인할 수 있다.

이 내용은 포스팅에도 정리되어있다.

다음과 같이 정리된다.

$$
\begin{cases}x\equiv a_1\left(mod\ m_1\right)\\x\equiv a_2\left(mod\ m_2\right)\end{cases}
$$

$$
\left(0\ \le \ x\ <\ \left[m1,\ m2\right]\right)
$$

$$
x가\ 유일한\ 해를\ 가진다면\ \left(m1,\ m2\right)\ |\ \left(a1-a2\right)이다.
$$

> 충분조건 증명

위의 정의에서 충분조건이라 함은 **x 가 유일한 해를 가질 때 gcd(m1, m2) \| (a1 - a2)가 만족됨을 보이는 것**이다.

이해하기 편하도록 조금 장황하게 식을 적어봤다.

$$
\begin{cases}x\equiv a_1\left(mod\ m_1\right)\\x\equiv a_2\left(mod\ m_2\right)\end{cases}
$$

$$
m\ =\left(m1,m2\right)\ 일\ 때,
$$

$$
m_1\ |\ \left(x-a_1\right)
$$

$$
m_2\ |\ \left(x-a_2\right)\ 이다.
$$

$$
m은\ m_1,\ m_2의\ 최대공약수이므로
$$

$$
m\ |\ m_1,\ m\ |\ m_2
$$

$$
m_1이\ \left(x-a_1\right)를\ 나눌\ 때,\ m_1의\ 약수인\ m\ 도\ \left(x-a_1\right)를\ 나누므로
$$

$$
m\ |\ \left(x-a_1\right)
$$

$$
m\ |\ \left(x-a_2\right)
$$

$$
m이\ \left(x-a_1\right)와\ \left(x-a_2\right)를\ 나누므로,
$$

$$
m\ |\ \left(x-a_2\right)-\left(x-a_1\right)
$$

$$
\therefore m=\left(m_1,m_2\right)\ |\ \left(a_1-a_2\right)
$$

> 필요조건 증명

이전 포스팅에서 다루었던 서로소가 아닌 법(m1, m2 ...)들에 대해 각각을 소인수분해 한 후에 합동식들을 분해하고 정리하면

**모든 법들이 서로소인 연립 합동식을 얻어낼 수 있기 때문**에 **중국인의 나머지 정리를 이용해 해가 유일하게 존재함이 보여진다.**

물론 해가 존재하는 경우여야 한다.

영상에서의 증명도 이 방식이다.

> 소인수 분해 없이 법들이 서로소가 아닐 때 해를 구하는 방법

위 필요충분조건이 이해가 되었다면 소인수 분해 없이 법들이 서로소가 아닐 때 해를 구하는 법을 생각해보자.

여러 합동식들이 있을 때, 두 개씩만 봐가면서 두 개의 합동식을 merge 하고 그 다음것과 계속 반복해나가는 방법을 생각할 수 있다. 이와 관련된 예시는 다음과 같은 동영상에 잘 나와있다.

~2분이라면서 8분은 뭡니까 에릭토씨~

![Chinese Remainder Theorem, 2-minute Method](https://i.ytimg.com/vi/EHDEvFuYPRQ/hqdefault.jpg)
[Chinese Remainder Theorem, 2-minute Method](https://youtu.be/EHDEvFuYPRQ)
A simple method for Chinese Remainder Theorem (solving system of congruences), without any modular inverse. Here's my code for Advent of Code day 13 https://...

예를 들어,

$$
x\equiv 3\left(mod\ 4\right)\ ①
$$

$$
x\equiv 5\left(mod\ 6\right)\ ②
$$

$$
x\equiv 2\left(mod\ 5\right)\ ③
$$

$$
라는\ 합동식이\ 있을\ 때,
$$

$$
①,\ ②\ 는\ 각각\ 해\ 집합
$$

$$
3,\ 7,\ 11,\ 15...
$$

$$
5,\ 11,\ 17,\ 23...
$$

$$
를\ 가지므로,
$$

$$
x\equiv 11\left(mod\ \left[4,6\right]\right)
$$

$$
x\equiv 11\left(mod\ 12\right)\ ④\ 로\ 정리된다.
$$

$$
이와\ ③을\ 동일한\ 방식으로\ 정리하면,
$$

$$
x\equiv 47\left(mod\ 60\right)\ 을\ 얻을\ 수\ 있다.
$$

그러므로 정답은 47이다. 이를 정리해보면,

$$
m\ =\left(m1,m2\right)일\ 때,
$$

$$
a_1-a_2\not\equiv 0\ \left(mod\ m\right)\ 이면\ 해가\ 없다.
$$

$$
만약\ 해\ x가\ 있다면,
$$

$$
x\ =\ a_1+m_1k_1=a_2+m_2k_2
$$

$$
m_1\left(-k_1\right)+m_2k_2=a_1-a_2\ \ ①
$$

$$
m\ |\ m1,\ m\ |\ m2\ 이므로\ ①의\ 좌항이\ m으로\ 나누어지므로
$$

$$
우항도\ 나누어진다.\ \to \ m\ |\ \left(a_1-a_2\right)
$$

$$
베주항등식에\ 의해
$$

$$
m_1x"+m_2y"=m\ 에서\ m은\ m_1과\ m_2의\ 최대공약수이므로
$$

$$
\left(x",\ y"\right)\ 해가\ 존재한다.
$$

$$
양변에\ \frac{a_1-a_2}{m}을\ 곱하면,
$$

$$
m_1x"\cdot \frac{a_1-a_2}{m}+m_2y"\cdot \frac{a_1-a_2}{m}=a_1-a_2\ \ ②
$$

$$
①에\ 의해\ k_1=-x"\cdot \frac{a_1-a_2}{m}=x"\cdot \frac{a_2-a_1}{m}
$$

$$
해\ x는\ a_1+m_1k_1\ 이므로
$$

$$
x=a_1+m_1x"\cdot \frac{a_2-a_1}{m}
$$

식에 나오는 x' 는 확장 유클리드 호제법으로 계산해주면 된다.

> 코드

이를 이용하여 소인수 분해 없이 연립 일차 합동식의 해를 구할 수 있다.

코드로 옮길 때 주의할 점은 역시 나머지 처리이다.

시간 복잡도는

$$
O\left(N\log M\right)
$$

$$
N:\ 합동식\ 수
$$

$$
M:\ 모듈러의\ 크기
$$

를 갖는다.

```javascript
ll crt(const vl &a, const vl &m) {
   ll a1 = a[0], m1 = m[0];
   for (int i = 1; i < sz(m); ++i) {
      ll a2 = a[i], m2 = m[i];
      auto[x, _, g] = xgcd(m1, m2);
      if ((a2 - a1) % g) return -1;
      ll k1 = x * (a2 - a1) / g;
      a1 = a1 + m1 * k1;
      m1 = lcm(m1, m2);
      a1 = md(m1, a1);
   }
   return a1;
}
```

카잉 달력 문제도 다음과 같이 코드를 쓸 수 있다.

[6064번: 카잉 달력](https://www.acmicpc.net/problem/6064)
6064번 제출 맞은 사람 숏코딩 재채점 결과 채점 현황 강의 카잉 달력 출처 다국어 시간 제한 메모리 제한 제출 정답 맞은 사람 정답 비율 1 초 256 MB 40100 9475 7069 24.277% 문제 최근에 ICPC 탐사대는 남아메리카의 잉카 제국이 놀라운 문명을 지닌 카잉 제국을 토대로 하여 세워졌다는 사실을 발견했다. 카잉 제국의 백성들은 특이한 달력을 사용한 것으로 알려져 있다. 그들은 M과 N보다 작거나 같은 두 개의 자연수 x, y를 가지고 각 년도를 \<x:y>와 같은 형식으로 표현하였다. 그들은 이 세상의 시초에...

```javascript
inline ll md(ll m, ll v) { return ((v % m) + m) % m; }

array<ll, 3> xgcd(ll A, ll B) {
   ll x1 = 1, x2 = 0, y1 = 0, y2 = 1, r1 = A, r2 = B;
   while (r2) {
      ll q = r1 / r2, r = r1 % r2;
      ll x = x1 - x2 * q, y = y1 - y2 * q;
      x1 = x2;
      y1 = y2;
      r1 = r2;
      x2 = x;
      y2 = y;
      r2 = r;
   }
   return {x1, y1, r1};
}

ll crt(const vl &a, const vl &m) {
   ll a1 = a[0], m1 = m[0];
   for (int i = 1; i < sz(m); ++i) {
      ll a2 = a[i], m2 = m[i];
      auto[x, _, g] = xgcd(m1, m2);
      if ((a2 - a1) % g) return -2;
      ll k1 = x * (a2 - a1) / g;
      a1 = a1 + m1 * k1;
      m1 = lcm(m1, m2);
      a1 = md(m1, a1);
   }
   return a1;
}
void solve() {
   int t, M, N, x, y;
   cin >> t;
   while (t--) {
      cin >> M >> N >> x >> y;
      cout << crt({x - 1, y - 1}, {M, N}) + 1 << endl;
   }
}
```

---

이렇게 연립 일차 합동식의 해를 구하는 방법에 대해서 중국인의 나머지 정리와 그것을 이용하여 더 간단하게 해를 구하는 방법을 알아보았다.

정말 혼자서는 쉽지 않은 공부였을 것이고 뿌듯하다.

정수론을 정복하는 그날까지 공부하자.

다음 정수론 주제는 밀러 라빈 소수 판별법이나 뤼카정리가 될 것 같다.

---

[https://codeforces.com/blog/entry/61290](https://codeforces.com/blog/entry/61290)

[\[Tutorial\] Chinese Remainder Theorem - Codeforces](https://codeforces.com/blog/entry/61290)
