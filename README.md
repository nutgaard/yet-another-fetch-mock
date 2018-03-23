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
const mock = FetchMock.configure({
  enableFallback: true,
  middleware: (requestArgs, response) => {
    console.log('response', response);
    return response;
  }
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

#### Types
Full documentation of types can be seen [here](https://www.utgaard.xyz/yet-another-fetch-mock/),
or [here](https://github.com/nutgaard/yet-another-fetch-mock/blob/master/src/types.ts) if you prefer reading typescript code.


### Teardown

```javascript
mock.restore();
```



### Tips

* It is recommended to toggle the fetch-mock functionality behind an environment variable, as to allow uglify etc to remove the code for production build.
* Take a look at the original [readme](https://github.com/alexjoverm/typescript-library-starter/blob/master/README.md);


## Credits

Made using the awesome [typescript library starter](https://github.com/alexjoverm/typescript-library-starter) 

