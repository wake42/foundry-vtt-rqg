export const RQG = {
  debug: {
    showActorActiveEffectsTab: false,
    showAllUiSections: false,
  },

  // TODO
  statusEffects: [
    {
      icon: "systems/swade/assets/icons/status/status_shaken.svg",
      id: "shaken",
      label: "SWADE.Shaken",
    },
    {
      icon: "icons/svg/skull.svg",
      id: "incapacitated",
      label: "SWADE.Incap",
    },
  ],

  equippedIcons: {
    notCarried: "systems/rqg/assets/images/equipped/not_carried.svg",
    carried: "systems/rqg/assets/images/equipped/carried.svg",
    equipped: "systems/rqg/assets/images/equipped/equipped.svg",
  },

  gearViewIcons: {
    byItemType: "systems/rqg/assets/images/gear-views/by-item-type.svg",
    byLocation: "systems/rqg/assets/images/gear-views/by-location.svg",
  },

  dblClickTimeout: 250, // Timeout for differentiating between single & double clicks

  dsnColorSets: {},

  dsnTextureList: {},
};