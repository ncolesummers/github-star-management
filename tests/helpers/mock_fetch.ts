/**
 * Mock implementation of the fetch API for testing
 * This utility allows us to simulate HTTP responses without making actual network requests
 */

export interface MockResponse {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

type RequestMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

interface MockRequestKey {
  url: string;
  method?: RequestMethod;
}

interface MockCall {
  url: string;
  request: Request;
}

function keyFromRequest(url: string, method?: RequestMethod): string {
  return `${method || "GET"}:${url}`;
}

export class MockFetch {
  private mocks = new Map<string, MockResponse | MockResponse[]>();
  private _calls: MockCall[] = [];

  constructor() {
    this.fetch = this.fetch.bind(this);
  }

  mock(
    url: string,
    response: MockResponse,
    options: { method?: RequestMethod } = {},
  ): void {
    const key = keyFromRequest(url, options.method);
    this.mocks.set(key, response);
  }

  mockSequence(
    url: string,
    responses: MockResponse[],
    options: { method?: RequestMethod } = {},
  ): void {
    const key = keyFromRequest(url, options.method);
    this.mocks.set(key, responses);
  }

  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const request = new Request(input, init);
    const url = request.url;
    const method = request.method as RequestMethod;

    // Record this call
    this._calls.push({ url, request });

    // Look for a matching mock
    const key = keyFromRequest(url, method);
    let mockResponse = this.mocks.get(key);

    // If no exact match, try just the URL
    if (!mockResponse) {
      const keyWithoutMethod = keyFromRequest(url);
      mockResponse = this.mocks.get(keyWithoutMethod);
    }

    if (!mockResponse) {
      throw new Error(`No mock response for ${method} ${url}`);
    }

    // Handle sequence of responses
    let response: MockResponse;
    if (Array.isArray(mockResponse)) {
      if (mockResponse.length === 0) {
        throw new Error(`Mock response sequence for ${method} ${url} is empty`);
      }

      response = mockResponse[0];

      // Remove the first item if there are more in the sequence
      if (mockResponse.length > 1) {
        this.mocks.set(key, mockResponse.slice(1));
      } else {
        this.mocks.delete(key);
      }
    } else {
      response = mockResponse;
    }

    // Create response object
    return createResponse(response);
  }

  get calls(): MockCall[] {
    return [...this._calls];
  }

  reset(): void {
    this.mocks.clear();
    this._calls = [];
  }
}

export function createResponse(mock: MockResponse): Response {
  const { status, body, headers = {} } = mock;

  const responseInit: ResponseInit = {
    status,
    headers,
  };

  if (body === undefined) {
    return new Response(null, responseInit);
  }

  if (typeof body === "string") {
    return new Response(body, responseInit);
  }

  // JSON body
  return new Response(
    JSON.stringify(body),
    {
      ...responseInit,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    },
  );
}
