# dbase-sdk

TypeScript client for the [DBase](https://dbase.com.br) API: CPF, CNPJ, phone, CEP, name and e-mail lookups, and company prospecting from the Receita Federal base, for Brazil. Unofficial, not made by DBase.

```bash
npm install dbase-sdk
# or
bun add dbase-sdk
```

The same code is also published as `@gusnips/dbase`. The `dbase` name on npm is a different package, by someone else.

## First call

```ts
import { DbaseClient } from "dbase-sdk";

const dbase = new DbaseClient("YOUR_TOKEN");

const company = await dbase.cnpj({ cnpj: "00000000000191" });
```

Before it works, do two things:

1. Get your token in the restricted area of dbase.com.br.
2. Have your server's IP allowlisted. DBase only answers calls from IPs on its list, and its message asks you to send the IPv4 or IPv6 address to its support. Until then every call fails with code `003`.

Keep the token on your server. Never ship it to a browser.

## Finding the method you need

The API has one endpoint, and the `consulta` field picks the lookup. Each `consulta` is one method:

| `consulta`   | In the SDK                              |
| ------------ | --------------------------------------- |
| `cpf`        | `dbase.cpf({ cpf })`                    |
| `cnpj`       | `dbase.cnpj({ cnpj, versao })`          |
| `telefone`   | `dbase.telefone({ telefone })`          |
| `cep`        | `dbase.cep({ cep, numero_inicial })`    |
| `nome`       | `dbase.nome({ nome })`                  |
| `email`      | `dbase.email({ email })`                |
| `prospeccao` | `dbase.prospeccao({ uf, cidade, ... })` |

Params keep the API's own names, so what you read in DBase's swagger is what you type. `versao` (`1` or `2`) picks the version of the CNPJ answer.

## Prospecting companies

```ts
const page = await dbase.prospeccao({
  uf: "ES",
  cidade: "VITORIA",
  cnae: "6201501",
  so_matriz: 1,
  pagina: 1,
});

console.log(page.total, page.total_paginas, page.empresas.length);
```

It needs the "Prospecção de Empresas" product on your account. A page holds 50 companies, up to page 40. DBase bills one search once, and paging through the same search is not billed again for 60 minutes.

## Errors

Every failure throws a `DbaseError`. DBase reports a failure in the body as `{ status: false, codigo, msg }`, and sometimes sends it with HTTP 200, so the client reads the body and not only the status:

```ts
import { DbaseError } from "dbase-sdk";

try {
  await dbase.cep({ cep: "29010001" });
} catch (error) {
  if (error instanceof DbaseError) {
    console.log(error.status); // HTTP status, or 0 if no answer came back
    console.log(error.code); // DBase's codigo, for example "003"
    console.log(error.message); // DBase's msg, in Portuguese
  }
}
```

Codes seen so far (the messages are DBase's):

| Code  | HTTP | DBase says                                 |
| ----- | ---- | ------------------------------------------ |
| `003` | 200  | Seu ip não está liberado para acesso a api |
| `004` | 400  | Campo token faltando ou inválido           |

## Cost and limits

DBase bills by search, and which lookups it bills depends on your plan, so check your account before a loop. The SDK never retries a call: a retry could bill a second time, and a call that timed out may already have been billed. If you want retries, add them for the errors you know are safe.

## Options

```ts
new DbaseClient({
  token: "...",
  baseUrl: "https://app.dbase.com.br", // default
  timeout: 60_000, // milliseconds, default
  fetch: myFetch, // replaces the global fetch
});
```

## About the types

Request types follow DBase's swagger. The one answer type shaped by the docs is the envelope of `prospeccao`. Every other successful answer is typed as a plain object (`Record<string, unknown>`), because DBase's swagger does not describe the answers and none has been captured yet. Check a field before you read it.

Not included: DBase's web panel (the `PHPSESSID` login). That route reads HTML and needs a session kept alive; this SDK only speaks the API.

If a real answer does not fit, [open an issue](https://github.com/gusnips/dbase/issues) with the call and the field.

## License

MIT
