import {
  FetchMethod,
  FunctionHandler,
  HttpMethod,
  MatcherUrl,
  MockHandler,
  RequestUrl,
  Route,
  RouteMatcher
} from './types';
import {
  findBody,
  findPathParams,
  findQueryParams,
  findRequestMethod,
  findRequestUrl
} from './utils';
import MatcherUtils from './match-utils';

class FetchMock {
  realFetch: FetchMethod;
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
    const handler: MockHandler = matchingRoute.handler;
    if (handler === this.realFetch) {
      const typedHandler: FetchMethod = handler as FetchMethod;
      return typedHandler(input, init);
    } else if (typeof handler === 'function') {
      const typedHandler: FunctionHandler = handler as FunctionHandler;
      const url: RequestUrl = findRequestUrl(input, init);
      const method: HttpMethod = findRequestMethod(input, init);
      const pathParams = findPathParams(url, matchingRoute.matcher.matcherUrl);
      const queryParams = findQueryParams(url);
      const body = findBody(input, init);

      const response: Response = new Response(
        JSON.stringify(typedHandler({ url, method, pathParams, queryParams, body }))
      );
      return Promise.resolve(response);
    } else {
      const response: Response = new Response(JSON.stringify(handler));
      return Promise.resolve(response);
    }
  }

  get(url: string, handler: MockHandler): void {
    this.mock(MatcherUtils.get(url as MatcherUrl), handler);
  }

  post(url: string, handler: MockHandler): void {
    this.mock(MatcherUtils.post(url as MatcherUrl), handler);
  }

  delete(url: string, handler: MockHandler): void {
    this.mock(MatcherUtils.delete(url as MatcherUrl), handler);
  }

  put(url: string, handler: MockHandler): void {
    this.mock(MatcherUtils.put(url as MatcherUrl), handler);
  }

  mock(matcher: RouteMatcher, handler: MockHandler) {
    this.routes.push({ matcher, handler });
  }

  _findMatchingRoute(input: RequestInfo, init?: RequestInit): Route | undefined {
    return this.routes.find((route: Route) => {
      return route.matcher.test(input, init);
    });
  }
}

export default FetchMock;
