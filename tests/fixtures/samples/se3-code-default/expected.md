---
title: sigil로 epub3 전자책 뚝딱 만들기 2018-11.2
source: https://blog.naver.com/magicmedia/221389993296
blogId: magicmedia
logNo: 221389993296
publishedAt: 2018-11-02T09:07:22+09:00
category: E-Book실습
categoryPath:
  - E-Book실습
thumbnail: https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_131%2Fmagicmedia_1448267647579OSyUI_PNG%2Fimgs_067.png%3Ftype%3Dw2%22&type=w2
---

sigil로 epub3 전자책 뚝딱 만들기 2018-11.2

무료로 사용할 수 있는 이 프로그램은 생각보다 사용자를 배려하는 점이 돋보이구요. 간단한 html 정도만 알면 누구나 쉽게 epub3 책을 만들 수 있답니다.

[v30sample_sigil.epub](https://download.blog.naver.com/open/v30sample_sigil.epub)

**그러면 이제부터 Sigil 사용법을 따라 해 보도록 하세요.**  
1\. 먼저 이전 글에서 링크를 연결해 sigil을 설치합니다.  
2\. Sigil을 실행합니다. 다음과 같이 보입니다. 설명이 없어도 화면이 어떻게 구성되었는지 알 수 있도록 예제 화면을 삽입했습니다.  
3. 화면의 간단한 설명입니다.

> 상단 : 메뉴 아이콘  
> 좌측 : 책을 구성하는 각종 요소 폴더가 존재  
> 가운데 : 페이지를 작성할 수 있는 화면(소스 보기 와 결과 보기 두 가지 모드 사용)  
> 화면 오른쪽 상단 : 목차가 나타남.  
> 오른쪽 하단 : 현재 작성한 문서의 미리 보기가 나타납니다.  
> 화면 하단 : 작업 도중 문제가 되는 소스코드를 수정할 수 있도록 안내함.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_131%2Fmagicmedia_1448267647579OSyUI_PNG%2Fimgs_067.png%3Ftype%3Dw2%22&type=w2)

4\. 새 문서를 만들면 먼저 기본으로 페이지 page0001. xhtml이라는 파일이 생성됩니다. 또는 section0001.xhtml 파일 생성됩니다. 추후에 손댈 것입니다. 이 부분은 그대로 두고 이미지 폴더부터 기존 파일을 추가하도록 해보겠습니다. 이 방법은 기존의 책을 만들기 위해 준비된 사진, 폰트, 오디오, 비디오, css 등을 한 번에 전부 등록을 한 후 작업을 하면 작업 속도가 매우 빠르기 때문에 이런 방법을 사용하는 것입니다.  
이미지 폴더를 누르고 마우스 오른쪽 버튼을 눌러 메뉴가 나오면 기존 파일 추가를 누릅니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_40%2Fmagicmedia_1448267649446jDPqS_PNG%2Fimgs_069.png%3Ftype%3Dw2%22&type=w2)

5. 등록할 이미지를 전체 선택하고 열기 버튼을 누릅니다'

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_296%2Fmagicmedia_1448267649822wsM0T_PNG%2Fimgs_070.png%3Ftype%3Dw2%22&type=w2)

6. 아래와 같이 여러 개의 파일이 등록되어 나타납니다. 이와 같은 방법으로 소스 폴더에 있는 모든 자료를 등록하면 됩니다. 폴더에 소스 자료를 등록하는 순서는 정해진 규칙이 없음으로 아무 폴더나 먼저 작업하시면 됩니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_98%2Fmagicmedia_1448267650006WJ66C_PNG%2Fimgs_071.png%3Ftype%3Dw2%22&type=w2)

7. 다시 한번 스타일 폴더에 기존 파일을 추가해 보겠습니다. 파일 폴더에 마우스 커서를 올려놓고 오른쪽 버튼을 눌러 기존 파일 추가를 클릭합니다. 소스 폴더에서 css 파일을 선택한 후 열기를 누르면 등록이 됩니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_65%2Fmagicmedia_144826764931055id1_PNG%2Fimgs_068.png%3Ftype%3Dw2%22&type=w2)

