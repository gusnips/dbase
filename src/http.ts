import { DbaseError, errorFromResponse, isRecord } from "./errors";
import type { DbaseConfig, DbaseFetch } from "./types/common";

export const DEFAULT_BASE_URL = "https://app.dbase.com.br";
const PATH = "/sistema/consultas/Data-basebrasil-api2024/";
const DEFAULT_TIMEOUT_MS = 60_000;

function readBody(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Sends every call as a multipart POST to one endpoint, with the token in the form next to the
 * params. There are no retries: DBase bills each search, and a call that timed out may have been
 * billed already.
 */
export class Http {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly fetch: DbaseFetch;

  constructor(config: DbaseConfig) {
    if (!config.token) {
      throw new Error(
        "DBase needs a token. Get it in the restricted area of dbase.com.br, then pass it to new DbaseClient({ token }).",
      );
    }
    this.token = config.token;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
    this.fetch = config.fetch ?? fetch;
  }

  /** `query` goes in the URL, like `versao` for the CNPJ answer. `params` go in the form. */
  async post<T>(
    consulta: string,
    params: object,
    query?: Record<string, string | number>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${PATH}`);
    for (const [key, value] of Object.entries(query ?? {}))
      url.searchParams.set(key, String(value));

    const form = new FormData();
    form.append("consulta", consulta);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) form.append(key, String(value));
    }
    form.append("token", this.token);

    const request = new Request(url.toString(), {
      method: "POST",
      headers: { Accept: "application/json" },
      body: form,
      signal: AbortSignal.timeout(this.timeout),
    });

    let status: number;
    let text: string;
    try {
      const response = await this.fetch(request);
      status = response.status;
      text = await response.text();
    } catch (error) {
      throw noAnswer(error);
    }

    const body = readBody(text);
    if (status < 200 || status >= 300 || (isRecord(body) && body.status === false)) {
      throw errorFromResponse(status, body);
    }
    if (typeof body === "string") {
      throw new DbaseError({ status, message: "DBase did not answer with JSON", body });
    }
    return body as T;
  }
}

/** The cause is left out on purpose: the request it came from holds the token. */
function noAnswer(error: unknown): DbaseError {
  const name = error instanceof Error ? error.name : "";
  const reason =
    name === "TimeoutError" || name === "AbortError"
      ? "it took too long"
      : error instanceof Error
        ? error.message
        : "unknown error";
  return new DbaseError({
    status: 0,
    message: `No answer from DBase (${reason}). Check your connection and try again, or raise the timeout option. The search may still have been billed.`,
  });
}
