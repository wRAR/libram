import {
  Effect,
  familiarWeight,
  useFamiliar,
  useSkill,
  weightAdjustment,
} from "kolmafia";
import {
  have as _have,
  canRememberSong,
  getActiveSongs,
  isCurrentFamiliar,
  uneffect,
} from "../../lib";
import { get } from "../../property";
import { $effect, $familiar, $skill } from "../../template-string";

export const familiar = $familiar`Frumious Bandersnatch`;

/**
 * Determines whether the player has the Frumious Bandersnatch in their
 * terrarium
 *
 * @returns Whether the player has a Frumious Bandersnatch
 */
export function have(): boolean {
  return _have(familiar);
}

/**
 * Get the number of free runaways that have already been used
 *
 * @see StompingBoots with which the Bandersnatch shares a counter
 * @returns Number of free runaways used today
 */
export function getRunaways(): number {
  return get("_banderRunaways");
}

/**
 * Determine the total number of free runaways that the player can
 * get from their Bandersnatch
 *
 * @param considerWeightAdjustment Include familiar weight modifiers
 * @returns Current maximum runaways
 */
export function getMaxRunaways(considerWeightAdjustment = true): number {
  const weightBuffs = considerWeightAdjustment ? weightAdjustment() : 0;
  return Math.floor((familiarWeight(familiar) + weightBuffs) / 5);
}

/**
 * Determine the number of remaining free runaways the player can
 * get from their Bandersnatch
 *
 * @param considerWeightAdjustment Include familiar weight modifiers
 * @returns Current maximum runaways reamining
 */
export function getRemainingRunaways(considerWeightAdjustment = true): number {
  return Math.max(0, getMaxRunaways(considerWeightAdjustment) - getRunaways());
}

/**
 * Determine whether the player could use their Bandersnatch to
 * get a free run in theory
 *
 * @param considerWeightAdjustment Include familiar weight modifiers
 * @returns Whether a free run is theoretically possible right now
 */
export function couldRunaway(considerWeightAdjustment = true): boolean {
  return have() && getRemainingRunaways(considerWeightAdjustment) > 0;
}

const odeSkill = $skill`The Ode to Booze`;
const odeEffect = $effect`Ode to Booze`;

/**
 * Determine whether the player can use their Bandersnatch to get a
 * free run right now
 *
 * @returns Whether a free run is actually possible right now
 */
export function canRunaway(): boolean {
  return isCurrentFamiliar(familiar) && couldRunaway() && _have(odeEffect);
}

/**
 * Prepare a Bandersnatch runaway.
 *
 * This will cast Ode to Booze and take your Bandersnatch with you.
 * If any of those steps fail, it will return false.
 *
 * @param songsToRemove Ordered list of songs that could be shrugged to make room for Ode to Booze
 * @returns Success
 */
export function prepareRunaway(songsToRemove: Effect[]): boolean {
  if (!_have(odeEffect)) {
    if (!_have(odeSkill)) {
      return false;
    }

    if (!canRememberSong()) {
      const activeSongs = getActiveSongs();

      for (const song of songsToRemove) {
        if (activeSongs.includes(song) && uneffect(song)) {
          break;
        }
      }
    }

    if (!useSkill(odeSkill)) {
      return false;
    }
  }

  return useFamiliar(familiar);
}
