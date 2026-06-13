---
title: "[Android] 더블버퍼링 Double Buffering"
source: https://blog.naver.com/mym0404/221343327125
blogKey: naver
sourceId: mym0404
postId: 221343327125
publishedAt: 2018-08-21T22:03:55+09:00
category: Tip
categoryPath:
  - Android
  - Tip
thumbnail: https://mblogthumb-phinf.pstatic.net/MjAxODA4MjFfODMg/MDAxNTM0ODU2NTYxOTEy.Q3jKlJ6uudo9HZPYicqBADHAQQCQXLLrV9Q1GX446VYg.ZPw_cxlRzqpXK9QGFklOYstG4GHfo3Pkxqe-ou5krnEg.GIF.mym0404/doubleBuffering.gif?type=w
---

더블 버퍼링은 onDraw에서 호출되는 캔버스로 뷰에 그림을 그리면 그려지는 과정이 있기 때문에 화면이 깜빡거리는 현상이 발생한다.

그러기 때문에 다른 캔버스로 다른 비트맵에 그림을 그려둔 후 딱 한번만 drawBitmap으로 모든걸 옮겨오면 더블버퍼링이다.

![](https://mblogthumb-phinf.pstatic.net/MjAxODA4MjFfODMg/MDAxNTM0ODU2NTYxOTEy.Q3jKlJ6uudo9HZPYicqBADHAQQCQXLLrV9Q1GX446VYg.ZPw_cxlRzqpXK9QGFklOYstG4GHfo3Pkxqe-ou5krnEg.GIF.mym0404/doubleBuffering.gif?type=w)

```
class CustomView extends View {
    Context context;
    Canvas mCanvas;
    Bitmap mBitmap;

    CustomView(Context context) {
        super(context);
        this.context=context;
        init();
    }

    CustomView(Context context, AttributeSet attrs) {
        super(context, attrs);
        this.context=context;
        init();
    }

    private void init() {
        mCanvas=new Canvas();
        mBitmap= Bitmap.createBitmap(300,300,Bitmap.Config.ARGB_8888);
        mCanvas.setBitmap(mBitmap);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        canvas.drawBitmap(mBitmap,0,0,null);
    }

    @SuppressLint("ClickableViewAccessibility")
    @Override
    public boolean onTouchEvent(MotionEvent event) {
        if(event.getAction()==MotionEvent.ACTION_DOWN) {
            Toast.makeText(context,"클릭",Toast.LENGTH_LONG).show();
            mCanvas.drawRect(100,100,500,500,new Paint());
            invalidate();
            return true;
        }

        return false;
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {

    }
}
```

커스텀 뷰를 정의한 코드이고 클릭 시에 예비 캔버스에 사각형을 그리고 invalidate() 로 onDraw() 를 호출해주고 이미 그려진 비트맵을 옮기기만 한다.

mCanvas가 예비 캔버스고 mBitmap이 예비 비트맵이다.

mCanvas.setBitmap(mBitmap); 을 통해 캔버스가 비트맵에 그릴 수 있도록 설정한다.
