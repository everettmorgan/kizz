export type KV<T> = { [key: string]: T }

export interface IRouteConstructor {
        relativePath: string;
        absolutePath?: string;
}

export interface ServerResponse {
        status: number;
        message?: string;
        data?: any;
}

export interface ResponseMeta {
        body?: KV<any>;
        headers?: KV<string[]>;
}

export interface RouteContext<Params, Body> {
        body: Body;

        cookies: Map<string, string>;

        params: Params;

        headers: KV<string>;

        send: (status: number, meta?: ResponseMeta) => void
}
