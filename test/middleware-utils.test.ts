import { HandlerArgument, ResponseData } from '../src/types';
import MathMock from './math-mock';
import { JSONValue } from '../src/yet-another-fetch-mock';
import MiddlewareUtils from '../src/middleware-utils';

describe('middleware-utils', () => {
  beforeAll(MathMock.setup);
  afterAll(MathMock.teardown);

  it('should combine middlewares', done => {
    MathMock.fixRandom(0.2);
    const delay = jest.fn(MiddlewareUtils.delayMiddleware(100));
    const failure = jest.fn(MiddlewareUtils.failurerateMiddleware(0.3, { status: 1337 }));
    const startTime = new Date().getTime();

    const combined = MiddlewareUtils.combine(delay, failure);
    const result = combined({} as HandlerArgument, 'data' as ResponseData);

    (result as Promise<ResponseData>).then(res => {
      const endTime = new Date().getTime();
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);

      expect(res.status).toBe(1337);
      expect(delay).toHaveBeenCalledTimes(1);
      expect(failure).toHaveBeenCalledTimes(1);
      done();
    });
  });

  it('should delay the response', done => {
    const delay = MiddlewareUtils.delayMiddleware(100);
    const result = delay({} as HandlerArgument, 'delayed' as ResponseData);
    const startTime = new Date().getTime();

    (result as Promise<String>).then(res => {
      const endTime = new Date().getTime();

      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
      expect(res).toBe('delayed');
      done();
    });
  });

  it('should have a random failure rate', done => {
    MathMock.fixRandom(0.2);
    const delay = MiddlewareUtils.failurerateMiddleware(0.3);
    const result = delay({} as HandlerArgument, 'normal-response' as ResponseData);

    (result as Promise<ResponseData>).then(res => {
      expect(res.status).toBe(500);
      done();
    });
  });

  it('should have a random failure rate2', done => {
    MathMock.fixRandom(0.4);
    const delay = MiddlewareUtils.failurerateMiddleware(0.3);
    const result = delay({} as HandlerArgument, 'normal-response' as ResponseData);

    (result as Promise<String>).then(res => {
      expect(res).toBe('normal-response');
      done();
    });
  });

  it('should support custom error response', done => {
    MathMock.fixRandom(0.2);
    const delay = MiddlewareUtils.failurerateMiddleware(0.3, { status: 1337 });
    const result = delay({} as HandlerArgument, 'normal-response' as ResponseData);

    (result as Promise<ResponseData>).then(res => {
      expect(res.status).toBe(1337);
      done();
    });
  });

  it('should support null values in JSON', done => {
    const value: JSONValue = { data: null };
    done();
  });
});
