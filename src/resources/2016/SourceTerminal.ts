import {
  cliExecute,
  Effect,
  Item,
  Monster,
  Path,
  myPath,
  Skill,
} from "kolmafia";

import { Copier } from "../../Copier";
import { haveInCampground } from "../../lib";
import { get } from "../../property";
import { $effect, $item, $skill } from "../../template-string";
import { arrayEquals } from "../../utils";

export const item = $item`Source terminal`;

/**
 * @returns Is the terminal currently installed & available in our campground?
 */
export function have(): boolean {
  return haveInCampground(item);
}

/**
 * Buffs that can be acquired from Enhance
 *
 * - Items: +30% Item Drop
 * - Meat: +60% Meat Drop
 * - Init: +50% Initiative
 * - Critical: +10% chance of Critical Hit, +10% chance of Spell Critical Hit
 * - Damage: +5 Prismatic Damage
 * - Substats: +3 Stats Per Fight
 */
export const Buffs = {
  Items: $effect`items.enh`,
  Meat: $effect`meat.enh`,
  Init: $effect`init.enh`,
  Critical: $effect`critical.enh`,
  Damage: $effect`damage.enh`,
  Substats: $effect`substats.enh`,
};

/**
 * Acquire a buff from the Source Terminal
 *
 * @param buff The buff to acquire
 * @see Buffs
 * @returns Whether we successfully acquired the buff
 */
export function enhance(buff: Effect): boolean {
  if (!Object.values(Buffs).includes(buff)) {
    return false;
  }

  return cliExecute(`terminal enhance ${buff.name}`);
}

/**
 * Rollover buffs that can be acquired from Enquiry
 */
export const RolloverBuffs = {
  /** +5 Familiar Weight */
  Familiar: $effect`familiar.enq`,
  /** +25 ML */
  Monsters: $effect`monsters.enq`,
  /** +5 Prismatic Resistance */
  Protect: $effect`protect.enq`,
  /** +100% Muscle, +100% Mysticality, +100% Moxie */
  Stats: $effect`stats.enq`,
};

/**
 * Acquire a buff from the Source Terminal
 *
 * @param rolloverBuff The buff to acquire
 * @see RolloverBuffs
 * @returns Whether we successfully `enquire`d the terminal for our rollover buff
 */
export function enquiry(rolloverBuff: Effect): boolean {
  if (!Object.values(RolloverBuffs).includes(rolloverBuff)) {
    return false;
  }

  return cliExecute(`terminal enquiry ${rolloverBuff.name}`);
}

/**
 * Skills that can be acquired from Enhance
 */
export const Skills = {
  /** Collect Source essence from enemies once per combat */
  Extract: $skill`Extract`,
  /** Stagger and create a wandering monster 1-3 times per day */
  Digitize: $skill`Digitize`,
  /** Stagger and deal 25% of enemy HP in damage once per combat */
  Compress: $skill`Compress`,
  /** Double monster's HP, attack, defence, attacks per round and item drops once per fight and once per day (five in The Source) */
  Duplicate: $skill`Duplicate`,
  /** Causes government agent/Source Agent wanderer next turn once per combat and three times per day */
  Portscan: $skill`Portscan`,
  /** Increase Max MP by 100% and recover 1000 MP once per combat with a 30 turn cooldown */
  Turbo: $skill`Turbo`,
};

/**
 * Make a skill available.
 * The Source Terminal can give the player access to two skills at any time
 *
 * @param skills Skill or 2-tuple of Skills to learn
 * @see Skills
 * @returns Whether our current skills match the ones we asked for
 */
export function educate(skills: Skill | [Skill, Skill]): boolean {
  const skillsArray = Array.isArray(skills) ? skills.slice(0, 2) : [skills];
  if (arrayEquals(skillsArray, getSkills())) return true;

  for (const skill of skillsArray) {
    if (!Object.values(Skills).includes(skill)) return false;

    cliExecute(`terminal educate ${skill.name.toLowerCase()}.edu`);
  }

  return true;
}

/**
 * @returns The Skills currently available from Source Terminal
 */
export function getSkills(): Skill[] {
  return (["sourceTerminalEducate1", "sourceTerminalEducate2"] as const)
    .map((p) => get(p))
    .filter((s) => s !== "")
    .map((s) => Skill.get(s.slice(0, -4)));
}

/**
 * @param skills A Skill or 2-tuple of Skills to check if we currently have active
 * @returns Whether the input agrees with our current skills
 */
export function isCurrentSkill(skills: Skill | [Skill, Skill]): boolean {
  const currentSkills = getSkills();
  const skillsArray = Array.isArray(skills) ? skills.slice(0, 2) : [skills];

  return skillsArray.every((skill) => currentSkills.includes(skill));
}

/**
 * Items that can be generated by the Source Terminal
 */
