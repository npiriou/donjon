const cardsList = [
  {
    id: 0,
    power: 0,
    name: "Rat",
    baseAmount: 4,
  },
  {
    id: 1,
    power: 1,
    name: "Gobelin",
    baseAmount: 4,
  },
  {
    id: 2,
    power: 2,
    name: "Squelette",
    baseAmount: 4,
  },
  {
    id: 3,
    power: 3,
    name: "Orc",
    baseAmount: 4,
  },
  {
    id: 4,
    power: 4,
    name: "Vampire",
    baseAmount: 4,
  },
  {
    id: 5,
    power: 5,
    name: "Golem",
    baseAmount: 4,
  },
  {
    id: 6,
    power: 6,
    name: "Liche",
    baseAmount: 2,
  },
  {
    id: 7,
    power: 7,
    name: "Démon",
    baseAmount: 2,
  },
  {
    id: 9,
    power: 9,
    name: "Dragon",
    baseAmount: 2,
  },
  {
    id: 10,
    power: 0,
    name: "Fée",
    baseAmount: 1,
  },
];
// itemsList template
// {
//   name: "",
//   passive: { bonusHP: 0, ignorePower: [], ignoreId: [] },
//   active: {},
// },
const itemsList = [
  {
    name: "Mamie",
    passive: { bonusHP: 3 },
    active: {},
  },
  {
    name: "Tunique Elfique",
    passive: { bonusHP: 5 },
    active: {},
  },
  {
    name: "Torche",
    passive: { ignoreId: [1, 2, 3] },
    active: {},
  },
  {
    name: "Pierre Maléfique",
    passive: { ignorePower: [1, 3] },
    active: {},
  },
  {
    name: "Rondache",
    passive: { bonusHP: 3 },
    active: {},
  },
  {
    name: "Herbes Médicinales",
    passive: { bonusHP: 3 },
    active: {},
  },
  {
    name: "Armure de plates",
    passive: { bonusHP: 5 },
    active: {},
  },
  {
    name: "Cotte de mailles",
    passive: { bonusHP: 4 },
    active: {},
  },
  {
    name: "Trophus",
    passive: { bonusHP: 6 },
    active: {},
  },
  {
    name: "Lance Dragon",
    passive: { ignoreId: [9] },
    active: {},
  },
  {
    name: "Familier Zombie",
    passive: { bonusHP: 6 },
    active: {},
  },
  {
    name: "Graal",
    passive: { ignorePower: [2, 6] },
    active: {},
  },
  {
    name: "Bracelet de Protection",
    passive: { bonusHP: 3 },
    active: {},
  },
  {
    name: "Bouclier en cuir",
    passive: { bonusHP: 3 },
    active: {},
  },
  {
    name: "Concoction étrange",
    passive: { bonusHP: 5 },
    active: {},
  },
  {
    name: "Patte du Rat Momie",
    passive: { ignoreId: [0, 6] },
    active: {},
  },
  {
    name: "Donjon Plus",
    passive: { bonusScore: 3 },
    active: {},
  },
  {
    name: "Marteau de Guerre",
    passive: { ignoreId: [5] },
    active: {},
  },
  {
    name: "Livre Sacré",
    passive: { bonusHP: 2, ignoreId: [2] },
    active: {},
  },

  {
    name: "Sceptre Sanglant",
    passive: { lifeStealId: [4] },
    active: {},
  },
  {
    name: "Fléau de Liche",
    passive: { lifeStealId: [6] },
    active: {},
  },
  {
    name: "Anneau de Pouvoir",
    passive: { lifeStealId: [1, 2] },
    active: {},
  },
  {
    name: "Sandales du Gamer",
    passive: { bonusHP: 2, bonusRun: 2 },
    active: {},
  },
  {
    name: "Gros Boulet",
    passive: { bonusHP: 7, bonusRun: -1 },
    active: {},
  },
];

itemsList.forEach((item, i) => {
  item.broken = false;
  item.id = i;
});

module.exports = { cardsList, itemsList };
