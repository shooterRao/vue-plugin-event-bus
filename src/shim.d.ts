import Vue, { Component } from 'vue'

export interface EventCompMap {
  [event: string]: Component[]
}

export interface CompEventMap {
  [event: string]: [Function]
}

export declare class EventBus extends Vue {
  eventCompMap: EventCompMap;
  compEventMap: WeakMap<Component, CompEventMap>;

  on(event: string, callback: Function, compInstance: Component): Vue;
  off(event: string, callback?: Function): Vue;
  emit(event: string, ...args: any[]): Vue;
  once(event: string, callback: Function): Vue;
}

declare module 'vue/types/vue' {
  interface Vue {
    $eventBus: EventBus;
  }
}