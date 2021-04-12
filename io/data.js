const cardsList = [
  { familyId: 0, id: 0, power: 0, name: "Rat", baseAmount: 4 },
  { familyId: 1, id: 1, power: 1, name: "Gobelin", baseAmount: 4 },
  { familyId: 2, id: 2, power: 2, name: "Squelette", baseAmount: 4 },
  { familyId: 3, id: 3, power: 3, name: "Orc", baseAmount: 4 },
  { familyId: 4, id: 4, power: 4, name: "Vampire", baseAmount: 4 },
  { familyId: 5, id: 5, power: 5, name: "Golem", baseAmount: 4 },
  { familyId: 6, id: 6, power: 6, name: "Liche", baseAmount: 2 },
  { familyId: 7, id: 7, power: 7, name: "Démon", baseAmount: 2 },
  { familyId: 9, id: 9, power: 9, name: "Dragon", baseAmount: 2 },
  { familyId: 10, id: 10, power: 0, name: "Fée", baseAmount: 1 },
];

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
    passive: { ignoreFamilyId: [1, 2, 3] },
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
    passive: { ignoreFamilyId: [9] },
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
    name: "Patte du Rat Momie",
    passive: { ignoreFamilyId: [0, 6] },
    active: {},
  },
  {
    name: "Donjon Plus",
    passive: { bonusScore: 3 },
    active: {},
  },
  {
    name: "Marteau de Guerre",
    passive: { ignoreFamilyId: [5] },
    active: {},
  },
  {
    name: "Livre Sacré",
    passive: { bonusHP: 2, ignoreFamilyId: [2] },
    active: {},
  },

  {
    name: "Sceptre Sanglant",
    passive: { lifestealFamilyId: [4] },
    active: {},
  },
  {
    name: "Fléau de Liche",
    passive: { lifestealFamilyId: [6] },
    active: {},
  },
  {
    name: "Anneau de Pouvoir",
    passive: { lifestealPower: [1, 2] },
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
  {
    name: "Champ de Force",
    passive: { ignoreFct: (p, dice) => dice >= 5 },
    active: {},
    passiveDescription: "Lance un dé, ignore le Mostre sur 5 ou plus",
  },
  // actives
  {
    name: "Epée Dansante",
    passive: {},
    active: { ignorePower: (p) => p % 2 !== 0 },
    activeDescription: "Ignore un Monstre Impair",
  },
  {
    name: "Main de Midas",
    passive: {},
    active: { lifestealPower: (p) => p <= 5 },
    activeDescription: "Absorbe un Monstre de puissance 5 ou moins",
  },
  {
    name: "Masque à Gaz",
    passive: { bonusHP: 4 },
    active: { ignorePower: (p) => true },
    activeDescription: "Ignorez un Monstre",
  },
  {
    name: "Barde",
    passive: { bonusHP: 3 },
    active: { ignorePower: (p) => true },
    activeDescription: "Ignorez un Monstre",
  },
  {
    name: "Hache Vorpale",
    passive: {},
    active: { ignorePower: (p) => true },
    activeDescription: "Ignorez un Monstre",
  },
  {
    name: "Calumet de la Paix",
    passive: {},
    active: { ignorePower: (p) => true, passTurn: true },
    activeDescription: "Ignorez un Monstre et passez votre tour",
  },
  {
    name: "Sablier Sombre",
    passive: {},
    active: { passTurn: true },
    activeDescription: "Passez votre tour, même pendant un combat",
  },
  {
    name: "Concoction étrange",
    passive: {},
    active: { changeHP: (hp) => hp + 5 },
    activeDescription: "Gagnez 5 PV",
  },
];

itemsList.forEach((item, i) => {
  item.broken = false;
  item.id = i;
});

module.exports = { cardsList, itemsList };
