import 'isomorphic-fetch';
import FetchMock, { SpyMiddleware, MatcherUtils } from '../src/yet-another-fetch-mock';

function fetchToJson(url: string, options?: RequestInit) {
  return fetch(url, options).then(resp => resp.json());
}

describe('SpyMiddlware', () => {
  let mock: FetchMock;
  let spy: SpyMiddleware;
  const data = { data: 'dummy' };

  beforeEach(() => {
    spy = new SpyMiddleware();
    mock = FetchMock.configure({
      middleware: spy.middleware
    });
    mock.mock(MatcherUtils.url('/data/:id'), data);
    expect(spy.size()).toBe(0);
  });

  afterEach(() => {
    mock.restore();
  });

  it('should capture all calls', done => {
    Promise.all([
      fetchToJson('/data/1231.1', { method: 'PUT' }),
      fetchToJson('/data/1231.2', { method: 'POST' }),
      fetchToJson('/data/1231.3', { method: 'DELETE' }),
      fetchToJson('/data/1232.0', { method: 'GET' })
    ]).then(([json1, json2, json3, json4]) => {
      const entry = spy.lastCall();

      expect(json1).toEqual(data);
      expect(json2).toEqual(data);
      expect(json3).toEqual(data);
      expect(json4).toEqual(data);
      expect(entry).not.toBeNull();
      expect(entry!.request.input).toBe('/data/1232.0');
      expect(spy.size()).toBe(4);
      done();
    });
  });

  it('should return true if route has been used by fetchmock', done => {
    Promise.all([fetchToJson('/data/213'), fetchToJson('/data/ignore', { method: 'POST' })]).then(
      () => {
        expect(spy.called()).toBe(true);
        expect(spy.called(MatcherUtils.method('GET'))).toBe(true);
        expect(spy.called(MatcherUtils.method('POST'))).toBe(true);
        expect(spy.called(MatcherUtils.method('PUT'))).toBe(false);
        done();
      }
    );
  });

  it('should return false if no route has been called', () => {
    expect(spy.called()).toBe(false);
  });

  it('should return the last url matched', done => {
    Promise.all([
      fetchToJson('/data/213'),
      fetchToJson('/data/214'),
      fetchToJson('/data/215', { method: 'POST' })
    ]).then(() => {
      expect(spy.lastUrl(MatcherUtils.method('GET'))).toBe('/data/214');
      expect(spy.lastUrl(MatcherUtils.method('PUT'))).toBeUndefined();
      expect(spy.lastUrl()).toBe('/data/215');
      done();
    });
  });

  it('should return the last options matched', done => {
    Promise.all([
      fetchToJson('/data/213', { headers: { 'X-custom': '1' } }),
      fetchToJson('/data/213', { headers: { 'X-custom': '2' } }),
      fetchToJson('/data/213', { method: 'POST', headers: { 'X-custom': '3' } })
    ]).then(() => {
      expect(spy.lastOptions(MatcherUtils.method('GET'))).toEqual({ headers: { 'X-custom': '2' } });
      expect(spy.lastOptions(MatcherUtils.method('PUT'))).toBeUndefined();
      expect(spy.lastOptions()).toEqual({ method: 'POST', headers: { 'X-custom': '3' } });
      done();
    });
  });

  it('should find all matching calls', done => {
    Promise.all([
      fetchToJson('/data/213'),
      fetchToJson('/data/ignore', { method: 'POST' }),
      fetchToJson('/data/214')
    ]).then(([json1, json2]) => {
      const allCalls = spy.calls();
      const getCalls = spy.calls(MatcherUtils.method('GET'));

      expect(allCalls.length).toBe(3);
      expect(getCalls.length).toBe(2);
      done();
    });
  });

  it('should capture calls', done => {
    mock.get('/test/:id', { data: 'test' });
    Promise.all([fetch('/test/121'), fetch('/test/122')]).then(() => {
      expect(spy.size()).toBe(2);
      expect(spy.lastCall()).not.toBeNull();
      expect(spy.lastUrl()).toBe('/test/122');
      expect(spy.called(MatcherUtils.url('/test/:id'))).toBe(true);
      done();
    });
  });

  it('should remove all entries on reset', done => {
    mock.get('/test/:id', { data: 'test' });
    Promise.all([fetch('/test/121'), fetch('/test/122')]).then(() => {
      expect(spy.size()).toBe(2);
      expect(spy.lastCall()).toBeDefined();
      expect(spy.lastUrl()).toBe('/test/122');
      expect(spy.called(MatcherUtils.url('/test/:id'))).toBe(true);

      spy.reset();
      expect(spy.lastCall()).toBeUndefined();
      expect(spy.lastUrl()).toBeUndefined();
      expect(spy.called(MatcherUtils.url('/test/:id'))).toBe(false);
      done();
    });
  });
});
