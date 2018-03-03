import { HttpMethod, MatcherUrl, RequestUrl, Route, RouteMatcher } from './types';
import { findRequestMethod, findRequestUrl } from './utils';
import pathToRegex, { Key } from 'path-to-regexp';

function httpMethodHelper(matcherUrl: MatcherUrl, httpMethod: HttpMethod): RouteMatcher {
  if (typeof matcherUrl === 'string') {
    return combine(method(httpMethod), url(matcherUrl));
  } else {
    throw new Error(`Unknown type of matcherUrl: ${typeof matcherUrl}`);
  }
}

export function combine(...matchers: RouteMatcher[]): RouteMatcher {
  return {
    test: (input: RequestInfo, init?: RequestInit) => {
      return matchers.reduce((status, matcher) => status && matcher.test(input, init), true);
    },
    matcherUrl: matchers.map(matcher => matcher.matcherUrl).find(url => !!url)
  };
}

export function method(httpMethod: HttpMethod): RouteMatcher {
  return {
    test: (input: RequestInfo, init?: RequestInit) => {
      return httpMethod === findRequestMethod(input, init);
    }
  };
}

export function url(matcherUrl: string): RouteMatcher {
  return {
    test: (input: RequestInfo, init?: RequestInit) => {
      if (matcherUrl === '*') {
        return true;
      }

      const url = findRequestUrl(input, init);
      const urlWithoutQueryParams: RequestUrl = url.split('?')[0] as RequestUrl;
      const keys: Key[] = [];
      const matcherRegex: RegExp = pathToRegex(matcherUrl, keys);
      const match: RegExpExecArray | null = matcherRegex.exec(urlWithoutQueryParams);

      return !!match;
    },
    matcherUrl: matcherUrl as MatcherUrl
  };
}

export function get(matcherUrl: MatcherUrl): RouteMatcher {
  return httpMethodHelper(matcherUrl, 'GET');
}

export function post(matcherUrl: MatcherUrl): RouteMatcher {
  return httpMethodHelper(matcherUrl, 'POST');
}

export function put(matcherUrl: MatcherUrl): RouteMatcher {
  return httpMethodHelper(matcherUrl, 'PUT');
}

export function del(matcherUrl: MatcherUrl): RouteMatcher {
  return httpMethodHelper(matcherUrl, 'DELETE');
}
