import HandlerContext from './handler-context';

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

export interface HandlerRequest {
  input: RequestInfo;
  init?: RequestInit;
  body?: any;
  pathParams: any;
  queryParams: any;
  url: RequestUrl;
  method: HttpMethod;
}
export type HandlerResponseElement = (data: ResponseData) => Promise<ResponseData>;
export type HandlerResponse = (...elements: Array<HandlerResponseElement>) => Promise<ResponseData>;
export type Handler = (
  req: HandlerRequest,
  res: HandlerResponse,
  ctx: HandlerContext
) => Promise<ResponseData>;

export type RequestUrl = Opaque<'RequestUrl', string>;
export type MatcherUrl = Opaque<'MatcherUrl', string>;

export interface Route {
  matcher: RouteMatcher;
  handler: Handler;
}

export type Middleware = (
  request: HandlerRequest,
  response: ResponseData
) => ResponseData | Promise<ResponseData>;

export interface Configuration {
  enableFallback: boolean;
  ignoreMiddlewareIfFallback: boolean;
  middleware: Middleware;
}
