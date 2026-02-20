/**
 * Brazilian address generator
 */

const STREET_TYPES = ["Rua", "Avenida", "Travessa", "Alameda", "Praça"];

const STREET_NAMES = [
  "das Flores",
  "Brasil",
  "São Paulo",
  "Minas Gerais",
  "Santos Dumont",
  "Tiradentes",
  "da Paz",
  "das Palmeiras",
  "Rio Branco",
  "Getúlio Vargas",
  "XV de Novembro",
  "Sete de Setembro",
  "Dom Pedro II",
  "Marechal Deodoro",
  "Presidente Vargas",
  "José Bonifácio",
  "Treze de Maio",
  "da República",
  "Independência",
  "das Nações",
];

const CITIES = [
  { city: "São Paulo", state: "SP", cepPrefix: "01" },
  { city: "Rio de Janeiro", state: "RJ", cepPrefix: "20" },
  { city: "Belo Horizonte", state: "MG", cepPrefix: "30" },
  { city: "Curitiba", state: "PR", cepPrefix: "80" },
  { city: "Porto Alegre", state: "RS", cepPrefix: "90" },
  { city: "Salvador", state: "BA", cepPrefix: "40" },
  { city: "Recife", state: "PE", cepPrefix: "50" },
  { city: "Fortaleza", state: "CE", cepPrefix: "60" },
  { city: "Brasília", state: "DF", cepPrefix: "70" },
  { city: "Goiânia", state: "GO", cepPrefix: "74" },
  { city: "Campinas", state: "SP", cepPrefix: "13" },
  { city: "Manaus", state: "AM", cepPrefix: "69" },
  { city: "Florianópolis", state: "SC", cepPrefix: "88" },
];

const STATES: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDigits(count: number): string {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
}

export function generateStreet(): string {
  const type = randomItem(STREET_TYPES);
  const name = randomItem(STREET_NAMES);
  const number = Math.floor(Math.random() * 9999) + 1;
  return `${type} ${name}, ${number}`;
}

export function generateCity(): string {
  return randomItem(CITIES).city;
}

export function generateState(): string {
  const cityData = randomItem(CITIES);
  return cityData.state;
}

export function generateStateName(): string {
  const state = generateState();
  return STATES[state] || state;
}

export function generateCep(formatted = true): string {
  const cityData = randomItem(CITIES);
  const cep =
    `${cityData.cepPrefix}${randomDigits(6 - cityData.cepPrefix.length)}000`.slice(
      0,
      8,
    );
  if (!formatted) return cep;
  return `${cep.slice(0, 5)}-${cep.slice(5)}`;
}

export function generateFullAddress(): string {
  const street = generateStreet();
  const cityData = randomItem(CITIES);
  const cep = generateCep();
  return `${street} - ${cityData.city}/${cityData.state} - CEP: ${cep}`;
}
