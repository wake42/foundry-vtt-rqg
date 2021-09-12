import { Ability, ResultEnum } from "../data-model/shared/ability";
import { RqgActor } from "../actors/rqgActor";
import { CombatManeuver } from "../data-model/item-data/meleeWeaponData";
import { ItemTypeEnum } from "../data-model/item-data/itemTypes";
import {
  assertItemType,
  getActorFromIds,
  getGame,
  getGameUser,
  getSpeakerName,
  hasOwnProperty,
  logMisconfiguration,
  moveCursorToEnd,
  requireValue,
  RqgError,
  usersThatOwnActor,
} from "../system/util";
import { DeepPartial } from "snowpack";
import { ItemDataSource } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData";
import { ChatMessageDataConstructorData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/chatMessageData";

type WeaponCardFlags = {
  actorId: string;
  tokenId: string | null;
  skillItemData: ItemDataSource;
  weaponItemData: ItemDataSource;
  result: ResultEnum | undefined;
  formData: {
    modifier: number | null; // Null is a placeholder instead of 0 to keep modifier in the object
    chance: number;
    combatManeuver: CombatManeuver | undefined;
  };
};

enum DamageRollTypeEnum {
  Normal = "normal",
  Special = "special",
  MaxSpecial = "maxSpecial",
}

export class WeaponCard extends ChatMessage {
  // TODO Should it extend ChatMessage?
  public static async show(
    weaponId: string,
    skillId: string,
    actor: RqgActor,
    token: TokenDocument | null
  ): Promise<void> {
    requireValue(actor.id, "No id on actor");
    const skillItem = actor.items.get(skillId);
    if (!skillItem || skillItem.data.type !== ItemTypeEnum.Skill) {
      const msg = `Couldn't find skill with itemId [${skillItem}] on actor ${actor.name} to show a weapon chat card.`;
      ui.notifications?.error(msg);
      throw new RqgError(msg);
    }
    const weaponItem = actor.items.get(weaponId);
    if (
      !weaponItem ||
      !(
        weaponItem.data.type === ItemTypeEnum.MeleeWeapon ||
        weaponItem.data.type === ItemTypeEnum.MissileWeapon
      )
    ) {
      const msg = `Couldn't find weapon with itemId [${skillItem}] on actor ${actor.name} to show a weapon chat card.`;
      ui.notifications?.error(msg);
      throw new RqgError(msg);
    }
    const flags: WeaponCardFlags = {
      actorId: actor.id,
      tokenId: token?.id ?? null,
      skillItemData: skillItem.data.toObject(),
      weaponItemData: weaponItem.data.toObject(),
      result: undefined,
      formData: {
        modifier: null,
        chance: skillItem.data.data.chance || 0,
        combatManeuver: undefined,
      },
    };

    // @ts-ignore 0.8 tabs
    ui.sidebar?.activateTab(ui.sidebar.tabs.chat.tabName); // Switch to chat to make sure the user doesn't miss the chat card
    await ChatMessage.create(await WeaponCard.renderContent(flags));
  }

  public static async inputChangeHandler(ev: Event, messageId: string): Promise<void> {
    const chatMessage = getGame().messages?.get(messageId);
    const flags = chatMessage?.data.flags.rqg as WeaponCardFlags;
    const form = (ev.target as HTMLElement).closest("form") as HTMLFormElement;
    const formData = new FormData(form);
    // @ts-ignore formData.entries
    for (const [name, value] of formData.entries()) {
      if (name in flags.formData) {
        // @ts-ignore number/string mismatch
        flags.formData[name as keyof typeof flags.formData] = value;
      }
    }
    const chance: number =
      (hasOwnProperty(flags.skillItemData.data, "chance") &&
        Number(flags.skillItemData.data.chance)) ||
      0;
    const modifier: number = Number(flags.formData.modifier) || 0;
    flags.formData.chance = WeaponCard.calcRollChance(chance, modifier);

    const data = await WeaponCard.renderContent(flags);
    if (!chatMessage || !data || !flags.formData.modifier) {
      return; // Not ready to update chatmessages
    }
    const domChatMessages = document.querySelectorAll(`[data-message-id="${chatMessage.id}"]`);
    const domChatMessage = Array.from(domChatMessages).find((m) =>
      m.contains(ev.currentTarget as Node)
    );
    const isFromPopoutChat = !!domChatMessage?.closest(".chat-popout");
    await chatMessage.update(data); // Rerenders the dom chatmessages

    const newDomChatMessages = document.querySelectorAll(`[data-message-id="${chatMessage.id}"]`);
    const newDomChatMessage = Array.from(newDomChatMessages).find(
      (m) => !!m.closest(".chat-popout") === isFromPopoutChat
    );
    const inputElement = newDomChatMessage?.querySelector("input");
    inputElement && moveCursorToEnd(inputElement);
    // @ts-ignore is marked as private!?
    ui.chat?.scrollBottom(); // Fix that he weapon card gets bigger and pushes the rest of the chatlog down
  }

  public static async formSubmitHandler(
    ev: JQueryEventObject,
    messageId: string
  ): Promise<boolean> {
    ev.preventDefault();

    // @ts-ignore submitter
    const actionButton = ev.originalEvent.submitter as HTMLButtonElement;
    actionButton.disabled = true;
    setTimeout(() => (actionButton.disabled = false), 1000); // Prevent double clicks

    const chatMessage = getGame().messages?.get(messageId);
    const flags = chatMessage?.data.flags.rqg as WeaponCardFlags;

    const formData = new FormData(ev.target as HTMLFormElement);
    // @ts-ignore formData.entries
    for (const [name, value] of formData.entries()) {
      if (name in flags.formData) {
        // @ts-ignore number/string mismatch
        flags.formData[name as keyof typeof flags.formData] = value;
      }
    }
    const actor = getActorFromIds(flags.actorId, flags.tokenId);

    switch (actionButton.name) {
      case "combatManeuver":
        flags.formData.combatManeuver = (ev as any).originalEvent.submitter.value;
        const projectileItemData =
          hasOwnProperty(flags.weaponItemData.data, "isProjectileWeapon") &&
          flags.weaponItemData.data.isProjectileWeapon
            ? actor.items.get(flags.weaponItemData.data.projectileId)?.data
            : flags.weaponItemData;

        if (
          flags.weaponItemData.type === ItemTypeEnum.MissileWeapon &&
          projectileItemData?.type === ItemTypeEnum.MissileWeapon &&
          projectileItemData.data.quantity &&
          projectileItemData.data.quantity > 0
        ) {
          const updateData: DeepPartial<ItemDataSource> = {
            _id: projectileItemData._id,
            data: { quantity: --projectileItemData.data.quantity },
          };
          await actor.updateEmbeddedDocuments("Item", [updateData]);
        } else if (flags.weaponItemData.type === ItemTypeEnum.MissileWeapon) {
          ui.notifications?.warn("Out of ammo!");
          return false;
        }

        if (!chatMessage) {
          const msg = "Couldn't find Chatmessage";
          ui.notifications?.error(msg);
          throw new RqgError(msg);
        }
        await WeaponCard.roll(flags, chatMessage);
        return false;

      case "damageRoll":
        // @ts-ignore submitter
        const damageRollType: DamageRollTypeEnum = ev.originalEvent.submitter.value;
        await WeaponCard.damageRoll(flags, damageRollType);
        return false;

      case "hitLocationRoll":
        const roll = new Roll("1d20");
        await roll.evaluate({ async: true });
        const speakerName = getSpeakerName(flags.actorId, flags.tokenId);
        await roll.toMessage({
          speaker: { alias: speakerName },
          type: CONST.CHAT_MESSAGE_TYPES.ROLL,
          flavor: `Hitlocation`,
        });
        return false;

      case "fumble":
        await WeaponCard.fumbleRoll(flags);
        return false;

      default:
        const msg = `Unknown button "${actionButton}" in weapon chat card`;
        ui.notifications?.error(msg);
        throw new RqgError(msg);
    }
  }

  public static async roll(flags: WeaponCardFlags, chatMessage: ChatMessage) {
    const modifier: number = Number(flags.formData.modifier) || 0;
    const chance: number =
      (hasOwnProperty(flags.skillItemData.data, "chance") &&
        Number(flags.skillItemData.data.chance)) ||
      0;
    const actor = getActorFromIds(flags.actorId, flags.tokenId);
    const speakerName = getSpeakerName(flags.actorId, flags.tokenId);
    flags.result = await Ability.roll(
      flags.skillItemData.name + " " + flags.formData.combatManeuver,
      chance,
      modifier,
      speakerName
    );
    await WeaponCard.checkExperience(actor, flags.skillItemData, flags.result);
    const data = await WeaponCard.renderContent(flags);
    await chatMessage.update(data);
  }

  public static async checkExperience(
    actor: RqgActor,
    skillItemData: ItemDataSource,
    result: ResultEnum
  ): Promise<void> {
    assertItemType(skillItemData.type, ItemTypeEnum.Skill);
    if (result <= ResultEnum.Success && !skillItemData.data.hasExperience) {
      await actor.updateEmbeddedDocuments("Item", [
        { _id: skillItemData._id, data: { hasExperience: true } },
      ]);
      const specialization = skillItemData.data.specialization
        ? ` (${skillItemData.data.specialization})`
        : "";
      ui.notifications?.info(
        `Yey, you got an experience check on ${skillItemData.data.skillName}${specialization}!`
      );
    }
  }

  private static async renderContent(flags: WeaponCardFlags): Promise<object> {
    let html = await renderTemplate("systems/rqg/chat/weaponCard.html", flags);
    const speakerName = getSpeakerName(flags.actorId, flags.tokenId);
    return {
      flavor: "Weapon: " + flags.weaponItemData.name,
      user: getGameUser().id,
      speaker: { alias: speakerName },
      content: html,
      whisper: usersThatOwnActor(getActorFromIds(flags.actorId, flags.tokenId)),
      type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
      flags: {
        core: { canPopout: true },
        rqg: flags,
      },
    };
  }

  private static calcRollChance(value: number, modifier: number): number {
    return value + modifier;
  }

  private static async damageRoll(
    flags: WeaponCardFlags,
    damageType: DamageRollTypeEnum
  ): Promise<void> {
    if (!flags.formData.combatManeuver) {
      const msg = `Damage Roll didn't have a combat maneuver`;
      ui.notifications?.error(msg);
      throw new RqgError(msg, flags, damageType);
    }

    const actor = getActorFromIds(flags.actorId, flags.tokenId);
    let damageBonusFormula: string =
      actor.data.data.attributes.damageBonus !== "0"
        ? // @ts-ignore 0.8 parse
          `${actor.data.data.attributes.damageBonus}`
        : "";

    if (flags.weaponItemData.type === ItemTypeEnum.MissileWeapon) {
      const missileWeaponData: ItemDataSource = flags.weaponItemData;

      if (missileWeaponData.data.isThrownWeapon) {
        damageBonusFormula = "ceil(" + actor.data.data.attributes.damageBonus + "/2)";
      } else if (missileWeaponData.data.isProjectileWeapon) {
        damageBonusFormula = "";
      }
    }

    const weaponDamage = hasOwnProperty(flags.weaponItemData.data, "damage")
      ? Roll.parse(`(${flags.weaponItemData.data.damage})[weapon]`, {})
      : [];

    const damageRollTerms =
      hasOwnProperty(flags.weaponItemData.data, "damage") && flags.weaponItemData.data.damage
        ? weaponDamage
        : []; // Don't add 0 damage rollTerm

    if ([DamageRollTypeEnum.Special, DamageRollTypeEnum.MaxSpecial].includes(damageType)) {
      if ([CombatManeuver.Slash, CombatManeuver.Impale].includes(flags.formData.combatManeuver)) {
        damageRollTerms.push(
          // @ts-ignore damage
          ...WeaponCard.slashImpaleSpecialDamage(flags.weaponItemData.data.damage)
        );
      } else if (flags.formData.combatManeuver === CombatManeuver.Crush) {
        damageRollTerms.push(...(await WeaponCard.crushSpecialDamage(damageBonusFormula)));
      } else if (flags.formData.combatManeuver === CombatManeuver.Parry) {
        // @ts-ignore combatManeuvers
        if (flags.weaponItemData.data.combatManeuvers.includes(CombatManeuver.Crush)) {
          damageRollTerms.push(...(await WeaponCard.crushSpecialDamage(damageBonusFormula)));
        } else if (
          // @ts-ignore combatManeuvers
          flags.weaponItemData.data.combatManeuvers.some((m) =>
            [CombatManeuver.Slash, CombatManeuver.Impale].includes(m)
          )
        ) {
          damageRollTerms.push(
            // @ts-ignore damage
            ...WeaponCard.slashImpaleSpecialDamage(flags.weaponItemData.data.damage)
          );
        } else {
          logMisconfiguration(
            `This weapon (${flags.weaponItemData.name}) does not have an attack Combat Manuever`,
            true
          );
        }
      }
    }
    if (damageBonusFormula.length) {
      damageRollTerms.push(...Roll.parse(`+ ${damageBonusFormula}[dmg bonus]`, {}));
    }
    const maximise = damageType === DamageRollTypeEnum.MaxSpecial;
    const roll = Roll.fromTerms(damageRollTerms);
    await roll.evaluate({
      maximize: maximise,
      async: true,
    });
    const speakerName = getSpeakerName(flags.actorId, flags.tokenId);
    await roll.toMessage({
      speaker: { alias: speakerName },
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      flavor: `damage`,
    });
  }

  private static async fumbleRoll(flags: WeaponCardFlags) {
    const fumbleTableName = getGame().settings.get("rqg", "fumbleRollTable");
    const fumbleTable = getGame().tables?.getName(fumbleTableName);
    if (!fumbleTable) {
      logMisconfiguration(`The fumble table "${fumbleTableName}" is missing`, true);
      return;
    }
    // @ts-ignore TODO draw StoredDocument<RollTable>
    const draw = await fumbleTable.draw({ displayChat: false });
    // Construct chat data
    const nr = draw.results.length > 1 ? `${draw.results.length} results` : "a result";
    const speakerName = getSpeakerName(flags.actorId, flags.tokenId);
    const messageData: ChatMessageDataConstructorData = {
      flavor: `Draws ${nr} from the ${fumbleTable.name} table.`,
      user: getGameUser().id,
      speaker: { alias: speakerName },
      whisper: usersThatOwnActor(getActorFromIds(flags.actorId, flags.tokenId)),
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      roll: draw.roll,
      sound: draw.roll ? CONFIG.sounds.dice : null,
      flags: { "core.RollTable": fumbleTable.id },
    };

    // Render the chat card which combines the dice roll with the drawn results
    messageData.content = await renderTemplate(CONFIG.RollTable.resultTemplate, {
      // @ts-ignore entities TODO check definitions
      description: TextEditor.enrichHTML(fumbleTable.data.description, { entities: true }),
      results: draw.results.map((r: any) => {
        // TODO fix typing
        r.text = r.getChatText();
        return r;
      }),
      rollHTML: fumbleTable.data.displayRoll ? await draw.roll.render() : null,
      table: fumbleTable,
    });

    // Create the chat message
    await ChatMessage.create(messageData);
  }

  private static async crushSpecialDamage(damageBonus: string): Promise<any[]> {
    if (damageBonus.length) {
      const specialDamage = Roll.parse(damageBonus, {});
      const roll = Roll.fromTerms(specialDamage);
      await roll.evaluate({ maximize: true, async: true });
      return Roll.parse(`+ ${roll.result}[special]`, {});
    }
    return [];
  }

  private static slashImpaleSpecialDamage(weaponDamage: string): any[] {
    return Roll.parse(`+ (${weaponDamage})[special]`, {});
  }
}
