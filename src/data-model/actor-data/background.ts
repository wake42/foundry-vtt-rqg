export enum OccupationEnum {
  NoOccupation = "",
  AssistantShaman = "assistantShaman",
  Bandit = "bandit",
  ChariotDriver = "chariotDriver",
  Crafter = "crafter",
  Entertainer = "entertainer",
  Farmer = "farmer",
  Fisher = "fisher",
  Healer = "healer",
  Herder = "herder",
  Hunter = "hunter",
  Merchant = "merchant",
  Noble = "noble",
  Philosopher = "philosopher",
  Priest = "priest",
  Scribe = "scribe",
  Thief = "thief",
  WarriorHeavyInfantry = "warriorHeavyInfantry",
  WarriorLightInfantry = "warriorLightInfantry",
  WarriorHeavyCavalry = "warriorHeavyCavalry",
  WarriorLightCavalry = "warriorLightCavalry",
}

export enum HomeLandEnum {
  Aggar = "aggar",
  Balazar = "balazar",
  BeastValley = "beastValley",
  Bilini = "bilini",
  DagoriInkarth = "dagoriInkarth",
  DragonPass = "dragonPass",
  DryadWoods = "dryadWoods",
  Esrolia = "esrolia",
  Grazelands = "grazelands",
  Hendrikiland = "hendrikiland",
  Heortland = "heortland",
  Holay = "holay",
  Imither = "imither",
  LunarTarsh = "lunarTarsh",
  OldTarsh = "oldTarsh",
  PraxianTribes = "praxianTribes",
  Sartar = "sartar",
  ShadowPlateau = "shadowPlateau",
  StinkingForest = "stinkingForest",
  TrollWoods = "trollWoods",
  Vansh = "vansh",
  HabitatPlains = "habitatPlains",
  HabitatForest = "habitatForest",
  HabitatMountainsHills = "habitatMountainsHills",
  HabitatMarshSwamp = "habitatMarshSwamp",
  HabitatWaterSea = "habitatWaterSea",
  HabitatSky = "habitatSky",
  HabitatGlacier = "habitatGlacier",
  HabitatUnderground = "habitatUnderground",
}

export interface Background {
  race: string;
  occupation: OccupationEnum;
  homeland: HomeLandEnum;
  town?: string;
  birthYear?: number;
  age?: number;
  gender?: string;
  tribe?: string;
  clan?: string;
  reputation?: number;
  standardOfLiving?: string;
  ransom?: number;
  baseIncome?: number;
  biography?: string;
}

export const emptyBackground: Background = {
  race: "Human",
  occupation: OccupationEnum.NoOccupation,
  homeland: HomeLandEnum.Sartar,
};
