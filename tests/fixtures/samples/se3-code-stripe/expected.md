---
title: css로 만드는 메뉴
source: https://blog.naver.com/magicmedia/221277520310
blogId: magicmedia
logNo: 221277520310
publishedAt: 2018-05-16T23:28:33+09:00
category: 웹디자인
categoryPath:
  - 웹디자인
thumbnail: https://mblogthumb-phinf.pstatic.net/MjAxODA1MTZfMjc0/MDAxNTI2NDc5MDIwNzE1.waX_rg2JWfuOsfbTPy9XHQwHzNhM8D06LF7mloPvs88g.MzPlJXdAjxT1UAXoJXaNJ8iJh2Q_OzNk5l2P6UkXCWQg.PNG.magicmedia/img184.png?type=w800
---

HTML에 CSS와 제이쿼리를 더하면 아래와 같이 멋진 메뉴를 만들 수 있습니다. 용어만 들어도 어려울 것 같다고 겁먹지 마세요. 소스 자체도 zip 파일로 첨부했습니다. 용어 이해를 못해도 그냥 사용하면 됩니다.

![](https://mblogthumb-phinf.pstatic.net/MjAxODA1MTZfMjQz/MDAxNTI2NDc5MDIwNzE3.bgc4IMLArQotUzD2853cC-0DueV0NQw5TH7FBpYij88g.4ON_JsHw1Q-C0zKXFAJ504aovPrxPZdSx26HQ3x9hrQg.PNG.magicmedia/img183.png?type=w800)

![](https://mblogthumb-phinf.pstatic.net/MjAxODA1MTZfMjc0/MDAxNTI2NDc5MDIwNzE1.waX_rg2JWfuOsfbTPy9XHQwHzNhM8D06LF7mloPvs88g.MzPlJXdAjxT1UAXoJXaNJ8iJh2Q_OzNk5l2P6UkXCWQg.PNG.magicmedia/img184.png?type=w800)

**HTML 소스입니다.**

```
<!doctype html>
<html lang=''>
<head>
   <meta charset='utf-8'>
   <meta http-equiv="X-UA-Compatible" content="IE=edge">
   <meta name="viewport" content="width=device-width, initial-scale=1">
   <link rel="stylesheet" href="styles.css">
   <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/
   font-awesome/4.7.0/css/font-awesome.min.css">
   <script src="http://code.jquery.com/jquery-latest.min.js" 
   type="text/javascript"></script>
   <script src="script.js"></script>
   <title>CSS 메뉴소스</title>
</head>
<body>

<div id='cssmenu'>
<ul>
   <li><a href='#'><span><i class="fa fa-home"></i> 홈</span></a></li>
   <li class='active has-sub'><a href='#'><span><i class="fa fa-cart-plus"></i>
   주요제품</span></a>
      <ul>
         <li class='has-sub'><a href='#'><span>제품소개 1</span></a>
            <ul>
               <li><a href='#'><span>가전제품</span></a></li>
               <li class='last'><a href='#'><span>산업용제품</span></a></li>
            </ul>
         </li>
         <li class='has-sub'><a href='#'><span>제품소개 2</span></a>
            <ul>
               <li><a href='#'><span>휴대폰</span></a></li>
               <li class='last'><a href='#'><span>태블릿PC</span></a></li>
            </ul>
         </li>
      </ul>
   </li>
   <li><a href='#'><span><i class="fa fa-leaf"></i> 회사소개</span></a></li>
   <li class='last'><a href='#'><span><i class="fa fa-phone-square"></i>
   연락처</span></a></li>
</ul>
</div>

</body>
<html>
```

1) 메뉴 개수를 더 늘리려면 <li> </li> 사이를 복사해서 메뉴 이름을 변경하고 원하는 위치에 붙여넣기 하면 됩니다.  
2) 메뉴를 클릭했을 때 사이트 이동을 하려면 <a href='#'>에서 #을 지우고 그 자리에 링크할 웹주소를 입력합니다.  
3) 메뉴명 앞에 아이콘을 수정하려면 Font Awesome라는 사이트에서 아이콘 이름을 사용하면 됩니다. 예를 들면 <i class="fa fa-xxx"></i>와 같이 사용하며 fa-xxx는 fa-search와 같이 수정하면 돋보기 아이콘이 나타납니다. 여기서는 아래와 같이 사용했습니다.  
 홈 <i class="fa fa-home"></i>  
