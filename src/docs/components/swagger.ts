// src/docs/components/swagger.ts
import type { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { SwaggerTheme } from 'swagger-themes';

export function registerSwaggerDocs(
    app: Express,
    spec: unknown,
    opts?: {
        /** Base path for Swagger UI (default: '/docs') */
        path?: string;
        /** Swagger UI theme (default: 'dracula') */
        theme?: string;
        /** Page title (default: 'My API — Docs') */
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
        swaggerUi.setup(spec as any, {
            explorer: true,
            customCss: theme.getBuffer(themeName as unknown as any),
            customSiteTitle: pageTitle,
            swaggerOptions: {
                persistAuthorization: true,

                // Capture token from /api/auth/login or /api/auth/refresh
                responseInterceptor: (res: any) => {
                    try {
                        const url = String(res?.url ?? '');
                        const isAuthLogin = url.endsWith('/api/auth/login');
                        const isAuthRefresh = url.endsWith('/api/auth/refresh');

                        if ((isAuthLogin || isAuthRefresh) && res.status === 200 && res.text) {
                            const json = JSON.parse(res.text);
                            const token: string | undefined = json?.accessToken;
                            if (token) {
                                localStorage.setItem('swaggerBearerToken', token);
                            }
                        }
                    } catch {
                        // ignore
                    }
                    return res;
                },

                // Pre-authorize UI with stored token
                onComplete: function () {
                    try {
                        const token = localStorage.getItem('swaggerBearerToken');
                        if (token && (window as any).ui) {
                            (window as any).ui.preauthorizeApiKey('bearerAuth', token);
                        }
                    } catch {
                        // ignore
                    }
                },
            },
        })
    );

    app.get('/api-docs.json', (_req: Request, res: Response) => res.json(spec));
}
