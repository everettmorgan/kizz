import { IRouteConstructor, KV } from './types';
import { Internal, Injectable } from './Injection';

interface IHttpMethodHandler {
        handler: Function;
        validators: Function[];
        customStatusCodes: KV<string>;
}

interface IHttpMethodHandlers {
        [key: string]: IHttpMethodHandler;
}

interface IRoute {
        relativePath: string;

        absolutePath?: string;

        methods: IHttpMethodHandlers;

        subRoutes: KV<IRoute>;
}

export class Route {
        relativePath: string;

        absolutePath?: string;

        methods: IHttpMethodHandlers;

        subRoutes: KV<IRoute>;

        constructor(opts: IRouteConstructor) {
                this.relativePath = opts.relativePath;
                this.absolutePath = opts.absolutePath;
                this.methods = {};
                this.subRoutes = {};
        }
}

export class Router {
        relativePath: string;

        routes: Route;

        constructor(opts: { relativePath: string; }) {
                this.relativePath = opts.relativePath;
                this.routes = new Route({
                        relativePath: opts.relativePath,
                        absolutePath: opts.relativePath,
                });
        }

        register(route: Route) {
                const segments = route.relativePath.split('/');

                if (route.relativePath.startsWith('/')) {
                        segments.shift();
                }

                let currRoute = this.routes;

                if (segments.length === 1 && segments[0] === '') {
                        currRoute.methods = route.methods;
                        return currRoute;
                }

                const end: any = segments.pop()!;

                segments.forEach((segment) => {
                        if (segment !== currRoute.relativePath) {
                                if (!currRoute.subRoutes[segment]) {
                                        const relativePath = segment;

                                        const newRoute = new Route({ relativePath });

                                        if (segment.startsWith(':')) {
                                                newRoute.relativePath = '*';
                                                currRoute.subRoutes['*'] = newRoute;
                                        } else {
                                                currRoute.subRoutes[segment] = newRoute;
                                        }
                                        currRoute = newRoute;
                                }
                        }
                });

                currRoute.subRoutes[end] = route;

                return route;
        }
}

@Internal()
@Injectable()
export default class ApplicationRouter {
        routers: Map<string, Router>;

        routersByControllerName: Map<string, Router>;

        routesByControllerName: Map<string, Route[]>;

        handlerByControllerNameAndMethod: Map<string, Map<string, IHttpMethodHandler>>;

        controllersByPath: Map<string, Function>;

        pathsByControllerName: Map<string, string>;

        constructor() {
                this.routers = new Map();
                this.controllersByPath = new Map();
                this.pathsByControllerName = new Map();
                this.routesByControllerName = new Map();
                this.routersByControllerName = new Map();
                this.handlerByControllerNameAndMethod = new Map();
        }

        register(constructor: Function, basePath: string) {
                this.controllersByPath.set(basePath, constructor);

                this.pathsByControllerName.set(constructor.name, basePath);

                const router = new Router({ relativePath: basePath });

                this.routers.set(basePath, router);

                this.routersByControllerName.set(constructor.name, router);
        }

        registerRoute(opts: {
                method: string;
                relativePath: string;
                constructor: Function;
                target: any;
                propertyKey: string;
        }) {
                const route = new Route({ relativePath: opts.relativePath });

                route.methods[opts.method] = {
                        handler: opts.target[opts.propertyKey],
                        validators: [],
                        customStatusCodes: {},
                };

                if (!this.routesByControllerName.get(opts.constructor.name)) {
                        this.routesByControllerName.set(opts.constructor.name, []);
                }

                const routes = this.routesByControllerName.get(opts.constructor.name)!;

                this.routesByControllerName.set(opts.constructor.name, [...routes, route]);

                const handlerByControllerMethod = new Map();

                handlerByControllerMethod.set(opts.propertyKey, route.methods[opts.method]);

                this.handlerByControllerNameAndMethod.set(
                        opts.target.constructor.name,
                        handlerByControllerMethod,
                );
        }

        bootstrap(controllers: Function[]) {
                this.controllersByPath.forEach((controller, path) => {
                        const router = this.routersByControllerName.get(controller.name)!;
                        const routes = this.routesByControllerName.get(controller.name)!;

                        const instance = controllers.find(
                                (c) => c.constructor.name === controller.name,
                        );

                        routes.forEach((route) => {
                                route.absolutePath = router.relativePath + route.relativePath;
                                Object.keys(route.methods).forEach((method) => {
                                        const ref = route.methods[method];
                                        ref.handler = ref.handler.bind(instance);
                                });
                                router.register(route);
                        });
                });
        }

        resolve(opts: { method: string, path: string }) {
                const base = opts.path.match(/^\/[^/]*/)?.[0];

                if (!base) {
                        throw new Error(`unexpected path: ${opts.path}`);
                }

                const router = this.routers.get(base);

                if (!router) {
                        throw new Error(`No router registered for: ${base}`);
                }

                const segments = opts.path.split('/').slice(2);

                let index = 0;

                const ctx: any | null = {
                        meta: { params: {} },
                        route: router.routes,
                };

                while (index < segments.length) {
                        const curr = segments[index];

                        if (ctx!.route.subRoutes[curr]) {
                                ctx.route = ctx!.route.subRoutes[curr];
                        } else if (ctx!.route.subRoutes['*']) {
                                ctx.route = ctx!.route.subRoutes['*'];
                        } else {
                                ctx.route = null;
                                break;
                        }

                        index += 1;
                }

                if (ctx.route) {
                        const schema = ctx.route.relativePath.split('/');

                        if (ctx.route.relativePath.startsWith('/')) {
                                schema.shift();
                        }

                        const params: KV<string> = {};

                        schema.forEach((s: string, i: number) => {
                                if (s.startsWith(':')) {
                                        params[s.slice(1)] = segments[i];
                                }
                        });

                        ctx.meta.params = params;
                }

                return ctx.route?.methods?.[opts.method];
        }
}
