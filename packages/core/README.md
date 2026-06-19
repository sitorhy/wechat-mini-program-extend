## 开发注意事项
+ 小程序引入需要放置在 dependencies
+ 小程序不支持引入 ts 依赖，需要编译为 js，如果 main 字段配置为 index.ts 文件，会报错（index.ts.js 找不到）

## 小程序与普通网页开发的区别
小程序的逻辑层和渲染层是分开的，逻辑层运行在不同于渲染层的独立 JS 运行时中，因此并不能直接使用 DOM API 和 BOM API。

## app.json
app.json 是当前小程序的全局配置，包括了小程序的所有页面路径、界面表现、网络超时时间、底部 tab 等。

## WXML / HTML 区别
WXML 支持表达式，标签跟 HTML 不一样，访问节点信息需要特定 API
```js
const query = this.createSelectorQuery()
query.select('#the-id').boundingClientRect(function(res){
  res.top // #the-id 节点的上边界坐标（相对于显示区域）
})
query.selectViewport().scrollOffset(function(res){
  res.scrollTop // 显示区域的竖直滚动位置
})
query.exec()
```

## CSS / WXSS 区别
app.wxss 作为全局样式，会作用于当前小程序的所有页面，
局部页面样式 page.wxss 仅对当前页面生效。
WXSS 底层支持 rpx 尺寸单位。 iPhone 6（375px 屏幕宽度）：1rpx = 0.5px
web 页面 rpx实现：
```scss
$design-width: 750; // 设计稿宽度

@function rpx($px) {
  @return ($px / $design-width) * 100vw;
}

.element {
  width: rpx(100);  // 100rpx
  height: rpx(200); // 200rpx
}
```

## WX 内联脚本
没有代码提示， 不支持 es6
```wxml
<!--wxml-->
<wxs module="m1">
var msg = "hello world";

module.exports.message = msg;
</wxs>

<view> {{m1.message}} </view>
```

## 新版小程序特性
+ 双向绑定 `<input model:value="{{value}}" />`
自定义组件中传递双向绑定，绑定字段不能有点运算符（不支持访问对象属性）
```
<!-- ✅ 正确写法 -->
<input model:value="{{simpleValue}}" />

<!-- ❌ 错误写法 -->
<input model:value="{{obj.property}}" />
```
自定义双向绑定：
```
// 自定义组件
Component({
  properties: {
    value: {
      type: String,
      value: ''
    }
  },
  
  methods: {
    onInput(e) {
      // 手动触发双向绑定
      this.setData({
        value: e.detail.value
      })
      // 触发事件通知父组件
      this.triggerEvent('input', e.detail.value)
    }
  }
})

<!-- 自定义组件模板 -->
<input value="{{value}}" bindinput="onInput" />

<!-- 父组件使用 -->
<custom-input model:value="{{parentValue}}" />

```
局限：
只能用于特定组件：
```
input / textarea / slider滚动条 / switch / picker / editor
```

## 小程序为什么要区分 Page 和 Component 接口
1. 生命周期不同
Page: 关注页面级别的生命周期（onLoad、onShow、onHide等）
Component: 关注组件级别的生命周期（created、attached、ready等）

2. 复用性
`Page: 页面级别的容器，通常不被复用
Component: 可复用的 UI 组件，可在多个页面中使用


## 小程序运行机制
1. 生命周期
「启动」专指冷启动，热启动一般被称为后台切前台 
进入了「后台」状态：
锁屏/切换应用/返回，小程序是微信的一个界面，只要微信进程保活，基本上都是切到后台。
「后台」状态一段时间后（目前是 5 秒），微信会停止小程序 JS 线程的执行，小程序进入「挂起」状态。
（目前是 30 分钟）都未再次进入前台，小程序会被销毁。
冷启动的情况：
扫码直接跳转到特定页面。还有就是重新进入。


## Skyline引擎跟 Webview 引擎区别
WebView 架构的小程序由于存在两个独立的 JS 运行时，所以需要使用 JSBridge 序列化中专。
Skyline 底层用的是 Flutter 渲染，只有一个 JS 运行时，所以不需要 JSBridge，实际上转换还是有的，但是 Flutter 优化的余地更大。
主要是两点：
无需为每个页面新建一个 JS 引擎实例（WebView），减少了内存、时间开销
框架的代码之间无需再通过 JSBridge 进行数据交换，减少了大量通信时间开销（数据序列化）
实际上：
由于底层使用的是 Flutter 渲染更加精细可控，样式兼容问题更少 
Skyline 支持函数式定义组件，从配置式转为链式调用，可以在文件最外层增加逻辑，复杂组件逻辑会更容易组织。
可以把一些初始化操作放在组件初始化之前：
```js
///  ... 初始化操作

Component()
  .property('myProperty', String)
  .property('myAnotherProperty', String)
  .data(() => ({
    myDataField: 'someValue',
  }))
  .register()
```
增加容器组件(list-builder)等，应该是对接 Flutter 的 ListView 组件，原生虚拟滚动支持。
