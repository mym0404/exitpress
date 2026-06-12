---
title: "[Nest JS] 공부 시작"
source: https://blog.naver.com/mym0404/222990202785
sourceId: mym0404
postId: 222990202785
publishedAt: 2023-01-21T02:38:27+09:00
category: NestJS
categoryPath:
  - NestJS
thumbnail: https://mblogthumb-phinf.pstatic.net/MjAyMzAxMjFfMTcw/MDAxNjc0MjM1Nzk4NzM3.j9xBOnc9ZEYJEjD181utsKj5wRIponNfcL93vCNx204g.c1mi5mJ6YAtuirjyqmyMnDXvwFCcc9IDVIx4MEuEkT0g.JPEG.mym0404/nestjs.jpeg?type=w
---

바빠서 공부할 시간은 많이 없는데 대략 공부를 시작해서 독스부터 천천히 읽고있다.

지금까지 읽은 부분은 OVERVIEW 부분이다.

![](https://mblogthumb-phinf.pstatic.net/MjAyMzAxMjFfNTUg/MDAxNjc0MjM1ODU3Mzkz.NmVEff2Zn6WnyyucbOGg3h2djc3LtXSAQPWROyFvUDog.fnpg_7aiAiGa32izgsxiasANsdgvhhwsJfQPyWsgbHEg.PNG.mym0404/SE-4676f277-1a30-4c6d-97f1-884f4936b76a.png?type=w)

일단 느낀점을 말하자면 구성이 좋다이다.

독스의 구성뿐 아니라 프레임워크 자체의 구성도 좋은것같다.

특징적으로 Nest JS는 RxJS, class decorator/transformer등 기존에 존재하는 유용한 라이브러리들을 프레임워크에 꽤나 큰 부분으로 잘 녹여내었다고 생각되고, 궁극적으로 express, fastify를 추상화함으로써 express나 fastify를 사용하던 유저들에게도 좋은 high level 프레임워크로써 잘 얹어진 느낌이다.

물론 이런것들이 공부를 하다가 잠깐식 새서 RxJS 독스를 보고온다든지 class-validator 를 잠깐 읽고온다든지를 시키지만 나쁘지않다. (아직 그것들도 다 읽지도 못함)

내 개발에서 다시 RxJava, RxSwift, RxDart를 이어 RxJS를 쓰게 되었다.

RxJS도 사실 리액트 네이티브를 처음 공부할때 이미 공부했던 것이지만 다시 보니 감회가 새롭다.

사실 JS는 Single Thread 언어라 observeOn, subscribeOn 같은것도 없고 헷갈릴필요도 없이 scheduling이 단순하다. 그리고 언어 자체가 워낙 functional 하게 진화해서 그 점도 한몫한다.

일단 Overview에 있는 내용들은 정말 기본적인 친구들의 역할과 사용법을 다룬다.

- Module, Controller, Provider의 역할분리와 DI
- Request Lifecycle: Middleware - Guard - Interceptor(req) - pipe - method - Interceptor(res) 로 가는 과정과 요소들
- Exception Filter등

내가 백엔드를 개발하며 API를 짠다면 이런것들이 잘 마련되어있으면 좋겠다 하는 것들이 잘 마련되어 있는 셈이다.

어차피 워낙 천천히 공부하고있어서 RxJS하고 class-validator/transformer 독스나 한번 더 훑고 공부를 이어나가면 되겠다.

\-----------

- unordered list 1
- 2
- 3

1. orderedlist 1
2. 2
3. 3

위첨자샘플위첨자

아래첨자샘플아래첨자
