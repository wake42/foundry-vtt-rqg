import { capitalize, getGame, getRequiredDomDataset } from "../system/util";

export class RqgItemSheet<
  Options extends ItemSheet.Options,
  Data extends object = ItemSheet.Data<Options>
> extends ItemSheet<Options, Data> {
  get title(): string {
    return `${getGame().i18n.localize("ITEM.Type" + capitalize(this.object.type))}: ${
      this.object.name
    }`;
  }

  public activateListeners(html: JQuery): void {
    super.activateListeners(html);

    // Edit Item Active Effect
    $(this.form!)
      .find("[data-item-effect-edit]")
      .each((i: number, el: HTMLElement) => {
        const effectId = getRequiredDomDataset($(el), "effect-id");
        const itemId = getRequiredDomDataset($(el), "item-id");
        const item = getGame().items?.get(itemId);
        if (!item) {
          return; // The item is not in the world (ie it's in a compendium)
        }
        el.addEventListener("click", () => {
          const effect = item?.effects.get(effectId);
          if (effect) {
            new ActiveEffectConfig(effect).render(true);
          }
        });
      });

    // Add Item Active Effect
    $(this.form!)
      .find("[data-item-effect-add]")
      .each((i: number, el: HTMLElement) => {
        const itemId = getRequiredDomDataset($(el), "item-id");
        const item = getGame().items?.get(itemId);
        if (!item) {
          return; // The item is not in the world (ie it's in a compendium)
        }
        el.addEventListener("click", async () => {
          const effect = new ActiveEffect(
            {
              icon: "icons/svg/aura.svg",
              changes: [],
              label: "New Active Effect",
              transfer: true,
              disabled: false,
            },
            item as any // TODO Type bailout - fixme!
          );

          const e = await item
            .createEmbeddedDocuments("ActiveEffect", [effect.toObject()])
            .catch((reason: any) => {
              ui.notifications?.error("Couldn't create Active Effect");
              throw reason;
            });
          e[0].id && new ActiveEffectConfig(item.effects.get(e[0].id)!).render(true);
        });
      });

    // Delete Item Active Effect
    $(this.form!)
      .find("[data-item-effect-delete]")
      .each((i: number, el: HTMLElement) => {
        const itemId = getRequiredDomDataset($(el), "item-id");
        const effectId = getRequiredDomDataset($(el), "effect-id");
        el.addEventListener("click", () => {
          const item = getGame().items?.get(itemId);
          if (!item) {
            return; // The item is not in the world (ie it's in a compendium)
          }
          // @ts-ignore 0.8
          item.getEmbeddedDocument("ActiveEffect", effectId).delete();
        });
      });
  }
}
