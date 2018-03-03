import * as queryString from 'query-string';
import { HttpMethod, MatcherUrl, RequestUrl } from './types';
import pathToRegex, { Key } from 'path-to-regexp';

export function findRequestUrl(
  input: RequestInfo,
  init?: RequestInit
): RequestUrl {
  if (typeof input === 'string') {
    return input as RequestUrl;
  } else {
    return input.url as RequestUrl;
  }
}

export function findRequestMethod(
  input: RequestInfo,
  init?: RequestInit
): HttpMethod {
  if (typeof input === 'string') {
    return ((init && init.method) || 'GET') as HttpMethod;
  } else {
    return input.method as HttpMethod;
  }
}

export function findPathParams(
  requestUrl: RequestUrl,
  matcherUrl?: MatcherUrl
): object {
  if (!matcherUrl) {
    return {};
  }

  const urlWithoutQueryParams: RequestUrl = requestUrl.split(
    '?'
  )[0] as RequestUrl;
  const keys: Key[] = [];
  const matcherRegex: RegExp = pathToRegex(matcherUrl, keys);
  const match: RegExpExecArray | null = matcherRegex.exec(
    urlWithoutQueryParams
  );

  const sources = keys.map((key, index) => ({
    [key.name]: match && match[index + 1]
  }));
  return Object.assign({}, ...sources);
}

export function findQueryParams(input: RequestInfo, init?: RequestInit) {
  return queryString.parse(queryString.extract(findRequestUrl(input, init)));
}

export function findBody(input: RequestInfo, init?: RequestInit) {
  if (!init) {
    return undefined;
  }

  try {
    return JSON.parse(init.body as string);
  } catch (e) {
    return init.body;
  }
}
