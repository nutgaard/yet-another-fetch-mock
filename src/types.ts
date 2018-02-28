import { Key } from 'path-to-regexp';

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

export interface HandlerArgument {
  body?: object;
  pathParams: object;
  queryParams: object;
  url: RequestUrl;
  method: HttpMethod;
}

export interface RequestMatchedUrl {
  test: boolean;
  match: RegExpExecArray | null;
  keys: Key[];
}
export type FetchMethod = (input: RequestInfo, init?: RequestInit) => Promise<Response>;
export interface RouteMatcher {
  test: (input: RequestInfo, init?: RequestInit) => boolean;
  matcherUrl?: MatcherUrl;
}
export type ValueHandler = object | Promise<Response>;
export type FunctionHandler = (args: HandlerArgument) => ValueHandler;
export type MockHandler = FunctionHandler | ValueHandler | FetchMethod;
export type RequestUrl = Opaque<'RequestUrl', string>;
export type MatcherUrl = Opaque<'MatcherUrl', string>;
export interface Route {
  matcher: RouteMatcher;
  handler: MockHandler;
}
