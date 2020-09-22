(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.VueEventBus = factory());
}(this, (function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    function plugin(Vue, options) {
        if (options === void 0) { options = {}; }
        var eventBusNamespace = options.eventBusNamespace;
        eventBusNamespace = eventBusNamespace || '$eventBus'; // this.$eventBus as default
        if (Vue[eventBusNamespace]) {
            throw new Error('eventBusNamespace conflict, please redefine');
        }
        var events = new Vue({
            name: eventBusNamespace,
            data: function () {
                return {
                    eventCompMap: {},
                    compEventMap: new WeakMap(),
                };
            },
            methods: {
                on: function (event, callback, compInstance) {
                    compInstance && this._handlecompEventMap(event, callback, compInstance);
                    compInstance && this._handleEventMap(event, compInstance);
                    this.$on(event, callback);
                },
                emit: function (event) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    this.$emit.apply(this, __spreadArrays([event], args));
                },
                off: function (event, callback) {
                    this.$off(event, callback);
                },
                once: function (event, callback) {
                    this.$once(event, callback);
                },
                // 记录该组件订阅了多少个事件
                // 便于在组件销毁时自动解绑
                _handlecompEventMap: function (event, callback, compInstance) {
                    var _a;
                    if (this.compEventMap.has(compInstance)) {
                        var eventCompMap = this.compEventMap.get(compInstance);
                        if (eventCompMap === null || eventCompMap === void 0 ? void 0 : eventCompMap[event]) {
                            eventCompMap[event].push(callback);
                        }
                        else {
                            eventCompMap = {};
                            eventCompMap[event] = [callback];
                        }
                    }
                    else {
                        this.compEventMap.set(compInstance, (_a = {},
                            _a[event] = [callback],
                            _a));
                    }
                },
                // 记录订阅事件组件引用处理
                _handleEventMap: function (event, compInstance) {
                    this.eventCompMap[event]
                        ? this.eventCompMap[event].push(compInstance)
                        : (this.eventCompMap[event] = [compInstance]);
                },
            },
        });
        Object.defineProperty(Vue.prototype, eventBusNamespace, {
            get: function () {
                return events;
            },
        });
        Vue.mixin({
            // 销毁时，自动解绑订阅事件
            beforeDestroy: function () {
                // const { $eventBus } = this as Vue;
                var _this = this;
                if (eventBusNamespace) {
                    var $eventBus_1 = this[eventBusNamespace];
                    var eventCompMap = $eventBus_1.eventCompMap, compEventMap = $eventBus_1.compEventMap;
                    var eventSubs = compEventMap.get(this);
                    if (eventSubs) {
                        var _loop_1 = function (eventName) {
                            var eventHandlers = eventSubs[eventName];
                            Array.isArray(eventHandlers) &&
                                eventHandlers.forEach(function (handler) {
                                    $eventBus_1.off(eventName, handler);
                                });
                            // 处理 eventCompMap
                            if (eventCompMap[eventName]) {
                                var compSubs = eventCompMap[eventName];
                                // 假如订阅了同个事件
                                // 需要全部移除
                                compSubs = compSubs.filter(function (comp) { return comp !== _this; });
                                compSubs.length === 0 && delete eventCompMap[eventName];
                            }
                        };
                        for (var _i = 0, _a = Object.keys(eventSubs); _i < _a.length; _i++) {
                            var eventName = _a[_i];
                            _loop_1(eventName);
                        }
                        compEventMap.delete(this);
                    }
                }
            },
        });
    }

    return plugin;

})));
