---
title: "[PostgreSQL] JOIN : 관계형 데이터베이스의 꽃"
source: https://blog.naver.com/mym0404/221392997287
blogKey: naver
sourceId: mym0404
postId: 221392997287
publishedAt: 2018-11-06T20:08:44+09:00
category: PostgreSQL
categoryPath:
  - PostgreSQL
---

생활코딩 egoing 선생님의 표현을 빌려왔다.

**Join 기능은 관계형 데이터베이스의 꽃**이다.

여러 foreign key로 이어진 데이터 베이스들을 SELECT와 JOIN을 통해 속성들을 묶어서 보여줄 수 있다.

Join엔 종류가 있다.

**PostgreSQL**뿐 아니라 여러 SQL에 공통적으로 사용되는 Join의 종류가 있고, PostgreSQL에서 사용할 수 있는 Join들을 알아보도록 하자.

그 전에 예시를 위해 튜토리얼 페이지에서 만든 테이블을 보자.

**\<TABLE : COMPANY>**

```
 id | name  | age | address   | salary | join_date
----+-------+-----+-----------+--------+-----------
  1 | Paul  |  32 | California|  20000 | 2001-07-13
  3 | Teddy |  23 | Norway    |  20000 |
  4 | Mark  |  25 | Rich-Mond |  65000 | 2007-12-13
  5 | David |  27 | Texas     |  85000 | 2007-12-13
  2 | Allen |  25 | Texas     |        | 2007-12-13
  8 | Paul  |  24 | Houston   |  20000 | 2005-07-13
  9 | James |  44 | Norway    |   5000 | 2005-07-13
 10 | James |  45 | Texas     |   5000 | 2005-07-13
```

**\<TABLE : DEPARTMENT>**

```
 id | dept        | emp_id
----+-------------+--------
  1 | IT Billing  |  1
  2 | Engineering |  2
  3 | Finance     |  7
```

**\[1. CROSS JOIN\]**

**CROSS JOIN은 1번 째 테이블의 모든 행과 2번 째 테이블의 모든 행을 모두 교차해서 매치시켜준다.**

위에 COMPANY 테이블과 DEPARTMENT 테이블이 각각 행이 8개, 3개 이기 때문에

CROSS JOIN의 결과는 8x3 = **24**개의 행이 나온다.

```
SELECT EMP_ID, NAME, DEPT FROM COMPANY CROSS JOIN DEPARTMENT;
```

```
emp_id| name  |  dept
------|-------|--------------
    1 | Paul  | IT Billing
    1 | Teddy | IT Billing
    1 | Mark  | IT Billing
    1 | David | IT Billing
    1 | Allen | IT Billing
    1 | Paul  | IT Billing
    1 | James | IT Billing
    1 | James | IT Billing
    2 | Paul  | Engineering
    2 | Teddy | Engineering
    2 | Mark  | Engineering
    2 | David | Engineering
    2 | Allen | Engineering
    2 | Paul  | Engineering
    2 | James | Engineering
    2 | James | Engineering
    7 | Paul  | Finance
    7 | Teddy | Finance
    7 | Mark  | Finance
    7 | David | Finance
    7 | Allen | Finance
    7 | Paul  | Finance
    7 | James | Finance
    7 | James | Finance
```

**\[2. INNER JOIN\]**

**Inner Join은 두 테이블의 열 값을 결합**해서 결과를 내놓는다.

이는 foreign key로 이어져 있는 두 테이블을 보여줄 때 유용하다.

table1와 table2의 모든 열의 값들을 비교해서 **해당 조건을 만족하는 모든 결과를 보여준다.**

문법은 다음과 같다.

```
SELECT table1.column1, table2.column2...
FROM table1
INNER JOIN table2
ON table1.common_filed = table2.common_field;
```

table1과 JOIN과 table2를 써주는 것은 똑같고 **ON**에 해당 조건을 입력해주면 된다.

예시를 보자.

