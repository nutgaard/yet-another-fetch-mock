import { MockRequest, ResponseData, RouteMatcher } from './types.js';

const allMatcher: RouteMatcher = {
  test(input: RequestInfo, init?: RequestInit) {
    return true;
  },
};

export interface Entry {
  request: MockRequest;
  response: ResponseData;
}

export default class SpyMiddleware {
  private entries: Entry[];

  constructor() {
    this.middleware = this.middleware.bind(this);
    this.entries = [];
  }

  middleware(request: MockRequest, response: ResponseData): ResponseData | Promise<ResponseData> {
    const entry = { request, response };
    this.entries.unshift(entry);
    return response;
  }

  reset() {
    this.entries = [];
  }

  calls(matcher: RouteMatcher = allMatcher) {
    return this.entries.filter((entry) => matcher.test(entry.request.input, entry.request.init));
  }

  lastCall(matcher: RouteMatcher = allMatcher) {
    return this.entries.find((entry) => matcher.test(entry.request.input, entry.request.init));
  }

  called(matcher: RouteMatcher = allMatcher) {
    return this.lastCall(matcher) !== undefined;
  }

  lastUrl(matcher: RouteMatcher = allMatcher) {
    const lastCalled = this.lastCall(matcher);
    return lastCalled ? lastCalled.request.input : undefined;
  }

  lastOptions(matcher: RouteMatcher = allMatcher) {
    const lastCalled = this.lastCall(matcher);
    return lastCalled ? lastCalled.request.init : undefined;
  }

  size() {
    return this.entries.length;
  }
}
