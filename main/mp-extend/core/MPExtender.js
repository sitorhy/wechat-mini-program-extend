import OptionInstaller from "./OptionInstaller";
import MethodsInstaller from "./MethodsInstaller";
import ConstantsInstaller from "./ConstantsInstaller";
import PropertiesInstaller from "./PropertiesInstaller";
import DataInstaller from "./DataInstaller";
import StateInstaller from "./StateInstaller";
import ProviderInstaller from "./ProviderInstaller";
import WatcherInstaller from "./WatcherInstaller";
import HookInstaller from "./HookInstaller";
import ComputedInstaller from "./ComputedInstaller";
import MixinInstaller from "./MixinInstaller";
import LifeCycleInstaller from "./LifeCycleInstaller";
import InstanceInstaller from "./InstanceInstaller";
import RelationsInstaller from "./RelationsInstaller";
import EventBusInstaller from "./EventBusInstaller";
import UpdateInstaller from "./UpdateInstaller";
import ContextInstaller from "./ContextInstaller";
import StoreInstaller from "./StoreInstaller";

import {Singleton} from "../libs/Singleton";
import {isFunction, isPlainObject} from "../utils/common";
import {createReactiveObject, selectPathRoot, getData, setData, selectPathParent} from "../utils/object";

import clone from "../libs/rfdc/default";
import {Collectors, Stream} from "../libs/Stream";
import RESERVED_OPTIONS_WORDS from "../utils/options";
import RESERVED_LIFECYCLES_WORDS from "../utils/lifecycle";

const RTCSign = Symbol("__wxRTC__");

class RuntimeContextSingleton extends Singleton {
    __interceptors = [];

    get() {
        const [
            options,
            thisArg,
            properties,
            computed,
            fnSetData,
            fnStateGetting = null,
            fnStateSetting = null,
            fnDeleted = null,
            fnBefore = null,
            fnAfter = null
        ] = arguments;
        this.intercept(
            fnStateGetting,
            fnStateSetting,
            fnDeleted,
            fnBefore,
            fnAfter
        );
        return super.get(options, thisArg, properties, computed, fnSetData,
            (path, value, level) => {
                if (this.__interceptors.length) {
                    this.__onStateGetting(path, value, level);
                }
            },
            (path, value, level) => {
                if (this.__interceptors.length) {
                    this.__onStateSetting(path, value, level);
                }
            },
            (path, level, parent) => {
                if (this.__interceptors.length) {
                    this.__onStateDeleted(path, level, parent);
                }
            },
            (path, prop, fn, thisArg, argArray, level, parent) => {
                if (this.__interceptors.length) {
                    this.__beforeMethodCall(path, prop, fn, thisArg, argArray, level, parent);
                }
            },
            (path, result, level, parent) => {
                if (this.__interceptors.length) {
                    this.__afterMethodCall(path, result, level, parent);
                }
            });
    }

    __onStateGetting(path, value, level) {
        for (const {get} of this.__interceptors) {
            if (get) {
                if (get(path, value, level) === true) {
                    break;
                }
            }
        }
    }

    __onStateSetting(path, value, level) {
        for (const {set} of this.__interceptors) {
            if (set) {
                if (set(path, value, level) === true) {
                    break;
                }
            }
        }
    }

    __onStateDeleted(path, level, parent) {
        for (const {del} of this.__interceptors) {
            if (del) {
                if (del(path, level, parent) === true) {
                    break;
                }
            }
        }
    }

    __beforeMethodCall(path, prop, fn, thisArg, argArray, level, parent) {
        for (const {before} of this.__interceptors) {
            if (before) {
                if (before(path, prop, fn, thisArg, argArray, level, parent) === true) {
                    break;
                }
            }
        }
    }

    __afterMethodCall(path, result, level, target) {
        for (const {after} of this.__interceptors) {
            if (after) {
                if (after(path, result, level, target) === true) {
                    break;
                }
            }
        }
    }

    intercept(
        fnStateGetting,
        fnStateSetting,
        fnDeleted,
        fnBefore,
        fnAfter
    ) {
        if (
            !fnStateGetting &&
            !fnStateSetting &&
            !fnDeleted &&
            !fnBefore &&
            !fnAfter
        ) {
            return null;
        }
        if (this.__interceptors.findIndex
        (
            i => i.get === fnStateGetting
                && i.set === fnStateSetting
                && i.del === fnDeleted
                && i.before === fnBefore
                && i.after === fnAfter
        ) >= 0) {
            return null;
        }
        this.__interceptors.push({
            get: fnStateGetting,
            set: fnStateSetting,
            del: fnDeleted,
            before: fnBefore,
            after: fnAfter
        });
        return () => {
            this.cancelIntercept(
                fnStateGetting,
                fnStateSetting,
                fnDeleted,
                fnBefore,
                fnAfter
            );
        };
    }

