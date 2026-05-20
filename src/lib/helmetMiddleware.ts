import type { RequestHandler } from 'express';
import helmetPkg from 'helmet';

/** Helmet default export types differ under TS 5.9 + NodeNext on Vercel. */
export function helmetMiddleware(): RequestHandler {
  const factory =
    typeof helmetPkg === 'function'
      ? helmetPkg
      : (helmetPkg as { default: () => RequestHandler }).default;
  return factory();
}
