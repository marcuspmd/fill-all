/**
 * Brazilian name generator
 */

const FIRST_NAMES_MALE = [
  "João",
  "Pedro",
  "Carlos",
  "Lucas",
  "Rafael",
  "Bruno",
  "Gustavo",
  "Thiago",
  "Diego",
  "Marcelo",
  "Rodrigo",
  "André",
  "Felipe",
  "Gabriel",
  "Leonardo",
  "Matheus",
  "Vinícius",
  "Eduardo",
  "Daniel",
  "Henrique",
  "Ricardo",
  "Fernando",
  "Paulo",
  "Marcos",
  "Alessandro",
];

const FIRST_NAMES_FEMALE = [
  "Maria",
  "Ana",
  "Júlia",
  "Fernanda",
  "Camila",
  "Larissa",
  "Beatriz",
  "Amanda",
  "Patrícia",
  "Vanessa",
  "Priscila",
  "Aline",
  "Bruna",
  "Carolina",
  "Isabela",
  "Gabriela",
  "Letícia",
  "Mariana",
  "Natália",
  "Raquel",
  "Simone",
  "Tatiana",
  "Viviane",
  "Débora",
  "Cristiane",
];

const LAST_NAMES = [
  "Silva",
  "Santos",
  "Oliveira",
  "Souza",
  "Lima",
  "Pereira",
  "Ferreira",
  "Costa",
  "Rodrigues",
  "Almeida",
  "Nascimento",
  "Carvalho",
  "Araújo",
  "Ribeiro",
  "Martins",
  "Gomes",
  "Barbosa",
  "Rocha",
  "Dias",
  "Moreira",
  "Vieira",
  "Cardoso",
  "Mendes",
  "Correia",
  "Teixeira",
  "Lopes",
  "Monteiro",
  "Freitas",
  "Pinto",
  "Nunes",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateFirstName(): string {
  const isMale = Math.random() > 0.5;
  return randomItem(isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE);
}

export function generateLastName(): string {
  return randomItem(LAST_NAMES);
}

export function generateFullName(): string {
  const firstName = generateFirstName();
  const middleName = Math.random() > 0.5 ? ` ${randomItem(LAST_NAMES)}` : "";
  const lastName = generateLastName();
  return `${firstName}${middleName} ${lastName}`;
}

export function generateCompanyName(): string {
  const prefixes = [
    "Tech",
    "Digital",
    "Neo",
    "Smart",
    "Global",
    "Inova",
    "Max",
    "Prime",
    "Ultra",
  ];
  const suffixes = [
    "Solutions",
    "Systems",
    "Corp",
    "Group",
    "Labs",
    "Soft",
    "Data",
    "Cloud",
    "Net",
  ];
  const types = ["LTDA", "S.A.", "ME", "EIRELI", "EPP"];

  return `${randomItem(prefixes)}${randomItem(suffixes)} ${randomItem(types)}`;
}
