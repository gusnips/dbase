import { Http } from "./http";
import type { DbaseConfig } from "./types/common";
import type {
  CepRequest,
  CnpjRequest,
  CpfRequest,
  EmailRequest,
  NomeRequest,
  ProspeccaoRequest,
  TelefoneRequest,
} from "./types/requests";
import type {
  CepResponse,
  CnpjResponse,
  CpfResponse,
  EmailResponse,
  NomeResponse,
  ProspeccaoResponse,
  TelefoneResponse,
} from "./types/responses";

/**
 * @example
 * ```ts
 * const dbase = new DbaseClient("YOUR_TOKEN");
 * const found = await dbase.cnpj({ cnpj: "00000000000191" });
 * ```
 *
 * One method per `consulta` the DBase API accepts. The API has a single endpoint, so the methods
 * are flat: `consulta=cpf` is `dbase.cpf()`.
 */
export class DbaseClient {
  private readonly http: Http;

  constructor(config: DbaseConfig | string) {
    this.http = new Http(typeof config === "string" ? { token: config } : config);
  }

  /** `consulta=cpf` */
  cpf(params: CpfRequest): Promise<CpfResponse> {
    return this.http.post("cpf", params);
  }

  /** `consulta=cnpj`. `versao` picks the API version of the answer. */
  cnpj({ versao, ...params }: CnpjRequest): Promise<CnpjResponse> {
    return this.http.post("cnpj", params, versao === undefined ? undefined : { versao });
  }

  /** `consulta=telefone` */
  telefone(params: TelefoneRequest): Promise<TelefoneResponse> {
    return this.http.post("telefone", params);
  }

  /** `consulta=cep`. `numero_inicial` and `numero_final` narrow the street numbers. */
  cep(params: CepRequest): Promise<CepResponse> {
    return this.http.post("cep", params);
  }

  /** `consulta=nome` */
  nome(params: NomeRequest): Promise<NomeResponse> {
    return this.http.post("nome", params);
  }

  /** `consulta=email`. Answers the documents tied to the e-mail address. */
  email(params: EmailRequest): Promise<EmailResponse> {
    return this.http.post("email", params);
  }

  /**
   * `consulta=prospeccao`. Lists companies from the Receita Federal base, by city and filters.
   * Needs the "Prospecção de Empresas" product. One search is billed once, and paging through it
   * (`pagina`) is not billed again for 60 minutes.
   */
  prospeccao(params: ProspeccaoRequest): Promise<ProspeccaoResponse> {
    return this.http.post("prospeccao", params);
  }
}