[![](https://mblogthumb-phinf.pstatic.net/MjAxODExMDZfNTgg/MDAxNTQxNTAxNDkyODQx.2C_7M6XpxuOr85BHMy-gEvIHNmEl6y4z_nUGXDCsJNcg.dl_-7y84mIlkHdu_hVbInBKvLTWF94lAaCE48KV2EVcg.PNG.mym0404/123.png?type=w)](#)

이런 간단한 테이블을 만들었다. table1이라고 이름지었다.

[![](https://mblogthumb-phinf.pstatic.net/MjAxODExMDZfMTc4/MDAxNTQxNTAxNTIwNjI4.otYcmCO7qaFopQZBk9TP0ucDzGwIPHIPGIHcuPY0oGog.enhoDEc_c24fZlQrkica9VteZ4jTHlpL93sALZXhLqAg.PNG.mym0404/123.png?type=w)](#)

이건 테이블 2이다.

테이블1의 major\_id는 테이블2의 \_id를 참조한다.

자이제 INNER JOIN을 써보자.

```
SELECT table1._id, table1.name, table2.major 
FROM table1 
INNER JOIN table2
ON table1.major_id=table2._id
```

table1의 major\_id에 table2.\_id와 같은 녀석들의 조건들만 SELECT 해주었다.

[![](https://mblogthumb-phinf.pstatic.net/MjAxODExMDZfNTEg/MDAxNTQxNTAxNjUzMzUz.GTMhV-8MGNA9IVubax2X8-gaXRFhMwSBSQ9YxT4mMaAg.spn-mwUPwx4Xe1tlzvZOmy378jx41YE13lAOYHepK74g.PNG.mym0404/123.png?type=w)](#)

결과는 위와 같다.

major\_id 대신 major가 적절히 들어갔다.

**\[3. LEFT OUTER JOIN\]**

OUTER JOIN은 INNER JOIN의 확장된 형태인데, 총 LEFT, RIGHT, FULL OUTER JOIN 3가지의 OUTER JOIN이 있다.

**LEFT OUTER JOIN은 우선 INNER JOIN이 실행되고**, **table1에 table2의 조건을 충족하지 못하는 행들이 table2의 값들이 null로 표시되어 나타난다.**

그렇기 때문에 **table1의 행들은 무조건 하나씩은 나타난다.** (table2의 조건을 충족하면 table1의 행 하나에도 여러개의 table2의 정보가 결합되어 나타날 수 있다.)

[![](https://mblogthumb-phinf.pstatic.net/MjAxODExMDZfMTE0/MDAxNTQxNTAxOTYxMjA0.3gJdnlDZjp43Ov2yEu9HkIbs0InRZDlA814HYq8Ueukg.gJGspvaMm5M50d7L16UT3KlAEdhnvkBxy6qM1MPooyYg.PNG.mym0404/123.png?type=w)](#)

자, 데이터를 위와 같이 바꾸어보았다. table2엔 major가 id 3까지밖에 없는 상태이므로 table1의 major\_id =4 들은 inner join으로는 표시할 수 없다.

[![](https://mblogthumb-phinf.pstatic.net/MjAxODExMDZfMTYy/MDAxNTQxNTAyMjQyMjgz.i5jI30cStyA2vpZ_z5i7Kc4i-kqSo1-B98M1MpB0HT4g.S8c2zIs6eNy-KOyFX-hpWaD8BgC5voWZtoaY-gZiUmYg.PNG.mym0404/123.png?type=w)](#)

하지만 위와 같이 LEFT OUTER JOIN을 사용하면 major는 null 로 처리되고 모두 보여진다.

**\[4. RIGHT OUTER JOIN\]**

이건 LEFT OUTER JOIN을 잘 이해했다면 반대로 생각하면 쉽다.

**INNER JOIN이 실행된 후,**

이제 table2의 정보중 tabel1의 조건을 만족하지 못하는 녀석들이 table1의 정보들이 null로 처리돼서 나타난다.

**\[5. FULL OUTER JOIN\]**

I**NNER JOIN이 실행된 후, table1에 있는 정보중 table2의 조건을 충족하지 못하는 것들도 모두 나타나고 그 반대도 모두 나타난다.**

\--------------

[PostgreSQL - JOINS](https://www.tutorialspoint.com/postgresql/postgresql_using_joins.htm)
PostgreSQL - JOINS Advertisements The PostgreSQL Joins clause is used to combine records from two or more tables in a database. A JOIN is a means for combining fields from two tables by using values common to each. Join Types in PostgreSQL are &minus; The CROSS JOIN The INNER JOIN The LEFT OUTER JOIN The ...
