import { MockRequest, Middleware, ResponseData } from './types';

const defaultFailure: ResponseData = {
  status: 500,
  statusText: 'Internal server error'
};

export default class MiddlewareUtils {
  static combine(...middlewares: Middleware[]): Middleware {
    return (request: MockRequest, response: ResponseData) => {
      return middlewares.reduce(
        (currentResponse, middleware) => currentResponse.then(resp => middleware(request, resp)),
        Promise.resolve(response)
      );
    };
  }

  static delayMiddleware(delayMs: number): Middleware {
    return (request: MockRequest, response: ResponseData) => {
      return new Promise<ResponseData>(resolve => {
        setTimeout(() => resolve(response), delayMs);
      });
    };
  }

  static failurerateMiddleware(
    probabilityOfFailure: number,
    failure: ResponseData = defaultFailure
  ): Middleware {
    return (request: MockRequest, response: ResponseData) => {
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

  static loggingMiddleware(): Middleware {
    return (request, response) => {
      // tslint:disable
      console.groupCollapsed(`${request.method} ${request.url}`);
      console.groupCollapsed('config');
      console.log('queryParams', request.queryParams);
      console.log('pathParams', request.pathParams);
      console.log('body', request.body);
      if (request.init) {
        console.log('header', request.init.headers);
      }
      console.groupEnd();

      try {
        console.log('response', JSON.parse(response.body));
      } catch (e) {
        console.log('response', response);
      }

      console.groupEnd();
      // tslint:enable
      return response;
    };
  }
}
