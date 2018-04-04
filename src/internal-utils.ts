import * as queryString from 'query-string';
import {
  HandlerArgument,
  HttpMethod,
  MatcherUrl,
  MockHandler,
  MockHandlerFunction,
  RequestUrl,
  ResponseData
} from './types';
import pathToRegex, { Key } from 'path-to-regexp';
import ResponseUtils from './response-utils';

export function findRequestUrl(input: RequestInfo, init?: RequestInit): RequestUrl {
  if (typeof input === 'string') {
    return input as RequestUrl;
  } else {
    return input.url as RequestUrl;
  }
}

export function findRequestMethod(input: RequestInfo, init?: RequestInit): HttpMethod {
  if (typeof input === 'string') {
    return ((init && init.method) || 'GET') as HttpMethod;
  } else {
    return input.method as HttpMethod;
  }
}

export function findPathParams(requestUrl: RequestUrl, matcherUrl?: MatcherUrl): object {
  if (!matcherUrl) {
    return {};
  }

  const urlWithoutQueryParams: RequestUrl = requestUrl.split('?')[0] as RequestUrl;
  const keys: Key[] = [];
  const matcherRegex: RegExp = pathToRegex(matcherUrl, keys);
  const match: RegExpExecArray | null = matcherRegex.exec(urlWithoutQueryParams);

  const sources = keys.map((key, index) => ({
    [key.name]: match && match[index + 1]
  }));
  return Object.assign({}, ...sources);
}

export function findQueryParams(input: RequestInfo, init?: RequestInit) {
  return queryString.parse(queryString.extract(findRequestUrl(input, init)));
}

export function findBody(input: RequestInfo, init?: RequestInit) {
  if (!init) {
    return undefined;
  }

  try {
    return JSON.parse(init.body as string);
  } catch (e) {
    return init.body;
  }
}

export function testPromise(data: any): boolean {
  return Promise.resolve(data) == data; // tslint:disable-line
}

export function toMockHandlerFunction(handler: MockHandler): MockHandlerFunction {
  if (typeof handler === 'function') {
    return (args: HandlerArgument) =>
      new Promise<ResponseData>((resolve, reject) => {
        const result = handler(args);
        const isPromise = testPromise(result);
        if (isPromise) {
          resolve(result as Promise<ResponseData>);
        } else {
          const response: ResponseData = { body: JSON.stringify(result) } as ResponseData;
          resolve(response);
        }
      });
  } else {
    return ResponseUtils.json(handler);
  }
}
