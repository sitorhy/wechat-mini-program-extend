type ReactivePath = Array<string | number | symbol>;

interface CreateReactiveOptions {
    set?: (value: any, path: string) => void;
}

function isObject(value: any): value is object {
    return value !== null && typeof value === 'object';
}

function formatPath(path: ReactivePath): string {
    return path.map((item) => String(item)).join('.');
}

export default function createReactive(value: any, options: CreateReactiveOptions = {}) {
    const proxyCache = new WeakMap<object, any>();

    function createProxy(target: any, path: ReactivePath): any {
        if (!isObject(target)) {
            return target;
        }

        const cachedProxy = proxyCache.get(target);
        if (cachedProxy) {
            return cachedProxy;
        }

        const proxy = new Proxy(target, {
            get(currentTarget, key, receiver) {
                const currentValue = Reflect.get(currentTarget, key, receiver);

                if (!isObject(currentValue)) {
                    return currentValue;
                }

                return createProxy(currentValue, path.concat(key));
            },
            set(currentTarget, key, newValue, receiver) {
                const oldValue = Reflect.get(currentTarget, key, receiver);
                const result = Reflect.set(currentTarget, key, newValue, receiver);

                if (result && !Object.is(oldValue, newValue)) {
                    options.set?.(newValue, formatPath(path.concat(key)));
                }

                return result;
            },
            deleteProperty(currentTarget, key) {
                const hadKey = Reflect.has(currentTarget, key);
                const result = Reflect.deleteProperty(currentTarget, key);

                if (result && hadKey) {
                    options.set?.(undefined, formatPath(path.concat(key)));
                }

                return result;
            }
        });

        proxyCache.set(target, proxy);

        return proxy;
    }

    let proxyValue = createProxy(value, []);

    return {
        get value() {
            return proxyValue;
        },
        set value(newValue: any) {
            if (Object.is(value, newValue)) {
                return;
            }

            value = newValue;
            proxyValue = createProxy(newValue, []);
            options.set?.(newValue, '');
        }
    };
}
