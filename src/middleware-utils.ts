import { HandlerArgument, Middleware, ResponseData } from './types';

const defaultFailure: ResponseData = {
  status: 500,
  statusText: 'Internal server error'
};

export default class MiddlewareUtils {
  static combine(...middlewares: Middleware[]): Middleware {
    return (request: HandlerArgument, response: ResponseData) => {
      return middlewares.reduce(
        (currentResponse, middleware) => currentResponse.then(resp => middleware(request, resp)),
        Promise.resolve(response)
      );
    };
  }

  static delayMiddleware(delayMs: number): Middleware {
    return (request: HandlerArgument, response: ResponseData) => {
      return new Promise<ResponseData>(resolve => {
        setTimeout(() => resolve(response), delayMs);
      });
    };
  }

  static failurerateMiddleware(
    probabilityOfFailure: number,
    failure: ResponseData = defaultFailure
  ): Middleware {
    return (request: HandlerArgument, response: ResponseData) => {
      return new Promise<ResponseData>(resolve => {
        const rnd = Math.random();

        if (rnd < probabilityOfFailure) {
          resolve(failure);
        } else {
          resolve(response);
        }
      });
    };
  }
}