    cancelIntercept(
        fnStateGetting,
        fnStateSetting,
        fnDeleted,
        fnBefore,
        fnAfter
    ) {
        const index = this.__interceptors.findIndex(
            i => i.get === fnStateGetting
                && i.set === fnStateSetting
                && i.del === fnDeleted
                && i.before === fnBefore
                && i.after === fnAfter
        );
        if (index >= 0) {
            this.__interceptors.splice(index, 1);
        }
    }
}

export default class MPExtender {
    /**
     * @type {Map<any, any>}
     * @private
     */
    _installers = new Map();

    _context = new Map();

    // @deprecated ??????????????????????????????????????????????????????????????????
    _initializationCompatibleContextEnabled = false;

    constructor() {
        this.use(new MixinInstaller(), 5);
        this.use(new LifeCycleInstaller(), 10);
        this.use(new MethodsInstaller(), 15);
        this.use(new ConstantsInstaller(), 20);
        this.use(new PropertiesInstaller(), 25);
        this.use(new DataInstaller(), 30);
        this.use(new StateInstaller(), 35);
        this.use(new ComputedInstaller(), 40);
        this.use(new StoreInstaller(), 45);
        this.use(new ProviderInstaller(), 50);
        this.use(new WatcherInstaller(), 55);
        this.use(new InstanceInstaller(), 95);
        this.use(new EventBusInstaller(), 150);
        this.use(new RelationsInstaller(), 200);
        this.use(new HookInstaller(), 250);
        this.use(new ContextInstaller(), 300);
        this.use(new UpdateInstaller(), 350);
    }

    /**
     * @returns {OptionInstaller[]}
     */
    get installers() {
        return [...this._installers.entries()].sort((i, j) => i[1] - j[1]).map(i => i[0]);
    }

    /**
     * ????????????
     * @param installer
     * @param priority - ??????????????????????????????
     */
    use(installer, priority = 100) {
        if (installer instanceof OptionInstaller) {
            if (!this._installers.has(installer)) {
                this._installers.set(installer, priority);
            }
        }
    }

    /**
     * ??????????????????????????? OptionInstaller.use ?????????????????????????????????????????????
     * @param installer
     * @returns {boolean}
     */
    unset(installer) {
        return this._installers.delete(installer);
    }

