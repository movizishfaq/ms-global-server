import type { NextFunction, Request, Response } from 'express';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { message: err.message, code: err.code }
    });
    return;
  }
  if (err instanceof Error && err.name === 'ValidationError') {
    res.status(400).json({ error: { message: err.message, code: 'VALIDATION' } });
    return;
  }
  console.error(err);
  res.status(500).json({
    error: {
      message:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err instanceof Error
            ? err.message
            : 'Unknown error'
    }
  });
}
