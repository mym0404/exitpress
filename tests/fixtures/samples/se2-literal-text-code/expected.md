---
title: "[자료구조]자료구조란"
source: https://blog.naver.com/mym0404/221006928501
blogKey: naver
sourceId: mym0404
postId: 221006928501
publishedAt: 2017-05-16T12:57:14+09:00
category: Data Structure
categoryPath:
  - Algorithm
  - Data Structure
thumbnail: https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fssl.pstatic.net%2Fimages.se2%2Fsmedit%2F2017%2F5%2F16%2Fj2r0ytpeuh7q8v.jpg%22&type=w
---

\<자료구조에 대한 전반적 이해>

자료구조 : 데이터를 표현하고, 그렇게 표현된 데이터를 처리하는 것

\-알고리즘은 자료구조에 의존적이다.

시간복잡도 : 어떤 알고리즘이 빠르고 느린가?

공간복잡도 : 어떤 알고리즘이 메모리를 적게쓰고 많이쓰는가?

\<시간복잡도 판별법>

\-핵심 연산의 횟수를 계산한다.

최선의 경우 : 어떤 자료구조에서 어떤 알고리즘이 가장 빨리 수행될 때

최악의 경우 : 어떤 자료구조에서 어떤 알고리즘이 가장 느리게 수행될 때 -> 보편적인 시간복잡도 계산 방법

평균적인 경우 : 어떤 자료구조에서 어떤 알고리즘이 평균적인 속도로 수행될 때 -> 이상적이지만 평균적인 경우를 구하기 어렵다

\<순차 탐색 알고리즘>

```
for (i = 0; i < len; i++)
{
    if (arr[i] == target)
        return i;
}
```

\-첫번째 값부터 하나씩 따져보아 target과 일치하는지 탐색한다.

\<이진 탐색 알고리즘>

\-배열에 저장된 데이터는 정렬되어 있어야 한다.

\-배열의 길이(인덱스)의 평균을 내서 그 인덱스에 있는 값이 target 값보다 작거나 큰것을 이용해 탐색대상을 1/2씩 줄여나간다.

```
while (first <= last)
{
    mid = (first + last) / 2;
    if (target == ar[mid])
        return mid;
    else
    {
        if (target < ar[mid])
        {
            last = mid - 1;
        }
        else
        {
            first = mid + 1;
        }
    }
}
```

\-이때 반복문의 조건이 first\<=last 인 이유는 first가 last보다 커져야만이 탐색의 실패를 의미하기 때문이다.

\-last와 first가 mid가 아닌 mid-1, mid+1로 변경되는 이유는 탐색을 실패했을 때, first가 last보다 커지게 하기 위함이다.

\<빅-오 표기법>

\-데이텅 수의 증가에 따른 연산횟수의 증가율을 상한선을 표현한 것이다.

\-시간복잡도 함수 ![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fssl.pstatic.net%2Fimages.se2%2Fsmedit%2F2017%2F5%2F16%2Fj2r0ytpeuh7q8v.jpg%22&type=w) 에서 가장 영향력이 큰 부분을 따지는 것이다.

\-다양한 빅-오형이 있다.

\<빅-오 의 수학적 정의>

**두개의 함수 ![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fssl.pstatic.net%2Fimages.se2%2Fsmedit%2F2017%2F5%2F16%2Fj2r1345se7j903.jpg%22&type=w)과 ![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fssl.pstatic.net%2Fimages.se2%2Fsmedit%2F2017%2F5%2F16%2Fj2r138de71f6x3.jpg%22&type=w)이 주어졌을 때, 모든 ![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fssl.pstatic.net%2Fimages.se2%2Fsmedit%2F2017%2F5%2F16%2Fj2r13qg8ivfchw.jpg%22&type=w)에 대하여 ![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fssl.pstatic.net%2Fimages.se2%2Fsmedit%2F2017%2F5%2F16%2Fj2r145h62hwvkv.jpg%22&type=w)을 만족하는 두개의 상수 ![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fssl.pstatic.net%2Fimages.se2%2Fsmedit%2F2017%2F5%2F16%2Fj2r14gi3l2vq7t.jpg%22&type=w)가 존재하면, ![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fssl.pstatic.net%2Fimages.se2%2Fsmedit%2F2017%2F5%2F16%2Fj2r14rum0wt56f.jpg%22&type=w)의 빅=오는 ![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fssl.pstatic.net%2Fimages.se2%2Fsmedit%2F2017%2F5%2F16%2Fj2r14z89b9gdjn.jpg%22&type=w)이다.**
