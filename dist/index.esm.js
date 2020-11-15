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

function eventBusPlugin(Vue) {
    // 用于记录同个事件被多少个组件订阅了
    var eventCompMap = {};
    // 用于记录每个组件订阅了多少个事件
    var compEventMap = new WeakMap();
    var EventBus = new Vue();
    // 记录该组件订阅了多少个事件
    // 便于在组件销毁时自动解绑
    function handleCompEventMap(event, callback, compInstance) {
        var _a;
        if (compEventMap.has(compInstance)) {
            var eventCompMap_1 = compEventMap.get(compInstance);
            if (eventCompMap_1) {
                if (eventCompMap_1[event]) {
                    eventCompMap_1[event].push(callback);
                }
                else {
                    eventCompMap_1[event] = [callback];
                }
            }
        }
        else {
            compEventMap.set(compInstance, (_a = {},
                _a[event] = [callback],
                _a));
        }
    }
    // 记录订阅事件组件引用处理
    function handleEventMap(event, compInstance) {
        eventCompMap[event]
            ? eventCompMap[event].push(compInstance)
            : (eventCompMap[event] = [compInstance]);
    }
    // 在使用了 $eventBus 组件的 beforeDestroy 钩子队列中加入解绑函数
    function handleBeforeDestroyHooks(compInstance) {
        var $options = compInstance.$options;
        var beforeDestroy = $options.beforeDestroy;
        if (Array.isArray(beforeDestroy) &&
            !beforeDestroy.includes(beforeDestroyHandler)) {
            beforeDestroy.push(beforeDestroyHandler);
        }
    }
    function beforeDestroyHandler() {
        // @ts-ignore
        var compInstance = this;
        var eventSubs = compEventMap.get(compInstance);
        if (eventSubs) {
            var _loop_1 = function (eventName) {
                var eventHandlers = eventSubs[eventName];
                Array.isArray(eventHandlers) &&
                    eventHandlers.forEach(function (handler) {
                        EventBus.$off(eventName, handler);
                    });
                // 处理 eventCompMap
                if (eventCompMap[eventName]) {
                    var compSubs = eventCompMap[eventName];
                    // 假如订阅了同个事件
                    // 需要全部移除
                    compSubs = compSubs.filter(function (comp) { return comp !== compInstance; });
                    compSubs.length === 0 && delete eventCompMap[eventName];
                }
            };
            for (var _i = 0, _a = Object.keys(eventSubs); _i < _a.length; _i++) {
                var eventName = _a[_i];
                _loop_1(eventName);
            }
            compEventMap.delete(compInstance);
        }
    }
    var events = {
        eventCompMap: eventCompMap,
        compEventMap: compEventMap,
        on: function (event, callback, compInstance) {
            if (compInstance) {
                handleCompEventMap(event, callback, compInstance);
                handleEventMap(event, compInstance);
                handleBeforeDestroyHooks(compInstance);
            }
            EventBus.$on(event, callback);
        },
        emit: function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            EventBus.$emit.apply(EventBus, __spreadArrays([event], args));
        },
        off: function (event, callback) {
            EventBus.$off(event, callback);
        },
        once: function (event, callback) {
            EventBus.$once(event, callback);
        },
    };
    Object.defineProperty(Vue.prototype, '$eventBus', {
        get: function () {
            return events;
        },
    });
}

export default eventBusPlugin;