    /**
     * ????????????????????????
     * @param {object} options - ??????
     * @param {object} instance - ??????this
     * @param {object} properties - ????????????
     * @param {object} computed - ??????????????????
     * @param {Function} fnSetData - ?????????setData????????????????????????setData?????????????????????
     * @param {Function} fnStateGetting
     * @param {Function} fnStateSetting
     * @param {Function} fnDeleted
     * @param {Function} fnBefore
     * @param {Function} fnAfter
     * @returns {*}
     */
    createRuntimeCompatibleContext(
        options,
        instance,
        properties,
        computed,
        fnSetData,
        fnStateGetting = null,
        fnStateSetting = null,
        fnDeleted = null,
        fnBefore = null,
        fnAfter = null
    ) {
        let runtimeContext;

        const beforeUpdateChain = (options, instance, data) => {
            this.installers.forEach(i => {
                i.beforeUpdate(this, this._context, options, instance, data);
            });
        };

        const updatedChain = (options, instance, data) => {
            this.installers.forEach(i => {
                i.updated(this, this._context, options, instance, data);
            });
        };

        const calling = [];

        const reactiveState = createReactiveObject(instance.data, instance.data,
            (path, value) => {
                const data = {[path]: value};
                beforeUpdateChain(options, instance, data);
                fnSetData(data, function () {
                    updatedChain(options, instance, data);
                });
            },
            "",
            fnStateGetting,
            fnStateSetting,
            (path, level, parent) => {
                const parentPath = selectPathParent(path);
                if (!calling.includes(parentPath)) {
                    // ?????? pop shift ???????????????
                    setData(reactiveState, parentPath, parent);
                }
                fnDeleted.call(undefined, path, level, parent);
            },
            (path, p, fn, thisArg, args, level, parent) => {
                if (Array.isArray(parent) && ["push", "splice", "shift", "pop", "fill", "unshift", "reverse", "copyWithin"].includes(p)) {
                    calling.push(path);
                }
                fnBefore.call(undefined, path, p, fn, thisArg, args, level, parent);
            },
            (path, result, level, target) => {
                calling.splice(0).forEach(path => {
                    setData(reactiveState, path, target);
                });
                fnAfter.call(undefined, path, result, level, target);
            });

        const propsSingleton = new Singleton((receiver) => {
            const $props = {};
            Object.keys(properties).forEach(prop => {
                Object.defineProperty($props, prop, {
                    get() {
                        return Reflect.get(receiver, prop);
                    },
                    set(v) {
                        Reflect.set(receiver, prop, v);
                    }
                });
            });
            return $props;
        });

        runtimeContext = new Proxy(instance, {
            ownKeys() {
                return [...new Set(["$data", "$props"].concat(Object.keys(instance)).concat(Object.keys(instance.data)))];
            },
            has(target, p) {
                if (["$data", "$props"].includes(p)) {
                    return true;
                }
                return Reflect.has(instance.data, p) || Reflect.has(instance, p);
            },
            get(target, p) {
                if (p === "$data") {
                    const keys = Object.keys(instance.data || {}).filter(k => {
                        if (properties) {
                            if (Reflect.has(properties, k)) {
                                return false;
                            }
                        }
                        if (computed) {
                            if (Reflect.has(computed, k)) {
                                return false;
                            }
                        }
                        return true;
                    });
                    const $data = {};
                    keys.forEach(k => {
                        Object.defineProperty($data, k, {
                            get() {
                                return Reflect.get(reactiveState, k);
                            },
                            set(v) {
                                Reflect.set(reactiveState, k, v);
                            }
                        })
                    });
                    return $data;
                }
                if (p === "$props") {
                    return propsSingleton.get(reactiveState);
                }

                if (Reflect.has(target, p)) {
                    const prop = Reflect.get(target, p);
                    if (isFunction(prop)) {
                        return prop.bind(target);
                    }
                    return prop;
                } else {
                    if (Reflect.has(instance.data, p)) {
                        return Reflect.get(reactiveState, p);
                    }
                    return Reflect.get(target, p);
                }
            },
            set(target, p, value) {
                if (["$data", "$props"].includes(p)) {
                    return false;
                }
                if (Reflect.has(instance.data, p) || (properties && Reflect.has(properties, p) || (computed && Reflect.has(computed, p)))) {
                    return Reflect.set(reactiveState, p, value);
                }
                return Reflect.set(instance, p, value);
            },
            deleteProperty(target, p) {
                if (["$data", "$props"].includes(p)) {
                    return false;
                }
                if (Reflect.has(instance.data, p)) {
                    return Reflect.deleteProperty(instance.data, p);
                }
                return Reflect.deleteProperty(target, p);
            }
        });

        return runtimeContext;
    }

    /**
     * ????????????????????????
     * @returns {Singleton}
     */
    createRuntimeContextSingleton() {
        return new RuntimeContextSingleton((
            options,
            thisArg,
            properties,
            computed,
            fnSetData,
            fnStateGetting = null,
            fnStateSetting = null,
            fnDeleted = null,
            fnBefore = null,
            fnAfter = null
        ) => {
            return this.createRuntimeCompatibleContext(
                options,
                thisArg,
                properties,
                computed,
                fnSetData,
                fnStateGetting,
                fnStateSetting,
                fnDeleted,
                fnBefore,
                fnAfter
            );
        });
    }

    /**
     * ????????????????????????????????????????????? created ???????????????????????????????????????????????????
     * @param context - ???????????????????????? this
     * @returns {*}
     */
    static getRuntimeContext(context) {
        if (!Reflect.has(context, RTCSign)) {
            throw new Error("Runtime context has not been initialized.");
        }
        return Reflect.get(context, RTCSign).get();
    }

    getRuntimeContextSingleton(context) {
        if (!Reflect.has(context, RTCSign)) {
            Object.defineProperty(context, RTCSign, {
                value: this.createRuntimeContextSingleton(),
                configurable: true,
                enumerable: false,
                writable: false
            });
        }
        return Reflect.get(context, RTCSign);
    }

    deleteRuntimeContextSingleton(context) {
        const singleton = this.getRuntimeContextSingleton();
        if (singleton) {
            singleton.release();
        }
        if (Reflect.has(context, RTCSign)) {
            Reflect.deleteProperty(context, RTCSign);
        }
    }

