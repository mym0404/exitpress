---
title: 구글 플레이에 전자책을 팔려면? 구글epub지원 내용 2018-11.15
source: https://blog.naver.com/magicmedia/221399317402
blogId: magicmedia
logNo: 221399317402
publishedAt: 2018-11-15T21:08:05+09:00
category: E-Book실습
categoryPath:
  - E-Book실습
---

구글 플레이에 전자책을 팔려면? 구글epub지원 내용  
EPUB에 삽입된 오디오/동영상은 아래 예와 같이 HTML5 태그에 포함되어야 합니다.

```
<audio src="audio/example.mp3" /> 
<video src="video/example.mp4" width="640" height="480" /> 
<video title="Example Video" width="640" height="480" poster="images/example.jpg"> 
  <source src="video/example.mp4" /> 
  <source src="video/example.webm" /> 
</video>
```

다음 속성만 Google Play 북에서 **파싱**됩니다.  
src: 동영상/오디오 파일의 위치를 정의합니다.  
width 및 height: 동영상의 크기입니다.  
poster: 동영상의 정지 이미지를 정의합니다. Google은 EPUB 규격에 지정된 이미지 형식(정적 GIF, JPEG, PNG, SVG 이미지)을 지원합니다.  
\* 참고용어 : Compile이란 영어와 Parsing이란 용어를 가있습니다.  
**파싱** : 컴파일을 하려면 소스 파일을 실행가능한 형태로 번역을 하는데 이때 의미있는 내용을 단어 단위로 나누어서 처리 하는 것입니다.  
**컴파일** : 소스파일을 실행가능한 형태로 변경하는 작업을 말합니다. 즉 소스 파일을 바이너리(기계를 위한 0,1로 이루어진 파일 형태) 파일로 변경하는것을 말합니다.  
즉 파싱 > 컴파일 > 기계어로 변환과 같은 과정을 거칩니다.  
[https://goo.gl/UEW5Te](https://goo.gl/UEW5Te) 에서는 아래와 같이 예를 들어 이해를 돕는 설명을 하고 있습니다.  
I am a boy를 한글로 컴파일 한다면  
1. 파싱 : I(나) + am(는) + a(하나의 그냥, 별 특징없는) + boy(소년)  
2. 컴파일 : I am a boy = 나는 소년이다.  
**형식**  
Google은 다음과 같은 다양한 오디오/동영상 형식을 지원합니다.  
MPEG-4, 3GPP, MOV: 일반적으로 H.264 또는 MPEG-4 동영상 코덱 및 AAC 오디오 코덱 지원  
WebM: VP8 동영상 코덱 및 Vorbis 오디오 코덱 지원  
MPEG: 일반적으로 MPEG-2 동영상 코덱 및 MP2 오디오 코덱 지원  
WMV : MS 윈도우 형식  
FLV: Adobe-FLV1 동영상 코덱 및 MP3 오디오 코덱 지원  
AVI: 많은 카메라가 이 형식을 출력함. 일반적으로 MJPEG 동영상 코덱 및 PCM 오디오 코덱  
MP3, WAV, M4A, MP4, 3GP(오디오의 경우)  
**지원되지 않는 기능**  
Google Play 북은 비표준 오디오/동영상 태그 및 자바스크립트 코드 등을 통해 사용 가능한 대화형 기능을 지원하지 않습니다.  
오디오 삽입 기능은 EPUB 파일로 제한되며 독립형 오디오북 제출은 허용하지 않습니다.  
미디어 오버레이는 현재 Android용 Google Play 북 앱에서만 지원됩니다.  
**고정 레이아웃**  
Google Play 북은 EPUB 3 파일의 고정 레이아웃 속성을 지원합니다.  
또한 아래 방법은 EPUB 2 및 EPUB 3 파일 모두에서 작동합니다.  
파일 META-INF/co[m.apple.ibooks.display-options.xml을](http://m.apple.ibooks.display-options.xml을) 포함합니다.  
<meta name="viewport" content="width=xxx, height=yyy"></meta>을(를) 추가하여 XHTML 항목의 레이아웃을 지정합니다.  
META-INF/co[m.apple.ibooks.display-options.xml](http://m.apple.ibooks.display-options.xml) 파일에서 다음 값만 파싱됩니다.

```
<?xml version="1.0" encoding="UTF-8"?> 
<display_options> 
  <platform name="*"> 
    <option name="fixed-layout">true</option> 
    <option name="orientation-lock">landscape-only</option> 
  </platform> 
</display_options>
```

orientation-lock의 경우 portrait-only 값도 지원됩니다.  
다음과 같은 추가 속성은 무시됩니다.  
platform name: \*와(과) 다른 경우  
open-to-spread: 항상 false로 설정

참고 : [https://goo.gl/k23tXV](https://goo.gl/k23tXV)

[EPUB 파일 - Books 고객센터](https://goo.gl/k23tXV)

EPUB 파일 EPUB은 국제 디지털 발행 포럼(IDPF) 에서 개발한 디지털 책의 개방형 표준 파일 형식입니다. 독자의 입장에서 EPUB 형식은 책의 텍스트를 자동으로 조정하거나 스마트폰, 넷북, e-Reader 기기 등 다양한 화면 크기에서 볼 수 있도록 '재배열'할 수 있다는 이점을 가지고 있습니다. 또한 EPUB은 고정 레이아웃 콘텐츠를 지원합니다. IDPF의 EPUBZone 에서 EPUB 형식에 대해 자세히 알아보세요. 다양한 도구와 서비스에서 EPUB 파일 생성을 지원합니다. 파트너마다 각기 다른 상황이 있