가급적 기존 스타일을 재활용해야 작업시간을 절ㅇ합니다. 이제 스타일 경로를 수정해야 합니다.  
 <head> 아래 빨간색으로 표시된 부분을 동일하게 입력합니다. 그다음 <title> </title> 을 찾아 그 사이에 문서의 제목을 써줍니다. 문서의 글자 크기, 위치, 색상 등등을 이렇게 하라고 사전에 만들어 놓은 CSS 파일을 연결해 주는 과정입니다. 이 부분은 첫 번째 페이지에서 만들어 복사해 사용합니다. 만일 나중에 하면 모든 xhtml 페이지에 각각 복사해야 하므로 쓸데없이 시간 낭비를 하게 됩니다. 이 사이트를 보고 복사하려면 아래를 사용합니다.

```
<link  href="../styles/book.css" rel="stylesheet" type="text/css" />
<meta content="width=600, height=800" name="mr kim"/> 
<title>각 장의 제목을 쓴다.</title>
```

위에서 href="../styles/book.css"중 book.css 파일 이름은 가져오기 전에 원본 이름을 수정하던지 또는 그대로 사용해도 됩니다. 아무튼 작업자에 달러 이름이 달라지겠지요.name="mr kim"은 임의로 입력하거나 저작도구 이름을 씁니다.

위에서 href="../styles/book.css"중 book.css 파일 이름은 가져오기 전에 원본 이름을 수정하던지 또는 그대로 사용해도 됩니다. 아무튼 작업자에 따라 이름이 달라지겠지요.name="mr kim"은 임의로 입력하거나 저작도구 이름을 씁니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_128%2Fmagicmedia_1448267653036rdk85_PNG%2Fimgs_083.png%3Ftype%3Dw2%22&type=w2)

8. 역시 위와 동일한 방법으로 폰트도 추가해 봅니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_184%2Fmagicmedia_1448267650121AbT0T_PNG%2Fimgs_072.png%3Ftype%3Dw2%22&type=w2)

9. 해당 폰트는 무료 배포하는 폰트로 이 블로그 사이트에 소개하고 있습니다. 방문하여 내려 받으시기 바랍니다. [http://magicmedia.blog.me/220517068395](http://magicmedia.blog.me/220517068395) 하지만 단말기에서는 추천 않습니다. 기존 포트를 사용하면 됩니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_253%2Fmagicmedia_1448267650383sXUjR_PNG%2Fimgs_073.png%3Ftype%3Dw2%22&type=w2)

10. 아래의 그림은 필요한 내용을 모두 등록한 상태입니다.  
하단에 보이는 **toc.ncx, content.opf는 소스 폴더에 없습니다**. 작업하면 자동으로 생성되는 파일입니다. **Misc 폴더를 사용하지 않습니다.**

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_21%2Fmagicmedia_1448267650526vocF6_PNG%2Fimgs_074.png%3Ftype%3Dw2%22&type=w2)

11. 이제 문서를 만들기 위해 페이지를 몇 개 생성해 보겠습니다' 컨텐트 폴더에 마우스 커서를 올리고 오른쪽 버튼을 눌러 새 페이지를 클릭합니다. 그러면 새로운 페이지가 하나 추가됩니다. 같은 방법으로 필요한 페이지를 추가해 나가면 되겠습니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_42%2Fmagicmedia_1448267646980l9wAB_PNG%2Fimgs_065.png%3Ftype%3Dw2%22&type=w2)

12. 이제 첫 번째 페이지에 북 커버를 만들어 보겠습니다 북 커버는 전체가 이미지 파일로 되어있으며 크기는 전자책 규격에 맞춰있습니다.  
첫 번째 페이지를 더블 클릭하면 자동으로 가운데 화면에 편집할 수 있는 빈 화면이 열립니다.  
이때 중요한 것은 상단 메뉴 아이콘 중에 책이 펼쳐진 모양과 **부등호 기호**가 마주 보고 있는 아이콘 있는데 **펼쳐진 책과 같은 아이콘**을 누르면 워드프로세서와 같은 익숙한 방법으로 작업할 수 있습니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_81%2Fmagicmedia_1448267650721d90Fq_PNG%2Fimgs_075.png%3Ftype%3Dw2%22&type=w2)

