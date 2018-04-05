export type Opaque<K, T> = T & { __TYPE__: K };

export type JSONValue = string | number | boolean | JSONObject | JSONArray;
export type JSONObject = { [member: string]: JSONValue };
export interface JSONArray extends Array<JSONValue> {}

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
  body?: any;
  pathParams: any;
  queryParams: any;
  url: RequestUrl;
  method: HttpMethod;
}

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

export type MockHandler =
  | ((args: HandlerArgument) => Promise<ResponseData>)
  | ((args: HandlerArgument) => JSONValue)
  | JSONValue;

export type MockHandlerFunction = (args: HandlerArgument) => Promise<ResponseData>;
export type RequestUrl = Opaque<'RequestUrl', string>;
export type MatcherUrl = Opaque<'MatcherUrl', string>;

export interface Route {
  matcher: RouteMatcher;
  handler: MockHandlerFunction;
}

export type Middleware = (
  request: HandlerArgument,
  response: ResponseData
) => ResponseData | Promise<ResponseData>;
export interface Configuration {
  enableFallback: boolean;
  middleware: Middleware;
}
