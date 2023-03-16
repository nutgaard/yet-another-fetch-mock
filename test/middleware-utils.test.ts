import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { MockRequest, ResponseData } from '../src/types';
import MathMock from './math-mock';
import MiddlewareUtils from '../src/middleware-utils';
import ConsoleMock from './console-mock';

describe('middleware-utils', () => {
  beforeAll(() => {
    MathMock.setup();
    ConsoleMock.setup();
  });

  afterAll(() => {
    MathMock.teardown();
    ConsoleMock.teardown();
  });

  it('should combine middlewares', async () => {
    MathMock.fixRandom(0.2);
    const delay = vi.fn(MiddlewareUtils.delayMiddleware(100));
    const failure = vi.fn(MiddlewareUtils.failurerateMiddleware(0.3, { status: 1337 }));
    const startTime = new Date().getTime();

    const combined = MiddlewareUtils.combine(delay, failure);
    const result = combined({} as MockRequest, 'data' as ResponseData);

    await (result as Promise<ResponseData>).then((res) => {
      const endTime = new Date().getTime();
      expect(endTime - startTime).toBeGreaterThanOrEqual(90);

      expect(res.status).toBe(1337);
      expect(delay).toHaveBeenCalledTimes(1);
      expect(failure).toHaveBeenCalledTimes(1);
    });
  });

  it('should delay the response', async () => {
    const delay = MiddlewareUtils.delayMiddleware(100);
    const result = delay({} as MockRequest, 'delayed' as ResponseData);
    const startTime = new Date().getTime();

    await (result as Promise<String>).then((res) => {
      const endTime = new Date().getTime();

      expect(endTime - startTime).toBeGreaterThanOrEqual(90);
      expect(res).toBe('delayed');
    });
  });

  it('should have a random failure rate', async () => {
    MathMock.fixRandom(0.2);
    const delay = MiddlewareUtils.failurerateMiddleware(0.3);
    const result = delay({} as MockRequest, 'normal-response' as ResponseData);

    await (result as Promise<ResponseData>).then((res) => {
      expect(res.status).toBe(500);
    });
  });

  it('should have a random failure rate2', async () => {
    MathMock.fixRandom(0.4);
    const delay = MiddlewareUtils.failurerateMiddleware(0.3);
    const result = delay({} as MockRequest, 'normal-response' as ResponseData);

    await (result as Promise<String>).then((res) => {
      expect(res).toBe('normal-response');
    });
  });

  it('should support custom error response', async () => {
    MathMock.fixRandom(0.2);
    const delay = MiddlewareUtils.failurerateMiddleware(0.3, { status: 1337 });
    const result = delay({} as MockRequest, 'normal-response' as ResponseData);

    await (result as Promise<ResponseData>).then((res) => {
      expect(res.status).toBe(1337);
    });
  });

  it('should should log the request', () => {
    const logging = MiddlewareUtils.loggingMiddleware();
    logging({ init: { headers: {} } } as MockRequest, 'resp' as ResponseData);

    expect(console.log).toBeCalledTimes(5);
  });
});
