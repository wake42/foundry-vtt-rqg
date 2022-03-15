import { PassionSheet } from "./passion-item/passionSheet";
import { ItemTypeEnum, ResponsibleItemClass } from "../data-model/item-data/itemTypes";
import { RuneSheet } from "./rune-item/runeSheet";
import { SkillSheet } from "./skill-item/skillSheet";
import { HitLocationSheet } from "./hit-location-item/hitLocationSheet";
import { GearSheet } from "./gear-item/gearSheet";
import { ArmorSheet } from "./armor-item/armorSheet";
import { WeaponSheet } from "./weapon-item/weaponSheet";
import { SpiritMagicSheet } from "./spirit-magic-item/spiritMagicSheet";
import { CultSheet } from "./cult-item/cultSheet";
import { RuneMagicSheet } from "./rune-magic-item/runeMagicSheet";
import { getGame, localize, RqgError } from "../system/util";
import { DocumentModificationOptions } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs";

export class RqgItem extends Item {
  public static init() {
    CONFIG.Item.documentClass = RqgItem;

    Items.unregisterSheet("core", ItemSheet);

    Items.registerSheet("rqg", PassionSheet as any, {
      label: "GM Passion Item Sheet",
      types: [ItemTypeEnum.Passion],
      makeDefault: true,
    });
    Items.registerSheet("rqg", RuneSheet as any, {
      label: "GM Rune Item Sheet",
      types: [ItemTypeEnum.Rune],
      makeDefault: true,
    });
    Items.registerSheet("rqg", SkillSheet as any, {
      label: "GM Skill Item Sheet",
      types: [ItemTypeEnum.Skill],
      makeDefault: true,
    });
    Items.registerSheet("rqg", HitLocationSheet as any, {
      label: "GM Hit Location Item Sheet",
      types: [ItemTypeEnum.HitLocation],
      makeDefault: true,
    });
    Items.registerSheet("rqg", GearSheet as any, {
      label: "GM Gear Item Sheet",
      types: [ItemTypeEnum.Gear],
      makeDefault: true,
    });
    Items.registerSheet("rqg", ArmorSheet as any, {
      label: "GM Armor Item Sheet",
      types: [ItemTypeEnum.Armor],
      makeDefault: true,
    });
    Items.registerSheet("rqg", WeaponSheet as any, {
      label: "GM Weapon Item Sheet",
      types: [ItemTypeEnum.Weapon],
      makeDefault: true,
    });
    Items.registerSheet("rqg", SpiritMagicSheet as any, {
      label: "GM Spirit Magic Item Sheet",
      types: [ItemTypeEnum.SpiritMagic],
      makeDefault: true,
    });
    Items.registerSheet("rqg", CultSheet as any, {
      label: "GM Cult Item Sheet",
      types: [ItemTypeEnum.Cult],
      makeDefault: true,
    });
    Items.registerSheet("rqg", RuneMagicSheet as any, {
      label: "GM Rune Magic Item Sheet",
      types: [ItemTypeEnum.RuneMagic],
      makeDefault: true,
    });
    // TODO this doesn't compile!? Sheet registration would be better in Item init
    // ResponsibleItemClass.forEach((itemClass) => itemClass.init());

    Hooks.on("preCreateItem", (document: any) => {
      const isOwnedItem =
        document instanceof RqgItem &&
        document.parent &&
        Object.values(ItemTypeEnum).includes(document.data.type);
      if (!isOwnedItem) {
        return true;
      }

      if (RqgItem.isDuplicateItem(document)) {
        ui.notifications?.warn(
          `${document.parent.name} already has a ${document.data.type} '${document.name}' and duplicates are not allowed`
        );
        return false;
      }

      if (RqgItem.isRuneMagicWithoutCult(document)) {
        ui.notifications?.warn(
          `${document.parent.name} has to join a cult before learning the ${document.name} rune magic spell`
        );
        return false;
      }
      return true;
    });
  }

  protected _onCreate(
    data: RqgItem["data"]["_source"],
    options: DocumentModificationOptions,
    userId: string
  ): void {
    const defaultItemIconSettings: any = getGame().settings.get("rqg", "defaultItemIconSettings");
    const item = data._id ? getGame().items?.get(data._id) : undefined;
    if (item?.data.img === foundry.data.ItemData.DEFAULT_ICON) {
      const updateData: any = {
        img: defaultItemIconSettings[data.type],
        "data.namePrefix": data.name,
      };

      if (data.type === ItemTypeEnum.Passion) {
        updateData.data = { subject: data.name };
      }

      item?.update(updateData);
    }
    return super._onCreate(data, options, userId);
  }

