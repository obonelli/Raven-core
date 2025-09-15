// src/docs/components/swagger.ts
import type { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import type { JsonObject } from 'swagger-ui-express';
import { SwaggerTheme } from 'swagger-themes';
import type { SwaggerThemeName } from 'swagger-themes';

type SwaggerUIResponse = {
    url?: string;
    status?: number;
    text?: string;
    [k: string]: unknown;
};

export function registerSwaggerDocs(
    app: Express,
    spec: JsonObject,
    opts?: {
        path?: string;
        theme?: string;
        title?: string;
    }
): void {
    const path = opts?.path ?? '/docs';
    const themeName = opts?.theme ?? 'dracula';
    const pageTitle = opts?.title ?? 'My API — Docs';

    const theme = new SwaggerTheme();

    app.use(
        path,
        swaggerUi.serve,
        swaggerUi.setup(spec as JsonObject, {
            explorer: true,
            customCss: theme.getBuffer(themeName as SwaggerThemeName),
            customSiteTitle: pageTitle,
            swaggerOptions: {
                persistAuthorization: true,
                responseInterceptor: (res: SwaggerUIResponse) => {
                    try {
                        const url = String(res?.url ?? '');
                        const isAuthLogin = url.endsWith('/api/auth/login');
                        const isAuthRefresh = url.endsWith('/api/auth/refresh');
                        if ((isAuthLogin || isAuthRefresh) && res.status === 200 && res.text) {
                            const json = JSON.parse(res.text);
                            const token: string | undefined = json?.accessToken;
                            if (token) {
                                (globalThis as unknown as { localStorage?: { setItem(k: string, v: string): void } })
                                    .localStorage?.setItem('swaggerBearerToken', token);
                            }
                        }
                    } catch (_err) { void _err; }
                    return res;
                },
                onComplete: function () {
                    try {
                        const ls = (globalThis as unknown as {
                            localStorage?: { getItem(k: string): string | null };
                        }).localStorage;
                        const token = ls?.getItem('swaggerBearerToken');
                        const w = globalThis as unknown as {
                            ui?: { preauthorizeApiKey(name: string, token: string): void };
                        };
                        if (token && w.ui) {
                            w.ui.preauthorizeApiKey('bearerAuth', token);
                        }
                    } catch (_err) { void _err; }
                },
            },
        })
    );

    app.get('/api-docs.json', (_req: Request, res: Response) => res.json(spec));
}
