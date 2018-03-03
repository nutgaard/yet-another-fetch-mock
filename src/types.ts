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
  input: RequestInfo;
  init?: RequestInit;
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

export type MockHandler = ((args: HandlerArgument) => Promise<Response>) | object;
export type MockHandlerFunction = (args: HandlerArgument) => Promise<Response>;
export type RequestUrl = Opaque<'RequestUrl', string>;
export type MatcherUrl = Opaque<'MatcherUrl', string>;

export interface Route {
  matcher: RouteMatcher;
  handler: MockHandlerFunction;
}