13. 이제 이미지를 삽입하기 위하여 상단 메뉴에서 모니터 와 같은 아이콘을 클릭합니다. 이 기능은 소스 파일을 삽입할 수 있게 합니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_107%2Fmagicmedia_1448267650921pVjgo_PNG%2Fimgs_076.png%3Ftype%3Dw2%22&type=w2)

14. 아이콘을 누르면 인서트 파일 대화 상자가 나타나며 왼쪽에 이미지 비디오 오디오 등과 같이 미리 등록한 미디어 종류가 납니다. 필요한 images를 선택하고 가운데 화면에서 커버 800x600이라는 파일을 선택하겠습니다. Ok 버튼을 누릅니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_66%2Fmagicmedia_1448267651170tq9mk_PNG%2Fimgs_077.png%3Ftype%3Dw2%22&type=w2)

15\. 화면에 커버 이미지가 삽입되어 나타납니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_297%2Fmagicmedia_1448267652008Sm45Y_PNG%2Fimgs_079.png%3Ftype%3Dw2%22&type=w2)

16. 첫 번째 페이지 소스를 보기 위해 책 아이콘 옆 부등호 아이콘을 누르면 소스를 볼 수 있습니다. 잘 기억해 주십시오 펼친 책 아이콘과 부등호 아이콘은 작업할 때 수시로 사용되는 기능입니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_108%2Fmagicmedia_1448267651439T3jDN_PNG%2Fimgs_078.png%3Ftype%3Dw2%22&type=w2)

17. 첫 번째 페이지를 사용했으므로 다시 두 번째 페이지를 만들기 위해 텍스트 폴더 위에 마우스 커서를 올려놓고 마우스 오른쪽 버튼을 누르면 메뉴가 나타나는데 이때 '빈 html 파일 추가하기'를 선택합니다. 내친김에 3번째 페이지까지 생성해 둡니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_185%2Fmagicmedia_14482676522109V6Hr_PNG%2Fimgs_080.png%3Ftype%3Dw2%22&type=w2)

18. 두 번째 페이지에 글자를 입력해 보겠습니다 그런데 이 글자를 입력하려면 시간이 많이 걸리기 때문에 준비된 텍스트 파일을 복사하여 붙여넣기 합니다. **텍스트를 붙여 넣을 화면 모드는 위 즈윅 모드**입니다. 이제부터 워드프로세서와 같이 문서를 작성하는 화면은 '위 즈윅 모드', 소스를 편집하는 화면은 '소스 보기 모드'라는 용어를 사용하겠습니다.  
아래와 같이 테스트 파일을 열어 복사한 후 붙여 넣기 합니다. 텍스트 파일을 메모장으로 열어서 복사하는 것은 눈에 보이지 않지만 불필요한 코드가 따라붙는 것을 방지하기 위해서입니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_271%2Fmagicmedia_1448267652487q53Mz_PNG%2Fimgs_081.png%3Ftype%3Dw2%22&type=w2)

19\. 소스 보기 모드를 눌러 소스를 봅니다. 이때 제목 부분에 <p> </p>를 <h1> </h1>으로 수정합니다. <body>아래에 있습니다.  
마찬가지로  
소제목에 해당하는 문장을 찾아 이번에는 <p> </p>를 <h2> </h2>로 수정합니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_166%2Fmagicmedia_14482676528080THlt_PNG%2Fimgs_082.png%3Ftype%3Dw2%22&type=w2)

20\. 세 번째 화면을 작성해 보겠습니다. 준비된 텍스트 파일을 메모장으로 열고 복사하여 위 즈윅 모드에서 붙여 넣기를 합니다. 아래의 화면이 나타나면 Yes를 클릭합니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_80%2Fmagicmedia_1448267653315UehlA_PNG%2Fimgs_084.png%3Ftype%3Dw2%22&type=w2)