  static async updateDocuments(updates: any[], context: any): Promise<any> {
    const { parent, pack, ...options } = context;
    if (parent?.documentName === "Actor") {
      updates.forEach((u) => {
        if (u) {
          const document = parent.items.get(u._id);
          if (!document || document.documentName !== "Item") {
            const msg = "couldn't find item document from result";
            ui.notifications?.error(msg);
            throw new RqgError(msg, updates);
          }
          // Will update "updates" as a side effect
          ResponsibleItemClass.get(document.data.type)?.preUpdateItem(
            parent,
            document,
            updates,
            options
          );
        }
      });
    }
    return super.updateDocuments(updates, context);
  }

  // Validate that embedded items are unique (name + type),
  // except for runeMagic where duplicates are allowed, at least
  // when the cultId is different. That is not implemented though
  private static isDuplicateItem(document: any): boolean {
    return document.parent.items.some(
      (i: RqgItem) =>
        document.data.type !== ItemTypeEnum.RuneMagic &&
        i.name === document.name &&
        i.type === document.type
    );
  }

  // Validate that embedded runeMagic can be connected to a cult
  private static isRuneMagicWithoutCult(document: any): boolean {
    const isRuneMagic = document.data.type === ItemTypeEnum.RuneMagic;
    const actorHasCult = document.parent.items.some(
      (i: RqgItem) => i.data.type === ItemTypeEnum.Cult
    );
    const okToAdd = !isRuneMagic || !(isRuneMagic && !actorHasCult);
    return !okToAdd;
  }

  //** Localizes Item Type Name using ITEM localization used by Foundry.
  public static localizeItemTypeName(itemType: ItemTypeEnum): string {
    return localize("ITEM.Type" + itemType.titleCase());
  }

  /**
   * Return the highest priority item matching the supplied rqid and lang from the items in the World.  If not
   * found return the highest priority item matching the supplied rqid and lang from the installed Compendia.
   * eg CONFIG.Item.documentClass.getItemByRqid("someid", "es")
   * @param rqid eg "humanoid-left-arm", "throwing-axe", or "spirit-lore"
   * @param lang default value is "en", eg "en" or "pl"
   * @returns
   */
  public static async getItemByRqid(
    rqid: string,
    lang: string = "en"
  ): Promise<RqgItem | undefined> {
    console.log("You're in getItemByRqId");

    console.log(lang);

    const worldItem = await this.getItemFromWorldByRqid(rqid, lang);

    if (worldItem !== undefined) {
      return worldItem;
    }

    const comendiumItem = await this.getItemFromAllCompendiaByRqid(rqid, lang);

    return comendiumItem;
  }

  private static async getItemFromWorldByRqid(
    rqid: string,
    lang: string = "en"
  ): Promise<RqgItem | undefined> {
    const candidates = getGame().items?.contents.filter(
      (i) => i.data.data.rqid === rqid && i.data.data.rqidlang === lang
    );

    if (candidates === undefined) {
      return undefined;
    }

    console.log(`world candidates.length: ${candidates.length}`);

    if (candidates.length > 0) {
      let result = candidates.reduce((max, obj) =>
        max.data.data.rqidpriority > obj.data.data.rqidpriority ? max : obj
      );
      
      // Detect more than one item that could be the match
      let duplicates = candidates.filter(i => i.data.data.rqidpriority === result.data.data.rqidpriority);
      if (duplicates.length > 1) {
        const msg = localize("RQG.Item.RqgItem.Error.MoreThanOneRqidMatchInWorld", {
          rqid: rqid,
          rqidlang: lang,
          rqidpriority: result.data.data.rqidpriority,
        });
        ui.notifications?.error(msg);
        console.log(msg + "  Duplicate items: ", duplicates);
      }
      return result as RqgItem;
    } else {
      return undefined;
    }
  }

  private static async getItemFromAllCompendiaByRqid(
    rqid: string,
    lang: string = "en"
  ): Promise<RqgItem | undefined> {
    const candidates: RqgItem[] = [];

    for (const pack of getGame().packs) {
      console.log("pack", pack);
      if (pack.documentClass.name === "RqgItem") {
        for (const item of await pack.getDocuments()) {
          if (item.data.data.rqid === rqid && item.data.data.rqidlang === lang) {
            console.log(item);
            candidates.push(item as RqgItem);
          }
        }
      }
    }

    console.log(`compendia candidates.length: ${candidates.length}`);
    if (candidates.length === 0) {
      return undefined;
    }

    if (candidates.length > 0) {
      let result = candidates.reduce((max, obj) =>
        max.data.data.rqidpriority > obj.data.data.rqidpriority ? max : obj
      );

      // Detect more than one item that could be the match
      let duplicates = candidates.filter(
        (i) => i.data.data.rqidpriority === result.data.data.rqidpriority
      );
      if (duplicates.length > 1) {
        const msg = localize("RQG.Item.RqgItem.Error.MoreThanOneRqidMatchInCompendia", {
          rqid: rqid,
          rqidlang: lang,
          rqidpriority: result.data.data.rqidpriority,
        });
        ui.notifications?.error(msg);
        console.log(msg + "  Duplicate items: ", duplicates);      
      }
      return result;
    } else {
      return undefined;
    }
  }
}
