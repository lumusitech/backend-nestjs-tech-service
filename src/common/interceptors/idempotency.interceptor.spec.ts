import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError, firstValueFrom } from 'rxjs';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import {
  IdempotencyService,
  IDEMPOTENCY_TTL_MS,
} from '../services/idempotency.service';
import { IdempotencyRecord } from '../entities/idempotency-record.entity';

describe('IdempotencyInterceptor', () => {
  let interceptor: IdempotencyInterceptor;
  let service: jest.Mocked<
    Pick<IdempotencyService, 'findByKey' | 'save' | 'remove' | 'isExpired'>
  >;

  const transformedBody = {
    statusCode: 201,
    data: { id: 'wo-1' },
    timestamp: '2026-08-15T00:00:00.000Z',
  };

  const record = (
    overrides: Partial<IdempotencyRecord> = {},
  ): IdempotencyRecord => ({
    id: 'idem-1',
    keyHash: 'hash',
    userId: 'user-1',
    method: 'POST',
    path: '/api/work-orders',
    responseStatus: 201,
    responseBody: transformedBody,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    ...overrides,
  });

  function createContext(
    method: string,
    headers: Record<string, unknown>,
    user?: { id: string },
  ): { context: ExecutionContext; response: { statusCode: number } } {
    const response = { statusCode: 200 };
    const req = { method, headers, user, originalUrl: '/api/work-orders' };
    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => response,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    return { context, response };
  }

  function callHandler(result: unknown = transformedBody): CallHandler {
    return { handle: () => of(result) } as CallHandler;
  }

  beforeEach(() => {
    service = {
      findByKey: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      isExpired: jest.fn(),
    };
    interceptor = new IdempotencyInterceptor(
      service as unknown as IdempotencyService,
    );
  });

  it('passes through non-mutating methods', async () => {
    const { context } = createContext('GET', {});
    const next = callHandler();
    const handleSpy = jest.spyOn(next, 'handle');

    await firstValueFrom(interceptor.intercept(context, next));

    expect(handleSpy).toHaveBeenCalled();
    expect(service.findByKey).not.toHaveBeenCalled();
  });

  it('passes through mutations without an Idempotency-Key header', async () => {
    const { context } = createContext('POST', {}, { id: 'user-1' });
    const next = callHandler();
    const handleSpy = jest.spyOn(next, 'handle');

    await firstValueFrom(interceptor.intercept(context, next));

    expect(handleSpy).toHaveBeenCalled();
    expect(service.findByKey).not.toHaveBeenCalled();
  });

  it('passes through mutations without an authenticated user', async () => {
    const { context } = createContext('POST', { 'idempotency-key': 'k1' });
    const next = callHandler();
    const handleSpy = jest.spyOn(next, 'handle');

    await firstValueFrom(interceptor.intercept(context, next));

    expect(handleSpy).toHaveBeenCalled();
    expect(service.findByKey).not.toHaveBeenCalled();
  });

  it('executes the handler and stores the response for a new key', async () => {
    service.findByKey.mockResolvedValue(null);
    service.isExpired.mockReturnValue(false);
    service.save.mockResolvedValue(record());
    const { context } = createContext(
      'POST',
      { 'idempotency-key': 'k1' },
      { id: 'user-1' },
    );
    const next = callHandler();

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual(transformedBody);
    expect(service.save).toHaveBeenCalledWith(
      expect.objectContaining({
        keyHash: expect.any(String),
        userId: 'user-1',
        method: 'POST',
        path: '/api/work-orders',
        responseStatus: 201,
        responseBody: transformedBody,
      }),
    );
  });

  it('replays the stored response without executing the handler (dedupe)', async () => {
    const existing = record();
    service.findByKey.mockResolvedValue(existing);
    service.isExpired.mockReturnValue(false);
    const { context } = createContext(
      'POST',
      { 'idempotency-key': 'k1' },
      { id: 'user-1' },
    );
    const next = callHandler();
    const handleSpy = jest.spyOn(next, 'handle');

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual(transformedBody);
    expect(handleSpy).not.toHaveBeenCalled();
    expect(service.save).not.toHaveBeenCalled();
  });

  it('sets the real HTTP status from the stored response on replay', async () => {
    const existing = record({ responseStatus: 201 });
    service.findByKey.mockResolvedValue(existing);
    service.isExpired.mockReturnValue(false);

    const { context, response } = createContext(
      'POST',
      { 'idempotency-key': 'k1' },
      { id: 'user-1' },
    );

    await firstValueFrom(interceptor.intercept(context, callHandler()));

    expect(response.statusCode).toBe(201);
  });

  it('deletes an expired record and re-executes the handler', async () => {
    const expired = record({
      createdAt: new Date(Date.now() - IDEMPOTENCY_TTL_MS - 1000),
    });
    service.findByKey.mockResolvedValue(expired);
    service.isExpired.mockReturnValue(true);
    service.remove.mockResolvedValue(undefined);
    service.save.mockResolvedValue(record());
    const { context } = createContext(
      'POST',
      { 'idempotency-key': 'k1' },
      { id: 'user-1' },
    );
    const next = callHandler();
    const handleSpy = jest.spyOn(next, 'handle');

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(service.remove).toHaveBeenCalledWith(expired);
    expect(handleSpy).toHaveBeenCalled();
    expect(service.save).toHaveBeenCalled();
    expect(result).toEqual(transformedBody);
  });

  it('falls back to normal execution if the idempotency lookup fails', async () => {
    service.findByKey.mockRejectedValue(new Error('db down'));
    const { context } = createContext(
      'POST',
      { 'idempotency-key': 'k1' },
      { id: 'user-1' },
    );
    const next = callHandler();
    const handleSpy = jest.spyOn(next, 'handle');

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(handleSpy).toHaveBeenCalled();
    expect(result).toEqual(transformedBody);
  });

  it('propagates handler errors normally', async () => {
    service.findByKey.mockResolvedValue(null);
    const { context } = createContext(
      'POST',
      { 'idempotency-key': 'k1' },
      { id: 'user-1' },
    );
    const next = {
      handle: () => throwError(() => new Error('validation failed')),
    } as CallHandler;

    await expect(
      firstValueFrom(interceptor.intercept(context, next)),
    ).rejects.toThrow('validation failed');
  });
});