    /**
     * ??????????????????????????????????????????????????????
     * @param options
     */
    createConstantsContext(options) {
        const $options = Stream.of(Object.keys(options).filter(p => !RESERVED_OPTIONS_WORDS.has(p) && !RESERVED_LIFECYCLES_WORDS.has(p)))
            .map(p => [p, options[p]])
            .collect(Collectors.toMap());

        return new Proxy($options, {
            set(target, p, value) {
                if (Reflect.set(target, p, value)) {
                    if (Reflect.has(options, p)) {
                        Reflect.set(options, p, value);
                    }
                    return true;
                }
                return false;
            }
        });
    }

    /**
     * ??????????????????????????????????????????????????????????????????????????? receiver ??????????????????????????????????????????
     * @param propertiesReceiver - ?????????????????????????????????????????????????????????????????????????????????????????????????????????
     * @param properties - ???????????????????????????Vue??????????????????
     * @param constants - ????????????, $options
     * @returns {{}|undefined|*}
     */
    createPropertiesCompatibleContext(propertiesReceiver, properties, constants = {}) {
        const propsSingleton = new Singleton((receiver) => {
            const $props = {};
            Object.keys(properties).forEach(prop => {
                Object.defineProperty($props, prop, {
                    get() {
                        return Reflect.get(receiver, prop);
                    },
                    set(v) {
                        Reflect.set(receiver, prop, v);
                    }
                });
            });
        });

        const context = new Proxy(
            propertiesReceiver,
            {
                has(target, p) {
                    return Reflect.has(target, p) || ["$options", "$props"].includes(p);
                },
                ownKeys(target) {
                    return [
                        ...new Set(["$options", "$props"].concat(Object.keys(target)))
                    ];
                },
                get(target, p, receiver) {
                    if (p === "$options") {
                        return constants;
                    }
                    if (p === "$props") {
                        return propsSingleton.get(receiver);
                    }
                    if (Reflect.has(target, p)) {
                        // ??????????????????
                        return Reflect.get(target, p);
                    } else if (Reflect.has(properties, p)) {
                        const prop = Reflect.get(properties, p);
                        if (Reflect.has(prop, "value")) {
                            return prop.value;
                        } else if (isFunction(prop.default)) {
                            return prop.default.call(receiver);
                        } else {
                            return prop.default;
                        }
                    }
                    return undefined;
                },
                set(target, p, value) {
                    if (["$options", "$props"].includes(p)) {
                        return false;
                    }
                    if (Reflect.has(properties, p)) {
                        Reflect.set(properties[p], "value", value);
                    }
                    return Reflect.set(target, p, value);
                }
            }
        );

        // ??????????????????
        Object.keys(properties).forEach(prop => {
            const constructor = properties[prop];
            if (!Reflect.has(propertiesReceiver, prop)) {
                if (Reflect.has(constructor, "value")) {
                    propertiesReceiver[prop] = constructor.value;
                } else if (isFunction(constructor.default)) {
                    propertiesReceiver[prop] = constructor.default.call(context);
                } else {
                    propertiesReceiver[prop] = constructor.default;
                }
            }
        });

        return context;
    }


