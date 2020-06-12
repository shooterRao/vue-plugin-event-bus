# vue-plugin-event-bus

Lightweight eventBus solution, easy to use eventBus in vue2.x

## Installing

use npm

```
npm install vue-plugin-event-bus
```

use yarn

```
yarn add vue-plugin-event-bus
```

## Usage

```js
import Vue from "vue";
import VueEventBus from "vue-plugin-event-bus"; 

Vue.use(VueEventBus);

// now you can use $eventBus directly in a vue component
// in vue component lifecycle hooks...
{
  created() {
    this.$eventBus.on('xxx', function callback() {}, this); // you should pass in the current vue instance
    // if you don't pass the current instance,like use this.$on(xxx),you should manual remove eventHandler...
    // so,I strongly recommend you pass 'this'(current vue instance)
    // because it can auto remove eventHandler when component is destroyed
  }
}

// in another vue component
{
  methods: {
    test() {
      this.$eventBus.emit('xxx', ...);
    }
  },
}
```
