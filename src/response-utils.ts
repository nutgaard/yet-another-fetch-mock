import { FetchMethod, MockHandlerFunction } from './types';

export function json(json: object): MockHandlerFunction {
  return () => jsonPromise(json);
}

export function jsonPromise(json: object): Promise<Response> {
  const response: Response = new Response(JSON.stringify(json));
  return Promise.resolve(response);
}

export function use(fn: FetchMethod): MockHandlerFunction {
  return ({ input, init }) => fn(input, init);
}
