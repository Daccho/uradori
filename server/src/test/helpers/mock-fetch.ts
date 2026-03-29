import { vi, beforeEach, afterEach } from "vitest";

type MockRoute = {
  url: string | RegExp;
  method?: string;
  response: { status: number; body: unknown; headers?: Record<string, string> };
};

let originalFetch: typeof fetch;
let mockRoutes: MockRoute[] = [];

export function useFetchMock() {
  beforeEach(() => {
    originalFetch = globalThis.fetch;
    mockRoutes = [];
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mockRoutes = [];
  });
}

export function mockFetchRoute(route: MockRoute) {
  mockRoutes.push(route);

  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method ?? "GET";

    for (const r of mockRoutes) {
      const urlMatch =
        typeof r.url === "string" ? url.includes(r.url) : r.url.test(url);
      const methodMatch = !r.method || r.method.toUpperCase() === method.toUpperCase();

      if (urlMatch && methodMatch) {
        const body =
          typeof r.response.body === "string"
            ? r.response.body
            : r.response.body instanceof ArrayBuffer
              ? r.response.body
              : JSON.stringify(r.response.body);

        return new Response(body, {
          status: r.response.status,
          headers: r.response.headers ?? {
            "Content-Type": "application/json",
          },
        });
      }
    }

    // Pass through to original fetch for unmocked URLs
    return originalFetch(input, init);
  }) as typeof fetch;
}
