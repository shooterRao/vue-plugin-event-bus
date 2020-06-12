import { VueConstructor, Component } from 'vue'

export interface EventCompMap {
  [event: string]: Component[]
}

export interface CompEventMap {
  [event: string]: [Function]
}

function plugin(Vue: VueConstructor) {

  const events = new Vue({
    name: '$eventBus',
    data() {
      return {
        eventCompMap: {} as EventCompMap, // 用于记录同个事件被多少个组件订阅了
        compEventMap: new WeakMap<Component, CompEventMap>(), // 用于记录每个组件订阅了多少个事件
      };
    },
    methods: {
      on(event: string, callback: Function, compInstance?: Component) {
        compInstance && this._handlecompEventMap(event, callback, compInstance);

        compInstance && this._handleEventMap(event, compInstance);

        this.$on(event, callback);
      },

      emit(event: string, ...args: any[]) {
        this.$emit(event, ...args);
      },

      off(event: string, callback?: Function) {
        this.$off(event, callback);
      },

      once(event: string, callback: Function) {
        this.$once(event, callback);
      },

      // 记录该组件订阅了多少个事件
      // 便于在组件销毁时自动解绑
      _handlecompEventMap(event: string, callback: Function, compInstance: Component) {
        if (this.compEventMap.has(compInstance)) {
          let eventCompMap = this.compEventMap.get(compInstance);
          if (eventCompMap?.[event]) {
            eventCompMap[event].push(callback);
          } else {
            eventCompMap = {};
            eventCompMap[event] = [callback];
          }
        } else {
          this.compEventMap.set(compInstance, {
            [event]: [callback],
          });
        }
      },

      // 记录订阅事件组件引用处理
      _handleEventMap(event: string, compInstance: Component) {
        this.eventCompMap[event]
          ? this.eventCompMap[event].push(compInstance)
          : (this.eventCompMap[event] = [compInstance]);
      },
    },
  });

  Object.defineProperty(Vue.prototype, '$eventBus', {
    get() {
      return events;
    },
  });

  Vue.mixin({
    // 销毁时，自动解绑订阅事件
    beforeDestroy() {
      const { $eventBus } = this as Vue;
      const { eventCompMap, compEventMap } = $eventBus;

      const eventSubs = compEventMap.get(this);

      if (eventSubs) {
        for (const eventName of Object.keys(eventSubs)) {
          const eventHandlers = eventSubs[eventName];
          Array.isArray(eventHandlers) &&
            eventHandlers.forEach((handler) => {
              $eventBus.off(eventName, handler);
            });

          // 处理 eventCompMap
          if (eventCompMap[eventName]) {
            let compSubs = eventCompMap[eventName];
            // 假如订阅了同个事件
            // 需要全部移除
            compSubs = compSubs.filter((comp) => comp !== this);
            compSubs.length === 0 && delete eventCompMap[eventName];
          }
        }

        compEventMap.delete(this);
      }
    },
  });
}

export default plugin;
