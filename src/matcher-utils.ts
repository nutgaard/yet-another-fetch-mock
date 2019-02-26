import { HttpMethod, MatcherUrl, RequestUrl, RouteMatcher } from './types';
import { findRequestMethod, findRequestUrl } from './internal-utils';
const pathToRegex = require('path-to-regexp');
import { Key } from 'path-to-regexp';

function httpMethodHelper(matcherUrl: MatcherUrl, httpMethod: HttpMethod): RouteMatcher {
  if (typeof matcherUrl === 'string') {
    return MatcherUtils.combine(MatcherUtils.method(httpMethod), MatcherUtils.url(matcherUrl));
  } else {
    throw new Error(`Unknown type of matcherUrl: ${typeof matcherUrl}`);
  }
}

export default class MatcherUtils {
  static combine(...matchers: RouteMatcher[]): RouteMatcher {
    return {
      test: (input: RequestInfo, init?: RequestInit) => {
        return matchers.reduce((status, matcher) => status && matcher.test(input, init), true);
      },
      matcherUrl: matchers.map(matcher => matcher.matcherUrl).find(url => !!url)
    };
  }

  static method(httpMethod: HttpMethod): RouteMatcher {
    return {
      test: (input: RequestInfo, init?: RequestInit) => {
        return httpMethod === findRequestMethod(input, init).toUpperCase();
      }
    };
  }

  static url(matcherUrl: string): RouteMatcher {
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

  static get(matcherUrl: MatcherUrl): RouteMatcher {
    return httpMethodHelper(matcherUrl, 'GET');
  }

  static post(matcherUrl: MatcherUrl): RouteMatcher {
    return httpMethodHelper(matcherUrl, 'POST');
  }

  static put(matcherUrl: MatcherUrl): RouteMatcher {
    return httpMethodHelper(matcherUrl, 'PUT');
  }

  static del(matcherUrl: MatcherUrl): RouteMatcher {
    return httpMethodHelper(matcherUrl, 'DELETE');
  }
}
