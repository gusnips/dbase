/** Every failed DBase call throws this: API error codes, HTTP errors and no-answer cases. */
export class DbaseError extends Error {
  /** HTTP status. `0` when no answer came back (network down, timeout). */
  readonly status: number;
  /** DBase's own `codigo`, a string like `"003"` for "Seu ip não está liberado". */
  readonly code: string | undefined;
  /** The raw response body, when there was one. */
  readonly body: unknown;

  constructor(init: { status: number; message: string; code?: string; body?: unknown }) {
    super(init.message);
    this.name = "DbaseError";
    this.status = init.status;
    this.code = init.code;
    this.body = init.body;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * DBase reports a failure as `{ status: false, codigo, msg }`, and sends it with HTTP 200 as well.
 * Other statuses (400, 403, 500) can carry the same body or a plain text one.
 */
export function errorFromResponse(status: number, body: unknown): DbaseError {
  const root = isRecord(body) ? body : {};
  const code =
    typeof root.codigo === "string" || typeof root.codigo === "number"
      ? String(root.codigo)
      : undefined;
  const detail =
    typeof root.msg === "string" && root.msg
      ? root.msg
      : typeof body === "string" && body
        ? body
        : undefined;

  return new DbaseError({
    status,
    code,
    body,
    message: detail ?? `DBase answered with an error (HTTP ${status})`,
  });
}
