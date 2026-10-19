// Weapon Lust numbers. The meter fills when a never-held weapon is equipped on the map, then drains.
export const LUST = { gain: 30, drain: 1.5, maxBonus: 0.15, toyBonus: 0.1, toyTime: 6 };
// damage multiplier for the weapon in hand: up to +15% from the meter, +10% during NEW TOY
export const lustMult = h => 1 + ((h.lust || 0) / 100) * LUST.maxBonus + ((h.newToyT || 0) > 0 ? LUST.toyBonus : 0);
