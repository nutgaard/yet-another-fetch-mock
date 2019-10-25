import {
  HandlerArgument,
  JSONValue,
  MockHandler,
  MockHandlerFunction,
  ResponseData
} from './types';
import { testPromise } from './promise-utils';

function execHandler(handler: MockHandler, args: HandlerArgument): Promise<ResponseData> {
  if (typeof handler === 'function') {
    let result = handler(args);
    const isPromise = testPromise(result);
    if (isPromise) {
      return result as Promise<ResponseData>;
    } else {
      return Promise.resolve({ body: result } as ResponseData);
    }
  } else {
    return ResponseUtils.jsonPromise(handler);
  }
}

function unwrap(args: HandlerArgument): (handler: MockHandler) => Promise<ResponseData> {
  return (handler: MockHandler) => {
    if (typeof handler === 'function') {
      const result = handler(args);
      const isPromise = testPromise(result);

      if (isPromise) {
        return result as Promise<ResponseData>;
      }

      return Promise.resolve({ body: result } as ResponseData);
    } else {
      return ResponseUtils.jsonPromise(handler);
    }
  };
}

function merge(into: ResponseData, data: ResponseData): ResponseData {
  return {
    body: into.body || data.body,
    status: into.status || data.status,
    statusText: into.statusText || data.statusText,
    headers: Object.assign({}, data.headers, into.headers)
  } as ResponseData;
}

export default class ResponseUtils {
  static json(json: JSONValue): MockHandlerFunction {
    return () => ResponseUtils.jsonPromise(json);
  }

  static jsonPromise(json: MockHandler): Promise<ResponseData> {
    const response: ResponseData = { body: JSON.stringify(json) };
    return Promise.resolve(response);
  }

  static delayed(delay: number, handler: MockHandler): MockHandler {
    return (args: HandlerArgument) => {
      return new Promise<ResponseData>(resolve => {
        setTimeout(() => resolve(execHandler(handler, args)), delay);
      });
    };
  }

  static statusCode(status: number): MockHandler {
    return (args: HandlerArgument) => {
      const response: ResponseData = { status };
      return Promise.resolve(response);
    };
  }

  static statusText(statusText: string): MockHandler {
    return (args: HandlerArgument) => {
      const response: ResponseData = { statusText };
      return Promise.resolve(response);
    };
  }

  static headers(headers: { [key: string]: string }): MockHandler {
    return (args: HandlerArgument) => {
      const response: ResponseData = { headers };
      return Promise.resolve(response);
    };
  }

  static combine(...handlers: MockHandler[]): MockHandler {
    return (args: HandlerArgument) => {
      return Promise.all(handlers.map(unwrap(args))).then((data: ResponseData[]) =>
        data.reduce(merge, {} as ResponseData)
      );
    };
  }
}
