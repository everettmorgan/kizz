import * as http from 'node:http';

export function createResponder(
        this: {
                request: http.IncomingMessage,
                response: http.ServerResponse
        },
        status: number,
        payload: any,
        headers?: any,
) {
        console.log(`[${(new Date()).toISOString()}]`, this.request.url!, this.request.method!, status);

        this.response.writeHead(status, {
                'Content-Type': 'application/json',
                ...headers,
        });

        this.response.end(JSON.stringify({
                status,
                ...payload,
        }));
}

export function executeHandlerValidators(handler: any, body: any) {
        let errors: string[] = [];

        /* eslint-disable */
        if (handler.$$validators) {
                for (const validator of handler.$$validators) {
                        errors = errors.concat((validator as any).call({ body }));
                }
        }
        /* eslint-enable */

        return errors;
}

export function removeTrailingSlash(path: string) {
        return path.endsWith('/') ? path.slice(0, path.length - 1) : path;
}

export function safeJSONParse(data: any) {
        try {
                return JSON.parse(data);
        } catch (e) {
                return {};
        }
}
