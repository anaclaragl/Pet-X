export interface BrazilianState {
  sigla: string;
  nome: string;
}

export const BRAZILIAN_STATES: BrazilianState[] = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

export const POPULAR_CITIES_BY_STATE: Record<string, string[]> = {
  MG: [
    'Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros',
    'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga', 'Sete Lagoas',
    'Divinópolis', 'Santa Luzia', 'Ibirité', 'Poços de Caldas', 'Patos de Minas',
    'Pouso Alegre', 'Teófilo Otoni', 'Barbacena', 'Sabará', 'Varginha', 'Vespasiano',
    'Conselheiro Lafaiete', 'Itabira', 'Araguari', 'Ubá', 'Passos', 'Coronel Fabriciano',
    'Muriaé', 'Itajubá', 'Itaúna', 'Três Corações', 'Lavras', 'Pará de Minas', 'Nova Lima',
    'Ouro Preto', 'Mariana', 'Viçosa', 'Diamantina', 'Tiradentes', 'São João del-Rei',
    'Alfenas', 'Caratinga', 'Manhuaçu', 'Timóteo', 'Curvelo', 'João Monlevade'
  ],
  SP: [
    'São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'São José dos Campos',
    'Santo André', 'Ribeirão Preto', 'Osasco', 'Sorocaba', 'Mauá', 'São José do Rio Preto',
    'Mogi das Cruzes', 'Santos', 'Diadema', 'Jundiaí', 'Piracicaba', 'Carapicuíba',
    'Bauru', 'Itaquaquecetuba', 'São Vicente', 'Franca', 'Praia Grande', 'Guarujá',
    'Taubaté', 'Limeira', 'Suzano', 'Taboão da Serra', 'Sumaré', 'Barueri', 'Embu das Artes',
    'São Carlos', 'Indaiatuba', 'Cotia', 'Americana', 'Marília', 'Araraquara', 'Jacareí'
  ],
  RJ: [
    'Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói',
    'Belford Roxo', 'Campos dos Goytacazes', 'São João de Meriti', 'Petrópolis',
    'Volta Redonda', 'Macaé', 'Magé', 'Itaboraí', 'Cabo Frio', 'Angra dos Reis',
    'Nova Friburgo', 'Barra Mansa', 'Teresópolis', 'Mesquita', 'Nilópolis', 'Maricá'
  ],
  BA: [
    'Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro',
    'Itabuna', 'Lauro de Freitas', 'Ilhéus', 'Jequié', 'Teixeira de Freitas',
    'Barreiras', 'Alagoinhas', 'Porto Seguro', 'Simões Filho', 'Paulo Afonso'
  ],
  PR: [
    'Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais',
    'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá', 'Araucária', 'Toledo',
    'Apucarana', 'Pinhais', 'Campo Largo', 'Arapongas', 'Almirante Tamandaré'
  ],
  RS: [
    'Porto Alegre', 'Caxias do Sul', 'Canoas', 'Pelotas', 'Santa Maria', 'Gravataí',
    'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande', 'Alvorada', 'Passo Fundo',
    'Sapucaia do Sul', 'Uruguaiana', 'Santa Cruz do Sul', 'Cachoeirinha', 'Bento Gonçalves'
  ],
  SC: [
    'Joinville', 'Florianópolis', 'Blumenau', 'São José', 'Chapecó', 'Itajaí',
    'Criciúma', 'Jaraguá do Sul', 'Palhoça', 'Lages', 'Balneário Camboriú', 'Brusque',
    'Tubarão', 'São Bento do Sul', 'Caçador', 'Concórdia', 'Camboriú'
  ],
  DF: [
    'Brasília', 'Ceilândia', 'Samambaia', 'Taguatinga', 'Plano Piloto', 'Planaltina',
    'Águas Claras', 'Recanto das Emas', 'Gama', 'Guará', 'Santa Maria', 'Sobradinho'
  ],
  GO: [
    'Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Águas Lindas de Goiás',
    'Luziânia', 'Valparaíso de Goiás', 'Trindade', 'Formosa', 'Senador Canedo', 'Itumbiara'
  ],
  PE: [
    'Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina', 'Paulista',
    'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns', 'Vitória de Santo Antão'
  ],
  CE: [
    'Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral', 'Crato',
    'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá', 'Pacatuba', 'Aquiraz'
  ],
};

const citiesCache = new Map<string, string[]>();

/**
 * Retorna as cidades de um estado brasileiro.
 * Carrega a lista completa via API do IBGE de forma assíncrona,
 * com fallback imediato para as cidades populares pré-carregadas.
 */
export async function getCitiesForState(uf: string): Promise<string[]> {
  const cleanUf = uf.toUpperCase().trim();
  if (!cleanUf) return [];

  if (citiesCache.has(cleanUf)) {
    return citiesCache.get(cleanUf)!;
  }

  const fallback = POPULAR_CITIES_BY_STATE[cleanUf] || [];

  try {
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${cleanUf}/municipios`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const cityNames = data.map((c: any) => c.nome).sort((a: string, b: string) => a.localeCompare(b));
        citiesCache.set(cleanUf, cityNames);
        return cityNames;
      }
    }
  } catch (err) {
    // Silencioso, usa fallback local
  }

  return fallback;
}
