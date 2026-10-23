/** Digits only or formatted, as you have it. */
export interface CpfRequest {
  cpf: string;
}

export interface CnpjRequest {
  cnpj: string;
  /** API version of the CNPJ answer. DBase's default is `1`. */
  versao?: 1 | 2;
}

export interface TelefoneRequest {
  telefone: string;
}

export interface CepRequest {
  cep: string;
  /** First street number to include in the answer. */
  numero_inicial?: number;
  /** Last street number to include in the answer. */
  numero_final?: number;
}

export interface NomeRequest {
  nome: string;
}

export interface EmailRequest {
  email: string;
}

export type Porte = "Microempresa (ME)" | "Empresa de Pequeno Porte (EPP)" | "Demais";

/** Needs the "Prospecção de Empresas" product on your DBase account. */
export interface ProspeccaoRequest {
  /** State, for example `"ES"`. */
  uf: string;
  /** City, for example `"VITORIA"`. */
  cidade: string;
  bairro?: string;
  /** Main CNAE, 7 digits (subclass). */
  cnae?: string;
  porte?: Porte;
  /** Opted into Simples Nacional: `"S"` or `"N"`. */
  simples?: "S" | "N";
  /** MEI: `"S"` or `"N"`. */
  mei?: "S" | "N";
  /** `"ativas"` by default. */
  situacao?: "ativas" | "todas";
  /** Only companies opened on or after this date, `YYYY-MM-DD`. */
  abertura?: string;
  /** `1` for head offices only. */
  so_matriz?: 0 | 1;
  /** `"recentes"` by default. */
  ordem?: "recentes" | "nome";
  /** 1 to 40, 50 companies per page. Paging through the same search is not billed again. */
  pagina?: number;
}
