import 'isomorphic-fetch';
import FetchMock, { FunctionHandlerArguments, TestedUrl } from '../src/yet-another-fetch-mock';

function fetchToJson(url: string, options?: RequestInit) {
  return fetch(url, options).then(resp => resp.json());
}

describe('FetchMock', () => {
  let mock: FetchMock;
  beforeEach(() => {
    mock = FetchMock.init();
  });

  afterEach(() => {
    mock.restore();
  });

  it('should match simple route', function(done) {
    mock.get('/test', { key: 'value' });

    fetchToJson('/test').then(json => {
      expect(json.key).toBe('value');
      done();
    });
  });

  it('should support fallback', done => {
    mock.get(/.+/, { key: 'value' });
    fetchToJson('/any-url-here').then(json => {
      expect(json.key).toBe('value');
      done();
    });
  });

  it('should pass along body, path-params and query-params', done => {
    const payload = { payload: 'my custom payload' };
    mock.post('/test/:id/:app', (args: FunctionHandlerArguments) => {
      expect(args.url).toBe('/test/123/testapp?name=abba&age=99');
      expect(args.method).toBe('POST');
      expect(args.pathParams && (args.pathParams as any).id).toBe('123');
      expect(args.pathParams && (args.pathParams as any).app).toBe('testapp');
      expect(args.queryParams && (args.queryParams as any).name).toBe('abba');
      expect(args.queryParams && (args.queryParams as any).age).toBe('99');
      expect(args.body).toEqual(payload);
      return { key: 'value' };
    });

    fetchToJson('/test/123/testapp?name=abba&age=99', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then(json => expect(json.key).toBe('value'))
      .then(() => done());
  });

  it('should pass along non-json body', function(done) {
    mock.post('/test/:id/:app', (args: FunctionHandlerArguments) => {
      expect(args.body).toBe('randompayload');
      return { key: 'value' };
    });

    fetchToJson('/test/123/testapp?name=abba&age=99', { method: 'POST', body: 'randompayload' })
      .then(json => expect(json.key).toBe('value'))
      .then(() => done());
  });

  it('should match other HTTP-verbs', function(done) {
    mock.post('/post', { key: 'post' });
    mock.delete('/delete', { key: 'delete' });
    mock.put('/put', { key: 'put' });
    mock.mock('HEAD', '/head', { key: 'head' });

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

  it('should support custom matcher function', function(done) {
    mock.get(
      (input: RequestInfo, init?: RequestInit): TestedUrl => {
        return {
          test: true,
          match: null,
          keys: []
        };
      },
      { key: 'value' }
    );

    fetchToJson('/test/123/testapp?name=abba&age=99')
      .then(json => expect(json.key).toBe('value'))
      .then(() => done());
  });

  it('should should support the Request', function(done) {
    mock.get('/test', { key: 'value' });
    fetch(new Request('/test'))
      .then(resp => resp.json())
      .then(json => expect(json.key).toBe('value'))
      .then(() => done());
  });

  it('should throw error if no route matches', function() {
    expect(() => {
      fetchToJson('/test');
    }).toThrow();
  });

  it('should throw on unknown url type', function() {
    expect(() => mock.post(1231 as any, {})).toThrow();
  });
});
