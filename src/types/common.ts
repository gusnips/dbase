export type DbaseFetch = (request: Request) => Promise<Response>;

export interface DbaseConfig {
  /** Your token, from the restricted area of dbase.com.br. */
  token: string;
  /** `https://app.dbase.com.br` by default. */
  baseUrl?: string;
  /** Milliseconds to wait for an answer. 60 seconds by default. */
  timeout?: number;
  /** Replaces the global `fetch`, for tests or a proxy. */
  fetch?: DbaseFetch;
}

/** What DBase answers when a call fails, even with HTTP 200. Read from a real answer. */
export interface DbaseErrorBody {
  status: false;
  codigo: string;
  msg: string;
}