제품 소개 <i class="fa fa-cart-plus"></i>  
회사소개 <i class="fa fa-leaf"></i>  
연락처 <i class="fa fa-telegram-plane"></i>  
그리고 추가하여 <head> </head>사이에 아래 소스를 삽입합니다. 아이콘을 링크하는 CSS 소스입니다.

```
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/
font-awesome/4.7.0/css/font-awesome.min.css">
```

만일 속도가 느려서 대안으로 Font Awesome 아이콘을 다운로드 하여 사용하려면 링크를 클릭하여 받을 수 있습니다.[https://goo.gl/FdCexh](https://goo.gl/FdCexh)

[Font Awesome 5](https://goo.gl/FdCexh)

**사용방법은 다음과 같습니다.**  
웹서버에 업로드해야 하는 파일은 css 폴더 안의 font-awesome.min.css 파일과 fonts 폴더에 안에 있는 모든 파일입니다. 폴더 구조를 유지한 채 업로드합니다.  
HTML 문서의 <head>와 </head> 사이에 다음의 코드를 추가합니다. (경로는 적절히 수정합니다.)  
<link rel="stylesheet" href="path/css/font-awesome.min.css">  
아이콘 삽입방법은 위 hrml에서 링크하는 것과 같습니다.  
형식은 <i class="fa fa-xxx"></i>입니다. 즉 xxx가 아이콘 이름으로 대체됩니다.

**CSS 소스입니다.**

```
@charset "UTF-8";
/* Base Styles */
#cssmenu > ul,
#cssmenu > ul li,
#cssmenu > ul ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
#cssmenu > ul {
  position: relative;
  z-index: 597;
}
#cssmenu > ul li {
  float: left;
  min-height: 1px;
  line-height: 1.3em;
  vertical-align: middle;
}
#cssmenu > ul li.hover,
#cssmenu > ul li:hover {
  position: relative;
  z-index: 599;
  cursor: default;
}
#cssmenu > ul ul {
  visibility: hidden;
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 598;
  width: 100%;
}
#cssmenu > ul ul li {
  float: none;
}
#cssmenu > ul ul ul {
  top: 1px;
  left: 99%;
}
#cssmenu > ul li:hover > ul {
  visibility: visible;
}
/* Align last drop down RTL */
#cssmenu > ul > li.last ul ul {
  left: auto !important;
  right: 99%;
}
#cssmenu > ul > li.last ul {
  left: auto;
  right: 0;
}
#cssmenu > ul > li.last {
  text-align: right;
}
/* Theme Styles */
#cssmenu > ul {
  border-top: 4px solid #f39800; /*오렌지*/
  font-family: Calibri, Tahoma, Arial, sans-serif;
  font-size: 14px;
  background: #1e1e1e;
  background: -webkit-gradient(linear, left top, left bottom, color-stop(0%, #1e1e1e), color-stop(100%, #040404));
  background: -webkit-linear-gradient(top, #1e1e1e 0%, #040404 100%);
  background: linear-gradient(top, #1e1e1e 0%, #040404 100%);
  width: auto;
  zoom: 1;
}
#cssmenu > ul:before {
  content: '';
  display: block;
}
#cssmenu > ul:after {
  content: '';
  display: table;
  clear: both;
}
#cssmenu > ul li a {
  display: inline-block;
  padding: 10px 22px;
}
#cssmenu > ul > li.active,
#cssmenu > ul > li.active:hover {
  background-color: #f39800;  /*오렌지*/
}
#cssmenu > ul > li > a:link,
#cssmenu > ul > li > a:active,
#cssmenu > ul > li > a:visited {
  color: #ffffff; /*흰색*/
}
#cssmenu > ul > li > a:hover {
  color: #ffffff; /*흰색*/
}
#cssmenu > ul ul ul {
  top: 0;
}
#cssmenu > ul li li {
  background-color: #ffffff; /*흰색*/
  border-bottom: 1px solid #ebebeb; /*밝은회색*/
  font-size: 12px;
}
#cssmenu > ul li.hover,
#cssmenu > ul li:hover {
  background-color: #fffac3; /*밝은 노란색*/
}
#cssmenu > ul > li.hover,
#cssmenu > ul > li:hover {
  background-color: #f39800; /*오렌지*/
  box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.15);
}
#cssmenu > ul a:link,
#cssmenu > ul a:visited {
  color: #9a9a9a; /*중간 회색*/
  text-decoration: none;
}
#cssmenu > ul a:hover {
  color: #9a9a9a; /*중간 회색*/
}
#cssmenu > ul a:active {
  color: #9a9a9a;  /*중간 회색*/
}
#cssmenu > ul ul {
  border: 1px solid #CCC \9;
  box-shadow: 0 0px 2px 1px rgba(0, 0, 0, 0.15);
  width: 150px;
}
```

위의 소스를 사용하고 싶으면 zip 파일을 다운로드합니다.  
압출을 풀고 index.html 파일을 찾아 더블클릭하면 됩니다.  
필요한 부분은 수정해서 사용합니다.  
CSS의 경로는 HTML과 같은 위치에 있습니다. 만일 별도 CSS 폴더에 저장하려면 경로를 수정해서 사용합니다.

[cssmenu.zip](https://download.blog.naver.com/open/cssmenu.zip)

아이콘 파일을 만들어 사용하는 방법은 없나?

위에 소개한 아이콘은 예쁘긴 해도 문제가 있긴 합니다. 속도가 느릴 수 있다는 점입니다. 장점도 있습니다. 벡터 아이콘으로 확대 축소에 영향을 받지 않습니다.  
느려서 문제가 있다면 아이콘을 벡터로 작업하고 웹에서 사용하는 SVG 형식으로 저장한 후 이미지 태그처럼 사용하는 방법을 고려할 수 있습니다.  
더 자세한 정보는 [https://svgontheweb.com/](https://svgontheweb.com/ko/)[ko/](https://svgontheweb.com/ko/) 에서 구할 수 있습니다.

![](https://dthumb-phinf.pstatic.net/?src=%22http%3A%2F%2Fdthumb.phinf.naver.net%2F%3Fsrc%3D%2522https%253A%252F%252Fsvgontheweb.com%252Fassets%252Fimg%252F2point.png%2522%26type%3Dff500_300%22&type=w2)

또 다른 방법은 **아이콘을 폰트로 만드는 방법**입니다. 즉 벡터로 그린 아이콘을 폰트 제작 툴을 이용해 폰트로 만들고 이를 웹폰트로 변환한 후 그것을 웹서버에 저장하여 링크로 사용하는 방법입니다. 아마 최적의 방법일 것 같으나 아이콘 수가 많아지면 '**폰트 어썸 웨어 아이콘**' 파일을 다운로드하여 사용하는 것과 **같은 이치여서** 속도가 얼마나 빠른지가 실용성에 기준이 될 듯합니다.폰트 제작 도구 중 오픈소스로 무료 제공되는 것으로는 [http://fontforge.](http://fontforge.github.io/en-US/)[github.io/en-US/](http://fontforge.github.io/en-US/) 에서 구할 수 있습니다.

[FontForge Open Source Font Editor](http://fontforge.github.io/en-US/)

Get started We recommend that you start by reading Design With FontForge before moving on to the documentation on this page. Get help Ask a question on the mailing list if you're stuck and the documentation and a websearch didn't provide any answers. Get libre FontForge is a free and open so

사용방법은 링크를 참고합니다. [http://son10001.blogspot.kr/2015/08/fontforge.html](http://son10001.blogspot.kr/2015/08/fontforge.html)

[플그램 : 폰트 제작 프로그램 FontForge](http://son10001.blogspot.kr/2015/08/fontforge.html)

웹폰트로 변환은 트루타입으로 만든 폰트를 사용함으로 변환기 소프트웨어가 있으면 됩니다. 무료로 제공되는 것이 있습니다. 하지만 간편한 방법은 사이트를 이용하는 것입니다. [https://onlinefontconverter.](https://onlinefontconverter.com)[com](https://onlinefontconverter.com) 에 있습니다.

[Online font converter](https://onlinefontconverter.com)

converts fonts to/from: .dfont .eot .otf .pfb .pfm .suit .svg .ttf .pfa .bin .pt3 .ps .t42 .cff .afm .ttc, .pdf & .woff

사용방법은 [](https://onlinefontconverter.com/)[http:](http://koreawebdesign.com/font-to-webfont-convert/)[//koreawebdesign.com/font-to-webfont-convert/](http://koreawebdesign.com/font-to-webfont-convert/) 를 참고합니다.

[웹폰트 초간편하게 변환해주는 사이트 | koreawebdesign.com](http://koreawebdesign.com/font-to-webfont-convert/)

[  
](http://koreawebdesign.com/font-to-webfont-convert/)