21\. 아래와 같이 글자가 삽입되었습니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_159%2Fmagicmedia_1448267653597nB3R9_PNG%2Fimgs_085.png%3Ftype%3Dw2%22&type=w2)

22\. 소스 보기 모드로 전환하여 상단에 <head> 아래 두 줄을 붙여 넣기 합니다. 타이틀에 문서의 제목도 써줍니다. 본문에는 제목에 해당하는 곳이 <p></p> 대신 <h1> </h1>으로 수정합니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_154%2Fmagicmedia_14482676541634WzMI_PNG%2Fimgs_086.png%3Ftype%3Dw2%22&type=w2)

23. 이번에는 이미지를 먼저 삽입 보겠습니다. 왼쪽에서 이미지를 선택하고 가운데서 image01.jpg 파일을 선택한 후 ok 버튼을 눌러 이미지를 삽입합니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_293%2Fmagicmedia_1448267654439qsvSF_PNG%2Fimgs_087.png%3Ftype%3Dw2%22&type=w2)

24. 아래와 같이 이미지가 삽입되었습니다. 빨간색 네모와 같이 삽입된 소스가 보입니다. 앞뒤에 p와 같은 태그가 붙어 있으면 제거합니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_238%2Fmagicmedia_1448267654947ksBQf_PNG%2Fimgs_088.png%3Ftype%3Dw2%22&type=w2)

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_224%2Fmagicmedia_1448267655302EvPvF_PNG%2Fimgs_089.png%3Ftype%3Dw2%22&type=w2)

25\. 이번에는 '위 즈윅 모드'에서 파일의 종류 중 비디오 파일을 삽입해 보겠습니다 비디오 파일은 확장자가 mp4입니다. 해당 파일을 찾아 선택한 후 ok 버튼을 눌러 삽입합니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_249%2Fmagicmedia_1448267655683eAoYD_PNG%2Fimgs_090.png%3Ftype%3Dw2%22&type=w2)

26. 비디오 파일 삽입되면 아래와 같이 컨트롤러가 나타납니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_208%2Fmagicmedia_1448267655995bxmYJ_PNG%2Fimgs_091.png%3Ftype%3Dw2%22&type=w2)

27. 소스 보기를 눌러 비디오 파일 삽입될 소스를 확인합니다. 아래의 그림처럼 빨간색으로 표시된 부분을 찾아서 확인하고 초록색으로 표시된 부분을 입력하여 추가합니다. 초록색 부분은 비디오가 상영되기 전 보이는 사진 이미지로 '포스터 이미지'라고 합니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_17%2Fmagicmedia_1448267656220FItFA_PNG%2Fimgs_092.png%3Ftype%3Dw2%22&type=w2)

28. 비디오 파일에 포스터가 삽입되어 나타난 상태입니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_161%2Fmagicmedia_1448267656550hBp6t_PNG%2Fimgs_093.png%3Ftype%3Dw2%22&type=w2)

29. 이번에도 같은 방법으로 오디오 파일을 삽입해 보겠습니다. 확장자가 mp3로 되어 있는 오디오 파일을 찾아서 선택하고 ok 버튼을 누르면 삽입됩니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_264%2Fmagicmedia_1448267656863xzRJg_PNG%2Fimgs_094.png%3Ftype%3Dw2%22&type=w2)

30. 아래는 오디오 파일 삽입된 상태입니다 컨트롤러와 나타납니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_296%2Fmagicmedia_1448267657039uiJpz_PNG%2Fimgs_095.png%3Ftype%3Dw2%22&type=w2)

31. 소스 보기를 눌러 오디오 파일이 제대로 삽입되어 있는지 빨간색 네모와 같이 확인합니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_95%2Fmagicmedia_1448267657257Vvmz2_PNG%2Fimgs_096.png%3Ftype%3Dw2%22&type=w2)

32. 이제 목차를 만들 차례입니다 목차를 만들기 위해서 상단 아이콘 중에 아래와 같이 보이는 아이콘을 눌러 주세요.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_136%2Fmagicmedia_1448267657406Uzj3Q_PNG%2Fimgs_097.png%3Ftype%3Dw2%22&type=w2)

