import { KV } from './types';

export function Internal() {
        return function<T extends { new (...args: any[]): {} }>(constructor: T) {
                Object.defineProperty(constructor, '__DO_NOT_TOUCH__', {
                        value: true,
                        writable: false,
                        enumerable: false,
                });
        };
}
export default abstract class Injector {
        static singletons = new Map<Function, {}>();

        static instances = new Map<Function, [any[], KV<{}>]>();

        static register<T>(Clazz: { new (...args: any): {} }, ...args: any[]) {
                if ((Clazz as any).__DO_NOT_TOUCH__) {
                        throw new Error(`attempting to override internal dependency: ${Clazz.name}`);
                }
                if ((Clazz as any).__SINGLETON__) {
                        const argz = args.map((arg) => {
                                if (typeof arg === 'function') {
                                        return arg();
                                }
                                return arg;
                        });
                        this.singletons.set(Clazz, new Clazz(...argz));
                } else {
                        this.instances.set(Clazz, [args, {}]);
                }
        }
}

export function Injectable(opts?: { singleton?: boolean; args?: any[] }) {
        return function<T extends { new (...args: any[]): {} }>(constructor: T) {
                if (opts?.singleton) {
                        Object.defineProperty(constructor, '__SINGLETON__', {
                                value: true,
                                writable: false,
                                enumerable: false,
                        });
                }

                Injector.register(constructor, ...(opts?.args ?? []));

                return constructor;
        };
}

export function Inject<A extends { new(...args: any[]): {} }>(dependencies: { [key: string]: A }) {
        return function<T extends { new (...args: any[]): {} }>(constructor: T) {
                const cls = class extends constructor {
                        constructor(...args: any[]) {
                                super(...args);

                                const keys = Object.keys(dependencies);
                                const deps = Object.values(dependencies);

                                const initialized = deps.map((Dep) => {
                                        const singleton = Injector.singletons.get(Dep);

                                        if (singleton) {
                                                if (!(singleton as any).__INTERNALS__) {
                                                        (singleton as any).__INTERNALS__ = {};
                                                }

                                                (singleton as any)
                                                        .__INTERNALS__
                                                        .__PARENT__ = this;

                                                return singleton;
                                        }

                                        const instances = Injector.instances.get(Dep);
                                        const argz = instances?.[0];
                                        const list = instances?.[1];

                                        if (list?.[cls.name]) {
                                                return list[cls.name];
                                        }

                                        if (list) {
                                                list[cls.name] = new Dep(...(argz ?? []));

                                                if (!(list[cls.name] as any).__INTERNALS__) {
                                                        (list[cls.name] as any).__INTERNALS__ = {};
                                                }

                                                (list[cls.name] as any)
                                                        .__INTERNALS__
                                                        .__PARENT__ = this;

                                                return list[cls.name];
                                        }

                                        throw new Error(`${Dep} is not registered @Injectable!`);
                                });

                                keys.forEach((key: string, index: number) => {
                                        Object.defineProperty(this, key, {
                                                value: initialized[index],
                                                writable: false,
                                                enumerable: false,
                                        });
                                });
                        }
                } as T;

                Object.defineProperty(cls, 'name', {
                        value: (constructor as any).name,
                });

                return cls;
        };
}
