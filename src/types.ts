import MockContext from './mock-context.js';
export { default as MockContext } from './mock-context.js';

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

export interface RouteMatcher {
  test: (input: RequestInfo, init?: RequestInit) => boolean;
  matcherUrl?: MatcherUrl;
}

export interface ResponseData {
  body?: any;
  headers?: HeadersInit;
  status?: number;
  statusText?: string;
}

export interface MockRequest {
  input: RequestInfo;
  init?: RequestInit;
  body?: any;
  pathParams: any;
  queryParams: any;
  url: RequestUrl;
  method: HttpMethod;
}
export type HandlerResponseElement = (data: ResponseData) => Promise<ResponseData>;
export type MockResponse = (...elements: Array<HandlerResponseElement>) => Promise<ResponseData>;
export type MockHandler = (
  req: MockRequest,
  res: MockResponse,
  ctx: MockContext
) => Promise<ResponseData>;

export type RequestUrl = Opaque<'RequestUrl', string>;
export type MatcherUrl = Opaque<'MatcherUrl', string>;

export interface Route {
  matcher: RouteMatcher;
  handler: MockHandler;
}

export type Middleware = (
  request: MockRequest,
  response: ResponseData
) => ResponseData | Promise<ResponseData>;

export interface Configuration {
  enableFallback: boolean;
  suppressRealFetchWarning: boolean;
  ignoreMiddlewareIfFallback: boolean;
  middleware: Middleware;
}