33. 차례 만들기 창이 열리면서 이미 지정한 제목들이 목차로 추출되어 나타납니다. 이때 편집이 필요하면 목차의 항목을 선택하고 상위 목차로 이동하고 싶을 경우 좌측 화살표를 누르고 하위 목차로 이동하고 싶은 경우에는 우측 화살표를 눌러 조절할 수 있습니다. 기본적인 규칙은 제목의 좌우에 h1으로 표시된 것은 상위 메뉴가 되고 h2로 표시된 것은 하위 메뉴가 됩니다. 그럼 h3는 어떻게 되느냐구요? 당연히 h2의 하위 메뉴가 되겠지요. 여기서는 이것을 강제로 수정하던지 또는 그대로 사용할 수 있습니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_265%2Fmagicmedia_1448267657787YNOdI_PNG%2Fimgs_098.png%3Ftype%3Dw2%22&type=w2)

34. 끝으로 메타데이터를 생성해 보겠습니다 메타데이터란 출판 유통 과정에서 필요한 내용입니다. 해당되는 내용을 대화 상자에서 찾아서 선택해주면 자동으로 입력됩니다.  
상단에서 그림과 같이 보이는 아이콘을 선택합니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_249%2Fmagicmedia_1448267657964IVttO_PNG%2Fimgs_099.png%3Ftype%3Dw2%22&type=w2)

35. 메타데이터 대화 상자가 나오면 우측에 '기본항목 더하기'와 '역할을 추가하세요'라는 버튼이 있습니다 어떤 것을 먼저 눌러도 상관이 없습니다. '기본항목 더하기'를 선택하면 기본적인 유통 정보가 제공되며 '역할을 추가하세요'를 선택하면 책을 만들기 위해서 참여한 사람들의 정보를 입력할 수 있습니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_238%2Fmagicmedia_1448267659051uJvp8_PNG%2Fimgs_102.png%3Ftype%3Dw2%22&type=w2)

36\. 다음은 '기본 항목'에서 선택할 수 있는 내용들입니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_142%2Fmagicmedia_1448267658324foE2d_PNG%2Fimgs_100.png%3Ftype%3Dw2%22&type=w2)

37\. 다음은 '역할을 추가하세요' 항목에서 선택할 수 있는 내용들입니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_56%2Fmagicmedia_1448267658821xns0q_PNG%2Fimgs_101.png%3Ftype%3Dw2%22&type=w2)

38\. 아래는 두 종류의 항목과 역할을 추가한 상태입니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_238%2Fmagicmedia_1448267659051uJvp8_PNG%2Fimgs_102.png%3Ftype%3Dw2%22&type=w2)

39. 항목과 역할을 추가해도 값에는 내용이 입력되지 않습니다. 값을 입력하는 네모 칸에는 직접 입력해야 합니다. 발행인 이름, 포토그래퍼, 일러스트레이터 등 필요한 내용을 입력하면 되겠습니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_216%2Fmagicmedia_1448267659509WpsOo_PNG%2Fimgs_103.png%3Ftype%3Dw2%22&type=w2)

40\. 이제 작업이 종료되었으므로 전자책 파일 포맷 epub 형식으로 파일을 저장할 차례입니다. 다른 이름으로 저장 하기를 누릅니다

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_115%2Fmagicmedia_14482676597272VK3T_PNG%2Fimgs_104.png%3Ftype%3Dw2%22&type=w2)

41\. 원하는 이름을 입력하고 저장 버튼을 누릅니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_207%2Fmagicmedia_1448267660078qK13a_PNG%2Fimgs_105.png%3Ftype%3Dw2%22&type=w2)

42. 만들어진 내용이 작동되는지 뷰어 프로그램을 이용하여 확인합니다. 이전 글을 참고합니다.  
모바일에서는 '깃든 리더' 사용을 추천합니다.

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fpostfiles.pstatic.net%2F20151123_180%2Fmagicmedia_1448267660351C8aBC_PNG%2Fimgs_106.png%3Ftype%3Dw2%22&type=w2)

엄청나게 장시간을 읽어주시느라고 고생하셨습니다. 현재 사용된 버전은 0.9입니다.
