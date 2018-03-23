import 'isomorphic-fetch';
import MatcherUtils from './../src/matcher-utils';
import ResponseUtils from './../src/response-utils';
import FetchMock from '../src/yet-another-fetch-mock';
import { HandlerArgument, RequestUrl } from '../src/types';
import { findBody, findPathParams } from '../src/internal-utils';

function fetchToJson(url: string, options?: RequestInit) {
  return fetch(url, options).then(resp => resp.json());
}

describe('utils', () => {
  it('should return empty params if no url exists', () => {
    expect(findPathParams('' as RequestUrl, undefined)).toEqual({});
  });

  it('should return undefind if no body is defined', () => {
    expect(findBody(null as any, undefined)).toBe(undefined);
  });
});

describe('FetchMock', () => {
  let mock: FetchMock;
  beforeEach(() => {
    mock = FetchMock.configure();
  });

  afterEach(() => {
    mock.restore();
  });

  it('should match simple route', done => {
    mock.get('/test', { key: 'value' });

    fetchToJson('/test').then(json => {
      expect(json.key).toBe('value');
      done();
    });
  });

  it('should support fallback', done => {
    mock.get('*', { key: 'value' });
    fetchToJson('/any-url-here').then(json => {
      expect(json.key).toBe('value');
      done();
    });
  });

  it('should pass along body, path-params and query-params', done => {
    const payload = { payload: 'my custom payload' };
    mock.post('/test/:id/:app', (args: HandlerArgument) => {
      expect(args.url).toBe('/test/123/testapp?name=abba&age=99');
      expect(args.method).toBe('POST');
      expect(args.pathParams && (args.pathParams as any).id).toBe('123');
      expect(args.pathParams && (args.pathParams as any).app).toBe('testapp');
      expect(args.queryParams && (args.queryParams as any).name).toBe('abba');
      expect(args.queryParams && (args.queryParams as any).age).toBe('99');
      expect(args.body).toEqual(payload);
      return ResponseUtils.jsonPromise({ key: 'value' });
    });

    fetchToJson('/test/123/testapp?name=abba&age=99', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then(json => expect(json.key).toBe('value'))
      .then(() => done());
  });

  it('should pass along non-json body', done => {
    mock.post('/test/:id/:app', (args: HandlerArgument) => {
      expect(args.body).toBe('randompayload');
      return ResponseUtils.jsonPromise({ key: 'value' });
    });

    fetchToJson('/test/123/testapp?name=abba&age=99', {
      method: 'POST',
      body: 'randompayload'
    })
      .then(json => expect(json.key).toBe('value'))
      .then(() => done());
  });

  it('should match other HTTP-verbs', done => {
    mock.post('/post', { key: 'post' });
    mock.delete('/delete', { key: 'delete' });
    mock.put('/put', { key: 'put' });
    mock.mock(
      MatcherUtils.combine(
        MatcherUtils.method('HEAD'),
        MatcherUtils.url('/head')
      ),
      {
        key: 'head'
      }
    );

    const postReq = fetchToJson('/post', { method: 'POST' }).then(json =>
      expect(json.key).toBe('post')
    );
    const deleteReq = fetchToJson('/delete', { method: 'DELETE' }).then(json =>
      expect(json.key).toBe('delete')
    );
    const putReq = fetchToJson('/put', { method: 'PUT' }).then(json =>
      expect(json.key).toBe('put')
    );
    const headReq = fetchToJson('/head', { method: 'HEAD' }).then(json =>
      expect(json.key).toBe('head')
    );

    Promise.all([postReq, deleteReq, putReq, headReq]).then(() => done());
  });

  it('should support custom matcher function', done => {
    mock.mock({ test: () => true }, { key: 'value' });

    fetchToJson('/test/123/testapp?name=abba&age=99')
      .then(json => expect(json.key).toBe('value'))
      .then(() => done());
  });

  it('should should support the Request', done => {
    mock.get('/test', { key: 'value' });
    fetch(new Request('/test'))
      .then(resp => resp.json())
      .then(json => expect(json.key).toBe('value'))
      .then(() => done());
  });

  it('should throw error if no route matches', () => {
    mock.restore();
    FetchMock.configure({ enableFallback: false });

    expect(() => {
      fetchToJson('/test');
    }).toThrow();
  });

  it('should throw on unknown url type', () => {
    expect(() => mock.post(1231 as any, {})).toThrow();
  });

  it('should support fallback to realFetch', done => {
    mock.get('/testurl', { key: 'testurl' });

    const mocked = fetchToJson('/testurl').then(json =>
      expect(json.key).toBe('testurl')
    );
    const fallback = fetchToJson('https://xkcd.com/info.0.json').then(json =>
      expect(json.num).toBeDefined()
    );

    Promise.all([mocked, fallback]).then(() => done());
  });

  it('should support delayed responses', done => {
    mock.get('/test', ResponseUtils.delayed(200, { key: 'delayed' }));
    mock.get(
      '/test2',
      ResponseUtils.delayed(200, ResponseUtils.json({ key: 'delayed2' }))
    );
    const startTime = new Date().getTime();

    Promise.all([fetchToJson('/test'), fetchToJson('/test2')]).then(json => {
      const endTime = new Date().getTime();
      expect(json[0].key).toBe('delayed');
      expect(json[1].key).toBe('delayed2');
      expect(endTime - startTime).toBeGreaterThan(200);
      done();
    });
  });

  it('should supportd combinding delay and handlerargs', done => {
    mock.get(
      '/test/:id',
      ResponseUtils.delayed(1000, (args: HandlerArgument) => {
        return ResponseUtils.jsonPromise({ requestId: args.pathParams.id });
      })
    );

    fetchToJson('/test/1234').then(json => {
      expect(json.requestId).toBe('1234');
      done();
    });
  });

  it('should support responding with status codes', done => {
    mock.get('/error', ResponseUtils.statusCode(404));

    fetch('/error').then(resp => {
      expect(resp.ok).toBe(false);
      expect(resp.status).toBe(404);
      done();
    });
  });

  it('should be able to combine response utils', done => {
    mock.get(
      '/combine',
      ResponseUtils.combine(
        ResponseUtils.json({ key: 'value' }),
        ResponseUtils.statusCode(201)
      )
    );

    mock.get(
      '/combine2',
      ResponseUtils.combine(
        ResponseUtils.statusCode(202),
        { key: 'value2' },
        ResponseUtils.statusText('Its ok')
      )
    );

    const first = fetch('/combine')
      .then(resp => {
        expect(resp.status).toBe(201);
        return resp.json();
      })
      .then(json => {
        expect(json.key).toBe('value');
      });

    const second = fetch('/combine2')
      .then(resp => {
        expect(resp.status).toBe(202);
        expect(resp.statusText).toBe('Its ok');
        return resp.json();
      })
      .then(json => {
        expect(json.key).toBe('value2');
      });

    Promise.all([first, second]).then(() => done());
  });

  it('should support lowercase httpverb', done => {
    mock.post('/lowercase', { key: 'BIG-CASE' });

    fetchToJson('/lowercase', { method: 'post' }).then(json => {
      expect(json.key).toBe('BIG-CASE');
      done();
    });
  });
});
