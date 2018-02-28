import { HttpMethod, MatcherUrl, RequestUrl, RouteMatcher } from './types';
import { findRequestMethod, findRequestUrl } from './utils';
import pathToRegex, { Key } from 'path-to-regexp';

function httpMethodHelper(matcherUrl: MatcherUrl, method: HttpMethod): RouteMatcher {
  if (typeof matcherUrl === 'string') {
    return {
      matcherUrl: matcherUrl,
      test: (input: RequestInfo, init?: RequestInit) => {
        return (
          MatcherUtils.method(method).test(input, init) &&
          MatcherUtils.url(matcherUrl).test(input, init)
        );
      }
    };
  } else {
    throw new Error(`Unknown type of matcherUrl: ${typeof matcherUrl}`);
  }
}

export default class MatcherUtils {
  static method(httpMethod: HttpMethod): RouteMatcher {
    return {
      test: (input: RequestInfo, init?: RequestInit) => {
        return httpMethod === findRequestMethod(input, init);
      }
    };
  }

  static url(matcherUrl: string | RegExp): RouteMatcher {
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
      }
    };
  }

  static get(matcherUrl: MatcherUrl): RouteMatcher {
    return httpMethodHelper(matcherUrl, 'GET');
  }

  static post(matcherUrl: MatcherUrl): RouteMatcher {
    return httpMethodHelper(matcherUrl, 'POST');
  }

  static delete(matcherUrl: MatcherUrl): RouteMatcher {
    return httpMethodHelper(matcherUrl, 'DELETE');
  }

  static put(matcherUrl: MatcherUrl): RouteMatcher {
    return httpMethodHelper(matcherUrl, 'PUT');
  }

  static combine(...matchers: RouteMatcher[]): RouteMatcher {
    return {
      test: (input: RequestInfo, init?: RequestInit) => {
        return matchers.reduce((status, matcher) => status && matcher.test(input, init), true);
      },
      matcherUrl: matchers.map(matcher => matcher.matcherUrl).find(url => !!url)
    };
  }
}
