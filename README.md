Vue2源码揭秘 - 虚拟DOM

# 1. 概念介绍

虚拟 DOM (Virtual DOM，简称 VDOM) 是一种编程概念。

意为将目标所需的 UI 通过数据结构“虚拟”地表示出来。一般保存在内存中，将真实的DOM与之保持同步。 

具体来说，虚拟 DOM 是由一系列的 ```JavaScript 对象```组成的树状结构，每个对象代表着一个DOM元素，包括元素的标签名、属性、子节点等信息。

虚拟 DOM 中的每个节点都是一个 ```JavaScript 对象```。

> Vue是基于 vdom 的前端框架，组件渲染时```执行 vue实例上的 render方法 会返回 vdom```，渲染器再把 vdom 通过浏览器增删改的 api 同步到 dom。

如下这种DOM结构。

```js 
<div>
    <div id="apple">苹果</div>
    <div class="banana">香蕉</div>
    <div>火龙果</div>
</div> 
```

上面这种DOM结构在vue中会被解析成类似下面这种vdom结构（省略部分属性）。

```js
{
  tag:'div',
  data:undefined,
  children:[
    {
      tag:'div',
      data:{
        attrs:{
          id:"apple"
        }
      },
      children:[
        {
          tag:undefined,
          text:"苹果"
        }
      ]
    },
    {
      tag:'div',
      data:{
        staticClass:'bannana'
      },
      children:[
        {
          tag:undefined,
          text:"香蕉"
        }
      ]
    },
    {
      tag:'div',
      data:undefined,
      children:[
        {
          tag:undefined,
          text:"火龙果"
        }
      ]
    }
  ]
}
```

```在前端领域虚拟 DOM 就是一个普通的 JS对象```。

我们可以利用对象上的属性来构建```真实 DOM 树```。

# 2. 生成 虚拟 DOM 的方法

## 2.1  vue的runtime-only模式

在Vue中，通常我们会采取Runtime-Only模式运行Vue项目。

在这个模式中，我们在构建阶段所有的模版```(<template>标签中的HTML)```已经被```预编译```成Javascript渲染函数（render函数）。

预编译过程通常由如vue-loader配合vue-template-compiler这样的工具在Webpack构建过程中完成，它们会把.vue文件中的模板转换为高效的JavaScript代码。

如下图，会将模版部分编译成一个 render 函数。

 ![alt text](image.png)

## 2.2 Vue.prototype._render 方法

在Vue源码路径```core/instance/index```文件中执行了 renderMixin 方法。

renderMixin 方法中给Vue构造函数上添加了 _render 方法。

_render 方法的返回值就是对应的 vdom。

渲染的时候就是调用 _render 方法获取当前模板对应的 vdom。

我们简化一下对应的代码：

```js
Vue.prototype._render = function () {
    const vm = this;
    const { render } = vm.$options;
    // 调用 vue 实例中的 render 选项 返回 vdom
    let vdom = render.call(vm, vm.$createElement);
    return vdom;
}
```

可以看出调用 render 

## 2.3 vm.render 方法

vm 在 vue 中代表 ```vue实例```。

每一个 vue 组件就对应着一个 vue实例。

每一个实例上都有对应的 render 方法。比如 2.1：

```js
var render = function render() {
    var _vm = this
      , _c = _vm._self._c;
    return _c("div", 
        [
            _c("div", {attrs: {id: "apple"}}, [_vm._v("苹果")]), 
            _c("div", {staticClass: "banana"}, [_vm._v("香蕉")]), 
            _c("div", [_vm._v("火龙果")])
        ]
    );
};
```