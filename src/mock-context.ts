import { MockRequest, HandlerResponseElement, ResponseData } from './types.js';

async function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

class MockContext {
  private req: MockRequest;
  private realFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;

  constructor(
    req: MockRequest,
    realFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ) {
    this.req = req;
    this.realFetch = realFetch;
  }

  status(code: number): HandlerResponseElement {
    return async (data: ResponseData) => {
      data.status = code;
      return data;
    };
  }

  statusText(message: string): HandlerResponseElement {
    return async (data: ResponseData) => {
      data.statusText = message;
      return data;
    };
  }

  delay(ms: number): HandlerResponseElement {
    return async (data: ResponseData) => {
      await delay(ms);
      return data;
    };
  }

  json(value: any): HandlerResponseElement {
    return async (data: ResponseData) => {
      await this.header('Content-Type', 'application/json')(data);
      await this.body(JSON.stringify(value))(data);
      return data;
    };
  }

  text(value: string): HandlerResponseElement {
    return async (data: ResponseData) => {
      await this.header('Content-Type', 'text/plain')(data);
      await this.body(value)(data);
      return data;
    };
  }

  body(body: any): HandlerResponseElement {
    return async (data: ResponseData) => {
      data.body = body;
      return data;
    };
  }

  header(key: string, value: string): HandlerResponseElement {
    return async (data: ResponseData) => {
      const headers = data.headers || new Headers();
      if (headers instanceof Headers) {
        headers.set(key, value);
      } else if (Array.isArray(headers)) {
        headers.push([key, value]);
      } else {
        headers[key] = value;
      }
      data.headers = headers;
      return data;
    };
  }

  fetch(): Promise<Response> {
    return this.realFetch(this.req.input, this.req.init);
  }
}

export default MockContext;
