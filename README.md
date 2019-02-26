# Yet-Another-Fetch-Mock

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Travis](https://img.shields.io/travis/nutgaard/yet-another-fetch-mock.svg)](https://travis-ci.org/nutgaard/yet-another-fetch-mock)
[![codecov](https://codecov.io/gh/nutgaard/yet-another-fetch-mock/branch/master/graph/badge.svg)](https://codecov.io/gh/nutgaard/yet-another-fetch-mock)
[![dependencies Status](https://david-dm.org/nutgaard/yet-another-fetch-mock/status.svg)](https://david-dm.org/nutgaard/yet-another-fetch-mock)

### Installation

```
npm install yet-another-fetch-mock --save-dev
```

### Setup 

```javascript
const loggingMiddleware: Middleware = (request, response) => {
  console.log('response', response);
  return response;
}


const mock = FetchMock.configure({
  enableFallback: true, // default: true
  middleware: loggingMiddleware // default: (req, resp) => resp
});


const delayedErrorMock = FetchMock.configure({
  middleware: MiddlewareUtils.combine(
    MiddlewareUtils.delayMiddleware(200),
    MiddlewareUtils.failurerateMiddleware(0.2)
  )
});
```


### Examples
```typescript
mock.get('/my-url', { key: 'value' }); // Returns the object as the json-response
mock.post('/another-url', { key: 'result of posting' });


// Creating dynamic content based on url
mock.put('/api/:id/app', (args: HandlerArgument) => {
  // `args` contains the original parameters to `fetch`,
  // and in addition: url, http-verb, path parameters and query parameters
  return ResponseUtils.jsonPromise({
    id: args.pathParams.id,
    content: 'Some random content'
  }); 
});


// More advanced route-matching
mock.mock(
  MatcherUtils.combine(
    MatcherUtils.method('HEAD'),
    MatcherUtils.url('/custom-url'),
    // Your custom matcher here
  ),
  ResponseUtils.delayed(1000, { data: 'lots of data' })
);

// Combining resultsUtils
mock.get('/test/:id', ResponseUtils.delayed(1000, (args: HandlerArgument) => {
  return ResponseUtils.jsonPromise({ requestId: args.pathParams.id });
}));
```

### Teardown

```javascript
mock.restore();
```

### Usage in tests
The library ships with a custom `Middleware` that allows for introspection of intercepted fetch-calls.

The `spy` exposes seven diffrent methods, six (`middleware` is used for setup) of which can be used to verify that a call has been intercepted.
All methods accept an optional argument of the type `RouteMatcher` which can be created using the `MatcherUtils`.
In cases where you don't send in an `RouteMatcher`, then a default "match-everything"-matcher is used.

#### Example
```typescript
import FetchMock, { MatcherUtils, SpyMiddleware } from 'yet-another-fetch-mock';

describe('test using yet-another-fetch-mock', () => {
  let mock: FetchMock;
  let spy: SpyMiddleware;
  
  beforeEach(() => {
    spy = new SpyMiddleware();
    mock = FetchMock.configure({
      middleware: spy.middleware
    });
    expect(spy.size()).toBe(0);
  });
  
  afterEach(() => {
    mock.restore();
  });
  
  it('should capture calls', (done) => {
      mock.get('/test/:id', { data: 'test' });
      Promise.all([
        fetch('/test/121'),
        fetch('/test/122')
      ])
        .then(() => {
          expect(spy.size()).toBe(2);
          expect(spy.lastCall()).not.toBeNull();
          expect(spy.lastUrl()).toBe('/test/122');
          expect(spy.called(MatcherUtils.url('/test/:id'))).toBe(true);
          done();
        })
    });
});
```


#### Types
Full documentation of types can be seen [here](https://www.utgaard.xyz/yet-another-fetch-mock/),
or [here](https://github.com/nutgaard/yet-another-fetch-mock/blob/master/src/types.ts) if you prefer reading typescript code.


### Tips

* It is recommended to toggle the fetch-mock functionality behind an environment variable, as to allow uglify etc to remove the code for production build.
* Take a look at the original [readme](https://github.com/alexjoverm/typescript-library-starter/blob/master/README.md);


## Credits

Made using the awesome [typescript library starter](https://github.com/alexjoverm/typescript-library-starter) 

