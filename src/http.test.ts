import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { DbaseClient } from "./client";
import { DbaseError } from "./errors";

interface Seen {
  path: string;
  search: string;
  contentType: string | null;
  form: Record<string, string>;
}

let seen: Seen[] = [];
let answers: Response[] = [];
let server: ReturnType<typeof Bun.serve>;

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);
      const form = Object.fromEntries(
        [...(await req.formData()).entries()].map(([key, value]) => [key, String(value)]),
      );
      seen.push({
        path: url.pathname,
        search: url.search,
        contentType: req.headers.get("content-type"),
        form,
      });
      return answers.shift() ?? Response.json({ ok: true });
    },
  });
});
afterAll(() => server.stop(true));
beforeEach(() => {
  seen = [];
  answers = [];
});

const newClient = () =>
  new DbaseClient({ token: "secret-token", baseUrl: `http://localhost:${server.port}` });

// A real answer, captured from the API when the caller's IP was not on the allowlist.
const ipNotAllowed = {
  status: false,
  codigo: "003",
  msg: "003 - Seu ip não está liberado para acesso a api, informe o Ipv4/6:  para o nosso suporte.",
};

describe("DbaseClient", () => {
  test("posts a multipart form with the consulta, the params and the token", async () => {
    await newClient().cpf({ cpf: "11144477735" });

    expect(seen).toHaveLength(1);
    expect(seen[0]!.path).toBe("/sistema/consultas/Data-basebrasil-api2024/");
    expect(seen[0]!.contentType).toStartWith("multipart/form-data; boundary=");
    expect(seen[0]!.form).toEqual({ consulta: "cpf", cpf: "11144477735", token: "secret-token" });
    expect(seen[0]!.search).toBe("");
  });

  test("sends the CNPJ version in the URL, not in the form", async () => {
    await newClient().cnpj({ cnpj: "00000000000191", versao: 2 });

    expect(seen[0]!.search).toBe("?versao=2");
    expect(seen[0]!.form).toEqual({
      consulta: "cnpj",
      cnpj: "00000000000191",
      token: "secret-token",
    });
  });

  test("leaves out params that are not set", async () => {
    await newClient().prospeccao({ uf: "ES", cidade: "VITORIA", so_matriz: 1, bairro: undefined });

    expect(seen[0]!.form).toEqual({
      consulta: "prospeccao",
      uf: "ES",
      cidade: "VITORIA",
      so_matriz: "1",
      token: "secret-token",
    });
  });

  test("asks for a token", () => {
    expect(() => new DbaseClient({ token: "" })).toThrow("needs a token");
  });

  test("takes the token as a plain string", () => {
    expect(() => new DbaseClient("abc")).not.toThrow();
  });

  test("sends the call through the fetch you pass, never the global one", async () => {
    const requests: Request[] = [];
    const client = new DbaseClient({
      token: "abc",
      fetch: async (request) => {
        requests.push(request);
        return Response.json({ ok: true });
      },
    });

    await client.cep({ cep: "29010001" });

    expect(requests).toHaveLength(1);
    expect(requests[0]!.url).toBe(
      "https://app.dbase.com.br/sistema/consultas/Data-basebrasil-api2024/",
    );
  });

  test("throws on status false, even with HTTP 200", async () => {
    answers = [Response.json(ipNotAllowed)];

    const error = await newClient()
      .cep({ cep: "29010001" })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(DbaseError);
    expect(error).toMatchObject({ status: 200, code: "003", body: ipNotAllowed });
    expect((error as DbaseError).message).toContain("Seu ip não está liberado");
  });

  test("throws on a failing HTTP status with a plain text body", async () => {
    answers = [new Response("Forbidden", { status: 403 })];

    const error = await newClient()
      .cpf({ cpf: "1" })
      .catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 403, code: undefined, message: "Forbidden" });
  });

  test("throws when a 200 answer is not JSON", async () => {
    answers = [new Response("<html>maintenance</html>")];

    const error = await newClient()
      .cpf({ cpf: "1" })
      .catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 200, message: "DBase did not answer with JSON" });
  });

  test("does not retry a failed call, because each search is billed", async () => {
    answers = [Response.json(ipNotAllowed), Response.json({ ok: true })];

    await newClient()
      .cpf({ cpf: "1" })
      .catch(() => undefined);

    expect(seen).toHaveLength(1);
  });

  test("reports no answer without leaking the token", async () => {
    const dead = new DbaseClient({
      token: "secret-token",
      baseUrl: "http://localhost:1",
      timeout: 500,
    });

    const error = await dead.cpf({ cpf: "1" }).catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 0 });
    expect(JSON.stringify(error)).not.toContain("secret-token");
    expect((error as DbaseError).cause).toBeUndefined();
  });
});
