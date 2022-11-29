import { KV } from './types';
import Injector from './Injection';
import ApplicationRouter from './Router';

export function Path(route: string) {
        return function<T extends { new (...args: any[]): {} }>(constructor: T) {
                const [_, instances] = Injector.instances.get(ApplicationRouter)!;
                (instances.Application as ApplicationRouter).register(constructor, route);
                return constructor;
        };
}

function RouteMethod(method: string, relativePath: string = '') {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
                const [_, instances] = Injector.instances.get(ApplicationRouter)!;
                (instances.Application as ApplicationRouter).registerRoute({
                        method,
                        relativePath,
                        target,
                        propertyKey,
                        constructor: target.constructor,
                });
        };
}

export function StatusCodes(statuses: KV<string>) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
                const [_, instances] = Injector.instances.get(ApplicationRouter)!;
                const handler = (instances.Application as ApplicationRouter)
                        .handlerByControllerNameAndMethod
                        .get(target.constructor.name)!
                        .get(propertyKey)!;

                handler.customStatusCodes = statuses;
        };
}

export function ValidationPipeline(pipes: any[]) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
                const [_, instances] = Injector.instances.get(ApplicationRouter)!;
                const handler = (instances.Application as ApplicationRouter)
                        .handlerByControllerNameAndMethod
                        .get(target.constructor.name)!
                        .get(propertyKey)!;

                handler.validators = pipes;
        };
}

export function Get(route?: string) { return RouteMethod('GET', route); }

export function Post(route?: string) { return RouteMethod('POST', route); }

export function Put(route?: string) { return RouteMethod('PUT', route); }

export function Delete(route?: string) { return RouteMethod('DELETE', route); }

export function Guard(guards: any[]) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

        };
}
