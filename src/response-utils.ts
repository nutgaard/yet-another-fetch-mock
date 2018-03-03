import { HandlerArgument, MockHandler, MockHandlerFunction } from './types';

function execHandler(
  handler: MockHandler,
  args: HandlerArgument
): Promise<Response> {
  if (typeof handler === 'function') {
    return handler(args);
  } else {
    return ResponseUtils.jsonPromise(handler);
  }
}

export default class ResponseUtils {
  static json(json: object): MockHandlerFunction {
    return () => ResponseUtils.jsonPromise(json);
  }

  static jsonPromise(json: MockHandler): Promise<Response> {
    const response: Response = new Response(JSON.stringify(json));
    return Promise.resolve(response);
  }

  static delayed(delay: number, handler: MockHandler): MockHandler {
    return (args: HandlerArgument) => {
      return new Promise<Response>(resolve => {
        setTimeout(() => resolve(execHandler(handler, args)), delay);
      });
    };
  }
}
