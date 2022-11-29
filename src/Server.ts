import * as http from 'node:http';

import { Application } from './Application';
import { ServerResponse, ResponseMeta } from './types';
import { createResponder, safeJSONParse } from './helpers';

export class Server {
        private server: http.Server;

        constructor() {
                this.server = http.createServer();
        }

        private handler(
                app: Application,
                request: http.IncomingMessage,
                response: http.ServerResponse,
                data: any,
        ) {
                const respond = createResponder.bind({ request, response });

                const route = app.router.resolve({
                        method: request.method!,
                        path: request.url!,
                });

                if (!route) {
                        return respond(404, {
                                message: 'Not Found',
                        });
                }

                const body = safeJSONParse(data);

                const cookies = new Map<string, string>();

                const fullCookies = request.headers.cookie?.split(';');

                fullCookies?.forEach((cookie: string) => {
                        const [key, value] = cookie.trim().split('=');
                        cookies.set(key, value);
                });

                const context = {
                        body,
                        cookies,
                        headers: request.headers,
                        params: route.meta?.params,
                        send: (status: number, meta?: ResponseMeta) => {
                                response.writeHead(status, {
                                        'Content-Type': 'application/json',
                                        ...(meta?.headers && meta.headers),
                                });

                                const payload: ServerResponse = {
                                        status,
                                        data: meta?.body,
                                };

                                respond(status, payload, meta?.headers);
                        },
                };

                try {
                        return route.handler(context);
                } catch (e) {
                        return respond(500, {
                                message: 'Internal server error',
                        });
                }
        }

        async listen(app: Application, port: number) {
                this.server.on('request', (request, response) => {
                        let data = '';

                        request.on('data', (d) => {
                                data += d.toString();
                        });

                        request.on('end', () => {
                                this.handler(app, request, response, data);
                        });
                });

                this.server.listen(port);
                console.log(`application started on port: ${port}`);
        }
}
