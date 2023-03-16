import 'isomorphic-fetch';
import { describe, it, expect, vi } from 'vitest';
import { RequestUrl } from '../src/types';
import MockContext from '../src/mock-context';

describe('MockContext', () => {
  const realFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response> = vi.fn();
  const handlerContext: MockContext = new MockContext(
    {
      input: 'http://mock.url',
      url: 'http://mock.url' as RequestUrl,
      pathParams: {},
      queryParams: {},
      method: 'GET',
    },
    realFetch
  );

  it('should set status code', async () => {
    const result = await handlerContext.status(211)({});
    expect(result.status).toBe(211);
  });

  it('should set status message', async () => {
    const result = await handlerContext.statusText('Its ok')({});
    expect(result.statusText).toBe('Its ok');
  });

  it('should wait the correct length of time', async () => {
    const startTime = new Date().getTime();
    await handlerContext.delay(200)({});
    const endTime = new Date().getTime();
    expect(endTime - startTime).toBeGreaterThan(190);
  });

  it('should set json-body', async () => {
    const result = await handlerContext.json({ key: 'value' })({});
    const headers: Headers = result.headers! as Headers;
    expect(headers.get('Content-Type')).toEqual('application/json');
    expect(result.body).toBe('{"key":"value"}');
  });

  it('should set text-body', async () => {
    const result = await handlerContext.text('This is some content')({});
    const headers: Headers = result.headers! as Headers;
    expect(headers.get('Content-Type')).toEqual('text/plain');
    expect(result.body).toBe('This is some content');
  });

  it('it should set header if header is instanceof Headers', async () => {
    const result = await handlerContext.header('key', 'value')({});
    const headers: Headers = result.headers! as Headers;
    expect(headers.get('key')).toEqual('value');
  });

  it('it should set header if header is instanceof string[][]', async () => {
    const result = await handlerContext.header(
      'key',
      'value'
    )({
      headers: [],
    });
    expect(result.headers).toEqual([['key', 'value']]);
  });

  it('it should set header if header is instanceof Record<string, string>', async () => {
    const result = await handlerContext.header(
      'key',
      'value'
    )({
      headers: {},
    });
    expect(result.headers).toEqual({ key: 'value' });
  });

  it('should use realFetch', async () => {
    await handlerContext.fetch();
    expect(realFetch).toBeCalledTimes(1);
  });
});
