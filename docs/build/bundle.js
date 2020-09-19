
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
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }

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

    /* src\PaletteInput.svelte generated by Svelte v3.24.1 */
    const file = "src\\PaletteInput.svelte";

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

    /* src\StylePicker.svelte generated by Svelte v3.24.1 */
    const file$1 = "src\\StylePicker.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[11] = list;
    	child_ctx[12] = i;
    	return child_ctx;
    }

    // (81:43) 
    function create_if_block_2(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler_1() {
    		/*input_input_handler_1*/ ctx[8].call(input, /*opt*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "form-input input-sm");
    			attr_dev(input, "type", "color");
    			add_location(input, file$1, 81, 16, 2514);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*config*/ ctx[0].style[/*opt*/ ctx[10].styleProperty]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", input_input_handler_1);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*config, options*/ 5) {
    				set_input_value(input, /*config*/ ctx[0].style[/*opt*/ ctx[10].styleProperty]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(81:43) ",
    		ctx
    	});

    	return block;
    }

    // (78:45) 
    function create_if_block_1(ctx) {
    	let input;
    	let t;
    	let paletteinput;
    	let current;
    	let mounted;
    	let dispose;

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[6].call(input, /*opt*/ ctx[10]);
    	}

    	function select_handler(...args) {
    		return /*select_handler*/ ctx[7](/*opt*/ ctx[10], ...args);
    	}

    	paletteinput = new PaletteInput({
    			props: {
    				selected: /*config*/ ctx[0].style[/*opt*/ ctx[10].styleProperty]
    			},
    			$$inline: true
    		});

    	paletteinput.$on("select", select_handler);

    	const block = {
    		c: function create() {
    			input = element("input");
    			t = space();
    			create_component(paletteinput.$$.fragment);
    			attr_dev(input, "class", "form-input input-sm");
    			attr_dev(input, "type", "color");
    			add_location(input, file$1, 78, 16, 2200);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*config*/ ctx[0].style[/*opt*/ ctx[10].styleProperty]);
    			insert_dev(target, t, anchor);
    			mount_component(paletteinput, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "input", input_input_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*config, options*/ 5) {
    				set_input_value(input, /*config*/ ctx[0].style[/*opt*/ ctx[10].styleProperty]);
    			}

    			const paletteinput_changes = {};
    			if (dirty & /*config, options*/ 5) paletteinput_changes.selected = /*config*/ ctx[0].style[/*opt*/ ctx[10].styleProperty];
    			paletteinput.$set(paletteinput_changes);
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
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t);
    			destroy_component(paletteinput, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(78:45) ",
    		ctx
    	});

    	return block;
    }

    // (73:12) {#if opt.type === 'range'}
    function create_if_block(ctx) {
    	let div;
    	let input0;
    	let input0_min_value;
    	let input0_max_value;
    	let input0_step_value;
    	let t;
    	let input1;
    	let input1_min_value;
    	let input1_max_value;
    	let input1_step_value;
    	let mounted;
    	let dispose;

    	function input0_change_input_handler() {
    		/*input0_change_input_handler*/ ctx[4].call(input0, /*opt*/ ctx[10]);
    	}

    	function input1_input_handler() {
    		/*input1_input_handler*/ ctx[5].call(input1, /*opt*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			input0 = element("input");
    			t = space();
    			input1 = element("input");
    			attr_dev(input0, "class", "form-input input-sm");
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "min", input0_min_value = /*opt*/ ctx[10].min);
    			attr_dev(input0, "max", input0_max_value = /*opt*/ ctx[10].max);
    			attr_dev(input0, "step", input0_step_value = /*opt*/ ctx[10].step);
    			add_location(input0, file$1, 74, 20, 1802);
    			attr_dev(input1, "class", "form-input input-sm svelte-s5l83w");
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", input1_min_value = /*opt*/ ctx[10].min);
    			attr_dev(input1, "max", input1_max_value = /*opt*/ ctx[10].max);
    			attr_dev(input1, "step", input1_step_value = /*opt*/ ctx[10].step);
    			add_location(input1, file$1, 75, 20, 1967);
    			attr_dev(div, "class", "form-pair svelte-s5l83w");
    			add_location(div, file$1, 73, 16, 1757);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input0);
    			set_input_value(input0, /*config*/ ctx[0].style[/*opt*/ ctx[10].styleProperty]);
    			append_dev(div, t);
    			append_dev(div, input1);
    			set_input_value(input1, /*config*/ ctx[0].style[/*opt*/ ctx[10].styleProperty]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", input0_change_input_handler),
    					listen_dev(input0, "input", input0_change_input_handler),
    					listen_dev(input1, "input", input1_input_handler)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*options*/ 4 && input0_min_value !== (input0_min_value = /*opt*/ ctx[10].min)) {
    				attr_dev(input0, "min", input0_min_value);
    			}

    			if (dirty & /*options*/ 4 && input0_max_value !== (input0_max_value = /*opt*/ ctx[10].max)) {
    				attr_dev(input0, "max", input0_max_value);
    			}

    			if (dirty & /*options*/ 4 && input0_step_value !== (input0_step_value = /*opt*/ ctx[10].step)) {
    				attr_dev(input0, "step", input0_step_value);
    			}

    			if (dirty & /*config, options*/ 5) {
    				set_input_value(input0, /*config*/ ctx[0].style[/*opt*/ ctx[10].styleProperty]);
    			}

    			if (dirty & /*options*/ 4 && input1_min_value !== (input1_min_value = /*opt*/ ctx[10].min)) {
    				attr_dev(input1, "min", input1_min_value);
    			}

    			if (dirty & /*options*/ 4 && input1_max_value !== (input1_max_value = /*opt*/ ctx[10].max)) {
    				attr_dev(input1, "max", input1_max_value);
    			}

    			if (dirty & /*options*/ 4 && input1_step_value !== (input1_step_value = /*opt*/ ctx[10].step)) {
    				attr_dev(input1, "step", input1_step_value);
    			}

    			if (dirty & /*config, options*/ 5 && to_number(input1.value) !== /*config*/ ctx[0].style[/*opt*/ ctx[10].styleProperty]) {
    				set_input_value(input1, /*config*/ ctx[0].style[/*opt*/ ctx[10].styleProperty]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(73:12) {#if opt.type === 'range'}",
    		ctx
    	});

    	return block;
    }

    // (70:4) {#each options as opt}
    function create_each_block$1(ctx) {
    	let div;
    	let label;
    	let t0_value = /*opt*/ ctx[10].label + "";
    	let t0;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let t2;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*opt*/ ctx[10].type === "range") return 0;
    		if (/*opt*/ ctx[10].type === "palette") return 1;
    		if (/*opt*/ ctx[10].type === "color") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			attr_dev(label, "class", "form-label label-sm");
    			add_location(label, file$1, 71, 12, 1645);
    			attr_dev(div, "class", "form-group");
    			add_location(div, file$1, 70, 8, 1607);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, t0);
    			append_dev(div, t1);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div, null);
    			}

    			append_dev(div, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*options*/ 4) && t0_value !== (t0_value = /*opt*/ ctx[10].label + "")) set_data_dev(t0, t0_value);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(div, t2);
    				} else {
    					if_block = null;
    				}
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
    			if (detaching) detach_dev(div);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(70:4) {#each options as opt}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let label;
    	let input;
    	let t0;
    	let i;
    	let h6;
    	let t1;
    	let h6_title_value;
    	let t2;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*options*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			i = element("i");
    			h6 = element("h6");
    			t1 = text(/*selector*/ ctx[1]);
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$1, 65, 12, 1406);
    			attr_dev(i, "class", "form-icon");
    			add_location(i, file$1, 66, 12, 1473);
    			attr_dev(h6, "title", h6_title_value = /*config*/ ctx[0].hint);
    			add_location(h6, file$1, 66, 37, 1498);
    			attr_dev(label, "class", "form-switch");
    			add_location(label, file$1, 64, 8, 1365);
    			attr_dev(div0, "class", "form-group");
    			add_location(div0, file$1, 63, 4, 1331);
    			attr_dev(div1, "class", "form");
    			add_location(div1, file$1, 62, 0, 1307);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, label);
    			append_dev(label, input);
    			input.checked = /*config*/ ctx[0].enabled;
    			append_dev(label, t0);
    			append_dev(label, i);
    			append_dev(label, h6);
    			append_dev(h6, t1);
    			append_dev(div1, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*config*/ 1) {
    				input.checked = /*config*/ ctx[0].enabled;
    			}

    			if (!current || dirty & /*selector*/ 2) set_data_dev(t1, /*selector*/ ctx[1]);

    			if (!current || dirty & /*config*/ 1 && h6_title_value !== (h6_title_value = /*config*/ ctx[0].hint)) {
    				attr_dev(h6, "title", h6_title_value);
    			}

    			if (dirty & /*options, config*/ 5) {
    				each_value = /*options*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
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
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
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

    	let options = [
    		{
    			label: "opacity",
    			styleProperty: "opacity",
    			type: "range",
    			min: 0,
    			max: 1,
    			step: 0.1
    		},
    		{
    			label: "fill",
    			styleProperty: "fill",
    			type: "palette"
    		},
    		{
    			label: "stroke",
    			styleProperty: "stroke",
    			type: "color"
    		},
    		{
    			label: "stroke width",
    			styleProperty: "stroke-width",
    			type: "range",
    			min: 0,
    			max: 4,
    			step: 0.1
    		}
    	];

    	const writable_props = ["config", "selector"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StylePicker> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("StylePicker", $$slots, []);

    	function input_change_handler() {
    		config.enabled = this.checked;
    		$$invalidate(0, config);
    	}

    	function input0_change_input_handler(opt) {
    		config.style[opt.styleProperty] = to_number(this.value);
    		$$invalidate(0, config);
    		($$invalidate(2, options), $$invalidate(0, config));
    	}

    	function input1_input_handler(opt) {
    		config.style[opt.styleProperty] = to_number(this.value);
    		$$invalidate(0, config);
    		($$invalidate(2, options), $$invalidate(0, config));
    	}

    	function input_input_handler(opt) {
    		config.style[opt.styleProperty] = this.value;
    		$$invalidate(0, config);
    		($$invalidate(2, options), $$invalidate(0, config));
    	}

    	const select_handler = (opt, e) => $$invalidate(0, config.style[opt.styleProperty] = e.detail.color, config);

    	function input_input_handler_1(opt) {
    		config.style[opt.styleProperty] = this.value;
    		$$invalidate(0, config);
    		($$invalidate(2, options), $$invalidate(0, config));
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
    		options
    	});

    	$$self.$inject_state = $$props => {
    		if ("config" in $$props) $$invalidate(0, config = $$props.config);
    		if ("selector" in $$props) $$invalidate(1, selector = $$props.selector);
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*config*/ 1) {
    			 {
    				requestAnimationFrame(() => {
    					onChanged({
    						id: config.id,
    						config,
    						style: config.style
    					});
    				});
    			}
    		}

    		if ($$self.$$.dirty & /*config*/ 1) {
    			 {
    				if (config.options) {
    					$$invalidate(2, options = config.options);
    				}
    			}
    		}
    	};

    	return [
    		config,
    		selector,
    		options,
    		input_change_handler,
    		input0_change_input_handler,
    		input1_input_handler,
    		input_input_handler,
    		select_handler,
    		input_input_handler_1
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

    /* src\StyleRenderer.svelte generated by Svelte v3.24.1 */

    const { console: console_1 } = globals;
    const file$2 = "src\\StyleRenderer.svelte";

    function create_fragment$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "styles");
    			add_location(div, file$2, 67, 0, 1786);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			/*div_binding*/ ctx[5](div);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[5](null);
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

    function renderStyle(style, selector, display) {
    	let res = `\n${selector} {`;

    	if (!display) {
    		res += `\nopacity: 0;`;
    	} else if (style.opacity != null) {
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

    	if (style.r != null) {
    		res += `\nr: ${style.r};`;
    	}

    	res += "\n}";
    	return res;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $changedEvent$;
    	let styleContainer;
    	let { classes } = $$props;
    	let { countries } = $$props;
    	const { changedEvent$ } = getContext("ctx");
    	validate_store(changedEvent$, "changedEvent$");
    	component_subscribe($$self, changedEvent$, value => $$invalidate(7, $changedEvent$ = value));
    	let mounted = false;

    	onMount(() => {
    		$$invalidate(6, mounted = true);

    		for (const key in classes) {
    			create(classes[key]);
    		}
    	});

    	function create(config) {
    		if (!config.styleElement) {
    			config.styleElement = document.createElement("style");
    			styleContainer.appendChild(config.styleElement);
    		}

    		config.styleElement.innerHTML = renderStyle(config.style, `.${config.id}`, config.enabled);
    	}

    	function renderAll(countries, classes) {
    		for (const key in countries) {
    			create(countries[key]);
    		}

    		for (const key in classes) {
    			create(classes[key]);
    		}
    	}

    	const writable_props = ["classes", "countries"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<StyleRenderer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("StyleRenderer", $$slots, []);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			styleContainer = $$value;
    			$$invalidate(0, styleContainer);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("classes" in $$props) $$invalidate(2, classes = $$props.classes);
    		if ("countries" in $$props) $$invalidate(3, countries = $$props.countries);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		onMount,
    		styleContainer,
    		classes,
    		countries,
    		changedEvent$,
    		renderStyle,
    		mounted,
    		create,
    		renderAll,
    		$changedEvent$
    	});

    	$$self.$inject_state = $$props => {
    		if ("styleContainer" in $$props) $$invalidate(0, styleContainer = $$props.styleContainer);
    		if ("classes" in $$props) $$invalidate(2, classes = $$props.classes);
    		if ("countries" in $$props) $$invalidate(3, countries = $$props.countries);
    		if ("mounted" in $$props) $$invalidate(6, mounted = $$props.mounted);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*mounted, $changedEvent$*/ 192) {
    			 {
    				if (mounted && $changedEvent$) {
    					console.log("Rendering...", $changedEvent$);
    					create($changedEvent$.config);
    				}
    			}
    		}
    	};

    	return [styleContainer, changedEvent$, classes, countries, renderAll, div_binding];
    }

    class StyleRenderer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { classes: 2, countries: 3, renderAll: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StyleRenderer",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*classes*/ ctx[2] === undefined && !("classes" in props)) {
    			console_1.warn("<StyleRenderer> was created without expected prop 'classes'");
    		}

    		if (/*countries*/ ctx[3] === undefined && !("countries" in props)) {
    			console_1.warn("<StyleRenderer> was created without expected prop 'countries'");
    		}
    	}

    	get classes() {
    		throw new Error("<StyleRenderer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<StyleRenderer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get countries() {
    		throw new Error("<StyleRenderer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set countries(value) {
    		throw new Error("<StyleRenderer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get renderAll() {
    		return this.$$.ctx[4];
    	}

    	set renderAll(value) {
    		throw new Error("<StyleRenderer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\PaletteSettings.svelte generated by Svelte v3.24.1 */

    const { console: console_1$1 } = globals;
    const file$3 = "src\\PaletteSettings.svelte";

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
    			a.textContent = "Color Palette Helper";
    			t1 = space();
    			div1 = element("div");
    			label = element("label");
    			label.textContent = "enter JSON palette";
    			t3 = space();
    			div0 = element("div");
    			textarea = element("textarea");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "href", "https://gka.github.io/palettes/");
    			add_location(a, file$3, 23, 4, 473);
    			attr_dev(label, "class", "form-label label-sm");
    			add_location(label, file$3, 26, 8, 601);
    			set_style(textarea, "height", "200px");
    			attr_dev(textarea, "class", "form-input input-sm");
    			attr_dev(textarea, "type", "text");
    			textarea.value = /*paletteStr*/ ctx[0];
    			add_location(textarea, file$3, 28, 12, 709);
    			attr_dev(div0, "class", "form-pair");
    			add_location(div0, file$3, 27, 8, 672);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$3, 25, 4, 567);
    			add_location(div2, file$3, 22, 0, 462);
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
    	const { palette$ } = getContext("ctx");
    	validate_store(palette$, "palette$");
    	component_subscribe($$self, palette$, value => $$invalidate(3, $palette$ = value));
    	let paletteStr;

    	function paletteChange(e) {
    		let str = e.target.value;

    		try {
    			const value = JSON.parse(str.replace(/'/g, "\""));
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
    		palette$,
    		paletteStr,
    		paletteChange,
    		$palette$
    	});

    	$$self.$inject_state = $$props => {
    		if ("paletteStr" in $$props) $$invalidate(0, paletteStr = $$props.paletteStr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$palette$*/ 8) {
    			 $$invalidate(0, paletteStr = JSON.stringify($palette$));
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

    /* src\ImageSettings.svelte generated by Svelte v3.24.1 */

    const { console: console_1$2 } = globals;
    const file$4 = "src\\ImageSettings.svelte";

    // (80:4) {#if imageConfig}
    function create_if_block_1$1(ctx) {
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
    			if (img.src !== (img_src_value = /*imageConfig*/ ctx[0].href)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "image preview");
    			attr_dev(img, "class", "svelte-1xvtmpf");
    			add_location(img, file$4, 81, 12, 1942);
    			attr_dev(div0, "class", "img-container svelte-1xvtmpf");
    			add_location(div0, file$4, 80, 8, 1901);
    			attr_dev(label0, "class", "form-label label-sm");
    			add_location(label0, file$4, 84, 12, 2056);
    			attr_dev(input0, "class", "form-input input-sm");
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "min", "0");
    			attr_dev(input0, "max", "4");
    			attr_dev(input0, "step", "0.1");
    			add_location(input0, file$4, 86, 16, 2159);
    			attr_dev(input1, "class", "form-input input-sm");
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "max", "4");
    			attr_dev(input1, "step", "0.1");
    			add_location(input1, file$4, 87, 16, 2283);
    			attr_dev(div1, "class", "form-pair svelte-1xvtmpf");
    			add_location(div1, file$4, 85, 12, 2118);
    			attr_dev(div2, "class", "form-group");
    			add_location(div2, file$4, 83, 8, 2018);
    			attr_dev(input2, "type", "checkbox");
    			add_location(input2, file$4, 92, 16, 2530);
    			attr_dev(i, "class", "form-icon");
    			add_location(i, file$4, 93, 16, 2659);
    			attr_dev(label1, "class", "form-checkbox label-sm");
    			add_location(label1, file$4, 91, 12, 2474);
    			attr_dev(div3, "class", "form-group");
    			add_location(div3, file$4, 90, 8, 2436);
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
    			set_input_value(input0, /*imageConfig*/ ctx[0].scale);
    			append_dev(div1, t3);
    			append_dev(div1, input1);
    			set_input_value(input1, /*imageConfig*/ ctx[0].scale);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, label1);
    			append_dev(label1, input2);
    			input2.checked = /*imageConfig*/ ctx[0].keepRatio;
    			append_dev(label1, t5);
    			append_dev(label1, i);
    			append_dev(label1, t6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_input_handler*/ ctx[5]),
    					listen_dev(input0, "input", /*input0_change_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[7]),
    					listen_dev(input2, "change", /*change_handler*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*imageConfig*/ 1 && img.src !== (img_src_value = /*imageConfig*/ ctx[0].href)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*imageConfig*/ 1) {
    				set_input_value(input0, /*imageConfig*/ ctx[0].scale);
    			}

    			if (dirty & /*imageConfig*/ 1 && to_number(input1.value) !== /*imageConfig*/ ctx[0].scale) {
    				set_input_value(input1, /*imageConfig*/ ctx[0].scale);
    			}

    			if (dirty & /*imageConfig*/ 1) {
    				input2.checked = /*imageConfig*/ ctx[0].keepRatio;
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(80:4) {#if imageConfig}",
    		ctx
    	});

    	return block;
    }

    // (106:8) {#if imageConfig}
    function create_if_block$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Remove";
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$4, 106, 8, 3115);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(106:8) {#if imageConfig}",
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
    	let if_block0 = /*imageConfig*/ ctx[0] && create_if_block_1$1(ctx);
    	let if_block1 = /*imageConfig*/ ctx[0] && create_if_block$1(ctx);

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
    			add_location(label, file$4, 98, 8, 2784);
    			attr_dev(input, "class", "form-input input-sm");
    			attr_dev(input, "type", "text");
    			add_location(input, file$4, 100, 12, 2883);
    			attr_dev(div0, "class", "form-pair svelte-1xvtmpf");
    			add_location(div0, file$4, 99, 8, 2846);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$4, 97, 4, 2750);
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$4, 104, 8, 3015);
    			attr_dev(div2, "class", "btns-apart svelte-1xvtmpf");
    			add_location(div2, file$4, 103, 4, 2981);
    			attr_dev(div3, "class", "form");
    			add_location(div3, file$4, 78, 0, 1850);
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
    					listen_dev(input, "input", /*input_input_handler*/ ctx[9]),
    					listen_dev(button, "click", /*apply*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*imageConfig*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
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

    			if (/*imageConfig*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
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
    	let { imageConfig } = $$props;
    	let url;
    	const dispatch = createEventDispatcher();
    	const { onChanged } = getContext("ctx");

    	function apply() {
    		if (url) {
    			dispatch("apply", { imageConfig, url });
    			$$invalidate(1, url = "");
    		} else {
    			console.error("No url entered");
    		}
    	}

    	function remove() {
    		if (imageConfig) {
    			dispatch("remove", { imageConfig });
    		}
    	}

    	function changeScale(scale) {
    		const image = imageConfig.imageElement;
    		const width = imageConfig.originalWidth * scale;
    		const height = imageConfig.originalHeight * scale;
    		const x = imageConfig.originX - width / 2;
    		const y = imageConfig.originY - height / 2;
    		image.setAttribute("x", x);
    		image.setAttribute("y", y);
    		image.setAttribute("width", width);
    		image.setAttribute("height", height);
    	}

    	function changeKeepRatio(keepRatio) {
    		const image = imageConfig.imageElement;

    		if (keepRatio) {
    			image.setAttribute("preserveAspectRatio", "xMidYMid meet");
    		} else {
    			image.setAttribute("preserveAspectRatio", "none");
    			$$invalidate(0, imageConfig.scale = 1, imageConfig);
    		}
    	}

    	const writable_props = ["imageConfig"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<ImageSettings> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ImageSettings", $$slots, []);

    	function input0_change_input_handler() {
    		imageConfig.scale = to_number(this.value);
    		$$invalidate(0, imageConfig);
    	}

    	function input1_input_handler() {
    		imageConfig.scale = to_number(this.value);
    		$$invalidate(0, imageConfig);
    	}

    	function input2_change_handler() {
    		imageConfig.keepRatio = this.checked;
    		$$invalidate(0, imageConfig);
    	}

    	const change_handler = e => changeKeepRatio(e.target.checked);

    	function input_input_handler() {
    		url = this.value;
    		$$invalidate(1, url);
    	}

    	$$self.$$set = $$props => {
    		if ("imageConfig" in $$props) $$invalidate(0, imageConfig = $$props.imageConfig);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		getContext,
    		imageConfig,
    		url,
    		dispatch,
    		onChanged,
    		apply,
    		remove,
    		changeScale,
    		changeKeepRatio
    	});

    	$$self.$inject_state = $$props => {
    		if ("imageConfig" in $$props) $$invalidate(0, imageConfig = $$props.imageConfig);
    		if ("url" in $$props) $$invalidate(1, url = $$props.url);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*imageConfig*/ 1) {
    			 {
    				if (imageConfig) {
    					changeKeepRatio(imageConfig.keepRatio);
    					changeScale(imageConfig.scale);
    				}
    			}
    		}
    	};

    	return [
    		imageConfig,
    		url,
    		apply,
    		remove,
    		changeKeepRatio,
    		input0_change_input_handler,
    		input1_input_handler,
    		input2_change_handler,
    		change_handler,
    		input_input_handler
    	];
    }

    class ImageSettings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { imageConfig: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageSettings",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*imageConfig*/ ctx[0] === undefined && !("imageConfig" in props)) {
    			console_1$2.warn("<ImageSettings> was created without expected prop 'imageConfig'");
    		}
    	}

    	get imageConfig() {
    		throw new Error("<ImageSettings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imageConfig(value) {
    		throw new Error("<ImageSettings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\PositionSettings.svelte generated by Svelte v3.24.1 */
    const file$5 = "src\\PositionSettings.svelte";

    function create_fragment$5(ctx) {
    	let div18;
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
    	let t15;
    	let div16;
    	let t16;
    	let div17;
    	let label5;
    	let input5;
    	let t17;
    	let i;
    	let t18;
    	let t19;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div18 = element("div");
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
    			t15 = space();
    			div16 = element("div");
    			t16 = space();
    			div17 = element("div");
    			label5 = element("label");
    			input5 = element("input");
    			t17 = space();
    			i = element("i");
    			t18 = text("auto-save");
    			t19 = space();
    			button = element("button");
    			button.textContent = "reset";
    			attr_dev(label0, "class", "form-label label-sm");
    			add_location(label0, file$5, 17, 37, 370);
    			attr_dev(div0, "class", "col-3 col-sm-12");
    			add_location(div0, file$5, 17, 8, 341);
    			attr_dev(input0, "class", "form-input input-sm");
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "step", "any");
    			add_location(input0, file$5, 18, 37, 463);
    			attr_dev(div1, "class", "col-9 col-sm-12");
    			add_location(div1, file$5, 18, 8, 434);
    			attr_dev(div2, "class", "form-group");
    			add_location(div2, file$5, 16, 4, 307);
    			attr_dev(label1, "class", "form-label label-sm");
    			add_location(label1, file$5, 21, 37, 629);
    			attr_dev(div3, "class", "col-3 col-sm-12");
    			add_location(div3, file$5, 21, 8, 600);
    			attr_dev(input1, "class", "form-input input-sm");
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "step", "any");
    			add_location(input1, file$5, 22, 37, 718);
    			attr_dev(div4, "class", "col-9 col-sm-12");
    			add_location(div4, file$5, 22, 8, 689);
    			attr_dev(div5, "class", "form-group");
    			add_location(div5, file$5, 20, 4, 566);
    			attr_dev(label2, "class", "form-label label-sm");
    			add_location(label2, file$5, 25, 37, 880);
    			attr_dev(div6, "class", "col-3 col-sm-12");
    			add_location(div6, file$5, 25, 8, 851);
    			attr_dev(input2, "class", "form-input input-sm");
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "step", "any");
    			add_location(input2, file$5, 26, 37, 969);
    			attr_dev(div7, "class", "col-9 col-sm-12");
    			add_location(div7, file$5, 26, 8, 940);
    			attr_dev(div8, "class", "form-group");
    			add_location(div8, file$5, 24, 4, 817);
    			attr_dev(div9, "class", "divider");
    			add_location(div9, file$5, 29, 4, 1070);
    			attr_dev(label3, "class", "form-label label-sm");
    			add_location(label3, file$5, 32, 37, 1168);
    			attr_dev(div10, "class", "col-3 col-sm-12");
    			add_location(div10, file$5, 32, 8, 1139);
    			attr_dev(input3, "class", "form-input input-sm");
    			attr_dev(input3, "type", "number");
    			add_location(input3, file$5, 33, 37, 1266);
    			attr_dev(div11, "class", "col-9 col-sm-12");
    			add_location(div11, file$5, 33, 8, 1237);
    			attr_dev(div12, "class", "form-group");
    			add_location(div12, file$5, 31, 4, 1105);
    			attr_dev(label4, "class", "form-label label-sm");
    			add_location(label4, file$5, 36, 37, 1421);
    			attr_dev(div13, "class", "col-3 col-sm-12");
    			add_location(div13, file$5, 36, 8, 1392);
    			attr_dev(input4, "class", "form-input input-sm");
    			attr_dev(input4, "type", "number");
    			add_location(input4, file$5, 37, 37, 1520);
    			attr_dev(div14, "class", "col-9 col-sm-12");
    			add_location(div14, file$5, 37, 8, 1491);
    			attr_dev(div15, "class", "form-group");
    			add_location(div15, file$5, 35, 4, 1358);
    			attr_dev(div16, "class", "divider");
    			add_location(div16, file$5, 40, 4, 1615);
    			attr_dev(input5, "type", "checkbox");
    			add_location(input5, file$5, 44, 12, 1725);
    			attr_dev(i, "class", "form-icon");
    			add_location(i, file$5, 45, 12, 1786);
    			attr_dev(label5, "class", "form-switch");
    			add_location(label5, file$5, 43, 8, 1684);
    			attr_dev(div17, "class", "form-group");
    			add_location(div17, file$5, 42, 4, 1650);
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$5, 49, 4, 1858);
    			attr_dev(div18, "class", "form-horizontal");
    			add_location(div18, file$5, 15, 0, 272);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div18, anchor);
    			append_dev(div18, div2);
    			append_dev(div2, div0);
    			append_dev(div0, label0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*scale*/ ctx[0]);
    			append_dev(div18, t2);
    			append_dev(div18, div5);
    			append_dev(div5, div3);
    			append_dev(div3, label1);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, input1);
    			set_input_value(input1, /*x*/ ctx[1]);
    			append_dev(div18, t5);
    			append_dev(div18, div8);
    			append_dev(div8, div6);
    			append_dev(div6, label2);
    			append_dev(div8, t7);
    			append_dev(div8, div7);
    			append_dev(div7, input2);
    			set_input_value(input2, /*y*/ ctx[2]);
    			append_dev(div18, t8);
    			append_dev(div18, div9);
    			append_dev(div18, t9);
    			append_dev(div18, div12);
    			append_dev(div12, div10);
    			append_dev(div10, label3);
    			append_dev(div12, t11);
    			append_dev(div12, div11);
    			append_dev(div11, input3);
    			set_input_value(input3, /*width*/ ctx[3]);
    			append_dev(div18, t12);
    			append_dev(div18, div15);
    			append_dev(div15, div13);
    			append_dev(div13, label4);
    			append_dev(div15, t14);
    			append_dev(div15, div14);
    			append_dev(div14, input4);
    			set_input_value(input4, /*height*/ ctx[4]);
    			append_dev(div18, t15);
    			append_dev(div18, div16);
    			append_dev(div18, t16);
    			append_dev(div18, div17);
    			append_dev(div17, label5);
    			append_dev(label5, input5);
    			input5.checked = /*autosave*/ ctx[5];
    			append_dev(label5, t17);
    			append_dev(label5, i);
    			append_dev(label5, t18);
    			append_dev(div18, t19);
    			append_dev(div18, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[8]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[9]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[10]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[11]),
    					listen_dev(input5, "change", /*input5_change_handler*/ ctx[12]),
    					listen_dev(button, "click", /*click_handler*/ ctx[13], false, false, false)
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

    			if (dirty & /*autosave*/ 32) {
    				input5.checked = /*autosave*/ ctx[5];
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div18);
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
    	let { autosave = true } = $$props;
    	const dispatch = createEventDispatcher();
    	const writable_props = ["scale", "x", "y", "width", "height", "autosave"];

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

    	function input5_change_handler() {
    		autosave = this.checked;
    		$$invalidate(5, autosave);
    	}

    	const click_handler = () => dispatch("reset");

    	$$self.$$set = $$props => {
    		if ("scale" in $$props) $$invalidate(0, scale = $$props.scale);
    		if ("x" in $$props) $$invalidate(1, x = $$props.x);
    		if ("y" in $$props) $$invalidate(2, y = $$props.y);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    		if ("height" in $$props) $$invalidate(4, height = $$props.height);
    		if ("autosave" in $$props) $$invalidate(5, autosave = $$props.autosave);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		scale,
    		x,
    		y,
    		width,
    		height,
    		autosave,
    		dispatch
    	});

    	$$self.$inject_state = $$props => {
    		if ("scale" in $$props) $$invalidate(0, scale = $$props.scale);
    		if ("x" in $$props) $$invalidate(1, x = $$props.x);
    		if ("y" in $$props) $$invalidate(2, y = $$props.y);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    		if ("height" in $$props) $$invalidate(4, height = $$props.height);
    		if ("autosave" in $$props) $$invalidate(5, autosave = $$props.autosave);
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
    		autosave,
    		dispatch,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_change_handler,
    		click_handler
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
    			height: 4,
    			autosave: 5
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

    	get autosave() {
    		throw new Error("<PositionSettings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autosave(value) {
    		throw new Error("<PositionSettings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Tabs.svelte generated by Svelte v3.24.1 */
    const file$6 = "src\\Tabs.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (46:4) {#if !hideHeader}
    function create_if_block$2(ctx) {
    	let ul;
    	let each_value = /*tabs*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "tab tab-block");
    			add_location(ul, file$6, 46, 4, 988);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$selectedTab$, tabs*/ 6) {
    				each_value = /*tabs*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(46:4) {#if !hideHeader}",
    		ctx
    	});

    	return block;
    }

    // (48:8) {#each tabs as tab}
    function create_each_block$2(ctx) {
    	let li;
    	let a;
    	let t0_value = /*tab*/ ctx[9].label + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[7](/*tab*/ ctx[9], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "href", "javascript:void(0)");
    			add_location(a, file$6, 49, 16, 1133);
    			attr_dev(li, "class", "tab-item");
    			toggle_class(li, "active", /*$selectedTab$*/ ctx[1] === /*tab*/ ctx[9]);
    			add_location(li, file$6, 48, 12, 1057);
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

    			if (dirty & /*$selectedTab$, tabs*/ 6) {
    				toggle_class(li, "active", /*$selectedTab$*/ ctx[1] === /*tab*/ ctx[9]);
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
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(48:8) {#each tabs as tab}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let t;
    	let current;
    	let if_block = !/*hideHeader*/ ctx[0] && create_if_block$2(ctx);
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "tabs");
    			add_location(div, file$6, 43, 0, 914);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*hideHeader*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
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
    			if (if_block) if_block.d();
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
    	let { activeTab } = $$props;
    	let { hideHeader = false } = $$props;
    	const tabs = [];
    	const selectedTab$ = writable(null);
    	validate_store(selectedTab$, "selectedTab$");
    	component_subscribe($$self, selectedTab$, value => $$invalidate(1, $selectedTab$ = value));

    	function select(tab) {
    		set_store_value(selectedTab$, $selectedTab$ = tab);
    	}

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
    		select,
    		selectedTab$
    	});

    	const writable_props = ["activeTab", "hideHeader"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tabs> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Tabs", $$slots, ['default']);
    	const click_handler = tab => set_store_value(selectedTab$, $selectedTab$ = tab);

    	$$self.$$set = $$props => {
    		if ("activeTab" in $$props) $$invalidate(4, activeTab = $$props.activeTab);
    		if ("hideHeader" in $$props) $$invalidate(0, hideHeader = $$props.hideHeader);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		TABS,
    		onDestroy,
    		setContext,
    		writable,
    		activeTab,
    		hideHeader,
    		tabs,
    		selectedTab$,
    		select,
    		$selectedTab$
    	});

    	$$self.$inject_state = $$props => {
    		if ("activeTab" in $$props) $$invalidate(4, activeTab = $$props.activeTab);
    		if ("hideHeader" in $$props) $$invalidate(0, hideHeader = $$props.hideHeader);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*activeTab*/ 16) {
    			 {
    				if (tabs && activeTab) {
    					const tab = tabs.find(tab => tab.label == activeTab);
    					select(tab);
    				}
    			}
    		}
    	};

    	return [
    		hideHeader,
    		$selectedTab$,
    		tabs,
    		selectedTab$,
    		activeTab,
    		$$scope,
    		$$slots,
    		click_handler
    	];
    }

    class Tabs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { activeTab: 4, hideHeader: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tabs",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*activeTab*/ ctx[4] === undefined && !("activeTab" in props)) {
    			console.warn("<Tabs> was created without expected prop 'activeTab'");
    		}
    	}

    	get activeTab() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeTab(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideHeader() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideHeader(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Tab.svelte generated by Svelte v3.24.1 */

    // (18:0) {#if $selectedTab$ === tab}
    function create_if_block$3(ctx) {
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(18:0) {#if $selectedTab$ === tab}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$selectedTab$*/ ctx[1] === /*tab*/ ctx[0] && create_if_block$3(ctx);

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
    					if_block = create_if_block$3(ctx);
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
        enabled: false,
        style: {
            opacity: 1,
            fill: '#e0e0e0',
            stroke: '#000000',
            'stroke-width': 0.5,
            r: 6.5
        },
        options: [
            {
                label: 'opacity',
                styleProperty: 'opacity',
                type: 'range',
                min: 0,
                max: 1,
                step: 0.1
            },
            {
                label: 'fill',
                styleProperty: 'fill',
                type: 'palette'
            },
            {
                label: 'stroke',
                styleProperty: 'stroke',
                type: 'color'
            },
            {
                label: 'stroke width',
                styleProperty: 'stroke-width',
                type: 'range',
                min: 0,
                max: 4,
                step: 0.1
            },
            {
                label: 'radius',
                styleProperty: 'r',
                type: 'range',
                min: 0,
                max: 10,
                step: 0.1
            }
        ]
    };

    // /*
    // * Smaller circles around French DOMs and Chinese SARs
    // *
    // * Change opacity to 1 to display all subnational circles.
    // *
    // */
    // classes.subxx = {
    //     id: 'subxx',
    //     hint: 'Smaller circles around French DOMs and Chinese SARs',
    //     enabled: true,
    //     style: {
    //         opacity: 0,
    //         'stroke-width': 0.3,
    //     }
    // }


    // /*
    // * Circles around small countries, but with no permanent residents 
    // *
    // * Change opacity to 1 to display all circles.
    // *
    // */
    // classes.noxx = {
    //     id: 'noxx',
    //     hint: 'Circles around small countries, but with no permanent residents',
    //     enabled: true,
    //     style: {
    //         opacity: 0,
    //         fill: '#e0e0e0',
    //         stroke: '#000000',
    //         'stroke-width': 0.5,
    //     }
    // }

    /*
    * land
    */
    classes.landxx = {
        id: 'landxx, .coastxx',
        hint: 'Land',
        enabled: true,
        style: {
            opacity: 1,
            fill: '#e0e0e0',
            stroke: '#ffffff',
            'stroke-width': 0.5,
        }
    };


    // /*
    // * Styles for coastlines of islands with no borders
    // */
    // classes.coastxx = {
    //     id: 'coastxx',
    //     hint: 'Styles for coastlines of islands with no borders',
    //     enabled: true,
    //     style: {
    //         fill: '#e0e0e0',
    //         stroke: '#ffffff',
    //         'stroke-width': 0.3,
    //     }
    // }


    // /*
    // * Styles for territories with limited or no recognition
    // */
    // classes.limitxx = {
    //     id: 'limitxx',
    //     hint: 'Styles for territories with limited or no recognition',
    //     enabled: true,
    //     style: {
    //         fill: '#e0e0e0',
    //         stroke: '#ffffff',
    //         'stroke-width': 0,
    //     }
    // }

    // /*
    // * Circles around small territories with limited or no recognition
    // *
    // * Change opacity to 1 to display all circles.
    // *
    // */
    // classes.unxx = {
    //     id: 'unxx',
    //     hint: 'Circles around small territories with limited or no recognition',
    //     enabled: true,
    //     style: {
    //         opacity: 0,
    //         fill: '#e0e0e0',
    //         stroke: '#000000',
    //         'stroke-width': 0.3,
    //     }
    // }


    // /*
    // * Styles for territories without permanent population.
    // */
    // classes.antxx = {
    //     id: 'antxx',
    //     hint: 'Styles for territories without permanent population.',
    //     enabled: true,
    //     style: {
    //         fill: '#e0e0e0',
    //         stroke: '#ffffff',
    //         'stroke-width': 0,
    //     }
    // }

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

    function toCountry(countrySvg) {
        const titleElement = countrySvg.querySelector('title');
        countrySvg.dataset.country = countrySvg.id;
        return {
            id: countrySvg.id,
            element: countrySvg,
            enabled: true,
            title: titleElement ? titleElement.textContent : countrySvg.id,
            hint: titleElement ? titleElement.textContent : countrySvg.id,
            // never have any styles actually
            style: {
                fill: countrySvg.style.fill,
                fillOpacity: countrySvg.style.fillOpacity,
                stroke: countrySvg.style.stroke,
                strokeWidth: countrySvg.style.strokeWidth
            },
            image: null,
        };
    }

    function getCountriesFromSvg(rootSvg, countries = {}) {
        for (const child of rootSvg.children) {
            if (child.tagName === 'title' || child.id === 'ocean') continue;
            countries[child.id] = toCountry(child);
        }
        
        // limited recognition
        const limitxx = rootSvg.querySelectorAll('.limitxx');
        for (const child of limitxx) {
            countries[child.id] = toCountry(child);
        }
    }

    const xmlns = 'http://www.w3.org/2000/svg';

    function clip(clipId, pathElement, href, imageConfig, mapContent) {
        imageConfig = imageConfig || {};

        const rect = pathElement.getBBox();
        
        let clipPath;
        if(!imageConfig.clipPathElement) {
            clipPath = cloneToPath(pathElement);
            clipPath.id = clipId;
            mapContent.appendChild(clipPath);
        } else {
            clipPath = imageConfig.clipPathElement;
        }
        
        let image;
        if(!imageConfig.imageElement) {
            image = document.createElementNS(xmlns, 'image');
            mapContent.appendChild(image);
            // pathElement.insertAdjacentElement('beforebegin', image);
        } else {
            image = imageConfig.imageElement;
        }

        image.setAttribute('clip-path', `url(#${clipId})`);
        image.setAttribute('href', href);
        image.setAttribute('height', rect.height);
        image.setAttribute('width', rect.width);
        image.setAttribute('x', rect.x);
        image.setAttribute('y', rect.y);
        image.setAttribute('preserveAspectRatio', 'none');

        return {
            href,
            scale: 1,
            keepRatio: false,
            originX: rect.x + rect.width / 2,
            originY: rect.y + rect.height / 2,
            originalWidth: rect.width,
            originalHeight: rect.height,
            imageElement: image,
            clipPathElement: clipPath,
        };
    }

    function removeImageFromSvg(imageConfig) {
        if(imageConfig.imageElement) {
            imageConfig.imageElement.remove();
        }
        if(imageConfig.clipPathElement) {
            imageConfig.clipPathElement.remove();
        }
    }

    function cloneToPath(element) {
        const clipPath = document.createElementNS(xmlns, 'clipPath');
        if(element.tagName === 'path') {
            clipPath.appendChild(element.cloneNode());
        } else {
            for(const node of element.querySelectorAll('path')) {
                clipPath.appendChild(node.cloneNode());
            }
        }
        return clipPath;
    }

    function delegated(fn) {
        return function (event) {
            let target = event.target.closest('[data-country]');
            if (target && target.dataset['country']) {
                fn(target, event);
            }
        };
    }


    async function loadSvg(url) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'image/svg+xml');
            const svg = doc.getElementsByTagName('svg')[0];
            return svg;
        } catch(err) {
            console.error('Failed to fetch page: ', err);
        }
    }

    function debounce(func, wait, immediate) {
    	var timeout;
    	return function() {
    		var ctx = this, args = arguments;
    		clearTimeout(timeout);
    		timeout = setTimeout(function() {
    			timeout = null;
    			if (!immediate) func.apply(ctx, args);
    		}, wait);
    		if (immediate && !timeout) func.apply(ctx, args);
    	};
    }

    /* src\App.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1, console: console_1$3, document: document_1 } = globals;
    const file$7 = "src\\App.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[48] = list[i];
    	return child_ctx;
    }

    // (384:20) {:else}
    function create_else_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Select a country");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(384:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (382:20) {#if selectedCountry}
    function create_if_block_1$2(ctx) {
    	let stylepicker;
    	let updating_config;
    	let current;

    	function stylepicker_config_binding(value) {
    		/*stylepicker_config_binding*/ ctx[23].call(null, value);
    	}

    	let stylepicker_props = {
    		selector: "." + /*selectedCountry*/ ctx[2].id
    	};

    	if (/*selectedCountry*/ ctx[2] !== void 0) {
    		stylepicker_props.config = /*selectedCountry*/ ctx[2];
    	}

    	stylepicker = new StylePicker({ props: stylepicker_props, $$inline: true });
    	binding_callbacks.push(() => bind(stylepicker, "config", stylepicker_config_binding));

    	const block = {
    		c: function create() {
    			create_component(stylepicker.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(stylepicker, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const stylepicker_changes = {};
    			if (dirty[0] & /*selectedCountry*/ 4) stylepicker_changes.selector = "." + /*selectedCountry*/ ctx[2].id;

    			if (!updating_config && dirty[0] & /*selectedCountry*/ 4) {
    				updating_config = true;
    				stylepicker_changes.config = /*selectedCountry*/ ctx[2];
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
    			destroy_component(stylepicker, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(382:20) {#if selectedCountry}",
    		ctx
    	});

    	return block;
    }

    // (380:12) <Tab label="Style">
    function create_default_slot_7(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block_1$2, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*selectedCountry*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "panel bg-light p-2 svelte-9c9bgx");
    			add_location(div, file$7, 380, 16, 11757);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
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
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(380:12) <Tab label=\\\"Style\\\">",
    		ctx
    	});

    	return block;
    }

    // (393:20) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Select a country");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(393:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (391:20) {#if selectedCountry}
    function create_if_block$4(ctx) {
    	let imagesettings;
    	let updating_imageConfig;
    	let current;

    	function imagesettings_imageConfig_binding(value) {
    		/*imagesettings_imageConfig_binding*/ ctx[24].call(null, value);
    	}

    	let imagesettings_props = {};

    	if (/*selectedCountry*/ ctx[2].image !== void 0) {
    		imagesettings_props.imageConfig = /*selectedCountry*/ ctx[2].image;
    	}

    	imagesettings = new ImageSettings({
    			props: imagesettings_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(imagesettings, "imageConfig", imagesettings_imageConfig_binding));
    	imagesettings.$on("apply", /*apply_handler*/ ctx[25]);
    	imagesettings.$on("remove", /*remove_handler*/ ctx[26]);

    	const block = {
    		c: function create() {
    			create_component(imagesettings.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(imagesettings, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const imagesettings_changes = {};

    			if (!updating_imageConfig && dirty[0] & /*selectedCountry*/ 4) {
    				updating_imageConfig = true;
    				imagesettings_changes.imageConfig = /*selectedCountry*/ ctx[2].image;
    				add_flush_callback(() => updating_imageConfig = false);
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
    			destroy_component(imagesettings, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(391:20) {#if selectedCountry}",
    		ctx
    	});

    	return block;
    }

    // (389:12) <Tab label="Image">
    function create_default_slot_6(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*selectedCountry*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "panel bg-light p-2 svelte-9c9bgx");
    			add_location(div, file$7, 389, 16, 12128);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
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
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(389:12) <Tab label=\\\"Image\\\">",
    		ctx
    	});

    	return block;
    }

    // (398:12) <Tab label="Shortcuts">
    function create_default_slot_5(ctx) {
    	let div;
    	let p;
    	let code;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			code = element("code");
    			code.textContent = "1-9";
    			t1 = text(" apply shades of current palette");
    			add_location(code, file$7, 399, 23, 12617);
    			add_location(p, file$7, 399, 20, 12614);
    			attr_dev(div, "class", "panel bg-light p-2 svelte-9c9bgx");
    			add_location(div, file$7, 398, 16, 12561);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, code);
    			append_dev(p, t1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(398:12) <Tab label=\\\"Shortcuts\\\">",
    		ctx
    	});

    	return block;
    }

    // (379:8) <Tabs activeTab={activeRightTab} hideHeader="true">
    function create_default_slot_4(ctx) {
    	let tab0;
    	let t0;
    	let tab1;
    	let t1;
    	let tab2;
    	let current;

    	tab0 = new Tab({
    			props: {
    				label: "Style",
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab1 = new Tab({
    			props: {
    				label: "Image",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab2 = new Tab({
    			props: {
    				label: "Shortcuts",
    				$$slots: { default: [create_default_slot_5] },
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

    			if (dirty[0] & /*selectedCountry*/ 4 | dirty[1] & /*$$scope*/ 1048576) {
    				tab0_changes.$$scope = { dirty, ctx };
    			}

    			tab0.$set(tab0_changes);
    			const tab1_changes = {};

    			if (dirty[0] & /*selectedCountry*/ 4 | dirty[1] & /*$$scope*/ 1048576) {
    				tab1_changes.$$scope = { dirty, ctx };
    			}

    			tab1.$set(tab1_changes);
    			const tab2_changes = {};

    			if (dirty[1] & /*$$scope*/ 1048576) {
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
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(379:8) <Tabs activeTab={activeRightTab} hideHeader=\\\"true\\\">",
    		ctx
    	});

    	return block;
    }

    // (410:16) {#each Object.keys(classes) as klass (klass)}
    function create_each_block$3(key_1, ctx) {
    	let div;
    	let stylepicker;
    	let t;
    	let current;

    	stylepicker = new StylePicker({
    			props: {
    				selector: "." + /*klass*/ ctx[48],
    				config: classes[/*klass*/ ctx[48]]
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			create_component(stylepicker.$$.fragment);
    			t = space();
    			attr_dev(div, "class", "panel bg-light p-2 mb-2 svelte-9c9bgx");
    			add_location(div, file$7, 410, 20, 12990);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(stylepicker, div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: noop,
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
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(410:16) {#each Object.keys(classes) as klass (klass)}",
    		ctx
    	});

    	return block;
    }

    // (409:12) <Tab label="Classes">
    function create_default_slot_3(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = Object.keys(classes);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*klass*/ ctx[48];
    	validate_each_keys(ctx, each_value, get_each_context$3, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$3(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$3(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, classes*/ 0) {
    				const each_value = Object.keys(classes);
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$3, each_1_anchor, get_each_context$3);
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
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(409:12) <Tab label=\\\"Classes\\\">",
    		ctx
    	});

    	return block;
    }

    // (416:12) <Tab label="Position">
    function create_default_slot_2(ctx) {
    	let div;
    	let positionsettings;
    	let updating_scale;
    	let updating_x;
    	let updating_y;
    	let updating_autosave;
    	let current;

    	function positionsettings_scale_binding(value) {
    		/*positionsettings_scale_binding*/ ctx[27].call(null, value);
    	}

    	function positionsettings_x_binding(value) {
    		/*positionsettings_x_binding*/ ctx[28].call(null, value);
    	}

    	function positionsettings_y_binding(value) {
    		/*positionsettings_y_binding*/ ctx[29].call(null, value);
    	}

    	function positionsettings_autosave_binding(value) {
    		/*positionsettings_autosave_binding*/ ctx[30].call(null, value);
    	}

    	let positionsettings_props = {};

    	if (/*position*/ ctx[5].scale !== void 0) {
    		positionsettings_props.scale = /*position*/ ctx[5].scale;
    	}

    	if (/*position*/ ctx[5].x !== void 0) {
    		positionsettings_props.x = /*position*/ ctx[5].x;
    	}

    	if (/*position*/ ctx[5].y !== void 0) {
    		positionsettings_props.y = /*position*/ ctx[5].y;
    	}

    	if (/*autosave*/ ctx[6] !== void 0) {
    		positionsettings_props.autosave = /*autosave*/ ctx[6];
    	}

    	positionsettings = new PositionSettings({
    			props: positionsettings_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(positionsettings, "scale", positionsettings_scale_binding));
    	binding_callbacks.push(() => bind(positionsettings, "x", positionsettings_x_binding));
    	binding_callbacks.push(() => bind(positionsettings, "y", positionsettings_y_binding));
    	binding_callbacks.push(() => bind(positionsettings, "autosave", positionsettings_autosave_binding));
    	positionsettings.$on("reset", /*resetState*/ ctx[10]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(positionsettings.$$.fragment);
    			attr_dev(div, "class", "panel bg-light p-2 svelte-9c9bgx");
    			add_location(div, file$7, 416, 16, 13245);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(positionsettings, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const positionsettings_changes = {};

    			if (!updating_scale && dirty[0] & /*position*/ 32) {
    				updating_scale = true;
    				positionsettings_changes.scale = /*position*/ ctx[5].scale;
    				add_flush_callback(() => updating_scale = false);
    			}

    			if (!updating_x && dirty[0] & /*position*/ 32) {
    				updating_x = true;
    				positionsettings_changes.x = /*position*/ ctx[5].x;
    				add_flush_callback(() => updating_x = false);
    			}

    			if (!updating_y && dirty[0] & /*position*/ 32) {
    				updating_y = true;
    				positionsettings_changes.y = /*position*/ ctx[5].y;
    				add_flush_callback(() => updating_y = false);
    			}

    			if (!updating_autosave && dirty[0] & /*autosave*/ 64) {
    				updating_autosave = true;
    				positionsettings_changes.autosave = /*autosave*/ ctx[6];
    				add_flush_callback(() => updating_autosave = false);
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
    		source: "(416:12) <Tab label=\\\"Position\\\">",
    		ctx
    	});

    	return block;
    }

    // (421:12) <Tab label="Palette">
    function create_default_slot_1(ctx) {
    	let div;
    	let palettesettings;
    	let current;
    	palettesettings = new PaletteSettings({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(palettesettings.$$.fragment);
    			attr_dev(div, "class", "panel bg-light p-2 svelte-9c9bgx");
    			add_location(div, file$7, 421, 16, 13543);
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
    		source: "(421:12) <Tab label=\\\"Palette\\\">",
    		ctx
    	});

    	return block;
    }

    // (408:8) <Tabs activeTab={activeLeftTab} hideHeader="true">
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

    			if (dirty[1] & /*$$scope*/ 1048576) {
    				tab0_changes.$$scope = { dirty, ctx };
    			}

    			tab0.$set(tab0_changes);
    			const tab1_changes = {};

    			if (dirty[0] & /*position, autosave*/ 96 | dirty[1] & /*$$scope*/ 1048576) {
    				tab1_changes.$$scope = { dirty, ctx };
    			}

    			tab1.$set(tab1_changes);
    			const tab2_changes = {};

    			if (dirty[1] & /*$$scope*/ 1048576) {
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
    		source: "(408:8) <Tabs activeTab={activeLeftTab} hideHeader=\\\"true\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let t0;
    	let div7;
    	let header;
    	let section0;
    	let a0;
    	let t2;
    	let section1;
    	let button0;
    	let i0;
    	let t4;
    	let button1;
    	let i1;
    	let t6;
    	let button2;
    	let i2;
    	let t8;
    	let div2;
    	let div0;
    	let button3;
    	let i3;
    	let t10;
    	let button4;
    	let i4;
    	let t12;
    	let button5;
    	let i5;
    	let t14;
    	let div1;
    	let a1;
    	let i6;
    	let t16;
    	let div4;
    	let div3;
    	let t17;
    	let div5;
    	let tabs0;
    	let t18;
    	let div6;
    	let tabs1;
    	let t19;
    	let stylerenderer;
    	let current;
    	let mounted;
    	let dispose;

    	tabs0 = new Tabs({
    			props: {
    				activeTab: /*activeRightTab*/ ctx[4],
    				hideHeader: "true",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tabs1 = new Tabs({
    			props: {
    				activeTab: /*activeLeftTab*/ ctx[3],
    				hideHeader: "true",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let stylerenderer_props = { classes, countries: /*countries*/ ctx[7] };

    	stylerenderer = new StyleRenderer({
    			props: stylerenderer_props,
    			$$inline: true
    		});

    	/*stylerenderer_binding*/ ctx[31](stylerenderer);

    	const block = {
    		c: function create() {
    			t0 = space();
    			div7 = element("div");
    			header = element("header");
    			section0 = element("section");
    			a0 = element("a");
    			a0.textContent = "Beautiful-maps";
    			t2 = space();
    			section1 = element("section");
    			button0 = element("button");
    			i0 = element("i");
    			i0.textContent = "brush";
    			t4 = space();
    			button1 = element("button");
    			i1 = element("i");
    			i1.textContent = "add_photo_alternate";
    			t6 = space();
    			button2 = element("button");
    			i2 = element("i");
    			i2.textContent = "keyboard";
    			t8 = space();
    			div2 = element("div");
    			div0 = element("div");
    			button3 = element("button");
    			i3 = element("i");
    			i3.textContent = "style";
    			t10 = space();
    			button4 = element("button");
    			i4 = element("i");
    			i4.textContent = "settings_overscan";
    			t12 = space();
    			button5 = element("button");
    			i5 = element("i");
    			i5.textContent = "gradient";
    			t14 = space();
    			div1 = element("div");
    			a1 = element("a");
    			i6 = element("i");
    			i6.textContent = "help_center";
    			t16 = space();
    			div4 = element("div");
    			div3 = element("div");
    			t17 = space();
    			div5 = element("div");
    			create_component(tabs0.$$.fragment);
    			t18 = space();
    			div6 = element("div");
    			create_component(tabs1.$$.fragment);
    			t19 = space();
    			create_component(stylerenderer.$$.fragment);
    			attr_dev(a0, "href", "https://github.com/ANovokmet/Beautiful-maps");
    			attr_dev(a0, "class", "navbar-brand mr-2 text-bold text-light");
    			add_location(a0, file$7, 338, 12, 9268);
    			attr_dev(section0, "class", "navbar-section");
    			add_location(section0, file$7, 337, 8, 9223);
    			attr_dev(i0, "class", "material-icons");
    			add_location(i0, file$7, 342, 16, 9651);
    			attr_dev(button0, "class", "btn btn-action btn-sm ml-1 tooltip tooltip-bottom");
    			attr_dev(button0, "data-tooltip", "Style");
    			toggle_class(button0, "active", /*activeRightTab*/ ctx[4] == "Style");
    			add_location(button0, file$7, 341, 12, 9460);
    			attr_dev(i1, "class", "material-icons");
    			add_location(i1, file$7, 345, 16, 9912);
    			attr_dev(button1, "class", "btn btn-action btn-sm ml-1 tooltip tooltip-bottom");
    			attr_dev(button1, "data-tooltip", "Image");
    			toggle_class(button1, "active", /*activeRightTab*/ ctx[4] == "Image");
    			add_location(button1, file$7, 344, 12, 9721);
    			attr_dev(i2, "class", "material-icons");
    			add_location(i2, file$7, 348, 16, 10169);
    			attr_dev(button2, "class", "btn btn-action btn-sm ml-1");
    			attr_dev(button2, "title", "Shortcuts");
    			toggle_class(button2, "active", /*activeRightTab*/ ctx[4] == "Shortcuts");
    			add_location(button2, file$7, 347, 12, 9996);
    			attr_dev(section1, "class", "navbar-section");
    			add_location(section1, file$7, 340, 8, 9415);
    			attr_dev(header, "class", "header navbar bg-primary svelte-9c9bgx");
    			add_location(header, file$7, 336, 4, 9173);
    			attr_dev(i3, "class", "material-icons");
    			add_location(i3, file$7, 356, 16, 10544);
    			attr_dev(button3, "class", "btn btn-action btn-primary btn-sm mb-1 tooltip tooltip-right");
    			attr_dev(button3, "data-tooltip", "Classes");
    			toggle_class(button3, "active", /*activeLeftTab*/ ctx[3] == "Classes");
    			add_location(button3, file$7, 355, 12, 10337);
    			attr_dev(i4, "class", "material-icons");
    			add_location(i4, file$7, 359, 16, 10824);
    			attr_dev(button4, "class", "btn btn-action btn-primary btn-sm mb-1 tooltip tooltip-right");
    			attr_dev(button4, "data-tooltip", "Position");
    			toggle_class(button4, "active", /*activeLeftTab*/ ctx[3] == "Position");
    			add_location(button4, file$7, 358, 12, 10614);
    			attr_dev(i5, "class", "material-icons");
    			add_location(i5, file$7, 362, 16, 11109);
    			attr_dev(button5, "class", "btn btn-action btn-primary btn-sm  tooltip tooltip-right");
    			attr_dev(button5, "data-tooltip", "Palette");
    			toggle_class(button5, "active", /*activeLeftTab*/ ctx[3] == "Palette");
    			add_location(button5, file$7, 361, 12, 10906);
    			attr_dev(div0, "class", "actions svelte-9c9bgx");
    			add_location(div0, file$7, 354, 8, 10303);
    			attr_dev(i6, "class", "material-icons");
    			add_location(i6, file$7, 368, 16, 11407);
    			attr_dev(a1, "class", "btn btn-action btn-primary btn-sm tooltip tooltip-right");
    			attr_dev(a1, "href", "https://github.com/ANovokmet/Beautiful-maps#README");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "data-tooltip", "Help");
    			add_location(a1, file$7, 367, 12, 11228);
    			attr_dev(div1, "class", "actions svelte-9c9bgx");
    			add_location(div1, file$7, 366, 8, 11194);
    			attr_dev(div2, "class", "sidebar pl-2 svelte-9c9bgx");
    			add_location(div2, file$7, 353, 4, 10268);
    			attr_dev(div3, "id", "map-container");
    			attr_dev(div3, "class", "panel svelte-9c9bgx");
    			add_location(div3, file$7, 374, 8, 11523);
    			attr_dev(div4, "class", "map svelte-9c9bgx");
    			add_location(div4, file$7, 373, 4, 11497);
    			attr_dev(div5, "class", "controls-right col-2 pr-2 svelte-9c9bgx");
    			add_location(div5, file$7, 377, 4, 11609);
    			attr_dev(div6, "class", "controls-left hide-scrollbar svelte-9c9bgx");
    			add_location(div6, file$7, 406, 4, 12772);
    			attr_dev(div7, "class", "grid pb-2 svelte-9c9bgx");
    			add_location(div7, file$7, 335, 0, 9145);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, header);
    			append_dev(header, section0);
    			append_dev(section0, a0);
    			append_dev(header, t2);
    			append_dev(header, section1);
    			append_dev(section1, button0);
    			append_dev(button0, i0);
    			append_dev(section1, t4);
    			append_dev(section1, button1);
    			append_dev(button1, i1);
    			append_dev(section1, t6);
    			append_dev(section1, button2);
    			append_dev(button2, i2);
    			append_dev(div7, t8);
    			append_dev(div7, div2);
    			append_dev(div2, div0);
    			append_dev(div0, button3);
    			append_dev(button3, i3);
    			append_dev(div0, t10);
    			append_dev(div0, button4);
    			append_dev(button4, i4);
    			append_dev(div0, t12);
    			append_dev(div0, button5);
    			append_dev(button5, i5);
    			append_dev(div2, t14);
    			append_dev(div2, div1);
    			append_dev(div1, a1);
    			append_dev(a1, i6);
    			append_dev(div7, t16);
    			append_dev(div7, div4);
    			append_dev(div4, div3);
    			/*div3_binding*/ ctx[22](div3);
    			append_dev(div7, t17);
    			append_dev(div7, div5);
    			mount_component(tabs0, div5, null);
    			append_dev(div7, t18);
    			append_dev(div7, div6);
    			mount_component(tabs1, div6, null);
    			insert_dev(target, t19, anchor);
    			mount_component(stylerenderer, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(document_1.body, "keydown", /*handleKeydown*/ ctx[11], false, false, false),
    					listen_dev(button0, "click", /*click_handler*/ ctx[16], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[17], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[18], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[19], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[20], false, false, false),
    					listen_dev(button5, "click", /*click_handler_5*/ ctx[21], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*activeRightTab*/ 16) {
    				toggle_class(button0, "active", /*activeRightTab*/ ctx[4] == "Style");
    			}

    			if (dirty[0] & /*activeRightTab*/ 16) {
    				toggle_class(button1, "active", /*activeRightTab*/ ctx[4] == "Image");
    			}

    			if (dirty[0] & /*activeRightTab*/ 16) {
    				toggle_class(button2, "active", /*activeRightTab*/ ctx[4] == "Shortcuts");
    			}

    			if (dirty[0] & /*activeLeftTab*/ 8) {
    				toggle_class(button3, "active", /*activeLeftTab*/ ctx[3] == "Classes");
    			}

    			if (dirty[0] & /*activeLeftTab*/ 8) {
    				toggle_class(button4, "active", /*activeLeftTab*/ ctx[3] == "Position");
    			}

    			if (dirty[0] & /*activeLeftTab*/ 8) {
    				toggle_class(button5, "active", /*activeLeftTab*/ ctx[3] == "Palette");
    			}

    			const tabs0_changes = {};
    			if (dirty[0] & /*activeRightTab*/ 16) tabs0_changes.activeTab = /*activeRightTab*/ ctx[4];

    			if (dirty[0] & /*selectedCountry*/ 4 | dirty[1] & /*$$scope*/ 1048576) {
    				tabs0_changes.$$scope = { dirty, ctx };
    			}

    			tabs0.$set(tabs0_changes);
    			const tabs1_changes = {};
    			if (dirty[0] & /*activeLeftTab*/ 8) tabs1_changes.activeTab = /*activeLeftTab*/ ctx[3];

    			if (dirty[0] & /*position, autosave*/ 96 | dirty[1] & /*$$scope*/ 1048576) {
    				tabs1_changes.$$scope = { dirty, ctx };
    			}

    			tabs1.$set(tabs1_changes);
    			const stylerenderer_changes = {};
    			stylerenderer.$set(stylerenderer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabs0.$$.fragment, local);
    			transition_in(tabs1.$$.fragment, local);
    			transition_in(stylerenderer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabs0.$$.fragment, local);
    			transition_out(tabs1.$$.fragment, local);
    			transition_out(stylerenderer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div7);
    			/*div3_binding*/ ctx[22](null);
    			destroy_component(tabs0);
    			destroy_component(tabs1);
    			if (detaching) detach_dev(t19);
    			/*stylerenderer_binding*/ ctx[31](null);
    			destroy_component(stylerenderer, detaching);
    			mounted = false;
    			run_all(dispose);
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

    function getSavedPalette() {
    	const str = localStorage.getItem("palette");

    	if (str) {
    		return JSON.parse(str);
    	} else {
    		return [
    			"#00429d",
    			"#2e59a8",
    			"#4771b2",
    			"#5d8abd",
    			"#73a2c6",
    			"#8abccf",
    			"#a5d5d8",
    			"#c5eddf",
    			"#ffffe0"
    		];
    	}
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $changedEvent$;
    	let $palette$;
    	let mapContainer;
    	let mapContent;
    	let renderer;
    	let panZoomInstance;
    	let countries = {};
    	let selected = null;
    	let hovering = null;
    	let selectedCountry = null;
    	let activeLeftTab = "Classes";
    	let activeRightTab = "Style";
    	let { mapUrl } = $$props;
    	const palette$ = writable(getSavedPalette());
    	validate_store(palette$, "palette$");
    	component_subscribe($$self, palette$, value => $$invalidate(39, $palette$ = value));
    	const changedEvent$ = writable(null);
    	validate_store(changedEvent$, "changedEvent$");
    	component_subscribe($$self, changedEvent$, value => $$invalidate(38, $changedEvent$ = value));
    	let defaultPosition = { scale: 3.815, x: -4348.21, y: -185.77 };
    	let defaultClasses = {};

    	for (const id in classes) {
    		const source = classes[id];

    		defaultClasses[id] = {
    			id: source.id,
    			enabled: source.enabled,
    			style: { ...source.style }
    		};
    	}

    	function resetState() {
    		$$invalidate(5, position = defaultPosition);

    		for (const id in countries) {
    			const target = countries[id];
    			target.enabled = true;
    			target.style = {};
    			target.image = null;
    		}

    		for (const id in defaultClasses) {
    			const source = defaultClasses[id];
    			const target = classes[id];
    			target.enabled = source.enabled;
    			target.style = source.style;
    		}

    		renderer.renderAll(countries, classes);
    		console.log("Loaded");
    	}

    	function saveState() {
    		console.log("Saving...");
    		const state = { position, countries: {}, classes: {} };

    		// save classes
    		for (const id in countries) {
    			const source = countries[id];

    			state.countries[id] = {
    				enabled: source.enabled,
    				style: source.style,
    				image: source.image
    			};
    		}

    		// save classes
    		for (const id in classes) {
    			const source = classes[id];

    			state.classes[id] = {
    				enabled: source.enabled,
    				style: source.style
    			};
    		}

    		localStorage.setItem("state", JSON.stringify(state));
    	}

    	function loadState() {
    		const state = JSON.parse(localStorage.getItem("state"));
    		$$invalidate(5, position = state.position);

    		for (const id in state.countries) {
    			const source = state.countries[id];
    			const target = countries[id];
    			target.enabled = source.enabled;
    			target.style = { ...target.style, ...source.style };

    			target.image = source.image
    			? { ...target.image, ...source.image }
    			: null;
    		}

    		for (const id in state.classes) {
    			const source = state.classes[id];
    			const target = classes[id];
    			target.enabled = source.enabled;
    			target.style = { ...target.style, ...source.style };
    		}

    		renderer.renderAll(countries, classes);
    		console.log("Loaded");
    	}

    	setContext("ctx", {
    		palette$,
    		changedEvent$,
    		onChanged: event => set_store_value(changedEvent$, $changedEvent$ = event),
    		countries,
    		classes
    	});

    	const mapContentLoad$ = loadSvg(mapUrl);

    	const onTransform = debounce(
    		e => {
    			const transform = e.getTransform();
    			if (position.x !== transform.x) $$invalidate(5, position.x = transform.x, position);
    			if (position.y !== transform.y) $$invalidate(5, position.y = transform.y, position);
    			if (position.scale !== transform.scale) $$invalidate(5, position.scale = transform.scale, position);
    		},
    		250
    	);

    	onMount(async () => {
    		mapContent = await mapContentLoad$;
    		mapContainer.appendChild(mapContent);

    		$$invalidate(33, panZoomInstance = window.pan = panzoom(mapContent, {
    			bounds: true,
    			boundsPadding: 0.5,
    			smoothScroll: false
    		}));

    		panZoomInstance.on("transform", onTransform);
    		getCountriesFromSvg(mapContent, countries);
    		setTransform(position);
    		loadState();

    		mapContent.addEventListener("click", delegated(target => {
    			const id = target.id;
    			selected && selected.removeAttribute("data-selected");
    			selected = target;
    			target.dataset.selected = true;
    			$$invalidate(2, selectedCountry = countries[id]);
    			setSelection(selectedCountry);
    		}));

    		mapContent.addEventListener("mouseover", delegated(target => {
    			hovering && hovering.removeAttribute("data-hover");
    			target.dataset.hover = true;
    			hovering = target;
    		}));
    	});

    	let selectionRect = null;

    	function setSelection(config) {
    		const target = config.element;

    		if (!selectionRect) {
    			selectionRect = document.createElementNS(xmlns, "rect");
    			selectionRect.classList.add("selection");
    			mapContent.appendChild(selectionRect);
    		}

    		const rect = target.getBBox();
    		selectionRect.setAttribute("x", rect.x);
    		selectionRect.setAttribute("y", rect.y);
    		selectionRect.setAttribute("height", rect.height);
    		selectionRect.setAttribute("width", rect.width);
    	}

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
    					$$invalidate(2, selectedCountry.style.fill = color, selectedCountry);
    				}
    				break;
    		}
    	}

    	function applyImage({ imageConfig, url }) {
    		$$invalidate(2, selectedCountry.image = clip(`clip-${selectedCountry.id}`, selectedCountry.element, url, imageConfig, mapContent), selectedCountry);
    		console.log(selectedCountry.image);
    	}

    	function removeImage({ imageConfig }) {
    		removeImageFromSvg(imageConfig);
    		$$invalidate(2, selectedCountry.image = null, selectedCountry);
    	}

    	function setTransform({ x, y, scale }) {
    		const transform = panZoomInstance.getTransform();
    		transform.scale = scale;
    		transform.x = x;
    		transform.y = y;
    		panZoomInstance.moveBy(0, 0);
    	}

    	window.setTransform = setTransform;
    	let position = { ...defaultPosition };

    	function toSvgDocumentSpace(clientX, clientY) {
    		var point = mapContent.createSVGPoint();
    		point.x = clientX;
    		point.y = clientY;
    		var ctm = mapContent.getScreenCTM();
    		var inverse = ctm.inverse();
    		var p = point.matrixTransform(inverse);
    		return { x: p.x, y: p.y };
    	}

    	let autosave = true;
    	let saveDebounced = debounce(() => saveState(), 2500);
    	const writable_props = ["mapUrl"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	const click_handler = () => $$invalidate(4, activeRightTab = "Style");
    	const click_handler_1 = () => $$invalidate(4, activeRightTab = "Image");
    	const click_handler_2 = () => $$invalidate(4, activeRightTab = "Shortcuts");
    	const click_handler_3 = () => $$invalidate(3, activeLeftTab = "Classes");
    	const click_handler_4 = () => $$invalidate(3, activeLeftTab = "Position");
    	const click_handler_5 = () => $$invalidate(3, activeLeftTab = "Palette");

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			mapContainer = $$value;
    			$$invalidate(0, mapContainer);
    		});
    	}

    	function stylepicker_config_binding(value) {
    		selectedCountry = value;
    		$$invalidate(2, selectedCountry);
    	}

    	function imagesettings_imageConfig_binding(value) {
    		selectedCountry.image = value;
    		$$invalidate(2, selectedCountry);
    	}

    	const apply_handler = e => applyImage(e.detail);
    	const remove_handler = e => removeImage(e.detail);

    	function positionsettings_scale_binding(value) {
    		position.scale = value;
    		$$invalidate(5, position);
    	}

    	function positionsettings_x_binding(value) {
    		position.x = value;
    		$$invalidate(5, position);
    	}

    	function positionsettings_y_binding(value) {
    		position.y = value;
    		$$invalidate(5, position);
    	}

    	function positionsettings_autosave_binding(value) {
    		autosave = value;
    		$$invalidate(6, autosave);
    	}

    	function stylerenderer_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			renderer = $$value;
    			$$invalidate(1, renderer);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("mapUrl" in $$props) $$invalidate(14, mapUrl = $$props.mapUrl);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		setContext,
    		writable,
    		panzoom,
    		StylePicker,
    		StyleRenderer,
    		PaletteSettings,
    		ImageSettings,
    		PositionSettings,
    		Tabs,
    		Tab,
    		classes,
    		getCountriesFromSvg,
    		clip,
    		removeImageFromSvg,
    		xmlns,
    		debounce,
    		delegated,
    		loadSvg,
    		mapContainer,
    		mapContent,
    		renderer,
    		panZoomInstance,
    		countries,
    		selected,
    		hovering,
    		selectedCountry,
    		activeLeftTab,
    		activeRightTab,
    		mapUrl,
    		palette$,
    		changedEvent$,
    		defaultPosition,
    		defaultClasses,
    		resetState,
    		saveState,
    		loadState,
    		getSavedPalette,
    		mapContentLoad$,
    		onTransform,
    		selectionRect,
    		setSelection,
    		handleKeydown,
    		applyImage,
    		removeImage,
    		setTransform,
    		position,
    		toSvgDocumentSpace,
    		autosave,
    		saveDebounced,
    		$changedEvent$,
    		$palette$
    	});

    	$$self.$inject_state = $$props => {
    		if ("mapContainer" in $$props) $$invalidate(0, mapContainer = $$props.mapContainer);
    		if ("mapContent" in $$props) mapContent = $$props.mapContent;
    		if ("renderer" in $$props) $$invalidate(1, renderer = $$props.renderer);
    		if ("panZoomInstance" in $$props) $$invalidate(33, panZoomInstance = $$props.panZoomInstance);
    		if ("countries" in $$props) $$invalidate(7, countries = $$props.countries);
    		if ("selected" in $$props) selected = $$props.selected;
    		if ("hovering" in $$props) hovering = $$props.hovering;
    		if ("selectedCountry" in $$props) $$invalidate(2, selectedCountry = $$props.selectedCountry);
    		if ("activeLeftTab" in $$props) $$invalidate(3, activeLeftTab = $$props.activeLeftTab);
    		if ("activeRightTab" in $$props) $$invalidate(4, activeRightTab = $$props.activeRightTab);
    		if ("mapUrl" in $$props) $$invalidate(14, mapUrl = $$props.mapUrl);
    		if ("defaultPosition" in $$props) defaultPosition = $$props.defaultPosition;
    		if ("defaultClasses" in $$props) defaultClasses = $$props.defaultClasses;
    		if ("selectionRect" in $$props) selectionRect = $$props.selectionRect;
    		if ("position" in $$props) $$invalidate(5, position = $$props.position);
    		if ("autosave" in $$props) $$invalidate(6, autosave = $$props.autosave);
    		if ("saveDebounced" in $$props) $$invalidate(47, saveDebounced = $$props.saveDebounced);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[1] & /*$palette$*/ 256) {
    			 {
    				localStorage.setItem("palette", JSON.stringify($palette$));
    			}
    		}

    		if ($$self.$$.dirty[0] & /*position*/ 32 | $$self.$$.dirty[1] & /*panZoomInstance*/ 4) {
    			 {
    				if (panZoomInstance) {
    					setTransform(position);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*autosave*/ 64 | $$self.$$.dirty[1] & /*$changedEvent$*/ 128) {
    			 {
    				if (autosave && $changedEvent$) {
    					saveDebounced();
    				}
    			}
    		}
    	};

    	return [
    		mapContainer,
    		renderer,
    		selectedCountry,
    		activeLeftTab,
    		activeRightTab,
    		position,
    		autosave,
    		countries,
    		palette$,
    		changedEvent$,
    		resetState,
    		handleKeydown,
    		applyImage,
    		removeImage,
    		mapUrl,
    		setTransform,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		div3_binding,
    		stylepicker_config_binding,
    		imagesettings_imageConfig_binding,
    		apply_handler,
    		remove_handler,
    		positionsettings_scale_binding,
    		positionsettings_x_binding,
    		positionsettings_y_binding,
    		positionsettings_autosave_binding,
    		stylerenderer_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { mapUrl: 14, setTransform: 15 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*mapUrl*/ ctx[14] === undefined && !("mapUrl" in props)) {
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
    		return this.$$.ctx[15];
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
