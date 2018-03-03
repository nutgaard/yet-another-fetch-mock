import { FetchMethod, MockHandlerFunction } from './types';

export default class ResponseUtils {
  static json(json: object): MockHandlerFunction {
    return () => ResponseUtils.jsonPromise(json);
  }

  static jsonPromise(json: object): Promise<Response> {
    const response: Response = new Response(JSON.stringify(json));
    return Promise.resolve(response);
  }

  static use(fn: FetchMethod): MockHandlerFunction {
    return ({ input, init }) => fn(input, init);
  }
}
