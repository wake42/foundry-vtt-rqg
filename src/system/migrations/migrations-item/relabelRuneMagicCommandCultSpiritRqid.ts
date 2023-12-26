import { ItemTypeEnum } from "../../../data-model/item-data/itemTypes";
import { ItemData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
import { ItemUpdate } from "../applyMigrations";
import { RqidLink } from "../../../data-model/shared/rqidLink";

const oldRqid = "i.rune-magic.command-cult-spirit-elemental";
const newRqid = "i.rune-magic.command-cult-spirit";
const oldEnglishName = "Command Cult Spirit (Elemental)";
const newEnglishName = "Command Cult Spirit";

export async function relabelRuneMagicCommandCultSpiritRqid(
  itemData: ItemData,
): Promise<ItemUpdate> {
  const updateData: any = {};

  if (
    itemData.type === ItemTypeEnum.RuneMagic &&
    itemData?.flags?.rqg?.documentRqidFlags?.id === oldRqid
  ) {
    mergeObject(updateData, {
      flags: {
        rqg: {
          documentRqidFlags: {
            id: newRqid,
          },
        },
      },
    });

    if (itemData.name === oldEnglishName) {
      mergeObject(updateData, { name: newEnglishName });
    }
  }

  if (itemData.type === ItemTypeEnum.Cult) {
    const commandCultSpiritLink = itemData.system.commonRuneMagicRqidLinks.find(
      (link) => link.rqid === oldRqid,
    );
    if (commandCultSpiritLink) {
      const newName =
        commandCultSpiritLink.name === oldEnglishName ? newEnglishName : commandCultSpiritLink.name;

      const newCommandCultSpiritLink = new RqidLink(newRqid, newName);
      const index = itemData.system.commonRuneMagicRqidLinks.indexOf(commandCultSpiritLink);
      itemData.system.commonRuneMagicRqidLinks.splice(index, 1, newCommandCultSpiritLink);

      mergeObject(updateData, {
        system: { commonRuneMagicRqidLinks: itemData.system.commonRuneMagicRqidLinks },
      });
    }
  }

  return updateData;
}