    /**
     * ??????????????????????????????????????????????????????
     * @param stateReceiver - ???????????????
     * @param properties - ??????????????????????????????????????????????????????????????????????????????null
     * @param data - ?????????????????????????????????????????????????????????????????????
     * @param computed - ???????????????????????????????????????
     * @param methods - ????????????
     * @param constants - ????????????, $options
     * @returns {{}}
     */
    createDataCompatibleContext(stateReceiver, properties, data, computed, methods, constants = {}) {
        const propertiesContext = this.createPropertiesCompatibleContext(stateReceiver, properties || {}, constants);

        const context = new Proxy(
            stateReceiver,
            {
                has(target, p) {
                    return Reflect.has(target, p)
                        || Reflect.has(propertiesContext, p)
                        || (methods ? false : Reflect.has(methods, p))
                        || (computed ? false : Reflect.has(computed, p))
                        || ["data", "$data"].includes(p);
                },
                ownKeys(target) {
                    const keys = [];
                    [methods, propertiesContext, computed, target].forEach(i => {
                        if (i) {
                            Array.prototype.push.apply(keys, Object.keys(i));
                        }
                    });
                    return [
                        ...new Set(["data", "$data"].concat(keys))
                    ];
                },
                get(target, p, receiver) {
                    if (p === "data") {
                        return target;
                    }
                    if (p === "$data") {
                        const keys = Object.keys(stateReceiver).filter(k => {
                            if (properties) {
                                if (Reflect.has(properties, k)) {
                                    return false;
                                }
                            }
                            if (computed) {
                                if (Reflect.has(computed, k)) {
                                    return false;
                                }
                            }
                            return true;
                        });
                        const $data = {};
                        keys.forEach(k => {
                            Object.defineProperty($data, k, {
                                get() {
                                    return Reflect.get(receiver, k);
                                },
                                set(v) {
                                    Reflect.set(receiver, p, v);
                                }
                            })
                        });
                        return $data;
                    }
                    if (Reflect.has(propertiesContext, p)) {
                        return Reflect.get(propertiesContext, p);
                    }
                    if (methods && Reflect.has(methods, p)) {
                        const method = methods[p];
                        if (isFunction(method)) {
                            return method.bind(receiver);
                        }
                        return method; // ???????????? ????????????
                    }
                    return Reflect.get(target, p);
                },
                set(target, p, value) {
                    if (["data", "$data"].includes(p)) {
                        return false;
                    }
                    if (Reflect.has(propertiesContext, p)) {
                        return Reflect.set(propertiesContext, p, value);
                    }
                    if (methods && Reflect.has(methods, p)) {
                        return Reflect.set(methods, p, value);
                    }
                    return Reflect.set(target, p, value);
                }
            }
        );
        if (isFunction(data)) {
            const dataReceiver = data.call(context);
            Object.keys(dataReceiver).forEach(p => {
                if (Reflect.has(stateReceiver, p)) {
                    throw new Error(`The data property "${p}" is already declared as a prop. Use prop default value instead.`);
                }
            });
            Object.assign(stateReceiver, dataReceiver);
        } else {
            if (data) {
                Object.keys(data).forEach(p => {
                    if (Reflect.has(stateReceiver, p)) {
                        throw new Error(`The data property "${p}" is already declared as a prop. Use prop default value instead.`);
                    }
                });
            }
            Object.assign(stateReceiver, data);
        }
        return context;
    }

    /**
     * ??????????????????????????????
     * @param state - ??????????????????????????????
     * @param properties - ?????????????????????
     * @param computed - ???????????????????????????
     * @param methods
     * @param constants
     */
    getComputedDependencies(state, properties, computed, methods, constants = {}) {
        const plainState = clone(state);
        const linkAge = new Map();
        const dependencies = [];
        const reactiveState = createReactiveObject(plainState, plainState,
            (path, value) => {
                setData(plainState, path, value);
            },
            "",
            (path, value, level) => {
                if (!dependencies.includes(path) && level === 0) {
                    dependencies.push(path);
                }
            },
            (path) => {
                const src = selectPathRoot(path);
                dependencies.splice(0).map(i => selectPathRoot(i)).filter(i => i !== src).forEach(p => {
                    if (!linkAge.has(p)) {
                        linkAge.set(p, []);
                    }
                    const targets = linkAge.get(p);
                    if (!targets.includes(src)) {
                        targets.push(src);
                    }
                });
            }
        );

        const context = this.createDataCompatibleContext(reactiveState, properties, null, computed, methods, constants);
        const getters = isPlainObject(computed) ? Object.keys(computed).filter(i => (isPlainObject(computed[i]) && isFunction(computed[i].get)) || isFunction(computed[i])) : [];

        getters.forEach(p => {
            if (!Reflect.has(plainState, p)) {
                const getter = isFunction(computed[p].get) ? computed[p].get : computed[p];
                if (isFunction(getter)) {
                    context[p] = getter.call(context);
                }
            }
        });

        return linkAge;
    }

