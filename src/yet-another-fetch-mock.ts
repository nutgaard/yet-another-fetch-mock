import {
  Configuration,
  HttpMethod,
  MatcherUrl,
  MockHandler,
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
import ResponseUtils from './response-utils';

const defaultConfiguration: Configuration = {
  enableFallback: true,
  middleware: (request, response) => response
};

class FetchMock {
  private realFetch: (
    input: RequestInfo,
    init?: RequestInit
  ) => Promise<Response>;
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

  static configure(
    configuration: Partial<Configuration> = defaultConfiguration
  ): FetchMock {
    return new FetchMock(window, configuration);
  }

  restore() {
    this.scope.fetch = this.realFetch;
  }

  get(url: string, handler: MockHandler): void {
    this.mock(MatcherUtils.get(url as MatcherUrl), handler);
  }

  post(url: string, handler: MockHandler): void {
    this.mock(MatcherUtils.post(url as MatcherUrl), handler);
  }

  delete(url: string, handler: MockHandler): void {
    this.mock(MatcherUtils.del(url as MatcherUrl), handler);
  }

  put(url: string, handler: MockHandler): void {
    this.mock(MatcherUtils.put(url as MatcherUrl), handler);
  }

  mock(matcher: RouteMatcher, handler: MockHandler) {
    if (typeof handler === 'function') {
      this.routes.push({ matcher, handler });
    } else {
      this.routes.push({ matcher, handler: ResponseUtils.json(handler) });
    }
  }

  private fetchproxy(
    input: RequestInfo,
    init?: RequestInit
  ): Promise<Response> {
    const matchingRoute: Route | undefined = this.findMatchingRoute(
      input,
      init
    );
    const url: RequestUrl = findRequestUrl(input, init);
    const method: HttpMethod = findRequestMethod(input, init);
    const queryParams = findQueryParams(url);
    const body = findBody(input, init);
    let pathParams: object = {};
    let response: Promise<ResponseData>;

    if (typeof matchingRoute === 'undefined') {
      if (this.configuration.enableFallback) {
        response = this.realFetch(input, init);
      } else {
        throw new Error(`Did not find any matching route for url: ${url}`);
      }
    } else {
      pathParams = findPathParams(url, matchingRoute.matcher.matcherUrl);
      response = matchingRoute.handler({
        input,
        init,
        url,
        method,
        pathParams,
        queryParams,
        body
      });
    }

    return response
      .then(resp =>
        this.configuration.middleware(
          { input, init, url, method, queryParams, pathParams, body },
          resp
        )
      )
      .then(
        ({ body, status, statusText, headers }: ResponseData) =>
          new Response(body, { status, statusText, headers })
      );
  }

  private findMatchingRoute(
    input: RequestInfo,
    init?: RequestInit
  ): Route | undefined {
    return this.routes.find((route: Route) => {
      return route.matcher.test(input, init);
    });
  }
}

export default FetchMock;

export { default as MatcherUtils } from './matcher-utils';
export { default as ResponseUtils } from './response-utils';
