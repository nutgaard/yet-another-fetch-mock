import pathToRegex, { Key } from 'path-to-regexp';
import * as queryString from 'query-string';

export type Opaque<K, T> = T & { __TYPE__: K };

export type HttpMethod =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'PATCH';

export type RequestUrl = Opaque<'RequestUrl', string>;
export type MatcherUrl = Opaque<'MatcherUrl', string>;

export interface FunctionHandlerArguments {
  body?: object;
  pathParams: object;
  queryParams: {};
  url: RequestUrl;
  method: HttpMethod;
}

export interface TestedUrl {
  test: boolean;
  match: RegExpExecArray | null;
  keys: Key[];
}
export type RouteMatcherFn = (input: RequestInfo, init?: RequestInit) => TestedUrl;
export type RouteMatcher = string | RegExp | RouteMatcherFn;
export type FunctionHandler = (args: FunctionHandlerArguments) => ValueHandler;
export type ValueHandler = object | Promise<Response>;
export type Handler = FunctionHandler | ValueHandler;

export interface Route {
  matcher: RouteMatcherFn;
  handler: Handler;
}

function findRequestUrl(input: RequestInfo, init?: RequestInit): RequestUrl {
  if (typeof input === 'string') {
    return input as RequestUrl;
  } else {
    return input.url as RequestUrl;
  }
}

function findRequestMethod(input: RequestInfo, init?: RequestInit): HttpMethod {
  if (typeof input === 'string') {
    return ((init && init.method) || 'GET') as HttpMethod;
  } else {
    return input.method as HttpMethod;
  }
}

function createRouteMatcher(method: HttpMethod, url: MatcherUrl): RouteMatcherFn {
  return (input: RequestInfo, init?: RequestInit) => {
    const requestUrl: RequestUrl = findRequestUrl(input, init);
    const requestMethod: HttpMethod = findRequestMethod(input, init);

    const tested = testUrl(requestUrl, url);

    if (requestMethod !== method) {
      return { ...tested, test: false };
    }

    return tested;
  };
}

function testUrl(requestUrl: RequestUrl, matcherUrl: MatcherUrl): TestedUrl {
  const urlWithoutQueryParams: RequestUrl = requestUrl.split('?')[0] as RequestUrl;
  const keys: Key[] = [];
  const matcherRegex: RegExp = pathToRegex(matcherUrl, keys);
  const match: RegExpExecArray | null = matcherRegex.exec(urlWithoutQueryParams);

  return {
    test: !!match,
    match,
    keys
  };
}

function findPathParams(tested: TestedUrl): object {
  const sources = tested.keys.map((key, index) => ({
    [key.name]: tested.match && tested.match[index + 1]
  }));
  return Object.assign({}, ...sources);
}

function findQueryParams(url: RequestUrl) {
  return queryString.parse(queryString.extract(url));
}

function findBody(init: RequestInit | undefined) {
  debugger;
  if (!init) {
    return undefined;
  }

  try {
    return JSON.parse(init.body);
  } catch (e) {
    return init.body;
  }
}

class FetchMock {
  private realFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  private routes: Route[];
  private scope: Window;

  constructor(scope: Window) {
    this.scope = scope;
    this.realFetch = scope.fetch;
    this.routes = [];
    this.scope.fetch = this.fetchproxy.bind(this);
  }

  static init(): FetchMock {
    return new FetchMock(window);
  }

  restore() {
    this.scope.fetch = this.realFetch;
  }

  fetchproxy(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const matchingRoute: Route | undefined = this._findMatchingRoute(input, init);
    if (typeof matchingRoute === 'undefined') {
      throw new Error('Matching route not found...');
    }
    const handler: Handler = matchingRoute.handler;
    if (typeof handler === 'function') {
      const url: RequestUrl = findRequestUrl(input, init);
      const method: HttpMethod = findRequestMethod(input, init);
      const pathParams = findPathParams(matchingRoute.matcher(input, init));
      const queryParams = findQueryParams(url);
      const body = findBody(init);

      const response: Response = new Response(
        JSON.stringify(handler({ url, method, pathParams, queryParams, body }))
      );
      return Promise.resolve(response);
    } else {
      const response: Response = new Response(JSON.stringify(handler));
      return Promise.resolve(response);
    }
  }

  get(url: RouteMatcher, handler: Handler): void {
    this.mock('GET', url, handler);
  }

  post(url: RouteMatcher, handler: Handler): void {
    this.mock('POST', url, handler);
  }

  delete(url: RouteMatcher, handler: Handler): void {
    this.mock('DELETE', url, handler);
  }

  put(url: RouteMatcher, handler: Handler): void {
    this.mock('PUT', url, handler);
  }

  mock(method: HttpMethod, url: RouteMatcher, handler: Handler) {
    if (typeof url === 'string' || url instanceof RegExp) {
      const matcher: RouteMatcherFn = createRouteMatcher(method, url as MatcherUrl);
      this.routes.push({ matcher, handler });
    } else if (typeof url === 'function') {
      this.routes.push({ matcher: url, handler });
    } else {
      throw new Error(`Unknown type for 'url': ${typeof url}. Expected string or function`);
    }
  }

  _findMatchingRoute(input: RequestInfo, init?: RequestInit): Route | undefined {
    return this.routes.find((route: Route) => {
      return route.matcher(input, init).test;
    });
  }
}

export default FetchMock;
