export type RuneMagicData = {
  description: string;
  cultId: string; // The cult from where to draw rune points
  runes: Array<string>; // Rune names like "Man (form)"
  points: number; // Learned strength
  isStackable: boolean; // Can the caster decide the number of rune points used
  castingRange: number; // meter - default 160
  duration: number; // seconds - default to 15*60 = 900
  chance: number; // Derived from runes, but has to be persisted?
  // --- Derived / Convenience Data Below ---
  cultIds?: Array<string>; // For select on sheet
  allRunes?: Array<any>; // For select on sheet {_id: , name:, img: }
};

export const emptyRuneMagic: RuneMagicData = {
  description: "",
  cultId: "",
  runes: [],
  points: 0,
  isStackable: false,
  castingRange: 160,
  duration: 900,
  chance: 0,
};