    /**
     * ?????????????????????
     * @param state - ???????????????????????????????????????????????????????????????????????????
     * @param {Map} linkAge - ????????????????????????,{ [???????????????:string]:???????????? }
     * @param properties - ?????????????????????
     * @param computed - ??????????????????
     * @param methods - ????????????
     * @param constants - ????????????
     * @returns {any}
     */
    createInitializationCompatibleContext(state, linkAge, properties, computed, methods, constants = {}) {
        let context;
        const locking = new Set();
        const calling = [];
        const reactiveState = createReactiveObject(state, state,
            (path, value) => {
                // ???????????????
                const src = selectPathRoot(path);
                if (locking.has(src)) {
                    // ????????????????????????????????????????????????
                    return;
                }
                // ????????????
                locking.add(src);
                if (src !== path) {
                    // ?????????????????????????????????????????????????????????
                    // ???????????????????????????????????????????????????????????????????????????????????????getter
                    if (getData(state, path) !== value) {
                        setData(state, path, value);
                    }
                } else {
                    // ????????????
                    const setter = computed[src] && isFunction(computed[src].set) ? computed[src].set : null;
                    if (value !== state[src]) {
                        if (isFunction(setter)) {
                            setter.call(context, value);
                            const getter = computed[src] && isFunction(computed[src].get) ? computed[src].get : computed[src];
                            if (isFunction(getter)) {
                                state[src] = getter.call(context);
                            } else {
                                throw new Error(`Getter is missing for computed property "${src}".`);
                            }
                        } else {
                            setData(state, path, value);
                        }
                    }
                }
                const targets = linkAge.get(src);
                if (targets) {
                    targets.forEach(p => {
                        if (!locking.has(p)) {
                            // Vue ?????????????????????????????????????????? ??????????????????????????????????????????????????????
                            // Vue ??? ???????????? a=100,a=200 ???a?????? watch ???????????? 200
                            const getter = computed[p] && isFunction(computed[p].get) ? computed[p].get : computed[p];
                            if (isFunction(getter)) {
                                context[p] = getter.call(context);
                            } else {
                                context[p] = state[p]; // ??????????????????????????????????????????
                            }
                        }
                    });
                }
                // ??????
                locking.delete(src);
            },
            "",
            null,
            null,
            (path, level, parent) => {
                const parentPath = selectPathParent(path);
                if (!calling.includes(parentPath)) {
                    setData(state, path, parent);
                }
            },
            (path, p, fn, thisArg, args, level, parent) => {
                if (Array.isArray(parent) && ["push", "splice", "shift", "pop", "fill", "unshift", "reverse", "copyWithin"].includes(p)) {
                    calling.push(path);
                }
            },
            (path, result, level, target) => {
                calling.splice(0).forEach(path => {
                    setData(state, path, target);
                });
            });

        context = this.createDataCompatibleContext(reactiveState, properties, null, computed, methods, constants);
        const getters = isPlainObject(computed) ? Object.keys(computed).filter(i => (isPlainObject(computed[i]) && isFunction(computed[i].get)) || isFunction(computed[i])) : [];

        getters.forEach(p => {
            if (!Reflect.has(state, p)) {
                const getter = computed[p] && isFunction(computed[p].get) ? computed[p].get : computed[p];
                if (isFunction(getter)) {
                    state[p] = getter.call(context);
                }
            }
        });

        return context;
    }

    /**
     * @returns {Singleton}
     */
    createInitializationContextSingleton() {
        return new Singleton((state, linkAge, properties, computed, methods, constants) => {
            return this.createInitializationCompatibleContext(state, linkAge, properties, computed, methods, constants);
        });
    }

    extends(configuration) {
        let options = configuration;

        const extender = Proxy.revocable(this, {
            get(target, p, receiver) {
                if (p === "use") {
                    return function () {
                        MPExtender.prototype.use.apply(target, arguments);
                        arguments[0].use(extender, options);
                    };
                }
                return Reflect.get(target, p, receiver);
            },
            set() {
                return false;
            },
            deleteProperty() {
                return false;
            }
        });

        this.installers.forEach(installer => {
            installer.use(extender.proxy, options);
        });

        extender.revoke();

        const installers = this.installers;
        const reduceOptions = {};
        installers.forEach(installer => {
            const o = installer.configuration(this, this._context, options);
            if (o) {
                Object.assign(reduceOptions, o);
            }
        });
        installers.forEach(installer => {
            installer.install(this, this._context, reduceOptions);
        });

        const config = {
            behaviors: [
                Behavior({
                    definitionFilter: (defFields, definitionFilterArr) => {
                        installers.forEach(installer => {
                            installer.definitionFilter(this, this._context, options, defFields, definitionFilterArr);
                            const behaviors = installer.behaviors();
                            if (Array.isArray(behaviors) && behaviors.length) {
                                defFields.behaviors = Stream.of(
                                    (defFields.behaviors || []).concat(behaviors)
                                ).distinct().collect(Collectors.toList());
                            }
                        });
                    }
                })
            ]
        };
        installers.forEach(installer => {
            Object.assign(config, installer.build(this, this._context, reduceOptions));
        });
        return config;
    }
}