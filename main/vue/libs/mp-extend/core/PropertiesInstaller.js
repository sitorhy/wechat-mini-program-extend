import OptionInstaller from './OptionInstaller';

import {Stream, Collectors} from '../libs/Stream';
import {Invocation} from '../libs/Invocation';
import {isPlainObject, isFunction, removeEmpty} from '../utils/common';

/**
 * 转换属性定义为小程序格式
 * 默认值为生成函数时，一律转为 default:Function
 *
 * Page启动参数的值会自动注入到属性中
 * /page?id=110，id会注入到value中，并触发observer
 */
export default class PropertiesInstaller extends OptionInstaller {
    _properties = {};

    install(extender, context, options) {
        const props = Object.assign.apply(
            undefined,
            [
                {},
                ...(extender.installers.map(i => i.properties())),
                options.props,
                options.properties
            ]
        );
        const properties = Stream.of(Object.entries(props)).map(function ([name, constructor]) {
            if (constructor === Number) {
                return [name, {
                    type: Number,
                    value: 0
                }];
            } else if (constructor === String) {
                return [name, {
                    type: String,
                    value: ''
                }];
            } else if (constructor === Boolean) {
                return [name, {
                    type: Boolean,
                    value: false
                }];
            } else if (constructor === Array) {
                return [name, {
                    type: Array,
                    value: []
                }];
            } else if (constructor === Object) {
                return [name, {
                    type: Object,
                    value: null
                }];
            } else if (constructor === null) {
                return [name, {
                    type: null,
                    value: null
                }];
            } else if (isPlainObject(constructor)) {
                return [name, Object.assign({
                        type: Array.isArray(constructor.type) ? (constructor.type[0] || null) : constructor.type
                    },
                    removeEmpty({
                        optionalTypes: Array.isArray(constructor.type) ? [...constructor.type].concat(
                            Array.isArray(constructor.optionalTypes) ? (constructor.optionalTypes) : []
                        ) : (Array.isArray(constructor.optionalTypes) ? [...constructor.optionalTypes] : null),
                        observer: isFunction(constructor.observer) || isFunction(constructor.validator) || constructor.required === true ? Invocation(
                            constructor.observer,
                            (function () {
                                const prop = name.toString();
                                const required = constructor.required;
                                const validator = constructor.validator;
                                constructor.validator = function (newVal, oldVal) {
                                    if (required === true && (newVal === null || newVal === undefined || newVal === '')) {
                                        console.warn(`${this.is}: Missing required prop '${prop}'`)
                                    } else {
                                        if (isFunction(validator)) {
                                            if (!validator.call(this, newVal, oldVal)) {
                                                console.warn(`${this.is}: custom validator failed for prop '${prop}'`);
                                            }
                                        }
                                    }
                                };
                                return constructor.validator;
                            })()
                        ) : null
                    }),
                    !Object.hasOwnProperty.call(constructor, 'value') ?
                        (
                            Object.hasOwnProperty.call(constructor, 'default') ?
                                (isFunction(constructor['default']) ? {'default': constructor['default']} : {value: constructor['default']}) : (
                                    [Number, String, Boolean, Array].includes(constructor.type) ? {
                                        value: constructor.type.call(undefined).valueOf()
                                    } : (
                                        Object === constructor.type ? {value: null} : null
                                    )
                                )
                        ) : (isFunction(constructor.value) ? {'default': constructor.value} : {value: constructor.value}),
                    constructor.validator ? {validator: constructor.validator} : null
                )];
            } else {
                throw new Error(`Bad type definition ${constructor ? (constructor.name || constructor.toString()) : constructor} for ${constructor}`);
            }
        }).collect(Collectors.toMap());

        context.set('properties', Object.assign(this._properties, properties));
    }
}