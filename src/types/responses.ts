/**
 * The shape of a successful answer is not typed yet: the DBase API only answers calls from
 * allowlisted IPs, and no successful answer has been captured to read the fields from. Until then
 * the answer is a plain object. Check a field before you rely on it.
 */
export type DbaseResult = Record<string, unknown>;

export type CpfResponse = DbaseResult;
export type CnpjResponse = DbaseResult;
export type TelefoneResponse = DbaseResult;
export type CepResponse = DbaseResult;
export type NomeResponse = DbaseResult;
export type EmailResponse = DbaseResult;

/**
 * The envelope is the one DBase's swagger describes:
 * `{ status, total, total_mais, pagina, por_pagina, total_paginas, cobrado, empresas[] }`.
 * The fields of each company are not typed yet, and the types of `total_mais` and `cobrado` are
 * not documented.
 */
export interface ProspeccaoResponse {
  status: boolean;
  total: number;
  total_mais: unknown;
  pagina: number;
  por_pagina: number;
  total_paginas: number;
  cobrado: unknown;
  empresas: DbaseResult[];
}
