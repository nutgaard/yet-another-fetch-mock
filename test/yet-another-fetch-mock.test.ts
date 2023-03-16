import 'isomorphic-fetch';
import { Request } from 'node-fetch';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import FetchMock from '../src/yet-another-fetch-mock';

function fetchToJson(url: string, options?: RequestInit) {
  return fetch(url, options).then((resp) => resp.json());
}

describe('FetchMock', () => {
  let mock: FetchMock;
  beforeEach(() => {
    mock = FetchMock.configure();
  });

  afterEach(() => {
    mock.restore();
  });

  it('should match simple route', async () => {
    mock.get('/test', (req, res, ctx) => res(ctx.json({ key: 'value' })));

    await fetchToJson('/test').then((json) => {
      expect(json.key).toBe('value');
    });
  });

  it('should support fallback', async () => {
    mock.get('*', (req, res, ctx) => res(ctx.json({ key: 'value' })));
    await fetchToJson('/any-url-here').then((json) => {
      expect(json.key).toBe('value');
    });
  });

  it('should should set statusCode and statusText', async () => {
    mock.get('/status', (req, res, ctx) => res(ctx.json({ key: 'value' })));
    await fetch('/status').then((resp) => {
      expect(resp.status).toBe(200);
      expect(resp.statusText).toBe('OK');
      expect(resp.ok).toBe(true);
    });
  });

  it('should pass along body, path-params and query-params', async () => {
    const payload = { payload: 'my custom payload' };
    mock.post('/test/:id/:app', (req, res, ctx) => {
      expect(req.url).toBe('/test/123/testapp?name=abba&age=99');
      expect(req.method).toBe('POST');
      expect(req.pathParams && (req.pathParams as any).id).toBe('123');
      expect(req.pathParams && (req.pathParams as any).app).toBe('testapp');
      expect(req.queryParams && (req.queryParams as any).name).toBe('abba');
      expect(req.queryParams && (req.queryParams as any).age).toBe('99');
      expect(req.body).toEqual(payload);
      return res(ctx.json({ key: 'value' }));
    });

    await fetchToJson('/test/123/testapp?name=abba&age=99', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then((json) => expect(json.key).toBe('value'));
  });

  it('should pass along non-json body', async () => {
    mock.post('/test/:id/:app', (req, res, ctx) => {
      expect(req.body).toBe('randompayload');
      return res(ctx.json({ key: 'value' }));
    });

    await fetchToJson('/test/123/testapp?name=abba&age=99', {
      method: 'POST',
      body: 'randompayload',
    }).then((json) => expect(json.key).toBe('value'));
  });

  it('should match other HTTP-verbs', async () => {
    mock.get('/get', (req, res, ctx) => res(ctx.json({ key: 'get' })));
    mock.head('/head', (req, res, ctx) => res(ctx.json({ key: 'head' })));
    mock.post('/post', (req, res, ctx) => res(ctx.json({ key: 'post' })));
    mock.put('/put', (req, res, ctx) => res(ctx.json({ key: 'put' })));
    mock.delete('/delete', (req, res, ctx) => res(ctx.json({ key: 'delete' })));
    mock.connect('/connect', (req, res, ctx) => res(ctx.json({ key: 'connect' })));
    mock.options('/options', (req, res, ctx) => res(ctx.json({ key: 'options' })));
    mock.patch('/patch', (req, res, ctx) => res(ctx.json({ key: 'patch' })));

    const getReq = fetchToJson('/get', { method: 'GET' }).then((json) =>
      expect(json.key).toBe('get')
    );
    const headReq = fetchToJson('/head', { method: 'HEAD' }).then((json) =>
      expect(json.key).toBe('head')
    );
    const postReq = fetchToJson('/post', { method: 'POST' }).then((json) =>
      expect(json.key).toBe('post')
    );
    const putReq = fetchToJson('/put', { method: 'PUT' }).then((json) =>
      expect(json.key).toBe('put')
    );
    const deleteReq = fetchToJson('/delete', { method: 'DELETE' }).then((json) =>
      expect(json.key).toBe('delete')
    );
    const connectReq = fetchToJson('/connect', { method: 'CONNECT' }).then((json) =>
      expect(json.key).toBe('connect')
    );
    const optionsReq = fetchToJson('/options', { method: 'OPTIONS' }).then((json) =>
      expect(json.key).toBe('options')
    );
    const patchReq = fetchToJson('/patch', { method: 'PATCH' }).then((json) =>
      expect(json.key).toBe('patch')
    );

    await Promise.all([
      getReq,
      headReq,
      postReq,
      putReq,
      deleteReq,
      connectReq,
      optionsReq,
      patchReq,
    ]);
  });

  it('should support custom matcher function', async () => {
    mock.mock({ test: () => true }, (req, res, ctx) => res(ctx.json({ key: 'value' })));

    await fetchToJson('/test/123/testapp?name=abba&age=99').then((json) =>
      expect(json.key).toBe('value')
    );
  });

  it('should should support the Request', async () => {
    mock.get('/test', (req, res, ctx) => res(ctx.json({ key: 'value' })));
    await fetch(new Request('/test'))
      .then((resp) => resp.json())
      .then((json) => expect(json.key).toBe('value'));
  });

  it('should throw error if no route matches', () => {
    mock.restore();
    FetchMock.configure({ enableFallback: false });

    expect(() => {
      fetchToJson('/test');
    }).toThrow(`Did not find any matching route for: GET /test`);
  });

  it('should throw on unknown url type', () => {
    expect(() => mock.post(1231 as any, (req, res) => res())).toThrow();
  });

  it('should support fallback to realFetch', async () => {
    mock.get('/testurl', (req, res, ctx) => res(ctx.json({ num: 'testurl' })));

    const mocked = fetchToJson('/testurl').then((json) => expect(json.num).toBe('testurl'));
    const fallback = fetchToJson('https://xkcd.com/info.0.json').then((json) =>
      expect(json.num).toBeDefined()
    );

    await Promise.all([mocked, fallback]);
  });

  it('should remove all mocks on reset', async () => {
    mock.get('https://xkcd.com/info.0.json', (req, res, ctx) => res(ctx.json({ num: 'testurl' })));

    const mocked = fetchToJson('https://xkcd.com/info.0.json').then((json) =>
      expect(json.num).toBe('testurl')
    );

    mock.reset();

    const fallback = fetchToJson('https://xkcd.com/info.0.json').then((json) =>
      expect(json.num).toBeDefined()
    );

    await Promise.all([mocked, fallback]);
  });

  it('should support delayed responses', async () => {
    mock.get('/test', (req, res, ctx) => res(ctx.delay(200), ctx.json({ key: 'delayed' })));
    mock.get('/test2', (req, res, ctx) => res(ctx.delay(200), ctx.json({ key: 'delayed2' })));
    const startTime = new Date().getTime();

    await Promise.all([fetchToJson('/test'), fetchToJson('/test2')]).then((json) => {
      const endTime = new Date().getTime();
      expect(json[0].key).toBe('delayed');
      expect(json[1].key).toBe('delayed2');
      expect(endTime - startTime).toBeGreaterThan(190);
    });
  });

  it('should supportd combinding delay and handlerargs', async () => {
    mock.get('/test/:id', (req, res, ctx) =>
      res(ctx.delay(1000), ctx.json({ requestId: req.pathParams.id }))
    );

    await fetchToJson('/test/1234').then((json) => {
      expect(json.requestId).toBe('1234');
    });
  });

  it('should support responding with status codes', async () => {
    mock.get('/error', (req, res, ctx) => res(ctx.status(404)));

    await fetch('/error').then((resp) => {
      expect(resp.ok).toBe(false);
      expect(resp.status).toBe(404);
    });
  });

  it('should be able to combine response utils', async () => {
    mock.get('/combine', (req, res, ctx) => res(ctx.status(201), ctx.json({ key: 'value' })));

    mock.get('/combine2', (req, res, ctx) =>
      res(ctx.status(202), ctx.statusText('Its ok'), ctx.json({ key: 'value2' }))
    );

    const first = fetch('/combine')
      .then((resp) => {
        expect(resp.status).toBe(201);
        return resp.json();
      })
      .then((json) => {
        expect(json.key).toBe('value');
      });

    const second = fetch('/combine2')
      .then((resp) => {
        expect(resp.status).toBe(202);
        expect(resp.statusText).toBe('Its ok');
        return resp.json();
      })
      .then((json) => {
        expect(json.key).toBe('value2');
      });

    await Promise.all([first, second]);
  });

  it('should be able to set headers', async () => {
    mock.get('/withheaders', (req, res, ctx) =>
      res(ctx.header('Content-Type', 'custom/type'), ctx.body(JSON.stringify({ key: 'value' })))
    );

    await fetch('/withheaders').then((resp) => {
      expect(resp.headers.get('Content-Type')).toBe('custom/type');
    });
  });

  it('should support lowercase httpverb', async () => {
    mock.post('/lowercase', (req, res, ctx) => res(ctx.json({ key: 'BIG-CASE' })));

    await fetchToJson('/lowercase', { method: 'post' }).then((json) => {
      expect(json.key).toBe('BIG-CASE');
    });
  });
});
