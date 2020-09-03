
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    /**
     * lodash (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright jQuery Foundation and other contributors <https://jquery.org/>
     * Released under MIT license <https://lodash.com/license>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     */

    /** Used as the `TypeError` message for "Functions" methods. */
    var FUNC_ERROR_TEXT = 'Expected a function';

    /** Used as references for various `Number` constants. */
    var NAN = 0 / 0;

    /** `Object#toString` result references. */
    var symbolTag = '[object Symbol]';

    /** Used to match leading and trailing whitespace. */
    var reTrim = /^\s+|\s+$/g;

    /** Used to detect bad signed hexadecimal string values. */
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

    /** Used to detect binary string values. */
    var reIsBinary = /^0b[01]+$/i;

    /** Used to detect octal string values. */
    var reIsOctal = /^0o[0-7]+$/i;

    /** Built-in method references without a dependency on `root`. */
    var freeParseInt = parseInt;

    /** Detect free variable `global` from Node.js. */
    var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

    /** Detect free variable `self`. */
    var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root = freeGlobal || freeSelf || Function('return this')();

    /** Used for built-in method references. */
    var objectProto = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString = objectProto.toString;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeMax = Math.max,
        nativeMin = Math.min;

    /**
     * Gets the timestamp of the number of milliseconds that have elapsed since
     * the Unix epoch (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Date
     * @returns {number} Returns the timestamp.
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => Logs the number of milliseconds it took for the deferred invocation.
     */
    var now = function() {
      return root.Date.now();
    };

    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed `func` invocations and a `flush` method to immediately invoke them.
     * Provide `options` to indicate whether `func` should be invoked on the
     * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
     * with the last arguments provided to the debounced function. Subsequent
     * calls to the debounced function return the result of the last `func`
     * invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the debounced function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=false]
     *  Specify invoking on the leading edge of the timeout.
     * @param {number} [options.maxWait]
     *  The maximum time `func` is allowed to be delayed before it's invoked.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // Avoid costly calculations while the window size is in flux.
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // Invoke `sendMail` when clicked, debouncing subsequent calls.
     * jQuery(element).on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
     * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', debounced);
     *
     * // Cancel the trailing debounced invocation.
     * jQuery(window).on('popstate', debounced.cancel);
     */
    function debounce(func, wait, options) {
      var lastArgs,
          lastThis,
          maxWait,
          result,
          timerId,
          lastCallTime,
          lastInvokeTime = 0,
          leading = false,
          maxing = false,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = toNumber(wait) || 0;
      if (isObject(options)) {
        leading = !!options.leading;
        maxing = 'maxWait' in options;
        maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      function invokeFunc(time) {
        var args = lastArgs,
            thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
      }

      function leadingEdge(time) {
        // Reset any `maxWait` timer.
        lastInvokeTime = time;
        // Start the timer for the trailing edge.
        timerId = setTimeout(timerExpired, wait);
        // Invoke the leading edge.
        return leading ? invokeFunc(time) : result;
      }

      function remainingWait(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime,
            result = wait - timeSinceLastCall;

        return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
      }

      function shouldInvoke(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime;

        // Either this is the first call, activity has stopped and we're at the
        // trailing edge, the system time has gone backwards and we're treating
        // it as the trailing edge, or we've hit the `maxWait` limit.
        return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
          (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
      }

      function timerExpired() {
        var time = now();
        if (shouldInvoke(time)) {
          return trailingEdge(time);
        }
        // Restart the timer.
        timerId = setTimeout(timerExpired, remainingWait(time));
      }

      function trailingEdge(time) {
        timerId = undefined;

        // Only invoke if we have `lastArgs` which means `func` has been
        // debounced at least once.
        if (trailing && lastArgs) {
          return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
      }

      function cancel() {
        if (timerId !== undefined) {
          clearTimeout(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = undefined;
      }

      function flush() {
        return timerId === undefined ? result : trailingEdge(now());
      }

      function debounced() {
        var time = now(),
            isInvoking = shouldInvoke(time);

        lastArgs = arguments;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
          if (timerId === undefined) {
            return leadingEdge(lastCallTime);
          }
          if (maxing) {
            // Handle invocations in a tight loop.
            timerId = setTimeout(timerExpired, wait);
            return invokeFunc(lastCallTime);
          }
        }
        if (timerId === undefined) {
          timerId = setTimeout(timerExpired, wait);
        }
        return result;
      }
      debounced.cancel = cancel;
      debounced.flush = flush;
      return debounced;
    }

    /**
     * Creates a throttled function that only invokes `func` at most once per
     * every `wait` milliseconds. The throttled function comes with a `cancel`
     * method to cancel delayed `func` invocations and a `flush` method to
     * immediately invoke them. Provide `options` to indicate whether `func`
     * should be invoked on the leading and/or trailing edge of the `wait`
     * timeout. The `func` is invoked with the last arguments provided to the
     * throttled function. Subsequent calls to the throttled function return the
     * result of the last `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the throttled function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.throttle` and `_.debounce`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to throttle.
     * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=true]
     *  Specify invoking on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // Avoid excessively updating the position while scrolling.
     * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
     *
     * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
     * var throttled = _.throttle(renewToken, 300000, { 'trailing': false });
     * jQuery(element).on('click', throttled);
     *
     * // Cancel the trailing throttled invocation.
     * jQuery(window).on('popstate', throttled.cancel);
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      if (isObject(options)) {
        leading = 'leading' in options ? !!options.leading : leading;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }
      return debounce(func, wait, {
        'leading': leading,
        'maxWait': wait,
        'trailing': trailing
      });
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return !!value && typeof value == 'object';
    }

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol(value) {
      return typeof value == 'symbol' ||
        (isObjectLike(value) && objectToString.call(value) == symbolTag);
    }

    /**
     * Converts `value` to a number.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     * @example
     *
     * _.toNumber(3.2);
     * // => 3.2
     *
     * _.toNumber(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toNumber(Infinity);
     * // => Infinity
     *
     * _.toNumber('3.2');
     * // => 3.2
     */
    function toNumber(value) {
      if (typeof value == 'number') {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject(other) ? (other + '') : other;
      }
      if (typeof value != 'string') {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, '');
      var isBinary = reIsBinary.test(value);
      return (isBinary || reIsOctal.test(value))
        ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
        : (reIsBadHex.test(value) ? NAN : +value);
    }

    var lodash_throttle = throttle;

    /**
     * This module used to unify mouse wheel behavior between different browsers in 2014
     * Now it's just a wrapper around addEventListener('wheel');
     *
     * Usage:
     *  var addWheelListener = require('wheel').addWheelListener;
     *  var removeWheelListener = require('wheel').removeWheelListener;
     *  addWheelListener(domElement, function (e) {
     *    // mouse wheel event
     *  });
     *  removeWheelListener(domElement, function);
     */

    var wheel = addWheelListener;

    // But also expose "advanced" api with unsubscribe:
    var addWheelListener_1 = addWheelListener;
    var removeWheelListener_1 = removeWheelListener;


    function addWheelListener(element, listener, useCapture) {
      element.addEventListener('wheel', listener, useCapture);
    }

    function removeWheelListener( element, listener, useCapture ) {
      element.removeEventListener('wheel', listener, useCapture);
    }
    wheel.addWheelListener = addWheelListener_1;
    wheel.removeWheelListener = removeWheelListener_1;

    /**
     * https://github.com/gre/bezier-easing
     * BezierEasing - use bezier curve for transition easing function
     * by Gaëtan Renaudeau 2014 - 2015 – MIT License
     */

    // These values are established by empiricism with tests (tradeoff: performance VS precision)
    var NEWTON_ITERATIONS = 4;
    var NEWTON_MIN_SLOPE = 0.001;
    var SUBDIVISION_PRECISION = 0.0000001;
    var SUBDIVISION_MAX_ITERATIONS = 10;

    var kSplineTableSize = 11;
    var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

    var float32ArraySupported = typeof Float32Array === 'function';

    function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
    function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
    function C (aA1)      { return 3.0 * aA1; }

    // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
    function calcBezier (aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT; }

    // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
    function getSlope (aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1); }

    function binarySubdivide (aX, aA, aB, mX1, mX2) {
      var currentX, currentT, i = 0;
      do {
        currentT = aA + (aB - aA) / 2.0;
        currentX = calcBezier(currentT, mX1, mX2) - aX;
        if (currentX > 0.0) {
          aB = currentT;
        } else {
          aA = currentT;
        }
      } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
      return currentT;
    }

    function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
     for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
       var currentSlope = getSlope(aGuessT, mX1, mX2);
       if (currentSlope === 0.0) {
         return aGuessT;
       }
       var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
       aGuessT -= currentX / currentSlope;
     }
     return aGuessT;
    }

    function LinearEasing (x) {
      return x;
    }

    var src = function bezier (mX1, mY1, mX2, mY2) {
      if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
        throw new Error('bezier x values must be in [0, 1] range');
      }

      if (mX1 === mY1 && mX2 === mY2) {
        return LinearEasing;
      }

      // Precompute samples table
      var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
      for (var i = 0; i < kSplineTableSize; ++i) {
        sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
      }

      function getTForX (aX) {
        var intervalStart = 0.0;
        var currentSample = 1;
        var lastSample = kSplineTableSize - 1;

        for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
          intervalStart += kSampleStepSize;
        }
        --currentSample;

        // Interpolate to provide an initial guess for t
        var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
        var guessForT = intervalStart + dist * kSampleStepSize;

        var initialSlope = getSlope(guessForT, mX1, mX2);
        if (initialSlope >= NEWTON_MIN_SLOPE) {
          return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
        } else if (initialSlope === 0.0) {
          return guessForT;
        } else {
          return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
        }
      }

      return function BezierEasing (x) {
        // Because JavaScript number are imprecise, we should guarantee the extremes are right.
        if (x === 0) {
          return 0;
        }
        if (x === 1) {
          return 1;
        }
        return calcBezier(getTForX(x), mY1, mY2);
      };
    };

    // Predefined set of animations. Similar to CSS easing functions
    var animations = {
      ease:  src(0.25, 0.1, 0.25, 1),
      easeIn: src(0.42, 0, 1, 1),
      easeOut: src(0, 0, 0.58, 1),
      easeInOut: src(0.42, 0, 0.58, 1),
      linear: src(0, 0, 1, 1)
    };


    var amator = animate;
    var makeAggregateRaf_1 = makeAggregateRaf;
    var sharedScheduler = makeAggregateRaf();


    function animate(source, target, options) {
      var start = Object.create(null);
      var diff = Object.create(null);
      options = options || {};
      // We let clients specify their own easing function
      var easing = (typeof options.easing === 'function') ? options.easing : animations[options.easing];

      // if nothing is specified, default to ease (similar to CSS animations)
      if (!easing) {
        if (options.easing) {
          console.warn('Unknown easing function in amator: ' + options.easing);
        }
        easing = animations.ease;
      }

      var step = typeof options.step === 'function' ? options.step : noop$1;
      var done = typeof options.done === 'function' ? options.done : noop$1;

      var scheduler = getScheduler(options.scheduler);

      var keys = Object.keys(target);
      keys.forEach(function(key) {
        start[key] = source[key];
        diff[key] = target[key] - source[key];
      });

      var durationInMs = typeof options.duration === 'number' ? options.duration : 400;
      var durationInFrames = Math.max(1, durationInMs * 0.06); // 0.06 because 60 frames pers 1,000 ms
      var previousAnimationId;
      var frame = 0;

      previousAnimationId = scheduler.next(loop);

      return {
        cancel: cancel
      }

      function cancel() {
        scheduler.cancel(previousAnimationId);
        previousAnimationId = 0;
      }

      function loop() {
        var t = easing(frame/durationInFrames);
        frame += 1;
        setValues(t);
        if (frame <= durationInFrames) {
          previousAnimationId = scheduler.next(loop);
          step(source);
        } else {
          previousAnimationId = 0;
          setTimeout(function() { done(source); }, 0);
        }
      }

      function setValues(t) {
        keys.forEach(function(key) {
          source[key] = diff[key] * t + start[key];
        });
      }
    }

    function noop$1() { }

    function getScheduler(scheduler) {
      if (!scheduler) {
        var canRaf = typeof window !== 'undefined' && window.requestAnimationFrame;
        return canRaf ? rafScheduler() : timeoutScheduler()
      }
      if (typeof scheduler.next !== 'function') throw new Error('Scheduler is supposed to have next(cb) function')
      if (typeof scheduler.cancel !== 'function') throw new Error('Scheduler is supposed to have cancel(handle) function')

      return scheduler
    }

    function rafScheduler() {
      return {
        next: window.requestAnimationFrame.bind(window),
        cancel: window.cancelAnimationFrame.bind(window)
      }
    }

    function timeoutScheduler() {
      return {
        next: function(cb) {
          return setTimeout(cb, 1000/60)
        },
        cancel: function (id) {
          return clearTimeout(id)
        }
      }
    }

    function makeAggregateRaf() {
      var frontBuffer = new Set();
      var backBuffer = new Set();
      var frameToken = 0;

      return {
        next: next,
        cancel: next,
        clearAll: clearAll
      }

      function clearAll() {
        frontBuffer.clear();
        backBuffer.clear();
        cancelAnimationFrame(frameToken);
        frameToken = 0;
      }

      function next(callback) {
        backBuffer.add(callback);
        renderNextFrame();
      }

      function renderNextFrame() {
        if (!frameToken) frameToken = requestAnimationFrame(renderFrame);
      }

      function renderFrame() {
        frameToken = 0;

        var t = backBuffer;
        backBuffer = frontBuffer;
        frontBuffer = t;

        frontBuffer.forEach(function(callback) {
          callback();
        });
        frontBuffer.clear();
      }
    }
    amator.makeAggregateRaf = makeAggregateRaf_1;
    amator.sharedScheduler = sharedScheduler;

    var ngraph_events = function eventify(subject) {
      validateSubject(subject);

      var eventsStorage = createEventsStorage(subject);
      subject.on = eventsStorage.on;
      subject.off = eventsStorage.off;
      subject.fire = eventsStorage.fire;
      return subject;
    };

    function createEventsStorage(subject) {
      // Store all event listeners to this hash. Key is event name, value is array
      // of callback records.
      //
      // A callback record consists of callback function and its optional context:
      // { 'eventName' => [{callback: function, ctx: object}] }
      var registeredEvents = Object.create(null);

      return {
        on: function (eventName, callback, ctx) {
          if (typeof callback !== 'function') {
            throw new Error('callback is expected to be a function');
          }
          var handlers = registeredEvents[eventName];
          if (!handlers) {
            handlers = registeredEvents[eventName] = [];
          }
          handlers.push({callback: callback, ctx: ctx});

          return subject;
        },

        off: function (eventName, callback) {
          var wantToRemoveAll = (typeof eventName === 'undefined');
          if (wantToRemoveAll) {
            // Killing old events storage should be enough in this case:
            registeredEvents = Object.create(null);
            return subject;
          }

          if (registeredEvents[eventName]) {
            var deleteAllCallbacksForEvent = (typeof callback !== 'function');
            if (deleteAllCallbacksForEvent) {
              delete registeredEvents[eventName];
            } else {
              var callbacks = registeredEvents[eventName];
              for (var i = 0; i < callbacks.length; ++i) {
                if (callbacks[i].callback === callback) {
                  callbacks.splice(i, 1);
                }
              }
            }
          }

          return subject;
        },

        fire: function (eventName) {
          var callbacks = registeredEvents[eventName];
          if (!callbacks) {
            return subject;
          }

          var fireArguments;
          if (arguments.length > 1) {
            fireArguments = Array.prototype.splice.call(arguments, 1);
          }
          for(var i = 0; i < callbacks.length; ++i) {
            var callbackInfo = callbacks[i];
            callbackInfo.callback.apply(callbackInfo.ctx, fireArguments);
          }

          return subject;
        }
      };
    }

    function validateSubject(subject) {
      if (!subject) {
        throw new Error('Eventify cannot use falsy object as events subject');
      }
      var reservedWords = ['on', 'fire', 'off'];
      for (var i = 0; i < reservedWords.length; ++i) {
        if (subject.hasOwnProperty(reservedWords[i])) {
          throw new Error("Subject cannot be eventified, since it already has property '" + reservedWords[i] + "'");
        }
      }
    }

    /**
     * Allows smooth kinetic scrolling of the surface
     */
    var kinetic_1 = kinetic;

    function kinetic(getPoint, scroll, settings) {
      if (typeof settings !== 'object') {
        // setting could come as boolean, we should ignore it, and use an object.
        settings = {};
      }

      var minVelocity = typeof settings.minVelocity === 'number' ? settings.minVelocity : 5;
      var amplitude = typeof settings.amplitude === 'number' ? settings.amplitude : 0.25;
      var cancelAnimationFrame = typeof settings.cancelAnimationFrame === 'function' ? settings.cancelAnimationFrame : getCancelAnimationFrame();
      var requestAnimationFrame = typeof settings.requestAnimationFrame === 'function' ? settings.requestAnimationFrame : getRequestAnimationFrame();

      var lastPoint;
      var timestamp;
      var timeConstant = 342;

      var ticker;
      var vx, targetX, ax;
      var vy, targetY, ay;

      var raf;

      return {
        start: start,
        stop: stop,
        cancel: dispose
      };

      function dispose() {
        cancelAnimationFrame(ticker);
        cancelAnimationFrame(raf);
      }

      function start() {
        lastPoint = getPoint();

        ax = ay = vx = vy = 0;
        timestamp = new Date();

        cancelAnimationFrame(ticker);
        cancelAnimationFrame(raf);

        // we start polling the point position to accumulate velocity
        // Once we stop(), we will use accumulated velocity to keep scrolling
        // an object.
        ticker = requestAnimationFrame(track);
      }

      function track() {
        var now = Date.now();
        var elapsed = now - timestamp;
        timestamp = now;

        var currentPoint = getPoint();

        var dx = currentPoint.x - lastPoint.x;
        var dy = currentPoint.y - lastPoint.y;

        lastPoint = currentPoint;

        var dt = 1000 / (1 + elapsed);

        // moving average
        vx = 0.8 * dx * dt + 0.2 * vx;
        vy = 0.8 * dy * dt + 0.2 * vy;

        ticker = requestAnimationFrame(track);
      }

      function stop() {
        cancelAnimationFrame(ticker);
        cancelAnimationFrame(raf);

        var currentPoint = getPoint();

        targetX = currentPoint.x;
        targetY = currentPoint.y;
        timestamp = Date.now();

        if (vx < -minVelocity || vx > minVelocity) {
          ax = amplitude * vx;
          targetX += ax;
        }

        if (vy < -minVelocity || vy > minVelocity) {
          ay = amplitude * vy;
          targetY += ay;
        }

        raf = requestAnimationFrame(autoScroll);
      }

      function autoScroll() {
        var elapsed = Date.now() - timestamp;

        var moving = false;
        var dx = 0;
        var dy = 0;

        if (ax) {
          dx = -ax * Math.exp(-elapsed / timeConstant);

          if (dx > 0.5 || dx < -0.5) moving = true;
          else dx = ax = 0;
        }

        if (ay) {
          dy = -ay * Math.exp(-elapsed / timeConstant);

          if (dy > 0.5 || dy < -0.5) moving = true;
          else dy = ay = 0;
        }

        if (moving) {
          scroll(targetX + dx, targetY + dy);
          raf = requestAnimationFrame(autoScroll);
        }
      }
    }

    function getCancelAnimationFrame() {
      if (typeof cancelAnimationFrame === 'function') return cancelAnimationFrame;
      return clearTimeout;
    }

    function getRequestAnimationFrame() {
      if (typeof requestAnimationFrame === 'function') return requestAnimationFrame;

      return function (handler) {
        return setTimeout(handler, 16);
      }
    }

    /**
     * Disallows selecting text.
     */
    var createTextSelectionInterceptor_1 = createTextSelectionInterceptor;

    function createTextSelectionInterceptor(useFake) {
      if (useFake) {
        return {
          capture: noop$2,
          release: noop$2
        };
      }

      var dragObject;
      var prevSelectStart;
      var prevDragStart;
      var wasCaptured = false;

      return {
        capture: capture,
        release: release
      };

      function capture(domObject) {
        wasCaptured = true;
        prevSelectStart = window.document.onselectstart;
        prevDragStart = window.document.ondragstart;

        window.document.onselectstart = disabled;

        dragObject = domObject;
        dragObject.ondragstart = disabled;
      }

      function release() {
        if (!wasCaptured) return;
        
        wasCaptured = false;
        window.document.onselectstart = prevSelectStart;
        if (dragObject) dragObject.ondragstart = prevDragStart;
      }
    }

    function disabled(e) {
      e.stopPropagation();
      return false;
    }

    function noop$2() {}

    var transform = Transform;

    function Transform() {
      this.x = 0;
      this.y = 0;
      this.scale = 1;
    }

    var svgController = makeSvgController;
    var canAttach = isSVGElement;

    function makeSvgController(svgElement, options) {
      if (!isSVGElement(svgElement)) {
        throw new Error('svg element is required for svg.panzoom to work')
      }

      var owner = svgElement.ownerSVGElement;
      if (!owner) {
        throw new Error(
          'Do not apply panzoom to the root <svg> element. ' +
          'Use its child instead (e.g. <g></g>). ' +
          'As of March 2016 only FireFox supported transform on the root element')
      }

      if (!options.disableKeyboardInteraction) {
        owner.setAttribute('tabindex', 0);
      }

      var api = {
        getBBox: getBBox,
        getScreenCTM: getScreenCTM,
        getOwner: getOwner,
        applyTransform: applyTransform,
        initTransform: initTransform
      };
      
      return api

      function getOwner() {
        return owner
      }

      function getBBox() {
        var bbox =  svgElement.getBBox();
        return {
          left: bbox.x,
          top: bbox.y,
          width: bbox.width,
          height: bbox.height,
        }
      }

      function getScreenCTM() {
        var ctm = owner.getCTM();
        if (!ctm) {
          // This is likely firefox: https://bugzilla.mozilla.org/show_bug.cgi?id=873106
          // The code below is not entirely correct, but still better than nothing
          return owner.getScreenCTM();
        }
        return ctm;
      }

      function initTransform(transform) {
        var screenCTM = svgElement.getCTM();

        // The above line returns null on Firefox
        if (screenCTM === null) {
          screenCTM = document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGMatrix();
        }

        transform.x = screenCTM.e;
        transform.y = screenCTM.f;
        transform.scale = screenCTM.a;
        owner.removeAttributeNS(null, 'viewBox');
      }

      function applyTransform(transform) {
        svgElement.setAttribute('transform', 'matrix(' +
          transform.scale + ' 0 0 ' +
          transform.scale + ' ' +
          transform.x + ' ' + transform.y + ')');
      }
    }

    function isSVGElement(element) {
      return element && element.ownerSVGElement && element.getCTM;
    }
    svgController.canAttach = canAttach;

    var domController = makeDomController;

    var canAttach$1 = isDomElement;

    function makeDomController(domElement, options) {
      var elementValid = isDomElement(domElement); 
      if (!elementValid) {
        throw new Error('panzoom requires DOM element to be attached to the DOM tree')
      }

      var owner = domElement.parentElement;
      domElement.scrollTop = 0;
      
      if (!options.disableKeyboardInteraction) {
        owner.setAttribute('tabindex', 0);
      }

      var api = {
        getBBox: getBBox,
        getOwner: getOwner,
        applyTransform: applyTransform,
      };
      
      return api

      function getOwner() {
        return owner
      }

      function getBBox() {
        // TODO: We should probably cache this?
        return  {
          left: 0,
          top: 0,
          width: domElement.clientWidth,
          height: domElement.clientHeight
        }
      }

      function applyTransform(transform) {
        // TODO: Should we cache this?
        domElement.style.transformOrigin = '0 0 0';
        domElement.style.transform = 'matrix(' +
          transform.scale + ', 0, 0, ' +
          transform.scale + ', ' +
          transform.x + ', ' + transform.y + ')';
      }
    }

    function isDomElement(element) {
      return element && element.parentElement && element.style;
    }
    domController.canAttach = canAttach$1;

    /**
     * Allows to drag and zoom svg elements
     */





    var domTextSelectionInterceptor = createTextSelectionInterceptor_1();
    var fakeTextSelectorInterceptor = createTextSelectionInterceptor_1(true);




    var defaultZoomSpeed = 1;
    var defaultDoubleTapZoomSpeed = 1.75;
    var doubleTapSpeedInMS = 300;

    var panzoom = createPanZoom;

    /**
     * Creates a new instance of panzoom, so that an object can be panned and zoomed
     *
     * @param {DOMElement} domElement where panzoom should be attached.
     * @param {Object} options that configure behavior.
     */
    function createPanZoom(domElement, options) {
      options = options || {};

      var panController = options.controller;

      if (!panController) {
        if (svgController.canAttach(domElement)) {
          panController = svgController(domElement, options);
        } else if (domController.canAttach(domElement)) {
          panController = domController(domElement, options);
        }
      }

      if (!panController) {
        throw new Error(
          'Cannot create panzoom for the current type of dom element'
        );
      }
      var owner = panController.getOwner();
      // just to avoid GC pressure, every time we do intermediate transform
      // we return this object. For internal use only. Never give it back to the consumer of this library
      var storedCTMResult = { x: 0, y: 0 };

      var isDirty = false;
      var transform$1 = new transform();

      if (panController.initTransform) {
        panController.initTransform(transform$1);
      }

      var filterKey = typeof options.filterKey === 'function' ? options.filterKey : noop$3;
      // TODO: likely need to unite pinchSpeed with zoomSpeed
      var pinchSpeed = typeof options.pinchSpeed === 'number' ? options.pinchSpeed : 1;
      var bounds = options.bounds;
      var maxZoom = typeof options.maxZoom === 'number' ? options.maxZoom : Number.POSITIVE_INFINITY;
      var minZoom = typeof options.minZoom === 'number' ? options.minZoom : 0;

      var boundsPadding = typeof options.boundsPadding === 'number' ? options.boundsPadding : 0.05;
      var zoomDoubleClickSpeed = typeof options.zoomDoubleClickSpeed === 'number' ? options.zoomDoubleClickSpeed : defaultDoubleTapZoomSpeed;
      var beforeWheel = options.beforeWheel || noop$3;
      var beforeMouseDown = options.beforeMouseDown || noop$3;
      var speed = typeof options.zoomSpeed === 'number' ? options.zoomSpeed : defaultZoomSpeed;
      var transformOrigin = parseTransformOrigin(options.transformOrigin);
      var textSelection = options.enableTextSelection ? fakeTextSelectorInterceptor : domTextSelectionInterceptor;

      validateBounds(bounds);

      if (options.autocenter) {
        autocenter();
      }

      var frameAnimation;
      var lastTouchEndTime = 0;
      var lastSingleFingerOffset;
      var touchInProgress = false;

      // We only need to fire panstart when actual move happens
      var panstartFired = false;

      // cache mouse coordinates here
      var mouseX;
      var mouseY;

      var pinchZoomLength;

      var smoothScroll;
      if ('smoothScroll' in options && !options.smoothScroll) {
        // If user explicitly asked us not to use smooth scrolling, we obey
        smoothScroll = rigidScroll();
      } else {
        // otherwise we use forward smoothScroll settings to kinetic API
        // which makes scroll smoothing.
        smoothScroll = kinetic_1(getPoint, scroll, options.smoothScroll);
      }

      var moveByAnimation;
      var zoomToAnimation;

      var multiTouch;
      var paused = false;

      listenForEvents();

      var api = {
        dispose: dispose,
        moveBy: internalMoveBy,
        moveTo: moveTo,
        centerOn: centerOn,
        zoomTo: publicZoomTo,
        zoomAbs: zoomAbs,
        smoothZoom: smoothZoom,
        smoothZoomAbs: smoothZoomAbs,
        showRectangle: showRectangle,

        pause: pause,
        resume: resume,
        isPaused: isPaused,

        getTransform: getTransformModel,

        getMinZoom: getMinZoom,
        setMinZoom: setMinZoom,

        getMaxZoom: getMaxZoom,
        setMaxZoom: setMaxZoom,

        getTransformOrigin: getTransformOrigin,
        setTransformOrigin: setTransformOrigin,

        getZoomSpeed: getZoomSpeed,
        setZoomSpeed: setZoomSpeed
      };

      ngraph_events(api);

      return api;

      function pause() {
        releaseEvents();
        paused = true;
      }

      function resume() {
        if (paused) {
          listenForEvents();
          paused = false;
        }
      }

      function isPaused() {
        return paused;
      }

      function showRectangle(rect) {
        // TODO: this duplicates autocenter. I think autocenter should go.
        var clientRect = owner.getBoundingClientRect();
        var size = transformToScreen(clientRect.width, clientRect.height);

        var rectWidth = rect.right - rect.left;
        var rectHeight = rect.bottom - rect.top;
        if (!Number.isFinite(rectWidth) || !Number.isFinite(rectHeight)) {
          throw new Error('Invalid rectangle');
        }

        var dw = size.x / rectWidth;
        var dh = size.y / rectHeight;
        var scale = Math.min(dw, dh);
        transform$1.x = -(rect.left + rectWidth / 2) * scale + size.x / 2;
        transform$1.y = -(rect.top + rectHeight / 2) * scale + size.y / 2;
        transform$1.scale = scale;
      }

      function transformToScreen(x, y) {
        if (panController.getScreenCTM) {
          var parentCTM = panController.getScreenCTM();
          var parentScaleX = parentCTM.a;
          var parentScaleY = parentCTM.d;
          var parentOffsetX = parentCTM.e;
          var parentOffsetY = parentCTM.f;
          storedCTMResult.x = x * parentScaleX - parentOffsetX;
          storedCTMResult.y = y * parentScaleY - parentOffsetY;
        } else {
          storedCTMResult.x = x;
          storedCTMResult.y = y;
        }

        return storedCTMResult;
      }

      function autocenter() {
        var w; // width of the parent
        var h; // height of the parent
        var left = 0;
        var top = 0;
        var sceneBoundingBox = getBoundingBox();
        if (sceneBoundingBox) {
          // If we have bounding box - use it.
          left = sceneBoundingBox.left;
          top = sceneBoundingBox.top;
          w = sceneBoundingBox.right - sceneBoundingBox.left;
          h = sceneBoundingBox.bottom - sceneBoundingBox.top;
        } else {
          // otherwise just use whatever space we have
          var ownerRect = owner.getBoundingClientRect();
          w = ownerRect.width;
          h = ownerRect.height;
        }
        var bbox = panController.getBBox();
        if (bbox.width === 0 || bbox.height === 0) {
          // we probably do not have any elements in the SVG
          // just bail out;
          return;
        }
        var dh = h / bbox.height;
        var dw = w / bbox.width;
        var scale = Math.min(dw, dh);
        transform$1.x = -(bbox.left + bbox.width / 2) * scale + w / 2 + left;
        transform$1.y = -(bbox.top + bbox.height / 2) * scale + h / 2 + top;
        transform$1.scale = scale;
      }

      function getTransformModel() {
        // TODO: should this be read only?
        return transform$1;
      }

      function getMinZoom() {
        return minZoom;
      }

      function setMinZoom(newMinZoom) {
        minZoom = newMinZoom;
      }

      function getMaxZoom() {
        return maxZoom;
      }

      function setMaxZoom(newMaxZoom) {
        maxZoom = newMaxZoom;
      }

      function getTransformOrigin() {
        return transformOrigin;
      }

      function setTransformOrigin(newTransformOrigin) {
        transformOrigin = parseTransformOrigin(newTransformOrigin);
      }

      function getZoomSpeed() {
        return speed;
      }

      function setZoomSpeed(newSpeed) {
        if (!Number.isFinite(newSpeed)) {
          throw new Error('Zoom speed should be a number');
        }
        speed = newSpeed;
      }

      function getPoint() {
        return {
          x: transform$1.x,
          y: transform$1.y
        };
      }

      function moveTo(x, y) {
        transform$1.x = x;
        transform$1.y = y;

        keepTransformInsideBounds();

        triggerEvent('pan');
        makeDirty();
      }

      function moveBy(dx, dy) {
        moveTo(transform$1.x + dx, transform$1.y + dy);
      }

      function keepTransformInsideBounds() {
        var boundingBox = getBoundingBox();
        if (!boundingBox) return;

        var adjusted = false;
        var clientRect = getClientRect();

        var diff = boundingBox.left - clientRect.right;
        if (diff > 0) {
          transform$1.x += diff;
          adjusted = true;
        }
        // check the other side:
        diff = boundingBox.right - clientRect.left;
        if (diff < 0) {
          transform$1.x += diff;
          adjusted = true;
        }

        // y axis:
        diff = boundingBox.top - clientRect.bottom;
        if (diff > 0) {
          // we adjust transform, so that it matches exactly our bounding box:
          // transform.y = boundingBox.top - (boundingBox.height + boundingBox.y) * transform.scale =>
          // transform.y = boundingBox.top - (clientRect.bottom - transform.y) =>
          // transform.y = diff + transform.y =>
          transform$1.y += diff;
          adjusted = true;
        }

        diff = boundingBox.bottom - clientRect.top;
        if (diff < 0) {
          transform$1.y += diff;
          adjusted = true;
        }
        return adjusted;
      }

      /**
       * Returns bounding box that should be used to restrict scene movement.
       */
      function getBoundingBox() {
        if (!bounds) return; // client does not want to restrict movement

        if (typeof bounds === 'boolean') {
          // for boolean type we use parent container bounds
          var ownerRect = owner.getBoundingClientRect();
          var sceneWidth = ownerRect.width;
          var sceneHeight = ownerRect.height;

          return {
            left: sceneWidth * boundsPadding,
            top: sceneHeight * boundsPadding,
            right: sceneWidth * (1 - boundsPadding),
            bottom: sceneHeight * (1 - boundsPadding)
          };
        }

        return bounds;
      }

      function getClientRect() {
        var bbox = panController.getBBox();
        var leftTop = client(bbox.left, bbox.top);

        return {
          left: leftTop.x,
          top: leftTop.y,
          right: bbox.width * transform$1.scale + leftTop.x,
          bottom: bbox.height * transform$1.scale + leftTop.y
        };
      }

      function client(x, y) {
        return {
          x: x * transform$1.scale + transform$1.x,
          y: y * transform$1.scale + transform$1.y
        };
      }

      function makeDirty() {
        isDirty = true;
        frameAnimation = window.requestAnimationFrame(frame);
      }

      function zoomByRatio(clientX, clientY, ratio) {
        if (isNaN(clientX) || isNaN(clientY) || isNaN(ratio)) {
          throw new Error('zoom requires valid numbers');
        }

        var newScale = transform$1.scale * ratio;

        if (newScale < minZoom) {
          if (transform$1.scale === minZoom) return;

          ratio = minZoom / transform$1.scale;
        }
        if (newScale > maxZoom) {
          if (transform$1.scale === maxZoom) return;

          ratio = maxZoom / transform$1.scale;
        }

        var size = transformToScreen(clientX, clientY);

        transform$1.x = size.x - ratio * (size.x - transform$1.x);
        transform$1.y = size.y - ratio * (size.y - transform$1.y);

        // TODO: https://github.com/anvaka/panzoom/issues/112
        if (bounds && boundsPadding === 1 && minZoom === 1) {
          transform$1.scale *= ratio;
          keepTransformInsideBounds();
        } else {
          var transformAdjusted = keepTransformInsideBounds();
          if (!transformAdjusted) transform$1.scale *= ratio;
        }

        triggerEvent('zoom');

        makeDirty();
      }

      function zoomAbs(clientX, clientY, zoomLevel) {
        var ratio = zoomLevel / transform$1.scale;
        zoomByRatio(clientX, clientY, ratio);
      }

      function centerOn(ui) {
        var parent = ui.ownerSVGElement;
        if (!parent)
          throw new Error('ui element is required to be within the scene');

        // TODO: should i use controller's screen CTM?
        var clientRect = ui.getBoundingClientRect();
        var cx = clientRect.left + clientRect.width / 2;
        var cy = clientRect.top + clientRect.height / 2;

        var container = parent.getBoundingClientRect();
        var dx = container.width / 2 - cx;
        var dy = container.height / 2 - cy;

        internalMoveBy(dx, dy, true);
      }

      function internalMoveBy(dx, dy, smooth) {
        if (!smooth) {
          return moveBy(dx, dy);
        }

        if (moveByAnimation) moveByAnimation.cancel();

        var from = { x: 0, y: 0 };
        var to = { x: dx, y: dy };
        var lastX = 0;
        var lastY = 0;

        moveByAnimation = amator(from, to, {
          step: function (v) {
            moveBy(v.x - lastX, v.y - lastY);

            lastX = v.x;
            lastY = v.y;
          }
        });
      }

      function scroll(x, y) {
        cancelZoomAnimation();
        moveTo(x, y);
      }

      function dispose() {
        releaseEvents();
      }

      function listenForEvents() {
        owner.addEventListener('mousedown', onMouseDown, { passive: false });
        owner.addEventListener('dblclick', onDoubleClick, { passive: false });
        owner.addEventListener('touchstart', onTouch, { passive: false });
        owner.addEventListener('keydown', onKeyDown, { passive: false });

        // Need to listen on the owner container, so that we are not limited
        // by the size of the scrollable domElement
        wheel.addWheelListener(owner, onMouseWheel, { passive: false });

        makeDirty();
      }

      function releaseEvents() {
        wheel.removeWheelListener(owner, onMouseWheel);
        owner.removeEventListener('mousedown', onMouseDown);
        owner.removeEventListener('keydown', onKeyDown);
        owner.removeEventListener('dblclick', onDoubleClick);
        owner.removeEventListener('touchstart', onTouch);

        if (frameAnimation) {
          window.cancelAnimationFrame(frameAnimation);
          frameAnimation = 0;
        }

        smoothScroll.cancel();

        releaseDocumentMouse();
        releaseTouches();
        textSelection.release();

        triggerPanEnd();
      }

      function frame() {
        if (isDirty) applyTransform();
      }

      function applyTransform() {
        isDirty = false;

        // TODO: Should I allow to cancel this?
        panController.applyTransform(transform$1);

        triggerEvent('transform');
        frameAnimation = 0;
      }

      function onKeyDown(e) {
        var x = 0,
          y = 0,
          z = 0;
        if (e.keyCode === 38) {
          y = 1; // up
        } else if (e.keyCode === 40) {
          y = -1; // down
        } else if (e.keyCode === 37) {
          x = 1; // left
        } else if (e.keyCode === 39) {
          x = -1; // right
        } else if (e.keyCode === 189 || e.keyCode === 109) {
          // DASH or SUBTRACT
          z = 1; // `-` -  zoom out
        } else if (e.keyCode === 187 || e.keyCode === 107) {
          // EQUAL SIGN or ADD
          z = -1; // `=` - zoom in (equal sign on US layout is under `+`)
        }

        if (filterKey(e, x, y, z)) {
          // They don't want us to handle the key: https://github.com/anvaka/panzoom/issues/45
          return;
        }

        if (x || y) {
          e.preventDefault();
          e.stopPropagation();

          var clientRect = owner.getBoundingClientRect();
          // movement speed should be the same in both X and Y direction:
          var offset = Math.min(clientRect.width, clientRect.height);
          var moveSpeedRatio = 0.05;
          var dx = offset * moveSpeedRatio * x;
          var dy = offset * moveSpeedRatio * y;

          // TODO: currently we do not animate this. It could be better to have animation
          internalMoveBy(dx, dy);
        }

        if (z) {
          var scaleMultiplier = getScaleMultiplier(z * 100);
          var offset = transformOrigin ? getTransformOriginOffset() : midPoint();
          publicZoomTo(offset.x, offset.y, scaleMultiplier);
        }
      }

      function midPoint() {
        var ownerRect = owner.getBoundingClientRect();
        return {
          x: ownerRect.width / 2,
          y: ownerRect.height / 2
        };
      }

      function onTouch(e) {
        // let the override the touch behavior
        beforeTouch(e);

        if (e.touches.length === 1) {
          return handleSingleFingerTouch(e, e.touches[0]);
        } else if (e.touches.length === 2) {
          // handleTouchMove() will care about pinch zoom.
          pinchZoomLength = getPinchZoomLength(e.touches[0], e.touches[1]);
          multiTouch = true;
          startTouchListenerIfNeeded();
        }
      }

      function beforeTouch(e) {
        // TODO: Need to unify this filtering names. E.g. use `beforeTouch`
        if (options.onTouch && !options.onTouch(e)) {
          // if they return `false` from onTouch, we don't want to stop
          // events propagation. Fixes https://github.com/anvaka/panzoom/issues/12
          return;
        }

        e.stopPropagation();
        e.preventDefault();
      }

      function beforeDoubleClick(e) {
        // TODO: Need to unify this filtering names. E.g. use `beforeDoubleClick``
        if (options.onDoubleClick && !options.onDoubleClick(e)) {
          // if they return `false` from onTouch, we don't want to stop
          // events propagation. Fixes https://github.com/anvaka/panzoom/issues/46
          return;
        }

        e.preventDefault();
        e.stopPropagation();
      }

      function handleSingleFingerTouch(e) {
        var touch = e.touches[0];
        var offset = getOffsetXY(touch);
        lastSingleFingerOffset = offset;
        var point = transformToScreen(offset.x, offset.y);
        mouseX = point.x;
        mouseY = point.y;

        smoothScroll.cancel();
        startTouchListenerIfNeeded();
      }

      function startTouchListenerIfNeeded() {
        if (touchInProgress) {
          // no need to do anything, as we already listen to events;
          return;
        }

        touchInProgress = true;
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchcancel', handleTouchEnd);
      }

      function handleTouchMove(e) {
        if (e.touches.length === 1) {
          e.stopPropagation();
          var touch = e.touches[0];

          var offset = getOffsetXY(touch);
          var point = transformToScreen(offset.x, offset.y);

          var dx = point.x - mouseX;
          var dy = point.y - mouseY;

          if (dx !== 0 && dy !== 0) {
            triggerPanStart();
          }
          mouseX = point.x;
          mouseY = point.y;
          internalMoveBy(dx, dy);
        } else if (e.touches.length === 2) {
          // it's a zoom, let's find direction
          multiTouch = true;
          var t1 = e.touches[0];
          var t2 = e.touches[1];
          var currentPinchLength = getPinchZoomLength(t1, t2);

          // since the zoom speed is always based on distance from 1, we need to apply
          // pinch speed only on that distance from 1:
          var scaleMultiplier =
            1 + (currentPinchLength / pinchZoomLength - 1) * pinchSpeed;

          var firstTouchPoint = getOffsetXY(t1);
          var secondTouchPoint = getOffsetXY(t2);
          mouseX = (firstTouchPoint.x + secondTouchPoint.x) / 2;
          mouseY = (firstTouchPoint.y + secondTouchPoint.y) / 2;
          if (transformOrigin) {
            var offset = getTransformOriginOffset();
            mouseX = offset.x;
            mouseY = offset.y;
          }

          publicZoomTo(mouseX, mouseY, scaleMultiplier);

          pinchZoomLength = currentPinchLength;
          e.stopPropagation();
          e.preventDefault();
        }
      }

      function handleTouchEnd(e) {
        if (e.touches.length > 0) {
          var offset = getOffsetXY(e.touches[0]);
          var point = transformToScreen(offset.x, offset.y);
          mouseX = point.x;
          mouseY = point.y;
        } else {
          var now = new Date();
          if (now - lastTouchEndTime < doubleTapSpeedInMS) {
            if (transformOrigin) {
              var offset = getTransformOriginOffset();
              smoothZoom(offset.x, offset.y, zoomDoubleClickSpeed);
            } else {
              // We want untransformed x/y here.
              smoothZoom(lastSingleFingerOffset.x, lastSingleFingerOffset.y, zoomDoubleClickSpeed);
            }
          }

          lastTouchEndTime = now;

          triggerPanEnd();
          releaseTouches();
        }
      }

      function getPinchZoomLength(finger1, finger2) {
        var dx = finger1.clientX - finger2.clientX;
        var dy = finger1.clientY - finger2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
      }

      function onDoubleClick(e) {
        beforeDoubleClick(e);
        var offset = getOffsetXY(e);
        if (transformOrigin) {
          // TODO: looks like this is duplicated in the file.
          // Need to refactor
          offset = getTransformOriginOffset();
        }
        smoothZoom(offset.x, offset.y, zoomDoubleClickSpeed);
      }

      function onMouseDown(e) {
        // if client does not want to handle this event - just ignore the call
        if (beforeMouseDown(e)) return;

        if (touchInProgress) {
          // modern browsers will fire mousedown for touch events too
          // we do not want this: touch is handled separately.
          e.stopPropagation();
          return false;
        }
        // for IE, left click == 1
        // for Firefox, left click == 0
        var isLeftButton =
          (e.button === 1 && window.event !== null) || e.button === 0;
        if (!isLeftButton) return;

        smoothScroll.cancel();

        var offset = getOffsetXY(e);
        var point = transformToScreen(offset.x, offset.y);
        mouseX = point.x;
        mouseY = point.y;

        // We need to listen on document itself, since mouse can go outside of the
        // window, and we will loose it
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        textSelection.capture(e.target || e.srcElement);

        return false;
      }

      function onMouseMove(e) {
        // no need to worry about mouse events when touch is happening
        if (touchInProgress) return;

        triggerPanStart();

        var offset = getOffsetXY(e);
        var point = transformToScreen(offset.x, offset.y);
        var dx = point.x - mouseX;
        var dy = point.y - mouseY;

        mouseX = point.x;
        mouseY = point.y;

        internalMoveBy(dx, dy);
      }

      function onMouseUp() {
        textSelection.release();
        triggerPanEnd();
        releaseDocumentMouse();
      }

      function releaseDocumentMouse() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        panstartFired = false;
      }

      function releaseTouches() {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', handleTouchEnd);
        panstartFired = false;
        multiTouch = false;
        touchInProgress = false;
      }

      function onMouseWheel(e) {
        // if client does not want to handle this event - just ignore the call
        if (beforeWheel(e)) return;

        smoothScroll.cancel();

        var delta = e.deltaY;
        if (e.deltaMode > 0) delta *= 100;

        var scaleMultiplier = getScaleMultiplier(delta);

        if (scaleMultiplier !== 1) {
          var offset = transformOrigin
            ? getTransformOriginOffset()
            : getOffsetXY(e);
          publicZoomTo(offset.x, offset.y, scaleMultiplier);
          e.preventDefault();
        }
      }

      function getOffsetXY(e) {
        var offsetX, offsetY;
        // I tried using e.offsetX, but that gives wrong results for svg, when user clicks on a path.
        var ownerRect = owner.getBoundingClientRect();
        offsetX = e.clientX - ownerRect.left;
        offsetY = e.clientY - ownerRect.top;

        return { x: offsetX, y: offsetY };
      }

      function smoothZoom(clientX, clientY, scaleMultiplier) {
        var fromValue = transform$1.scale;
        var from = { scale: fromValue };
        var to = { scale: scaleMultiplier * fromValue };

        smoothScroll.cancel();
        cancelZoomAnimation();

        zoomToAnimation = amator(from, to, {
          step: function (v) {
            zoomAbs(clientX, clientY, v.scale);
          },
          done: triggerZoomEnd
        });
      }

      function smoothZoomAbs(clientX, clientY, toScaleValue) {
        var fromValue = transform$1.scale;
        var from = { scale: fromValue };
        var to = { scale: toScaleValue };

        smoothScroll.cancel();
        cancelZoomAnimation();

        zoomToAnimation = amator(from, to, {
          step: function (v) {
            zoomAbs(clientX, clientY, v.scale);
          }
        });
      }

      function getTransformOriginOffset() {
        var ownerRect = owner.getBoundingClientRect();
        return {
          x: ownerRect.width * transformOrigin.x,
          y: ownerRect.height * transformOrigin.y
        };
      }

      function publicZoomTo(clientX, clientY, scaleMultiplier) {
        smoothScroll.cancel();
        cancelZoomAnimation();
        return zoomByRatio(clientX, clientY, scaleMultiplier);
      }

      function cancelZoomAnimation() {
        if (zoomToAnimation) {
          zoomToAnimation.cancel();
          zoomToAnimation = null;
        }
      }

      function getScaleMultiplier(delta) {
        var sign = Math.sign(delta);
        var deltaAdjustedSpeed = Math.min(0.25, Math.abs(speed * delta / 128));
        return 1 - sign * deltaAdjustedSpeed;
      }

      function triggerPanStart() {
        if (!panstartFired) {
          triggerEvent('panstart');
          panstartFired = true;
          smoothScroll.start();
        }
      }

      function triggerPanEnd() {
        if (panstartFired) {
          // we should never run smooth scrolling if it was multiTouch (pinch zoom animation):
          if (!multiTouch) smoothScroll.stop();
          triggerEvent('panend');
        }
      }

      function triggerZoomEnd() {
        triggerEvent('zoomend');
      }

      function triggerEvent(name) {
        api.fire(name, api);
      }
    }

    function parseTransformOrigin(options) {
      if (!options) return;
      if (typeof options === 'object') {
        if (!isNumber(options.x) || !isNumber(options.y))
          failTransformOrigin(options);
        return options;
      }

      failTransformOrigin();
    }

    function failTransformOrigin(options) {
      console.error(options);
      throw new Error(
        [
          'Cannot parse transform origin.',
          'Some good examples:',
          '  "center center" can be achieved with {x: 0.5, y: 0.5}',
          '  "top center" can be achieved with {x: 0.5, y: 0}',
          '  "bottom right" can be achieved with {x: 1, y: 1}'
        ].join('\n')
      );
    }

    function noop$3() { }

    function validateBounds(bounds) {
      var boundsType = typeof bounds;
      if (boundsType === 'undefined' || boundsType === 'boolean') return; // this is okay
      // otherwise need to be more thorough:
      var validBounds =
        isNumber(bounds.left) &&
        isNumber(bounds.top) &&
        isNumber(bounds.bottom) &&
        isNumber(bounds.right);

      if (!validBounds)
        throw new Error(
          'Bounds object is not valid. It can be: ' +
          'undefined, boolean (true|false) or an object {left, top, right, bottom}'
        );
    }

    function isNumber(x) {
      return Number.isFinite(x);
    }

    // IE 11 does not support isNaN:
    function isNaN(value) {
      if (Number.isNaN) {
        return Number.isNaN(value);
      }

      return value !== value;
    }

    function rigidScroll() {
      return {
        start: noop$3,
        stop: noop$3,
        cancel: noop$3
      };
    }

    function autoRun() {
      if (typeof document === 'undefined') return;

      var scripts = document.getElementsByTagName('script');
      if (!scripts) return;
      var panzoomScript;

      for (var i = 0; i < scripts.length; ++i) {
        var x = scripts[i];
        if (x.src && x.src.match(/\bpanzoom(\.min)?\.js/)) {
          panzoomScript = x;
          break;
        }
      }

      if (!panzoomScript) return;

      var query = panzoomScript.getAttribute('query');
      if (!query) return;

      var globalName = panzoomScript.getAttribute('name') || 'pz';
      var started = Date.now();

      tryAttach();

      function tryAttach() {
        var el = document.querySelector(query);
        if (!el) {
          var now = Date.now();
          var elapsed = now - started;
          if (elapsed < 2000) {
            // Let's wait a bit
            setTimeout(tryAttach, 100);
            return;
          }
          // If we don't attach within 2 seconds to the target element, consider it a failure
          console.error('Cannot find the panzoom element', globalName);
          return;
        }
        var options = collectOptions(panzoomScript);
        console.log(options);
        window[globalName] = createPanZoom(el, options);
      }

      function collectOptions(script) {
        var attrs = script.attributes;
        var options = {};
        for (var i = 0; i < attrs.length; ++i) {
          var attr = attrs[i];
          var nameValue = getPanzoomAttributeNameValue(attr);
          if (nameValue) {
            options[nameValue.name] = nameValue.value;
          }
        }

        return options;
      }

      function getPanzoomAttributeNameValue(attr) {
        if (!attr.name) return;
        var isPanZoomAttribute =
          attr.name[0] === 'p' && attr.name[1] === 'z' && attr.name[2] === '-';

        if (!isPanZoomAttribute) return;

        var name = attr.name.substr(3);
        var value = JSON.parse(attr.value);
        return { name: name, value: value };
      }
    }

    autoRun();

    /* C:\Users\ante.novokmet\Desktop\Projects\Beautiful-maps\src\PaletteInput.svelte generated by Svelte v3.24.1 */
    const file = "C:\\Users\\ante.novokmet\\Desktop\\Projects\\Beautiful-maps\\src\\PaletteInput.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (35:4) {#each $palette$ as step}
    function create_each_block(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[4](/*step*/ ctx[7], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "palette-step svelte-1hc0gjj");
    			set_style(div, "background-color", /*step*/ ctx[7]);
    			toggle_class(div, "selected", /*step*/ ctx[7] === /*selected*/ ctx[0]);
    			add_location(div, file, 35, 4, 773);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$palette$*/ 2) {
    				set_style(div, "background-color", /*step*/ ctx[7]);
    			}

    			if (dirty & /*$palette$, selected*/ 3) {
    				toggle_class(div, "selected", /*step*/ ctx[7] === /*selected*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(35:4) {#each $palette$ as step}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let each_value = /*$palette$*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "palette svelte-1hc0gjj");
    			add_location(div, file, 33, 0, 715);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$palette$, selected, onSelected*/ 11) {
    				each_value = /*$palette$*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $palette$;
    	const dispatch = createEventDispatcher();
    	const { palette, palette$ } = getContext("ctx");
    	validate_store(palette$, "palette$");
    	component_subscribe($$self, palette$, value => $$invalidate(1, $palette$ = value));
    	let { selected } = $$props;

    	function onSelected(color) {
    		$$invalidate(0, selected = color);
    		dispatch("select", { color });
    	}

    	const writable_props = ["selected"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PaletteInput> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PaletteInput", $$slots, []);
    	const click_handler = step => onSelected(step);

    	$$self.$$set = $$props => {
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		createEventDispatcher,
    		dispatch,
    		palette,
    		palette$,
    		selected,
    		onSelected,
    		$palette$
    	});

    	$$self.$inject_state = $$props => {
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selected, $palette$, palette$, onSelected, click_handler];
    }

    class PaletteInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { selected: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PaletteInput",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*selected*/ ctx[0] === undefined && !("selected" in props)) {
    			console.warn("<PaletteInput> was created without expected prop 'selected'");
    		}
    	}

    	get selected() {
    		throw new Error("<PaletteInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<PaletteInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\ante.novokmet\Desktop\Projects\Beautiful-maps\src\StylePicker.svelte generated by Svelte v3.24.1 */
    const file$1 = "C:\\Users\\ante.novokmet\\Desktop\\Projects\\Beautiful-maps\\src\\StylePicker.svelte";

    function create_fragment$1(ctx) {
    	let div7;
    	let div0;
    	let label0;
    	let input0;
    	let t0;
    	let i;
    	let h6;
    	let t1;
    	let h6_title_value;
    	let t2;
    	let div2;
    	let label1;
    	let t4;
    	let div1;
    	let input1;
    	let t5;
    	let input2;
    	let t6;
    	let div3;
    	let label2;
    	let t8;
    	let input3;
    	let t9;
    	let paletteinput;
    	let t10;
    	let div4;
    	let label3;
    	let t12;
    	let input4;
    	let t13;
    	let div6;
    	let label4;
    	let t15;
    	let div5;
    	let input5;
    	let t16;
    	let input6;
    	let current;
    	let mounted;
    	let dispose;

    	paletteinput = new PaletteInput({
    			props: { selected: /*config*/ ctx[0].style.fill },
    			$$inline: true
    		});

    	paletteinput.$on("select", /*select_handler*/ ctx[7]);

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			input0 = element("input");
    			t0 = space();
    			i = element("i");
    			h6 = element("h6");
    			t1 = text(/*selector*/ ctx[1]);
    			t2 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "opacity";
    			t4 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t5 = space();
    			input2 = element("input");
    			t6 = space();
    			div3 = element("div");
    			label2 = element("label");
    			label2.textContent = "fill";
    			t8 = space();
    			input3 = element("input");
    			t9 = space();
    			create_component(paletteinput.$$.fragment);
    			t10 = space();
    			div4 = element("div");
    			label3 = element("label");
    			label3.textContent = "stroke";
    			t12 = space();
    			input4 = element("input");
    			t13 = space();
    			div6 = element("div");
    			label4 = element("label");
    			label4.textContent = "strokeWidth";
    			t15 = space();
    			div5 = element("div");
    			input5 = element("input");
    			t16 = space();
    			input6 = element("input");
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file$1, 37, 12, 768);
    			attr_dev(i, "class", "form-icon");
    			add_location(i, file$1, 38, 12, 835);
    			attr_dev(h6, "title", h6_title_value = /*config*/ ctx[0].hint);
    			add_location(h6, file$1, 38, 37, 860);
    			attr_dev(label0, "class", "form-switch");
    			add_location(label0, file$1, 36, 8, 727);
    			attr_dev(div0, "class", "form-group");
    			add_location(div0, file$1, 35, 4, 693);
    			attr_dev(label1, "class", "form-label label-sm");
    			add_location(label1, file$1, 42, 8, 971);
    			attr_dev(input1, "class", "form-input input-sm");
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "max", "1");
    			attr_dev(input1, "step", "0.1");
    			add_location(input1, file$1, 44, 12, 1068);
    			attr_dev(input2, "class", "form-input input-sm");
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "min", "0");
    			attr_dev(input2, "max", "1");
    			attr_dev(input2, "step", "0.1");
    			add_location(input2, file$1, 45, 12, 1191);
    			attr_dev(div1, "class", "form-pair svelte-qnisce");
    			add_location(div1, file$1, 43, 8, 1031);
    			attr_dev(div2, "class", "form-group");
    			add_location(div2, file$1, 41, 4, 937);
    			attr_dev(label2, "class", "form-label label-sm");
    			add_location(label2, file$1, 49, 8, 1369);
    			attr_dev(input3, "class", "form-input input-sm");
    			attr_dev(input3, "type", "color");
    			add_location(input3, file$1, 50, 8, 1426);
    			attr_dev(div3, "class", "form-group");
    			add_location(div3, file$1, 48, 4, 1335);
    			attr_dev(label3, "class", "form-label label-sm");
    			add_location(label3, file$1, 54, 8, 1662);
    			attr_dev(input4, "class", "form-input input-sm");
    			attr_dev(input4, "type", "color");
    			add_location(input4, file$1, 55, 8, 1721);
    			attr_dev(div4, "class", "form-group");
    			add_location(div4, file$1, 53, 4, 1628);
    			attr_dev(label4, "class", "form-label label-sm");
    			add_location(label4, file$1, 58, 8, 1854);
    			attr_dev(input5, "class", "form-input input-sm");
    			attr_dev(input5, "type", "range");
    			attr_dev(input5, "min", "0");
    			attr_dev(input5, "max", "4");
    			attr_dev(input5, "step", "0.1");
    			add_location(input5, file$1, 60, 12, 1955);
    			attr_dev(input6, "class", "form-input input-sm");
    			attr_dev(input6, "type", "number");
    			attr_dev(input6, "min", "0");
    			attr_dev(input6, "max", "4");
    			attr_dev(input6, "step", "0.1");
    			add_location(input6, file$1, 61, 12, 2086);
    			attr_dev(div5, "class", "form-pair svelte-qnisce");
    			add_location(div5, file$1, 59, 8, 1918);
    			attr_dev(div6, "class", "form-group");
    			add_location(div6, file$1, 57, 4, 1820);
    			attr_dev(div7, "class", "form");
    			add_location(div7, file$1, 34, 0, 669);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div0);
    			append_dev(div0, label0);
    			append_dev(label0, input0);
    			input0.checked = /*config*/ ctx[0].enabled;
    			append_dev(label0, t0);
    			append_dev(label0, i);
    			append_dev(label0, h6);
    			append_dev(h6, t1);
    			append_dev(div7, t2);
    			append_dev(div7, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, input1);
    			set_input_value(input1, /*config*/ ctx[0].style.opacity);
    			append_dev(div1, t5);
    			append_dev(div1, input2);
    			set_input_value(input2, /*config*/ ctx[0].style.opacity);
    			append_dev(div7, t6);
    			append_dev(div7, div3);
    			append_dev(div3, label2);
    			append_dev(div3, t8);
    			append_dev(div3, input3);
    			set_input_value(input3, /*config*/ ctx[0].style.fill);
    			append_dev(div3, t9);
    			mount_component(paletteinput, div3, null);
    			append_dev(div7, t10);
    			append_dev(div7, div4);
    			append_dev(div4, label3);
    			append_dev(div4, t12);
    			append_dev(div4, input4);
    			set_input_value(input4, /*config*/ ctx[0].style.stroke);
    			append_dev(div7, t13);
    			append_dev(div7, div6);
    			append_dev(div6, label4);
    			append_dev(div6, t15);
    			append_dev(div6, div5);
    			append_dev(div5, input5);
    			set_input_value(input5, /*config*/ ctx[0].style["stroke-width"]);
    			append_dev(div5, t16);
    			append_dev(div5, input6);
    			set_input_value(input6, /*config*/ ctx[0].style["stroke-width"]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[3]),
    					listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[4]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[5]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[6]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[8]),
    					listen_dev(input5, "change", /*input5_change_input_handler*/ ctx[9]),
    					listen_dev(input5, "input", /*input5_change_input_handler*/ ctx[9]),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[10])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*config*/ 1) {
    				input0.checked = /*config*/ ctx[0].enabled;
    			}

    			if (!current || dirty & /*selector*/ 2) set_data_dev(t1, /*selector*/ ctx[1]);

    			if (!current || dirty & /*config*/ 1 && h6_title_value !== (h6_title_value = /*config*/ ctx[0].hint)) {
    				attr_dev(h6, "title", h6_title_value);
    			}

    			if (dirty & /*config*/ 1) {
    				set_input_value(input1, /*config*/ ctx[0].style.opacity);
    			}

    			if (dirty & /*config*/ 1 && to_number(input2.value) !== /*config*/ ctx[0].style.opacity) {
    				set_input_value(input2, /*config*/ ctx[0].style.opacity);
    			}

    			if (dirty & /*config*/ 1) {
    				set_input_value(input3, /*config*/ ctx[0].style.fill);
    			}

    			const paletteinput_changes = {};
    			if (dirty & /*config*/ 1) paletteinput_changes.selected = /*config*/ ctx[0].style.fill;
    			paletteinput.$set(paletteinput_changes);

    			if (dirty & /*config*/ 1) {
    				set_input_value(input4, /*config*/ ctx[0].style.stroke);
    			}

    			if (dirty & /*config*/ 1) {
    				set_input_value(input5, /*config*/ ctx[0].style["stroke-width"]);
    			}

    			if (dirty & /*config*/ 1 && to_number(input6.value) !== /*config*/ ctx[0].style["stroke-width"]) {
    				set_input_value(input6, /*config*/ ctx[0].style["stroke-width"]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(paletteinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(paletteinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_component(paletteinput);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { config } = $$props;
    	let { selector } = $$props;
    	const { onChanged } = getContext("ctx");

    	const defaults = {
    		opacity: 1,
    		fill: "#cccccc",
    		"fill-opacity": 1,
    		stroke: "#ffffff",
    		"stroke-width": 0.5
    	};

    	function onFillSelected(event) {
    		$$invalidate(0, config.style.fill = event.detail.color, config);
    	}

    	const writable_props = ["config", "selector"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StylePicker> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("StylePicker", $$slots, []);

    	function input0_change_handler() {
    		config.enabled = this.checked;
    		$$invalidate(0, config);
    	}

    	function input1_change_input_handler() {
    		config.style.opacity = to_number(this.value);
    		$$invalidate(0, config);
    	}

    	function input2_input_handler() {
    		config.style.opacity = to_number(this.value);
    		$$invalidate(0, config);
    	}

    	function input3_input_handler() {
    		config.style.fill = this.value;
    		$$invalidate(0, config);
    	}

    	const select_handler = e => onFillSelected(e);

    	function input4_input_handler() {
    		config.style.stroke = this.value;
    		$$invalidate(0, config);
    	}

    	function input5_change_input_handler() {
    		config.style["stroke-width"] = to_number(this.value);
    		$$invalidate(0, config);
    	}

    	function input6_input_handler() {
    		config.style["stroke-width"] = to_number(this.value);
    		$$invalidate(0, config);
    	}

    	$$self.$$set = $$props => {
    		if ("config" in $$props) $$invalidate(0, config = $$props.config);
    		if ("selector" in $$props) $$invalidate(1, selector = $$props.selector);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		PaletteInput,
    		config,
    		selector,
    		onChanged,
    		defaults,
    		onFillSelected
    	});

    	$$self.$inject_state = $$props => {
    		if ("config" in $$props) $$invalidate(0, config = $$props.config);
    		if ("selector" in $$props) $$invalidate(1, selector = $$props.selector);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*config*/ 1) {
    			 {
    				onChanged({ id: config.id, style: config.style });
    			}
    		}
    	};

    	return [
    		config,
    		selector,
    		onFillSelected,
    		input0_change_handler,
    		input1_change_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		select_handler,
    		input4_input_handler,
    		input5_change_input_handler,
    		input6_input_handler
    	];
    }

    class StylePicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { config: 0, selector: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StylePicker",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*config*/ ctx[0] === undefined && !("config" in props)) {
    			console.warn("<StylePicker> was created without expected prop 'config'");
    		}

    		if (/*selector*/ ctx[1] === undefined && !("selector" in props)) {
    			console.warn("<StylePicker> was created without expected prop 'selector'");
    		}
    	}

    	get config() {
    		throw new Error("<StylePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<StylePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selector() {
    		throw new Error("<StylePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selector(value) {
    		throw new Error("<StylePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\ante.novokmet\Desktop\Projects\Beautiful-maps\src\StyleRenderer.svelte generated by Svelte v3.24.1 */

    const { console: console_1 } = globals;

    function create_fragment$2(ctx) {
    	let html_tag;
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(/*htmlString*/ ctx[0], target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*htmlString*/ 1) html_tag.p(/*htmlString*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function renderStyle(style, selector) {
    	let res = `\n${selector} {`;

    	if (style.opacity != null) {
    		res += `\nopacity: ${style.opacity};`;
    	}

    	if (style.fill) {
    		res += `\nfill: ${style.fill};`;
    	}

    	if (style.stroke) {
    		res += `\nstroke: ${style.stroke};`;
    	}

    	if (style["stroke-width"] != null) {
    		res += `\nstroke-width: ${style["stroke-width"]};`;
    	}

    	res += "\n}";
    	return res;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $changedEvent$;
    	let { configs } = $$props;
    	let { countries } = $$props;
    	const { changedEvent$ } = getContext("ctx");
    	validate_store(changedEvent$, "changedEvent$");
    	component_subscribe($$self, changedEvent$, value => $$invalidate(4, $changedEvent$ = value));
    	let htmlString;

    	function createCssNode() {
    		$$invalidate(0, htmlString = "<style>");

    		for (const key in configs) {
    			const config = configs[key];

    			if (config.enabled) {
    				$$invalidate(0, htmlString += renderStyle(config.style, `.${key}`));
    			}
    		}

    		for (const key in countries) {
    			const config = countries[key];

    			if (config.enabled) {
    				$$invalidate(0, htmlString += renderStyle(config.style, `.${key}`));
    			}
    		}

    		$$invalidate(0, htmlString += "</style>");
    	}

    	const writable_props = ["configs", "countries"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<StyleRenderer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("StyleRenderer", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("configs" in $$props) $$invalidate(2, configs = $$props.configs);
    		if ("countries" in $$props) $$invalidate(3, countries = $$props.countries);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		configs,
    		countries,
    		changedEvent$,
    		renderStyle,
    		htmlString,
    		createCssNode,
    		$changedEvent$
    	});

    	$$self.$inject_state = $$props => {
    		if ("configs" in $$props) $$invalidate(2, configs = $$props.configs);
    		if ("countries" in $$props) $$invalidate(3, countries = $$props.countries);
    		if ("htmlString" in $$props) $$invalidate(0, htmlString = $$props.htmlString);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$changedEvent$*/ 16) {
    			 {
    				console.log("Recreating CSS", $changedEvent$);

    				if ($changedEvent$) {
    					createCssNode();
    				}
    			}
    		}
    	};

    	return [htmlString, changedEvent$, configs, countries];
    }

    class StyleRenderer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { configs: 2, countries: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StyleRenderer",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*configs*/ ctx[2] === undefined && !("configs" in props)) {
    			console_1.warn("<StyleRenderer> was created without expected prop 'configs'");
    		}

    		if (/*countries*/ ctx[3] === undefined && !("countries" in props)) {
    			console_1.warn("<StyleRenderer> was created without expected prop 'countries'");
    		}
    	}

    	get configs() {
    		throw new Error("<StyleRenderer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set configs(value) {
    		throw new Error("<StyleRenderer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get countries() {
    		throw new Error("<StyleRenderer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set countries(value) {
    		throw new Error("<StyleRenderer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\ante.novokmet\Desktop\Projects\Beautiful-maps\src\PaletteSettings.svelte generated by Svelte v3.24.1 */

    const { console: console_1$1 } = globals;
    const file$2 = "C:\\Users\\ante.novokmet\\Desktop\\Projects\\Beautiful-maps\\src\\PaletteSettings.svelte";

    function create_fragment$3(ctx) {
    	let div2;
    	let a;
    	let t1;
    	let div1;
    	let label;
    	let t3;
    	let div0;
    	let textarea;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			a = element("a");
    			a.textContent = "Palette helper here";
    			t1 = space();
    			div1 = element("div");
    			label = element("label");
    			label.textContent = "enter JSON palette";
    			t3 = space();
    			div0 = element("div");
    			textarea = element("textarea");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "href", "https://gka.github.io/palettes/");
    			add_location(a, file$2, 29, 4, 586);
    			attr_dev(label, "class", "form-label label-sm");
    			add_location(label, file$2, 32, 8, 713);
    			set_style(textarea, "height", "200px");
    			attr_dev(textarea, "class", "form-input input-sm");
    			attr_dev(textarea, "type", "text");
    			textarea.value = /*paletteStr*/ ctx[0];
    			add_location(textarea, file$2, 34, 12, 821);
    			attr_dev(div0, "class", "form-pair");
    			add_location(div0, file$2, 33, 8, 784);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$2, 31, 4, 679);
    			add_location(div2, file$2, 28, 0, 575);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, a);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, label);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, textarea);

    			if (!mounted) {
    				dispose = listen_dev(textarea, "input", /*paletteChange*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*paletteStr*/ 1) {
    				prop_dev(textarea, "value", /*paletteStr*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $palette$;
    	const ctx = getContext("ctx");
    	let palette = ctx.palette;
    	let palette$ = ctx.palette$;
    	validate_store(palette$, "palette$");
    	component_subscribe($$self, palette$, value => $$invalidate(4, $palette$ = value));
    	let paletteStr;

    	function paletteChange(e) {
    		let str = e.target.value;

    		try {
    			const value = JSON.parse(str.replace(/'/g, "\""));
    			$$invalidate(3, ctx.palette = value, ctx);
    			set_store_value(palette$, $palette$ = value);
    		} catch(e) {
    			console.error(e);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<PaletteSettings> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PaletteSettings", $$slots, []);

    	$$self.$capture_state = () => ({
    		getContext,
    		ctx,
    		palette,
    		palette$,
    		paletteStr,
    		paletteChange,
    		$palette$
    	});

    	$$self.$inject_state = $$props => {
    		if ("palette" in $$props) palette = $$props.palette;
    		if ("palette$" in $$props) $$invalidate(1, palette$ = $$props.palette$);
    		if ("paletteStr" in $$props) $$invalidate(0, paletteStr = $$props.paletteStr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*ctx*/ 8) {
    			 {
    				$$invalidate(0, paletteStr = JSON.stringify(ctx.palette));
    			}
    		}
    	};

    	return [paletteStr, palette$, paletteChange];
    }

    class PaletteSettings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PaletteSettings",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* C:\Users\ante.novokmet\Desktop\Projects\Beautiful-maps\src\ImageSettings.svelte generated by Svelte v3.24.1 */

    const { console: console_1$2 } = globals;
    const file$3 = "C:\\Users\\ante.novokmet\\Desktop\\Projects\\Beautiful-maps\\src\\ImageSettings.svelte";

    // (80:4) {#if config.appliedImageHref}
    function create_if_block_1(ctx) {
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let label0;
    	let t2;
    	let div1;
    	let input0;
    	let t3;
    	let input1;
    	let t4;
    	let div3;
    	let label1;
    	let input2;
    	let t5;
    	let i;
    	let t6;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			label0 = element("label");
    			label0.textContent = "scale";
    			t2 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t3 = space();
    			input1 = element("input");
    			t4 = space();
    			div3 = element("div");
    			label1 = element("label");
    			input2 = element("input");
    			t5 = space();
    			i = element("i");
    			t6 = text(" keep ratio");
    			if (img.src !== (img_src_value = /*config*/ ctx[0].appliedImageHref)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "image preview");
    			attr_dev(img, "class", "svelte-1xvtmpf");
    			add_location(img, file$3, 81, 12, 1874);
    			attr_dev(div0, "class", "img-container svelte-1xvtmpf");
    			add_location(div0, file$3, 80, 8, 1833);
    			attr_dev(label0, "class", "form-label label-sm");
    			add_location(label0, file$3, 84, 12, 1995);
    			attr_dev(input0, "class", "form-input input-sm");
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "min", "0");
    			attr_dev(input0, "max", "4");
    			attr_dev(input0, "step", "0.1");
    			add_location(input0, file$3, 86, 16, 2098);
    			attr_dev(input1, "class", "form-input input-sm");
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "max", "4");
    			attr_dev(input1, "step", "0.1");
    			add_location(input1, file$3, 87, 16, 2217);
    			attr_dev(div1, "class", "form-pair svelte-1xvtmpf");
    			add_location(div1, file$3, 85, 12, 2057);
    			attr_dev(div2, "class", "form-group");
    			add_location(div2, file$3, 83, 8, 1957);
    			attr_dev(input2, "type", "checkbox");
    			add_location(input2, file$3, 92, 16, 2459);
    			attr_dev(i, "class", "form-icon");
    			add_location(i, file$3, 93, 16, 2532);
    			attr_dev(label1, "class", "form-checkbox label-sm");
    			add_location(label1, file$3, 91, 12, 2403);
    			attr_dev(div3, "class", "form-group");
    			add_location(div3, file$3, 90, 8, 2365);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, img);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, label0);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*config*/ ctx[0].scale);
    			append_dev(div1, t3);
    			append_dev(div1, input1);
    			set_input_value(input1, /*config*/ ctx[0].scale);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, label1);
    			append_dev(label1, input2);
    			input2.checked = /*config*/ ctx[0].keepRatio;
    			append_dev(label1, t5);
    			append_dev(label1, i);
    			append_dev(label1, t6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_input_handler*/ ctx[4]),
    					listen_dev(input0, "input", /*input0_change_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[6])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*config*/ 1 && img.src !== (img_src_value = /*config*/ ctx[0].appliedImageHref)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*config*/ 1) {
    				set_input_value(input0, /*config*/ ctx[0].scale);
    			}

    			if (dirty & /*config*/ 1 && to_number(input1.value) !== /*config*/ ctx[0].scale) {
    				set_input_value(input1, /*config*/ ctx[0].scale);
    			}

    			if (dirty & /*config*/ 1) {
    				input2.checked = /*config*/ ctx[0].keepRatio;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(80:4) {#if config.appliedImageHref}",
    		ctx
    	});

    	return block;
    }

    // (106:8) {#if config.appliedImageHref}
    function create_if_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Remove";
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$3, 106, 8, 3000);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*remove*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(106:8) {#if config.appliedImageHref}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div3;
    	let t0;
    	let div1;
    	let label;
    	let t2;
    	let div0;
    	let input;
    	let t3;
    	let div2;
    	let button;
    	let t5;
    	let mounted;
    	let dispose;
    	let if_block0 = /*config*/ ctx[0].appliedImageHref && create_if_block_1(ctx);
    	let if_block1 = /*config*/ ctx[0].appliedImageHref && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			label = element("label");
    			label.textContent = "image url";
    			t2 = space();
    			div0 = element("div");
    			input = element("input");
    			t3 = space();
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "Apply";
    			t5 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(label, "class", "form-label label-sm");
    			add_location(label, file$3, 98, 8, 2657);
    			attr_dev(input, "class", "form-input input-sm");
    			attr_dev(input, "type", "text");
    			add_location(input, file$3, 100, 12, 2756);
    			attr_dev(div0, "class", "form-pair svelte-1xvtmpf");
    			add_location(div0, file$3, 99, 8, 2719);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$3, 97, 4, 2623);
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$3, 104, 8, 2888);
    			attr_dev(div2, "class", "btns-apart svelte-1xvtmpf");
    			add_location(div2, file$3, 103, 4, 2854);
    			attr_dev(div3, "class", "form");
    			add_location(div3, file$3, 78, 0, 1770);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, label);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*url*/ ctx[1]);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, button);
    			append_dev(div2, t5);
    			if (if_block1) if_block1.m(div2, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(button, "click", /*apply*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*config*/ ctx[0].appliedImageHref) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div3, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*url*/ 2 && input.value !== /*url*/ ctx[1]) {
    				set_input_value(input, /*url*/ ctx[1]);
    			}

    			if (/*config*/ ctx[0].appliedImageHref) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div2, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { config } = $$props;
    	let url;
    	const dispatch = createEventDispatcher();
    	const { onChanged } = getContext("ctx");

    	function apply() {
    		if (url) {
    			dispatch("apply", { config, url });
    			$$invalidate(1, url = "");
    		} else {
    			console.error("No url entered");
    		}
    	}

    	function remove() {
    	}

    	function changeScale(scale) {
    		const image = config.imageElement;
    		const width = config.imageOriginalWidth * scale;
    		const height = config.imageOriginalHeight * scale;
    		const x = config.imageOriginX - width / 2;
    		const y = config.imageOriginY - height / 2;
    		image.setAttribute("x", x);
    		image.setAttribute("y", y);
    		image.setAttribute("width", width);
    		image.setAttribute("height", height);
    	}

    	function changeKeepRatio(keepRatio) {
    		const image = config.imageElement;

    		if (keepRatio) {
    			image.setAttribute("preserveAspectRatio", "xMidYMid meet");
    		} else {
    			image.setAttribute("preserveAspectRatio", "none");
    			$$invalidate(0, config.scale = 1, config);
    		}
    	}

    	const writable_props = ["config"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<ImageSettings> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ImageSettings", $$slots, []);

    	function input0_change_input_handler() {
    		config.scale = to_number(this.value);
    		$$invalidate(0, config);
    	}

    	function input1_input_handler() {
    		config.scale = to_number(this.value);
    		$$invalidate(0, config);
    	}

    	function input2_change_handler() {
    		config.keepRatio = this.checked;
    		$$invalidate(0, config);
    	}

    	function input_input_handler() {
    		url = this.value;
    		$$invalidate(1, url);
    	}

    	$$self.$$set = $$props => {
    		if ("config" in $$props) $$invalidate(0, config = $$props.config);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		getContext,
    		config,
    		url,
    		dispatch,
    		onChanged,
    		apply,
    		remove,
    		changeScale,
    		changeKeepRatio
    	});

    	$$self.$inject_state = $$props => {
    		if ("config" in $$props) $$invalidate(0, config = $$props.config);
    		if ("url" in $$props) $$invalidate(1, url = $$props.url);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*config*/ 1) {
    			 {
    				if (config.imageElement) {
    					changeKeepRatio(config.keepRatio);
    					changeScale(config.scale);
    				}
    			}
    		}
    	};

    	return [
    		config,
    		url,
    		apply,
    		remove,
    		input0_change_input_handler,
    		input1_input_handler,
    		input2_change_handler,
    		input_input_handler
    	];
    }

    class ImageSettings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { config: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageSettings",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*config*/ ctx[0] === undefined && !("config" in props)) {
    			console_1$2.warn("<ImageSettings> was created without expected prop 'config'");
    		}
    	}

    	get config() {
    		throw new Error("<ImageSettings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<ImageSettings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\ante.novokmet\Desktop\Projects\Beautiful-maps\src\PositionSettings.svelte generated by Svelte v3.24.1 */

    const file$4 = "C:\\Users\\ante.novokmet\\Desktop\\Projects\\Beautiful-maps\\src\\PositionSettings.svelte";

    function create_fragment$5(ctx) {
    	let div16;
    	let div2;
    	let div0;
    	let label0;
    	let t1;
    	let div1;
    	let input0;
    	let t2;
    	let div5;
    	let div3;
    	let label1;
    	let t4;
    	let div4;
    	let input1;
    	let t5;
    	let div8;
    	let div6;
    	let label2;
    	let t7;
    	let div7;
    	let input2;
    	let t8;
    	let div9;
    	let t9;
    	let div12;
    	let div10;
    	let label3;
    	let t11;
    	let div11;
    	let input3;
    	let t12;
    	let div15;
    	let div13;
    	let label4;
    	let t14;
    	let div14;
    	let input4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div16 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "scale";
    			t1 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t2 = space();
    			div5 = element("div");
    			div3 = element("div");
    			label1 = element("label");
    			label1.textContent = "x";
    			t4 = space();
    			div4 = element("div");
    			input1 = element("input");
    			t5 = space();
    			div8 = element("div");
    			div6 = element("div");
    			label2 = element("label");
    			label2.textContent = "y";
    			t7 = space();
    			div7 = element("div");
    			input2 = element("input");
    			t8 = space();
    			div9 = element("div");
    			t9 = space();
    			div12 = element("div");
    			div10 = element("div");
    			label3 = element("label");
    			label3.textContent = "width (px)";
    			t11 = space();
    			div11 = element("div");
    			input3 = element("input");
    			t12 = space();
    			div15 = element("div");
    			div13 = element("div");
    			label4 = element("label");
    			label4.textContent = "height (px)";
    			t14 = space();
    			div14 = element("div");
    			input4 = element("input");
    			attr_dev(label0, "class", "form-label label-sm");
    			add_location(label0, file$4, 11, 37, 231);
    			attr_dev(div0, "class", "col-3 col-sm-12");
    			add_location(div0, file$4, 11, 8, 202);
    			attr_dev(input0, "class", "form-input input-sm");
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "step", "any");
    			add_location(input0, file$4, 12, 37, 324);
    			attr_dev(div1, "class", "col-9 col-sm-12");
    			add_location(div1, file$4, 12, 8, 295);
    			attr_dev(div2, "class", "form-group");
    			add_location(div2, file$4, 10, 4, 168);
    			attr_dev(label1, "class", "form-label label-sm");
    			add_location(label1, file$4, 15, 37, 490);
    			attr_dev(div3, "class", "col-3 col-sm-12");
    			add_location(div3, file$4, 15, 8, 461);
    			attr_dev(input1, "class", "form-input input-sm");
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "step", "any");
    			add_location(input1, file$4, 16, 37, 579);
    			attr_dev(div4, "class", "col-9 col-sm-12");
    			add_location(div4, file$4, 16, 8, 550);
    			attr_dev(div5, "class", "form-group");
    			add_location(div5, file$4, 14, 4, 427);
    			attr_dev(label2, "class", "form-label label-sm");
    			add_location(label2, file$4, 19, 37, 741);
    			attr_dev(div6, "class", "col-3 col-sm-12");
    			add_location(div6, file$4, 19, 8, 712);
    			attr_dev(input2, "class", "form-input input-sm");
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "step", "any");
    			add_location(input2, file$4, 20, 37, 830);
    			attr_dev(div7, "class", "col-9 col-sm-12");
    			add_location(div7, file$4, 20, 8, 801);
    			attr_dev(div8, "class", "form-group");
    			add_location(div8, file$4, 18, 4, 678);
    			attr_dev(div9, "class", "divider");
    			add_location(div9, file$4, 23, 4, 931);
    			attr_dev(label3, "class", "form-label label-sm");
    			add_location(label3, file$4, 26, 37, 1029);
    			attr_dev(div10, "class", "col-3 col-sm-12");
    			add_location(div10, file$4, 26, 8, 1000);
    			attr_dev(input3, "class", "form-input input-sm");
    			attr_dev(input3, "type", "number");
    			add_location(input3, file$4, 27, 37, 1127);
    			attr_dev(div11, "class", "col-9 col-sm-12");
    			add_location(div11, file$4, 27, 8, 1098);
    			attr_dev(div12, "class", "form-group");
    			add_location(div12, file$4, 25, 4, 966);
    			attr_dev(label4, "class", "form-label label-sm");
    			add_location(label4, file$4, 30, 37, 1282);
    			attr_dev(div13, "class", "col-3 col-sm-12");
    			add_location(div13, file$4, 30, 8, 1253);
    			attr_dev(input4, "class", "form-input input-sm");
    			attr_dev(input4, "type", "number");
    			add_location(input4, file$4, 31, 37, 1381);
    			attr_dev(div14, "class", "col-9 col-sm-12");
    			add_location(div14, file$4, 31, 8, 1352);
    			attr_dev(div15, "class", "form-group");
    			add_location(div15, file$4, 29, 4, 1219);
    			attr_dev(div16, "class", "form-horizontal");
    			add_location(div16, file$4, 9, 0, 133);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div16, anchor);
    			append_dev(div16, div2);
    			append_dev(div2, div0);
    			append_dev(div0, label0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*scale*/ ctx[0]);
    			append_dev(div16, t2);
    			append_dev(div16, div5);
    			append_dev(div5, div3);
    			append_dev(div3, label1);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, input1);
    			set_input_value(input1, /*x*/ ctx[1]);
    			append_dev(div16, t5);
    			append_dev(div16, div8);
    			append_dev(div8, div6);
    			append_dev(div6, label2);
    			append_dev(div8, t7);
    			append_dev(div8, div7);
    			append_dev(div7, input2);
    			set_input_value(input2, /*y*/ ctx[2]);
    			append_dev(div16, t8);
    			append_dev(div16, div9);
    			append_dev(div16, t9);
    			append_dev(div16, div12);
    			append_dev(div12, div10);
    			append_dev(div10, label3);
    			append_dev(div12, t11);
    			append_dev(div12, div11);
    			append_dev(div11, input3);
    			set_input_value(input3, /*width*/ ctx[3]);
    			append_dev(div16, t12);
    			append_dev(div16, div15);
    			append_dev(div15, div13);
    			append_dev(div13, label4);
    			append_dev(div15, t14);
    			append_dev(div15, div14);
    			append_dev(div14, input4);
    			set_input_value(input4, /*height*/ ctx[4]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[7]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[8]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[9])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*scale*/ 1 && to_number(input0.value) !== /*scale*/ ctx[0]) {
    				set_input_value(input0, /*scale*/ ctx[0]);
    			}

    			if (dirty & /*x*/ 2 && to_number(input1.value) !== /*x*/ ctx[1]) {
    				set_input_value(input1, /*x*/ ctx[1]);
    			}

    			if (dirty & /*y*/ 4 && to_number(input2.value) !== /*y*/ ctx[2]) {
    				set_input_value(input2, /*y*/ ctx[2]);
    			}

    			if (dirty & /*width*/ 8 && to_number(input3.value) !== /*width*/ ctx[3]) {
    				set_input_value(input3, /*width*/ ctx[3]);
    			}

    			if (dirty & /*height*/ 16 && to_number(input4.value) !== /*height*/ ctx[4]) {
    				set_input_value(input4, /*height*/ ctx[4]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div16);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { scale } = $$props;
    	let { x } = $$props;
    	let { y } = $$props;
    	let { width } = $$props;
    	let { height } = $$props;
    	const writable_props = ["scale", "x", "y", "width", "height"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PositionSettings> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PositionSettings", $$slots, []);

    	function input0_input_handler() {
    		scale = to_number(this.value);
    		$$invalidate(0, scale);
    	}

    	function input1_input_handler() {
    		x = to_number(this.value);
    		$$invalidate(1, x);
    	}

    	function input2_input_handler() {
    		y = to_number(this.value);
    		$$invalidate(2, y);
    	}

    	function input3_input_handler() {
    		width = to_number(this.value);
    		$$invalidate(3, width);
    	}

    	function input4_input_handler() {
    		height = to_number(this.value);
    		$$invalidate(4, height);
    	}

    	$$self.$$set = $$props => {
    		if ("scale" in $$props) $$invalidate(0, scale = $$props.scale);
    		if ("x" in $$props) $$invalidate(1, x = $$props.x);
    		if ("y" in $$props) $$invalidate(2, y = $$props.y);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    		if ("height" in $$props) $$invalidate(4, height = $$props.height);
    	};

    	$$self.$capture_state = () => ({ scale, x, y, width, height });

    	$$self.$inject_state = $$props => {
    		if ("scale" in $$props) $$invalidate(0, scale = $$props.scale);
    		if ("x" in $$props) $$invalidate(1, x = $$props.x);
    		if ("y" in $$props) $$invalidate(2, y = $$props.y);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    		if ("height" in $$props) $$invalidate(4, height = $$props.height);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		scale,
    		x,
    		y,
    		width,
    		height,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler
    	];
    }

    class PositionSettings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			scale: 0,
    			x: 1,
    			y: 2,
    			width: 3,
    			height: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PositionSettings",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*scale*/ ctx[0] === undefined && !("scale" in props)) {
    			console.warn("<PositionSettings> was created without expected prop 'scale'");
    		}

    		if (/*x*/ ctx[1] === undefined && !("x" in props)) {
    			console.warn("<PositionSettings> was created without expected prop 'x'");
    		}

    		if (/*y*/ ctx[2] === undefined && !("y" in props)) {
    			console.warn("<PositionSettings> was created without expected prop 'y'");
    		}

    		if (/*width*/ ctx[3] === undefined && !("width" in props)) {
    			console.warn("<PositionSettings> was created without expected prop 'width'");
    		}

    		if (/*height*/ ctx[4] === undefined && !("height" in props)) {
    			console.warn("<PositionSettings> was created without expected prop 'height'");
    		}
    	}

    	get scale() {
    		throw new Error("<PositionSettings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scale(value) {
    		throw new Error("<PositionSettings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<PositionSettings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<PositionSettings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<PositionSettings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<PositionSettings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<PositionSettings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<PositionSettings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<PositionSettings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<PositionSettings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\ante.novokmet\Desktop\Projects\Beautiful-maps\src\Tabs.svelte generated by Svelte v3.24.1 */
    const file$5 = "C:\\Users\\ante.novokmet\\Desktop\\Projects\\Beautiful-maps\\src\\Tabs.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (35:8) {#each tabs as tab}
    function create_each_block$1(ctx) {
    	let li;
    	let a;
    	let t0_value = /*tab*/ ctx[6].label + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[5](/*tab*/ ctx[6], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "href", "javascript:void(0)");
    			add_location(a, file$5, 36, 16, 874);
    			attr_dev(li, "class", "tab-item");
    			toggle_class(li, "active", /*$selectedTab$*/ ctx[0] === /*tab*/ ctx[6]);
    			add_location(li, file$5, 35, 12, 798);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$selectedTab$, tabs*/ 3) {
    				toggle_class(li, "active", /*$selectedTab$*/ ctx[0] === /*tab*/ ctx[6]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(35:8) {#each tabs as tab}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let ul;
    	let t;
    	let current;
    	let each_value = /*tabs*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(ul, "class", "tab tab-block");
    			add_location(ul, file$5, 33, 4, 729);
    			attr_dev(div, "class", "tabs");
    			add_location(div, file$5, 31, 0, 678);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div, t);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$selectedTab$, tabs*/ 3) {
    				each_value = /*tabs*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const TABS = {};

    function instance$6($$self, $$props, $$invalidate) {
    	let $selectedTab$;
    	const tabs = [];
    	const selectedTab$ = writable(null);
    	validate_store(selectedTab$, "selectedTab$");
    	component_subscribe($$self, selectedTab$, value => $$invalidate(0, $selectedTab$ = value));

    	setContext(TABS, {
    		register(tab) {
    			tabs.push(tab);

    			if (!$selectedTab$) {
    				set_store_value(selectedTab$, $selectedTab$ = tab);
    			}

    			onDestroy(() => {
    				const index = tabs.indexOf(tab);
    				tabs.splice(index, 1);
    			});
    		},
    		select(tab) {
    			set_store_value(selectedTab$, $selectedTab$ = tab);
    		},
    		selectedTab$
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tabs> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Tabs", $$slots, ['default']);
    	const click_handler = tab => set_store_value(selectedTab$, $selectedTab$ = tab);

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		TABS,
    		onDestroy,
    		setContext,
    		writable,
    		tabs,
    		selectedTab$,
    		$selectedTab$
    	});

    	return [$selectedTab$, tabs, selectedTab$, $$scope, $$slots, click_handler];
    }

    class Tabs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tabs",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* C:\Users\ante.novokmet\Desktop\Projects\Beautiful-maps\src\Tab.svelte generated by Svelte v3.24.1 */

    // (18:0) {#if $selectedTab$ === tab}
    function create_if_block$1(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(18:0) {#if $selectedTab$ === tab}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$selectedTab$*/ ctx[1] === /*tab*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$selectedTab$*/ ctx[1] === /*tab*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$selectedTab$, tab*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $selectedTab$;
    	const { register, selectedTab$ } = getContext(TABS);
    	validate_store(selectedTab$, "selectedTab$");
    	component_subscribe($$self, selectedTab$, value => $$invalidate(1, $selectedTab$ = value));
    	let { label } = $$props;
    	const tab = { label };
    	register(tab);
    	const writable_props = ["label"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tab> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Tab", $$slots, ['default']);

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(3, label = $$props.label);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		TABS,
    		register,
    		selectedTab$,
    		label,
    		tab,
    		$selectedTab$
    	});

    	$$self.$inject_state = $$props => {
    		if ("label" in $$props) $$invalidate(3, label = $$props.label);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*label*/ 8) {
    			 $$invalidate(0, tab.label = label, tab);
    		}
    	};

    	return [tab, $selectedTab$, selectedTab$, label, $$scope, $$slots];
    }

    class Tab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { label: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tab",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*label*/ ctx[3] === undefined && !("label" in props)) {
    			console.warn("<Tab> was created without expected prop 'label'");
    		}
    	}

    	get label() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /*
    * Below are Cascading Style Sheet (CSS) definitions in use in this file,
    * which allow easily changing how countries are displayed.
    *
    */

    /*
    * Circles around small countries
    *
    * Change opacity to 1 to display all circles.
    *
    */
    const classes = {};

    classes.circlexx = {
        id: 'circlexx',
        hint: 'Circles around small countries',
        enabled: true,
        style: {
            opacity: 0,
            fill: '#e0e0e0',
            stroke: '#000000',
            'stroke-width': 0.5,
        }
    };

    /*
    * Smaller circles around French DOMs and Chinese SARs
    *
    * Change opacity to 1 to display all subnational circles.
    *
    */
    classes.subxx = {
        id: 'subxx',
        hint: 'Smaller circles around French DOMs and Chinese SARs',
        enabled: true,
        style: {
            opacity: 0,
            'stroke-width': 0.3,
        }
    };


    /*
    * Circles around small countries, but with no permanent residents 
    *
    * Change opacity to 1 to display all circles.
    *
    */
    classes.noxx = {
        id: 'noxx',
        hints: 'Circles around small countries, but with no permanent residents',
        enabled: true,
        style: {
            opacity: 0,
            fill: '#e0e0e0',
            stroke: '#000000',
            'stroke-width': 0.5,
        }
    };

    /*
    * land
    */
    classes.landxx = {
        id: 'landxx',
        hints: 'land',
        enabled: true,
        style: {
            fill: '#e0e0e0',
            stroke: '#ffffff',
            'stroke-width': 0.5,
        }
    };


    /*
    * Styles for coastlines of islands with no borders
    */
    classes.coastxx = {
        id: 'coastxx',
        hints: 'Styles for coastlines of islands with no borders',
        enabled: true,
        style: {
            fill: '#e0e0e0',
            stroke: '#ffffff',
            'stroke-width': 0.3,
        }
    };


    /*
    * Styles for territories with limited or no recognition
    */
    classes.limitxx = {
        id: 'limitxx',
        hints: 'Styles for territories with limited or no recognition',
        enabled: true,
        style: {
            fill: '#e0e0e0',
            stroke: '#ffffff',
            'stroke-width': 0,
        }
    };

    /*
    * Circles around small territories with limited or no recognition
    *
    * Change opacity to 1 to display all circles.
    *
    */
    classes.unxx = {
        id: 'unxx',
        hint: 'Circles around small territories with limited or no recognition',
        enabled: true,
        style: {
            opacity: 0,
            fill: '#e0e0e0',
            stroke: '#000000',
            'stroke-width': 0.3,
        }
    };


    /*
    * Styles for territories without permanent population.
    */
    classes.antxx = {
        id: 'antxx',
        hint: 'Styles for territories without permanent population.',
        enabled: true,
        style: {
            fill: '#e0e0e0',
            stroke: '#ffffff',
            'stroke-width': 0,
        }
    };

    /*
    * Oceans and seas
    */
    classes.oceanxx = {
        id: 'oceanxx',
        hint: 'Oceans and seas',
        enabled: true,
        style: {
            opacity: 1,
            color: '#000000',
            fill: '#ffffff',
            stroke: '#000000',
            'stroke-width': 0,
            'stroke-miterlimit': 1,
        }
    };

    /* C:\Users\ante.novokmet\Desktop\Projects\Beautiful-maps\src\App.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1, console: console_1$3, document: document_1 } = globals;
    const file$6 = "C:\\Users\\ante.novokmet\\Desktop\\Projects\\Beautiful-maps\\src\\App.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	child_ctx[29] = list;
    	child_ctx[30] = i;
    	return child_ctx;
    }

    // (267:12) {#if selectedCountry}
    function create_if_block$2(ctx) {
    	let tabs;
    	let current;

    	tabs = new Tabs({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tabs.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tabs, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tabs_changes = {};

    			if (dirty[0] & /*selectedCountry*/ 8 | dirty[1] & /*$$scope*/ 1) {
    				tabs_changes.$$scope = { dirty, ctx };
    			}

    			tabs.$set(tabs_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tabs, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(267:12) {#if selectedCountry}",
    		ctx
    	});

    	return block;
    }

    // (269:16) <Tab label="Style">
    function create_default_slot_6(ctx) {
    	let div;
    	let stylepicker;
    	let updating_config;
    	let current;

    	function stylepicker_config_binding(value) {
    		/*stylepicker_config_binding*/ ctx[12].call(null, value);
    	}

    	let stylepicker_props = {
    		selector: "." + /*selectedCountry*/ ctx[3].id
    	};

    	if (/*selectedCountry*/ ctx[3] !== void 0) {
    		stylepicker_props.config = /*selectedCountry*/ ctx[3];
    	}

    	stylepicker = new StylePicker({ props: stylepicker_props, $$inline: true });
    	binding_callbacks.push(() => bind(stylepicker, "config", stylepicker_config_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(stylepicker.$$.fragment);
    			attr_dev(div, "class", "panel bg-light p-2 svelte-12w1lwo");
    			add_location(div, file$6, 269, 20, 8346);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(stylepicker, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const stylepicker_changes = {};
    			if (dirty[0] & /*selectedCountry*/ 8) stylepicker_changes.selector = "." + /*selectedCountry*/ ctx[3].id;

    			if (!updating_config && dirty[0] & /*selectedCountry*/ 8) {
    				updating_config = true;
    				stylepicker_changes.config = /*selectedCountry*/ ctx[3];
    				add_flush_callback(() => updating_config = false);
    			}

    			stylepicker.$set(stylepicker_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(stylepicker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(stylepicker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(stylepicker);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(269:16) <Tab label=\\\"Style\\\">",
    		ctx
    	});

    	return block;
    }

    // (274:16) <Tab label="Image">
    function create_default_slot_5(ctx) {
    	let div;
    	let imagesettings;
    	let updating_config;
    	let current;

    	function imagesettings_config_binding(value) {
    		/*imagesettings_config_binding*/ ctx[13].call(null, value);
    	}

    	let imagesettings_props = {};

    	if (/*selectedCountry*/ ctx[3] !== void 0) {
    		imagesettings_props.config = /*selectedCountry*/ ctx[3];
    	}

    	imagesettings = new ImageSettings({
    			props: imagesettings_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(imagesettings, "config", imagesettings_config_binding));
    	imagesettings.$on("apply", /*apply_handler*/ ctx[14]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(imagesettings.$$.fragment);
    			attr_dev(div, "class", "panel bg-light p-2 svelte-12w1lwo");
    			add_location(div, file$6, 274, 20, 8600);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(imagesettings, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const imagesettings_changes = {};

    			if (!updating_config && dirty[0] & /*selectedCountry*/ 8) {
    				updating_config = true;
    				imagesettings_changes.config = /*selectedCountry*/ ctx[3];
    				add_flush_callback(() => updating_config = false);
    			}

    			imagesettings.$set(imagesettings_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imagesettings.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imagesettings.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(imagesettings);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(274:16) <Tab label=\\\"Image\\\">",
    		ctx
    	});

    	return block;
    }

    // (268:12) <Tabs>
    function create_default_slot_4(ctx) {
    	let tab0;
    	let t;
    	let tab1;
    	let current;

    	tab0 = new Tab({
    			props: {
    				label: "Style",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab1 = new Tab({
    			props: {
    				label: "Image",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tab0.$$.fragment);
    			t = space();
    			create_component(tab1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tab0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(tab1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tab0_changes = {};

    			if (dirty[0] & /*selectedCountry*/ 8 | dirty[1] & /*$$scope*/ 1) {
    				tab0_changes.$$scope = { dirty, ctx };
    			}

    			tab0.$set(tab0_changes);
    			const tab1_changes = {};

    			if (dirty[0] & /*selectedCountry*/ 8 | dirty[1] & /*$$scope*/ 1) {
    				tab1_changes.$$scope = { dirty, ctx };
    			}

    			tab1.$set(tab1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab0.$$.fragment, local);
    			transition_in(tab1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tab0.$$.fragment, local);
    			transition_out(tab1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tab0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(tab1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(268:12) <Tabs>",
    		ctx
    	});

    	return block;
    }

    // (288:16) {#each Object.keys(classes) as klass}
    function create_each_block$2(ctx) {
    	let div1;
    	let div0;
    	let stylepicker;
    	let updating_config;
    	let t;
    	let current;

    	function stylepicker_config_binding_1(value) {
    		/*stylepicker_config_binding_1*/ ctx[15].call(null, value, /*klass*/ ctx[28]);
    	}

    	let stylepicker_props = { selector: "." + /*klass*/ ctx[28] };

    	if (/*classes*/ ctx[0][/*klass*/ ctx[28]] !== void 0) {
    		stylepicker_props.config = /*classes*/ ctx[0][/*klass*/ ctx[28]];
    	}

    	stylepicker = new StylePicker({ props: stylepicker_props, $$inline: true });
    	binding_callbacks.push(() => bind(stylepicker, "config", stylepicker_config_binding_1));

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(stylepicker.$$.fragment);
    			t = space();
    			attr_dev(div0, "class", "panel bg-light p-2 svelte-12w1lwo");
    			add_location(div0, file$6, 289, 24, 9101);
    			attr_dev(div1, "class", "column svelte-12w1lwo");
    			add_location(div1, file$6, 288, 20, 9056);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(stylepicker, div0, null);
    			append_dev(div1, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const stylepicker_changes = {};
    			if (dirty[0] & /*classes*/ 1) stylepicker_changes.selector = "." + /*klass*/ ctx[28];

    			if (!updating_config && dirty[0] & /*classes*/ 1) {
    				updating_config = true;
    				stylepicker_changes.config = /*classes*/ ctx[0][/*klass*/ ctx[28]];
    				add_flush_callback(() => updating_config = false);
    			}

    			stylepicker.$set(stylepicker_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(stylepicker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(stylepicker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(stylepicker);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(288:16) {#each Object.keys(classes) as klass}",
    		ctx
    	});

    	return block;
    }

    // (286:8) <Tab label="Classes">
    function create_default_slot_3(ctx) {
    	let div;
    	let current;
    	let each_value = Object.keys(/*classes*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "columns");
    			add_location(div, file$6, 286, 12, 8960);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*classes*/ 1) {
    				each_value = Object.keys(/*classes*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(286:8) <Tab label=\\\"Classes\\\">",
    		ctx
    	});

    	return block;
    }

    // (297:8) <Tab label="Position">
    function create_default_slot_2(ctx) {
    	let div;
    	let positionsettings;
    	let updating_scale;
    	let updating_x;
    	let updating_y;
    	let current;

    	function positionsettings_scale_binding(value) {
    		/*positionsettings_scale_binding*/ ctx[16].call(null, value);
    	}

    	function positionsettings_x_binding(value) {
    		/*positionsettings_x_binding*/ ctx[17].call(null, value);
    	}

    	function positionsettings_y_binding(value) {
    		/*positionsettings_y_binding*/ ctx[18].call(null, value);
    	}

    	let positionsettings_props = {};

    	if (/*position*/ ctx[4].scale !== void 0) {
    		positionsettings_props.scale = /*position*/ ctx[4].scale;
    	}

    	if (/*position*/ ctx[4].x !== void 0) {
    		positionsettings_props.x = /*position*/ ctx[4].x;
    	}

    	if (/*position*/ ctx[4].y !== void 0) {
    		positionsettings_props.y = /*position*/ ctx[4].y;
    	}

    	positionsettings = new PositionSettings({
    			props: positionsettings_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(positionsettings, "scale", positionsettings_scale_binding));
    	binding_callbacks.push(() => bind(positionsettings, "x", positionsettings_x_binding));
    	binding_callbacks.push(() => bind(positionsettings, "y", positionsettings_y_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(positionsettings.$$.fragment);
    			attr_dev(div, "class", "panel bg-light p-2 svelte-12w1lwo");
    			add_location(div, file$6, 297, 12, 9398);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(positionsettings, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const positionsettings_changes = {};

    			if (!updating_scale && dirty[0] & /*position*/ 16) {
    				updating_scale = true;
    				positionsettings_changes.scale = /*position*/ ctx[4].scale;
    				add_flush_callback(() => updating_scale = false);
    			}

    			if (!updating_x && dirty[0] & /*position*/ 16) {
    				updating_x = true;
    				positionsettings_changes.x = /*position*/ ctx[4].x;
    				add_flush_callback(() => updating_x = false);
    			}

    			if (!updating_y && dirty[0] & /*position*/ 16) {
    				updating_y = true;
    				positionsettings_changes.y = /*position*/ ctx[4].y;
    				add_flush_callback(() => updating_y = false);
    			}

    			positionsettings.$set(positionsettings_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(positionsettings.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(positionsettings.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(positionsettings);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(297:8) <Tab label=\\\"Position\\\">",
    		ctx
    	});

    	return block;
    }

    // (302:8) <Tab label="Palette">
    function create_default_slot_1(ctx) {
    	let div;
    	let palettesettings;
    	let current;
    	palettesettings = new PaletteSettings({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(palettesettings.$$.fragment);
    			attr_dev(div, "class", "panel bg-light p-2 svelte-12w1lwo");
    			add_location(div, file$6, 302, 12, 9629);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(palettesettings, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(palettesettings.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(palettesettings.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(palettesettings);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(302:8) <Tab label=\\\"Palette\\\">",
    		ctx
    	});

    	return block;
    }

    // (285:4) <Tabs>
    function create_default_slot(ctx) {
    	let tab0;
    	let t0;
    	let tab1;
    	let t1;
    	let tab2;
    	let current;

    	tab0 = new Tab({
    			props: {
    				label: "Classes",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab1 = new Tab({
    			props: {
    				label: "Position",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab2 = new Tab({
    			props: {
    				label: "Palette",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tab0.$$.fragment);
    			t0 = space();
    			create_component(tab1.$$.fragment);
    			t1 = space();
    			create_component(tab2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tab0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(tab1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(tab2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tab0_changes = {};

    			if (dirty[0] & /*classes*/ 1 | dirty[1] & /*$$scope*/ 1) {
    				tab0_changes.$$scope = { dirty, ctx };
    			}

    			tab0.$set(tab0_changes);
    			const tab1_changes = {};

    			if (dirty[0] & /*position*/ 16 | dirty[1] & /*$$scope*/ 1) {
    				tab1_changes.$$scope = { dirty, ctx };
    			}

    			tab1.$set(tab1_changes);
    			const tab2_changes = {};

    			if (dirty[1] & /*$$scope*/ 1) {
    				tab2_changes.$$scope = { dirty, ctx };
    			}

    			tab2.$set(tab2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab0.$$.fragment, local);
    			transition_in(tab1.$$.fragment, local);
    			transition_in(tab2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tab0.$$.fragment, local);
    			transition_out(tab1.$$.fragment, local);
    			transition_out(tab2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tab0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(tab1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(tab2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(285:4) <Tabs>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let t0;
    	let header;
    	let section0;
    	let a0;
    	let t2;
    	let section1;
    	let button;
    	let t4;
    	let a1;
    	let t6;
    	let main;
    	let div3;
    	let div1;
    	let div0;
    	let t7;
    	let div2;
    	let t8;
    	let tabs;
    	let t9;
    	let stylerenderer;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*selectedCountry*/ ctx[3] && create_if_block$2(ctx);

    	tabs = new Tabs({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	stylerenderer = new StyleRenderer({
    			props: {
    				configs: /*classes*/ ctx[0],
    				countries: /*countries*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = space();
    			header = element("header");
    			section0 = element("section");
    			a0 = element("a");
    			a0.textContent = "Beautiful-maps";
    			t2 = space();
    			section1 = element("section");
    			button = element("button");
    			button.textContent = "Shortcuts";
    			t4 = space();
    			a1 = element("a");
    			a1.textContent = "GitHub";
    			t6 = space();
    			main = element("main");
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t7 = space();
    			div2 = element("div");
    			if (if_block) if_block.c();
    			t8 = space();
    			create_component(tabs.$$.fragment);
    			t9 = space();
    			create_component(stylerenderer.$$.fragment);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "navbar-brand mr-2 text-bold text-light");
    			add_location(a0, file$6, 253, 8, 7682);
    			attr_dev(section0, "class", "navbar-section");
    			add_location(section0, file$6, 252, 4, 7641);
    			attr_dev(button, "class", "btn btn-sm");
    			add_location(button, file$6, 256, 8, 7820);
    			attr_dev(a1, "href", "https://github.com/ANovokmet/Beautiful-maps");
    			attr_dev(a1, "class", "btn btn-sm");
    			add_location(a1, file$6, 257, 8, 7874);
    			attr_dev(section1, "class", "navbar-section");
    			add_location(section1, file$6, 255, 4, 7779);
    			attr_dev(header, "class", "navbar bg-primary svelte-12w1lwo");
    			add_location(header, file$6, 251, 0, 7602);
    			attr_dev(div0, "id", "map-container");
    			attr_dev(div0, "class", "panel svelte-12w1lwo");
    			add_location(div0, file$6, 263, 12, 8092);
    			attr_dev(div1, "class", "column map svelte-12w1lwo");
    			add_location(div1, file$6, 262, 8, 8055);
    			attr_dev(div2, "class", "column col-2 svelte-12w1lwo");
    			set_style(div2, "min-width", "260px");
    			add_location(div2, file$6, 265, 8, 8185);
    			attr_dev(div3, "class", "columns");
    			set_style(div3, "height", "512px");
    			add_location(div3, file$6, 261, 4, 8003);
    			attr_dev(main, "class", " svelte-12w1lwo");
    			add_location(main, file$6, 260, 0, 7983);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, header, anchor);
    			append_dev(header, section0);
    			append_dev(section0, a0);
    			append_dev(header, t2);
    			append_dev(header, section1);
    			append_dev(section1, button);
    			append_dev(section1, t4);
    			append_dev(section1, a1);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div3);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			/*div0_binding*/ ctx[11](div0);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			if (if_block) if_block.m(div2, null);
    			append_dev(main, t8);
    			mount_component(tabs, main, null);
    			insert_dev(target, t9, anchor);
    			mount_component(stylerenderer, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(document_1.body, "keydown", /*handleKeydown*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*selectedCountry*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*selectedCountry*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div2, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const tabs_changes = {};

    			if (dirty[0] & /*position, classes*/ 17 | dirty[1] & /*$$scope*/ 1) {
    				tabs_changes.$$scope = { dirty, ctx };
    			}

    			tabs.$set(tabs_changes);
    			const stylerenderer_changes = {};
    			if (dirty[0] & /*classes*/ 1) stylerenderer_changes.configs = /*classes*/ ctx[0];
    			if (dirty[0] & /*countries*/ 4) stylerenderer_changes.countries = /*countries*/ ctx[2];
    			stylerenderer.$set(stylerenderer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(tabs.$$.fragment, local);
    			transition_in(stylerenderer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(tabs.$$.fragment, local);
    			transition_out(stylerenderer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(main);
    			/*div0_binding*/ ctx[11](null);
    			if (if_block) if_block.d();
    			destroy_component(tabs);
    			if (detaching) detach_dev(t9);
    			destroy_component(stylerenderer, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const xmlns = "http://www.w3.org/2000/svg";

    function delegated(fn) {
    	return function (event) {
    		let target = event.target.closest("[data-country]");

    		if (target && target.dataset["country"]) {
    			fn(target, event);
    		}
    	};
    }

    function cloneToPath(element) {
    	const clipPath = document.createElementNS(xmlns, "clipPath");

    	if (element.tagName === "path") {
    		clipPath.appendChild(element.cloneNode());
    	} else {
    		for (const node of element.querySelectorAll("path")) {
    			clipPath.appendChild(node.cloneNode());
    		}
    	}

    	return clipPath;
    }

    function setTransform({ x, y, scale }) {
    	const transform = window.pan.getTransform();
    	transform.scale = scale;
    	transform.x = x;
    	transform.y = y;
    	window.pan.moveBy(0, 0);
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $changedEvent$;
    	let $palette$;
    	let mapContainer;
    	let mapContent;
    	var countries = {};
    	let selected = null;
    	let hovering = null;
    	let selectedCountry = null;
    	let panZoomInstance;
    	let { mapUrl } = $$props;

    	const palette$ = writable([
    		"#00429d",
    		"#2e59a8",
    		"#4771b2",
    		"#5d8abd",
    		"#73a2c6",
    		"#8abccf",
    		"#a5d5d8",
    		"#c5eddf",
    		"#ffffe0"
    	]);

    	validate_store(palette$, "palette$");
    	component_subscribe($$self, palette$, value => $$invalidate(24, $palette$ = value));
    	const changedEvent$ = writable(null);
    	validate_store(changedEvent$, "changedEvent$");
    	component_subscribe($$self, changedEvent$, value => $$invalidate(23, $changedEvent$ = value));

    	const onChanged = lodash_throttle(
    		event => {
    			set_store_value(changedEvent$, $changedEvent$ = event);
    		},
    		400,
    		{ leading: true, trailing: true }
    	);

    	setContext("ctx", {
    		palette: [
    			"#00429d",
    			"#2e59a8",
    			"#4771b2",
    			"#5d8abd",
    			"#73a2c6",
    			"#8abccf",
    			"#a5d5d8",
    			"#c5eddf",
    			"#ffffe0"
    		],
    		palette$,
    		changedEvent$,
    		onChanged
    	});

    	let svgFetch$ = fetch(mapUrl).then(response => response.text()).then(html => {
    		var parser = new DOMParser();
    		var doc = parser.parseFromString(html, "image/svg+xml");
    		const svg = doc.getElementsByTagName("svg")[0];
    		return svg;
    	}).catch(err => console.error("Failed to fetch page: ", err));

    	onMount(async () => {
    		mapContent = await svgFetch$;
    		mapContainer.appendChild(mapContent);

    		for (const child of mapContent.children) {
    			//child.setAttribute()
    			if (child.tagName === "title" || child.id === "ocean") continue;

    			const titleElement = child.querySelector("title");
    			child.dataset.country = child.id;

    			$$invalidate(
    				2,
    				countries[child.id] = {
    					id: child.id,
    					element: child,
    					title: titleElement ? titleElement.textContent : child.id,
    					hint: titleElement ? titleElement.textContent : child.id,
    					enabled: true,
    					style: {
    						fill: child.style.fill,
    						fillOpacity: child.style.fillOpacity,
    						stroke: child.style.stroke,
    						strokeWidth: child.style.strokeWidth
    					}
    				},
    				countries
    			);
    		}

    		// limited recognition
    		const limitxx = mapContent.querySelectorAll(".limitxx, .unxx");

    		for (const child of limitxx) {
    			const titleElement = child.querySelector("title");
    			child.dataset.country = child.id;

    			$$invalidate(
    				2,
    				countries[child.id] = {
    					id: child.id,
    					element: child,
    					title: titleElement ? titleElement.textContent : child.id,
    					style: {
    						fill: child.style.fill,
    						fillOpacity: child.style.fillOpacity,
    						stroke: child.style.stroke,
    						strokeWidth: child.style.strokeWidth
    					}
    				},
    				countries
    			);
    		}

    		$$invalidate(22, panZoomInstance = window.pan = panzoom(mapContent, {
    			bounds: true,
    			boundsPadding: 0.5,
    			smoothScroll: false
    		}));

    		panZoomInstance.on("transform", e => {
    			const transform = e.getTransform();
    			$$invalidate(4, position.x = transform.x, position);
    			$$invalidate(4, position.y = transform.y, position);
    			$$invalidate(4, position.scale = transform.scale, position);
    		});

    		setTransform(position);

    		mapContent.addEventListener("click", delegated(target => {
    			const id = target.id;
    			selected && selected.removeAttribute("data-selected");
    			selected = target;
    			target.dataset.selected = true;
    			$$invalidate(3, selectedCountry = countries[id]);
    			console.log(countries[id]);
    		}));

    		mapContent.addEventListener("mouseover", delegated(target => {
    			hovering && hovering.removeAttribute("data-hover");
    			target.dataset.hover = true;
    			hovering = target;
    		}));
    	});

    	function handleKeydown(e) {
    		let c = String.fromCharCode(e.keyCode);

    		switch (c) {
    			case "1":
    			case "2":
    			case "3":
    			case "4":
    			case "5":
    			case "6":
    			case "7":
    			case "8":
    			case "9":
    				const color = $palette$[+c - 1];
    				if (selectedCountry && color) {
    					$$invalidate(3, selectedCountry.style.fill = color, selectedCountry);
    				}
    				break;
    		}
    	}

    	function applyImage(data) {
    		const element = data.config.element;
    		clip(`clip-${data.config.id}`, element, data.url, data.config);
    	}

    	function clip(clipId, pathElement, imageHref, config) {
    		const rect = pathElement.getBBox();
    		const clipPath = cloneToPath(pathElement);
    		clipPath.id = clipId;
    		const image = document.createElementNS(xmlns, "image");
    		image.setAttribute("clip-path", `url(#${clipId})`);
    		image.setAttribute("href", imageHref);
    		image.setAttribute("height", rect.height);
    		image.setAttribute("width", rect.width);
    		image.setAttribute("x", rect.x);
    		image.setAttribute("y", rect.y);
    		image.setAttribute("preserveAspectRatio", "none");
    		mapContent.appendChild(clipPath);

    		// pathElement.insertAdjacentElement('beforebegin', image);
    		mapContent.appendChild(image);

    		config.scale = 1;
    		config.keepRatio = false;
    		config.imageOriginX = rect.x + rect.width / 2;
    		config.imageOriginY = rect.y + rect.height / 2;
    		config.imageOriginalWidth = rect.width;
    		config.imageOriginalHeight = rect.height;
    		config.imageElement = image;
    		config.clipPathElement = clipPath;
    		config.appliedImageHref = imageHref;
    	}

    	let position = { scale: 3.815, x: -4348.21, y: -185.77 };
    	const writable_props = ["mapUrl"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			mapContainer = $$value;
    			$$invalidate(1, mapContainer);
    		});
    	}

    	function stylepicker_config_binding(value) {
    		selectedCountry = value;
    		$$invalidate(3, selectedCountry);
    	}

    	function imagesettings_config_binding(value) {
    		selectedCountry = value;
    		$$invalidate(3, selectedCountry);
    	}

    	const apply_handler = e => applyImage(e.detail);

    	function stylepicker_config_binding_1(value, klass) {
    		classes[klass] = value;
    		$$invalidate(0, classes);
    	}

    	function positionsettings_scale_binding(value) {
    		position.scale = value;
    		$$invalidate(4, position);
    	}

    	function positionsettings_x_binding(value) {
    		position.x = value;
    		$$invalidate(4, position);
    	}

    	function positionsettings_y_binding(value) {
    		position.y = value;
    		$$invalidate(4, position);
    	}

    	$$self.$$set = $$props => {
    		if ("mapUrl" in $$props) $$invalidate(9, mapUrl = $$props.mapUrl);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		setContext,
    		writable,
    		throttle: lodash_throttle,
    		panzoom,
    		StylePicker,
    		StyleRenderer,
    		PaletteInput,
    		PaletteSettings,
    		ImageSettings,
    		PositionSettings,
    		Tabs,
    		Tab,
    		classes,
    		mapContainer,
    		mapContent,
    		countries,
    		selected,
    		hovering,
    		selectedCountry,
    		panZoomInstance,
    		mapUrl,
    		palette$,
    		changedEvent$,
    		onChanged,
    		svgFetch$,
    		delegated,
    		handleKeydown,
    		applyImage,
    		xmlns,
    		clip,
    		cloneToPath,
    		setTransform,
    		position,
    		$changedEvent$,
    		$palette$
    	});

    	$$self.$inject_state = $$props => {
    		if ("mapContainer" in $$props) $$invalidate(1, mapContainer = $$props.mapContainer);
    		if ("mapContent" in $$props) mapContent = $$props.mapContent;
    		if ("countries" in $$props) $$invalidate(2, countries = $$props.countries);
    		if ("selected" in $$props) selected = $$props.selected;
    		if ("hovering" in $$props) hovering = $$props.hovering;
    		if ("selectedCountry" in $$props) $$invalidate(3, selectedCountry = $$props.selectedCountry);
    		if ("panZoomInstance" in $$props) $$invalidate(22, panZoomInstance = $$props.panZoomInstance);
    		if ("mapUrl" in $$props) $$invalidate(9, mapUrl = $$props.mapUrl);
    		if ("svgFetch$" in $$props) svgFetch$ = $$props.svgFetch$;
    		if ("position" in $$props) $$invalidate(4, position = $$props.position);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*panZoomInstance, position*/ 4194320) {
    			 {
    				if (panZoomInstance) {
    					setTransform(position);
    				}
    			}
    		}
    	};

    	return [
    		classes,
    		mapContainer,
    		countries,
    		selectedCountry,
    		position,
    		palette$,
    		changedEvent$,
    		handleKeydown,
    		applyImage,
    		mapUrl,
    		setTransform,
    		div0_binding,
    		stylepicker_config_binding,
    		imagesettings_config_binding,
    		apply_handler,
    		stylepicker_config_binding_1,
    		positionsettings_scale_binding,
    		positionsettings_x_binding,
    		positionsettings_y_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { mapUrl: 9, setTransform: 10 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*mapUrl*/ ctx[9] === undefined && !("mapUrl" in props)) {
    			console_1$3.warn("<App> was created without expected prop 'mapUrl'");
    		}
    	}

    	get mapUrl() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mapUrl(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setTransform() {
    		return setTransform;
    	}

    	set setTransform(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		mapUrl: './world-map.svg'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
