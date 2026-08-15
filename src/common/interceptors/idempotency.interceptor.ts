import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of, from } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import * as crypto from 'node:crypto';
import { Response } from 'express';
import { IdempotencyService } from '../services/idempotency.service';
import { ApiResponse } from './transform.interceptor';

interface AuthenticatedRequest {
  method: string;
  originalUrl?: string;
  url?: string;
  headers?: Record<string, unknown>;
  user?: { id: string };
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const PURGE_EVERY = 50;

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private purgeCounter = 0;

  constructor(private readonly idempotencyService: IdempotencyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const res = context.switchToHttp().getResponse<Response>();
    const key = req.headers?.['idempotency-key'];
    const userId = req.user?.id;

    if (
      !MUTATING_METHODS.has(req.method) ||
      typeof key !== 'string' ||
      key.length === 0 ||
      typeof userId !== 'string'
    ) {
      return next.handle();
    }

    const method = req.method;
    const path = req.originalUrl ?? req.url ?? '';
    const keyHash = this.hashKey(userId, method, path, key);

    return from(this.idempotencyService.findByKey(keyHash)).pipe(
      switchMap((existing) => {
        if (existing) {
          if (this.idempotencyService.isExpired(existing)) {
            return from(this.idempotencyService.remove(existing)).pipe(
              switchMap(() =>
                this.executeAndStore(
                  context,
                  next,
                  userId,
                  keyHash,
                  method,
                  path,
                ),
              ),
            );
          }
          res.statusCode = existing.responseStatus;
          return of(existing.responseBody);
        }
        return this.executeAndStore(
          context,
          next,
          userId,
          keyHash,
          method,
          path,
        );
      }),
      // Si la consulta de idempotencia falla, no romper la request: se procesa normal.
      catchError(() => next.handle()),
    );
  }

  private executeAndStore(
    context: ExecutionContext,
    next: CallHandler,
    userId: string,
    keyHash: string,
    method: string,
    path: string,
  ): Observable<unknown> {
    this.maybePurge();
    const res = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const body = data as ApiResponse<unknown>;
        const statusCode = body.statusCode ?? res.statusCode;

        void this.idempotencyService
          .save({
            keyHash,
            userId,
            method,
            path,
            responseStatus: statusCode,
            responseBody: body as unknown as Record<string, unknown>,
          })
          .catch(() => {
            // Fallo de persistencia no debe tumbar la request original.
          });

        return body;
      }),
    );
  }

  private maybePurge(): void {
    this.purgeCounter += 1;
    if (this.purgeCounter % PURGE_EVERY === 0) {
      void this.idempotencyService.purgeExpired().catch(() => {
        // Purga best-effort.
      });
    }
  }

  private hashKey(
    userId: string,
    method: string,
    path: string,
    key: string,
  ): string {
    return crypto
      .createHash('sha256')
      .update(`${userId}|${method}|${path}|${key}`)
      .digest('hex');
  }
}
