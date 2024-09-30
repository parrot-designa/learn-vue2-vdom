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

# 2. vue 的模板编译

在 vue 中，通常我们会采取Runtime-Only模式运行 vue 项目。

在这个模式中，我们在构建阶段所有的模版```(<template>标签中的HTML)```已经被```预编译```成Javascript渲染函数（render函数）。

预编译过程通常由如vue-loader配合vue-template-compiler这样的工具在Webpack构建过程中完成，它们会把.vue文件中的模板转换为高效的JavaScript代码。

如下图，会将模版部分编译成一个 render 函数。 

 ![alt text](image.png)

```不管是使用template直接编写模板还是使用 vue 脚手架搭建项目，最终都会编译为 render 函数```。

# 3. render 函数的本质

## 3.1 _render 方法

在 vue 源码中，是调用 vm._render 函数来获取需要渲染的vDom。

那么_render和 render函数有什么关联呢？

在 vue 框架初始化时中给Vue构造函数上添加了 _render 方法。 

```js
Vue.prototype._render = function () {
    const vm = this;
    const { render } = vm.$options;
    // 调用 vue 实例中的 render 选项 返回 vdom
    let vdom = render.call(vm);
    return vdom;
}
``` 
可以看出_render方法就是调用 vue 实例上的render方法。

所以核心还是  vm.render 方法。

## 3.2 vm是什么？

上面我们可以看到有大量的 vm 代码。

其实 vm 在 vue 中代表 ```vue实例```。

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
## 3.3 vm._self指的是什么？ 

vm._self 是在vue框架初始化时 vm._init 方法中设置的，如下。

```js
Vue.prototype._init = function(){
    const vm = this
    vm._self = vm
}
```  
通过上面，我们很容易发现_self就是指的实例本身。

## 3.4 vm._self._c指的是什么？

上面我们知道 vm._self 其实就是 vm 。

那么 ```vm._self._c  === vm._c```。

vm._c 是在vue框架初始化时在 initRender 函数中定义的。

```js
export function initRender(vm){
    vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
}
```  

可以看到实际上是调用了 createElement 这个函数。


## 3.5 总结

通过上面的总结，我们知道 render 函数本质上就是将模板变成对应结构的createElement函数调用。

下一章节我们来研究一下这个 createElement函数。

# 4. createElement函数

我们来好好研究一下这个 createElement 函数。

```js
export function createElement(
  context: Component,
  tag: any,
  data: any,
  children: any
): VNode | Array<VNode> {
  if (isArray(data) || isPrimitive(data)) { 
    children = data
    data = undefined
  }
  return _createElement(context, tag, data, children)
}
```

## 4.1 灵活性

我们可以看出来这个函数最后又调用了_createElement。

只是其中对children属性和 data 属性做了处理。

那么这个处理的意义是什么呢？

这个判断的存在主要是为了提高函数的灵活性和易用性，允许用户在调用 createElement 函数时有几种不同的方式来传递参数：

1. 标准调用：

```js
// 编译前
<div class="container">
    Hello World
</div>
// 编译前
createElement(context, 'div', { class: 'container' }, ['Hello World']);
```

目前 data 只可能是对象或者为空。

2. 只有子节点： 

```js
// 编译前
<div>Hello World</div>
// 编译后
createElement(context, 'div', 'Hello World');
```

这种情况就对应着 isPrimitive 的判断。

isPrimitive可以判断值的类型是否是一个原始类型（如字符串、数字、布尔值）。

在这种情况下，对应着 data 实际上是子节点内容，应该被解释为 children，而 data 应该为 undefined。

3. 子节点数组：

```js
// 编译前
<ul>
    <li>Item 1</li>
    <li>Item 2</li>
</ul>
// 编译后
createElement(context, 'ul', ['<li>Item 1</li>', '<li>Item 2</li>']);
```

这种情况就对应着 isArray 的判断。

isArray可以判断值的类型是否是一个数组。

在这种情况下，对应 data 是一个包含子节点的数组，应该被解释为 children，而 data 应该为 undefined。

> 所以在传入_createElement时参数已经被处理过了，体现了 Vue 框架处理参数的灵活性和易用性。

## 4.2 _createElement的四个参数

经过 createElement对参数的处理，_createElement收到的参数意义不会有偏差了。

### 4.2.1 context

context就是上下文，也就是自身。

可以通过这个参数获取实例上的各个属性并灵活使用。

### 4.2.2 tag

这个参数指定了要创建的虚拟节点的标签名称。

这个参数决定了最终会渲染成什么样的 DOM元素。

tag可以是 HTML 元素，比如字符串```'span'、'div'```。

```html
// 编译前
<div></div>
// 编译后
_createElement("div")
```
如上面这个div标签会被编译为 ```createElement('div')```。

也可以是一个组件引用，同样可以是一个动态标签。

### 4.2.3  data

data 参数通常是一个对象，包含了用于描述 VNode 的各种属性和配置信息。

data参数可以由以下几种构成：

1. attrs

attrs 是一个对象，包含了要设置在元素上的静态属性。

如下创建一个带有 src 属性的 img 元素。

```js
// 编译前
<img src="image.jpg" />
// 编译后
_createElement(context, 'img', { attrs: { src: 'image.jpg' } });
```

2. 类 (staicClass)

可以使用 class 属性来设置 CSS 类。

```js
// 编译前
<div class="custom-class"></div>
// 编译后
_createElement(context, 'div', { staicClass: 'custom-class' });
```
3. 样式 (style)

可以使用 style 属性来设置内联样式。

```js
// 编译前
<div style="color:'red'"></div>
// 编译后
_createElement(context, 'div', { style: { color: 'red' } });
```

4. 事件处理器 (on)

on 属性用于绑定事件监听器。

```js
// 编译前
<button click="() => console.log('Clicked')"></button>
// 编译后
_createElement(context, 'button', { on: { click: () => console.log('Clicked') } });
```

5. 插槽 (slot)

可以使用 slot 属性来指定一个作用域插槽或普通插槽的位置。

```js
// 编译前
<div slot="header"></div>
// 编译后
_createElement(context, 'div', { slot: 'header' });
```

6. 组件特定属性 (props)

可以使用 props 属性来传递组件的 props 数据。

```js
// 编译前
<MyComponent message="Hello World"></MyComponent>
// 编译后
_createElement(context, MyComponent, { props: { message: 'Hello World' } });
```

7. DOM 操作指令 (directives)

可以使用 directives 来添加自定义的行为，如 v-model 或 v-show。

```js
// 编译前
<input v-model="value" />
// 编译后
_createElement(context, 'input', { directives: [{ name: 'model', value: 'value' }] });
```

8. 关键值 (key)

可以使用 key 属性来唯一标识一个 VNode，这对于列表渲染时的性能优化非常重要。

```js
// 编译前
<li key="unique-key"></li>
// 编译后
_createElement(context, 'li', { key: 'unique-key' });
``` 

### 4.2.4 children

children 参数是指定一个 VNode（虚拟节点）的子节点内容。这个参数可以包含多种类型的数据，用于描述子节点的结构和内容。

1. 文本字符串

最简单的情况是 children 参数是一个文本字符串。

这通常用于向一个元素或组件添加纯文本内容。

```js
// 编译前
<div>Hello World</div>
// 编译后
_createElement(context, 'div', {}, 'Hello World');
``` 

2. 数组

children 参数也可以是一个数组，其中包含多个子节点。

这些子节点可以是任意组合的 VNode 对象、字符串或其他可以转换为 VNode 的数据结构。