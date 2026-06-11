---
title: "[iOS] 오토 레이아웃을 이용할 때 기기에 따라 적절한 값을 얻어오기"
source: https://blog.naver.com/mym0404/221504285266
blogId: mym0404
logNo: 221504285266
publishedAt: 2019-04-03T11:07:24+09:00
category: Tip
categoryPath:
  - iOS
  - Tip
thumbnail: https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fcdn-images-1.medium.com%2Fmax%2F1200%2F0*WZM2cHocLncEgg1F.png%22&type=f560_336
---

![](https://dthumb-phinf.pstatic.net/?src=%22https%3A%2F%2Fcdn-images-1.medium.com%2Fmax%2F1200%2F0*WZM2cHocLncEgg1F.png%22&type=f560_336)

[
Auto Layout with different screen sizes in iOS
Auto Layout is awesome. Just declare the constraints and the views are resized accordingly to their parent ‘s bounds changes.
medium.com
](https://medium.com/fantageek/auto-layout-with-different-screen-sizes-in-ios-954c780b2884)

\----------------------

우선 아래와 같은 클래스를 하나 만들어준다.

보통 아이폰6를 기준으로 작업을 하기 때문에 아이폰6의 가로 포인트 길이인 375를 기준으로 잡는다.

```
class Device {
    // Base width in point, use iPhone 6
    static let base: CGFloat = 375
    static var ratio: CGFloat {
        return UIScreen.main.bounds.width / base
    }
}
```

그리고 각 기기에 맞춰 ratio를 계산한다. 예를 들어 아이폰 XS같은 기기들은 가로 길이가 375보다 높기 때문에 ratio가 높게 나올 것이고, 아이폰 6 같은 경우에는 1이 나올 것이다.

그리고 다음과 같은 확장 함수를 정의한다.

```
extension CGFloat {
  var adjusted: CGFloat {
    return self * Device.ratio
  }
}
extension Double {
  var adjusted: CGFloat {
    return CGFloat(self) * Device.ratio
  }
}
extension Int {
  var adjusted: CGFloat {
    return CGFloat(self) * Device.ratio
  }
}
```

간단하게 Int나 Double이나 CGFloat의 값들을 ratio를 이용해서 얻어올 수 있는 확장 함수이다.

.adjusted 와 같이 사용 가능하다.
