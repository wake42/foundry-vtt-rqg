import { Rqid } from "../../system/api/rqidApi";
import { getDomDataset } from "../../system/util";

export class RqidLink {
  /** The rqid to link to */
  readonly rqid: string;
  /** Display name of the link */
  readonly name: string;

  bonus: number | undefined; // TODO Should not be here.

  constructor(rqid: string, name: string) {
    this.rqid = rqid;
    this.name = name;
  }

  // Handle rqid links
  static async addRqidLinkClickHandlers(html: JQuery): Promise<void> {
    html.find("[data-rqid-link]").each((i: number, el: HTMLElement) => {
      const rqid = getDomDataset(el, "rqid-link");
      const anchor = getDomDataset(el, "anchor");
      if (rqid) {
        el.addEventListener("click", async () => {
          await Rqid.renderRqidDocument(rqid, anchor);
        });
      }
    });
  }
}
