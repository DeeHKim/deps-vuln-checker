declare module 'npm-registry-fetch' {
  interface FetchOptions {
    method?: string;
    gzip?: boolean;
    body?: any;
    [key: string]: any;
  }

  interface FetchResponse {
    json(): Promise<any>;
    buffer(): Promise<Buffer>;
    [key: string]: any;
  }

  function fetch(uri: string, opts?: FetchOptions): Promise<FetchResponse>;

  export = fetch;
}

