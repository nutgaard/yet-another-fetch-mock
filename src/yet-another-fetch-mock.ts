import {
  Configuration,
  MockHandler,
  MockRequest,
  MockResponse,
  HandlerResponseElement,
  HttpMethod,
  MatcherUrl,
  RequestUrl,
  ResponseData,
  Route,
  RouteMatcher
} from './types';
import {
  findBody,
  findPathParams,
  findQueryParams,
  findRequestMethod,
  findRequestUrl
} from './internal-utils';
import MatcherUtils from './matcher-utils';
import MockContext from './mock-context';

const defaultConfiguration: Configuration = {
  enableFallback: true,
  ignoreMiddlewareIfFallback: false,
  middleware: (request, response) => response
};

class FetchMock {
  private realFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  private configuration: Configuration;
  private routes: Route[];
  private scope: GlobalFetch;

  constructor(scope: GlobalFetch, configuration: Partial<Configuration>) {
    this.scope = scope;
    this.configuration = Object.assign({}, defaultConfiguration, configuration);
    this.realFetch = scope.fetch;
    this.routes = [];
    this.scope.fetch = this.fetchproxy.bind(this);
  }

  static configure(configuration: Partial<Configuration> = defaultConfiguration): FetchMock {
    return new FetchMock(window, configuration);
  }

  restore() {
    this.scope.fetch = this.realFetch;
  }

  get(url: string, handler: MockHandler): void {
    this.mock(MatcherUtils.get(url as MatcherUrl), handler);
  }

  head(url: string, handler: MockHandler): void {
    this.mock(MatcherUtils.head(url as MatcherUrl), handler);
  }

  post(url: string, handler: MockHandler): void {
    this.mock(MatcherUtils.post(url as MatcherUrl), handler);
  }

  put(url: string, handler: MockHandler): void {
    this.mock(MatcherUtils.put(url as MatcherUrl), handler);
  }

  delete(url: string, handler: MockHandler): void {
    this.mock(MatcherUtils.del(url as MatcherUrl), handler);
  }

  connect(url: string, handler: MockHandler): void {
    this.mock(MatcherUtils.connect(url as MatcherUrl), handler);
  }

  options(url: string, handler: MockHandler): void {
    this.mock(MatcherUtils.options(url as MatcherUrl), handler);
  }

  patch(url: string, handler: MockHandler): void {
    this.mock(MatcherUtils.patch(url as MatcherUrl), handler);
  }

  mock(matcher: RouteMatcher, handler: MockHandler) {
    this.routes.push({ matcher, handler });
  }

  reset() {
    this.routes = [];
  }

  private fetchproxy(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const matchingRoute: Route | undefined = this.findMatchingRoute(input, init);
    const url: RequestUrl = findRequestUrl(input, init);
    const method: HttpMethod = findRequestMethod(input, init);
    const queryParams = findQueryParams(url);
    const body = findBody(input, init);
    let pathParams: object = {};
    let response: Promise<ResponseData>;

    if (typeof matchingRoute === 'undefined') {
      if (this.configuration.enableFallback) {
        console.warn(
          `Did not find any matching route for: ${method.toUpperCase()} ${url}. Defaulting to the real fetch-implementation.`
        );
        response = this.realFetch.call(this.scope, input, init);
        if (this.configuration.ignoreMiddlewareIfFallback) {
          return response as Promise<Response>;
        }
      } else {
        throw new Error(`Did not find any matching route for: ${method.toUpperCase()} ${url}.`);
      }
    } else {
      pathParams = findPathParams(url, matchingRoute.matcher.matcherUrl);
      const req: MockRequest = { input, init, url, method, pathParams, queryParams, body };
      const res: MockResponse = async (...args: Array<HandlerResponseElement>) => {
        let responseData: ResponseData = {};
        for (const responseElement of args) {
          responseData = await responseElement(responseData);
        }

        return responseData;
      };
      const ctx = new MockContext(req, this.realFetch);

      response = matchingRoute.handler(req, res, ctx);
    }

    return response
      .then(resp =>
        this.configuration.middleware(
          { input, init, url, method, queryParams, pathParams, body },
          resp
        )
      )
      .then(
        ({ body, status = 200, statusText = 'OK', headers = {} }: ResponseData) =>
          new Response(body, { status, statusText, headers })
      );
  }

  private findMatchingRoute(input: RequestInfo, init?: RequestInit): Route | undefined {
    return this.routes.find((route: Route) => {
      return route.matcher.test(input, init);
    });
  }
}

export default FetchMock;

export { default as MatcherUtils } from './matcher-utils';
export { default as MiddlewareUtils } from './middleware-utils';
export { default as SpyMiddleware } from './spy-middleware';
export * from './types';
