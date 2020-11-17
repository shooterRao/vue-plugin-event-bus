import { VueConstructor, Component } from 'vue';

export interface EventCompMap {
  [event: string]: Component[];
}

export interface CompEventMap {
  [event: string]: [Function];
}

export interface HasHook {
  [uid: string]: boolean;
}

function eventBusPlugin(Vue: VueConstructor) {
  // 用于记录同个事件被多少个组件订阅了
  const eventCompMap = {} as EventCompMap;

  // 用于记录每个组件订阅了多少个事件
  const compEventMap = new WeakMap<Component, CompEventMap>();

  // components has hook
  const hasHook: HasHook = {};

  const EventBus = new Vue();

  // 记录该组件订阅了多少个事件
  // 便于在组件销毁时自动解绑
  function handleCompEventMap(
    event: string,
    callback: Function,
    compInstance: Component
  ) {
    if (compEventMap.has(compInstance)) {
      let eventCompMap = compEventMap.get(compInstance);

      if (eventCompMap) {
        if (eventCompMap[event]) {
          eventCompMap[event].push(callback);
        } else {
          eventCompMap[event] = [callback];
        }
      }
    } else {
      compEventMap.set(compInstance, {
        [event]: [callback],
      });
    }
  }

  // 记录订阅事件组件引用处理
  function handleEventMap(event: string, compInstance: Component) {
    eventCompMap[event]
      ? eventCompMap[event].push(compInstance)
      : (eventCompMap[event] = [compInstance]);
  }

  // 在使用了 $eventBus 组件的 beforeDestroy 钩子队列中加入解绑函数
  function handleBeforeDestroyHooks(compInstance) {
    const { _uid } = compInstance;

    if (!hasHook[_uid]) {
      compInstance.$once('hook:beforeDestroy', beforeDestroyHandler);
      hasHook[_uid] = true;
    }
  }

  function beforeDestroyHandler() {
    // @ts-ignore
    const compInstance = this;

    const eventSubs = compEventMap.get(compInstance);

    if (eventSubs) {
      for (const eventName of Object.keys(eventSubs)) {
        const eventHandlers = eventSubs[eventName];
        Array.isArray(eventHandlers) &&
          eventHandlers.forEach((handler) => {
            EventBus.$off(eventName, handler);
          });

        // 处理 eventCompMap
        if (eventCompMap[eventName]) {
          let compSubs = eventCompMap[eventName];
          // 假如订阅了同个事件
          // 需要全部移除
          compSubs = compSubs.filter((comp) => comp !== compInstance);
          compSubs.length === 0 && delete eventCompMap[eventName];
        }
      }

      compEventMap.delete(compInstance);

      delete hasHook[compInstance._uid];
    }
  }

  const events = {
    eventCompMap,
    compEventMap,

    on(event: string, callback: Function, compInstance?: Component) {
      if (compInstance) {
        handleCompEventMap(event, callback, compInstance);
        handleEventMap(event, compInstance);
        handleBeforeDestroyHooks(compInstance);
      }

      EventBus.$on(event, callback);
    },

    emit(event: string, ...args: any[]) {
      EventBus.$emit(event, ...args);
    },

    off(event: string, callback?: Function) {
      EventBus.$off(event, callback);
    },

    once(event: string, callback: Function) {
      EventBus.$once(event, callback);
    },
  };

  Object.defineProperty(Vue.prototype, '$eventBus', {
    get() {
      return events;
    },
  });
}

export default eventBusPlugin;