export const Items = new Map<Item, string>([
  [$item`browser cookie`, "food.ext"],
  [$item`hacked gibson`, "booze.ext"],
  [$item`Source shades`, "goggles.ext"],
  [$item`Source terminal GRAM chip`, "gram.ext"],
  [$item`Source terminal PRAM chip`, "pram.ext"],
  [$item`Source terminal SPAM chip`, "spam.ext"],
  [$item`Source terminal CRAM chip`, "cram.ext"],
  [$item`Source terminal DRAM chip`, "dram.ext"],
  [$item`Source terminal TRAM chip`, "tram.ext"],
  [$item`software bug`, "familiar.ext"],
]);

/**
 * Collect an item from the Source Terminal (up to three times a day)
 *
 * @param item Item to collect
 * @see Items
 * @returns Whether the `cliExecute` succeeded
 */
export function extrude(item: Item): boolean {
  const fileName = Items.get(item);
  if (!fileName) return false;

  return cliExecute(`terminal extrude ${fileName}`);
}

type Chip =
  | "INGRAM"
  | "DIAGRAM"
  | "ASHRAM"
  | "SCRAM"
  | "TRIGRAM"
  | "CRAM"
  | "DRAM"
  | "TRAM";
/**
 * @returns chips currently installed to player's Source Terminal
 */
export function getChips(): Chip[] {
  return get("sourceTerminalChips").split(",") as Chip[];
}

/**
 * @returns number of times digitize was cast today
 */
export function getDigitizeUses(): number {
  return get("_sourceTerminalDigitizeUses");
}

/**
 * @returns Monster that is currently digitized, else `null`
 */
export function getDigitizeMonster(): Monster | null {
  return get("_sourceTerminalDigitizeMonster");
}

/**
 * @returns number of digitized monsters encountered since it was last cast
 */
export function getDigitizeMonsterCount(): number {
  return get("_sourceTerminalDigitizeMonsterCount");
}

/**
 * @returns maximum number of digitizes player can cast
 */
export function getMaximumDigitizeUses(): number {
  const chips = getChips();
  return (
    1 + (chips.includes("TRAM") ? 1 : 0) + (chips.includes("TRIGRAM") ? 1 : 0)
  );
}

/**
 * @returns the current day's number of remaining digitize uses
 */
export function getDigitizeUsesRemaining(): number {
  return getMaximumDigitizeUses() - getDigitizeUses();
}

/**
 * @returns whether the player could theoretically cast Digitize
 */
export function couldDigitize(): boolean {
  return getDigitizeUses() < getMaximumDigitizeUses();
}

/**
 * Sets Digitize to be one of our skilsl if it currently isn't
 *
 * @returns Whether we expect that Digitize is one of our active skills now
 */
export function prepareDigitize(): boolean {
  if (!isCurrentSkill(Skills.Digitize)) {
    return educate(Skills.Digitize);
  }

  return true;
}

/**
 * Determines whether the player can cast Digitize immediately
 * This only considers whether the player has learned the skill
 * and has sufficient daily casts remaining, not whether they have sufficient MP
 *
 * @returns Whether the player can currently cast digitize, ignoring the MP cost but accounting for other factors
 */
export function canDigitize(): boolean {
  return couldDigitize() && getSkills().includes(Skills.Digitize);
}

export const Digitize = new Copier(
  () => couldDigitize(),
  () => prepareDigitize(),
  () => canDigitize(),
  () => getDigitizeMonster()
);

/**
 * @returns number of times duplicate was cast today
 */
export function getDuplicateUses(): number {
  return get("_sourceTerminalDuplicateUses");
}

/**
 * @returns number of times enhance was cast today
 */
export function getEnhanceUses(): number {
  return get("_sourceTerminalEnhanceUses");
}

/**
 * @returns number of times portscan was cast today
 */
export function getPortscanUses(): number {
  return get("_sourceTerminalPortscanUses");
}

/**
 * @returns maximum number of times duplicate can be used
 */
export function maximumDuplicateUses(): number {
  return myPath() === Path.get("The Source") ? 5 : 1;
}

/**
 * @returns number of remaining times duplicate can be used today
 */
export function duplicateUsesRemaining(): number {
  return maximumDuplicateUses() - getDuplicateUses();
}

/**
 * @returns number of times enhance can be used per day
 */
export function maximumEnhanceUses(): number {
  return (
    1 + getChips().filter((chip) => ["CRAM", "SCRAM"].includes(chip)).length
  );
}

/**
 * @returns number of remaining times enahce can be used today
 */
export function enhanceUsesRemaining(): number {
  return maximumEnhanceUses() - getEnhanceUses();
}

/**
 * @returns expected duration of an enhance buff
 */
export function enhanceBuffDuration(): number {
  return (
    25 +
    get("sourceTerminalPram") * 5 +
    (getChips().includes("INGRAM") ? 25 : 0)
  );
}

/**
 * @returns expected duration of an enquiry buff
 */
export function enquiryBuffDuration(): number {
  return (
    50 +
    10 * get("sourceTerminalGram") +
    (getChips().includes("DIAGRAM") ? 50 : 0)
  );
}
