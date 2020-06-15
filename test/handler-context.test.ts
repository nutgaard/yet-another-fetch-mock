import 'isomorphic-fetch';
import { RequestUrl } from '../src/types';
import MockContext from '../src/mock-context';

describe('MockContext', () => {
  const realFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response> = jest.fn();
  const handlerContext: MockContext = new MockContext(
    {
      input: 'http://mock.url',
      url: 'http://mock.url' as RequestUrl,
      pathParams: {},
      queryParams: {},
      method: 'GET'
    },
    realFetch
  );

  it('should set status code', async done => {
    const result = await handlerContext.status(211)({});
    expect(result.status).toBe(211);
    done();
  });

  it('should set status message', async done => {
    const result = await handlerContext.statusText('Its ok')({});
    expect(result.statusText).toBe('Its ok');
    done();
  });

  it('should wait the correct length of time', async done => {
    const startTime = new Date().getTime();
    await handlerContext.delay(200)({});
    const endTime = new Date().getTime();
    expect(endTime - startTime).toBeGreaterThan(190);
    done();
  });

  it('should set json-body', async done => {
    const result = await handlerContext.json({ key: 'value' })({});
    const headers: Headers = result.headers! as Headers;
    expect(headers.get('Content-Type')).toEqual('application/json');
    expect(result.body).toBe('{"key":"value"}');
    done();
  });

  it('should set text-body', async done => {
    const result = await handlerContext.text('This is some content')({});
    const headers: Headers = result.headers! as Headers;
    expect(headers.get('Content-Type')).toEqual('text/plain');
    expect(result.body).toBe('This is some content');
    done();
  });

  it('it should set header if header is instanceof Headers', async done => {
    const result = await handlerContext.header('key', 'value')({});
    const headers: Headers = result.headers! as Headers;
    expect(headers.get('key')).toEqual('value');
    done();
  });

  it('it should set header if header is instanceof string[][]', async done => {
    const result = await handlerContext.header('key', 'value')({
      headers: []
    });
    expect(result.headers).toEqual([['key', 'value']]);
    done();
  });

  it('it should set header if header is instanceof Record<string, string>', async done => {
    const result = await handlerContext.header('key', 'value')({
      headers: {}
    });
    expect(result.headers).toEqual({ key: 'value' });
    done();
  });

  it('should use realFetch', async done => {
    await handlerContext.fetch();
    expect(realFetch).toBeCalledTimes(1);
    done();
  });
});
