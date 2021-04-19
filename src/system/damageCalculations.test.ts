import { DamageCalculations } from "./damageCalculations";
import { mockActor as mockActorOriginal } from "../mocks/mockActor";
import { HitLocationItemData } from "../data-model/item-data/hitLocationData";
import { CharacterActorData } from "../data-model/actor-data/rqgActorData";

describe("Inflict Damage", () => {
  let mockActor: any;
  let mockLeftLeg: HitLocationItemData;
  let mockHead: HitLocationItemData;
  let mockChest: HitLocationItemData;
  let mockAbdomen: HitLocationItemData;

  beforeEach(() => {
    mockActor = JSON.parse(JSON.stringify(mockActorOriginal));
    mockLeftLeg = mockActor.items.find((i: any) => i.name === "leftLeg") as HitLocationItemData;

    mockHead = mockActor.items.find((i: any) => i.name === "head") as HitLocationItemData;
    mockChest = mockActor.items.find((i: any) => i.name === "chest") as HitLocationItemData;
    mockAbdomen = mockActor.items.find((i: any) => i.name === "abdomen") as HitLocationItemData;
  });

  describe("Limb Damage", () => {
    it("should be correct for smaller wounds", () => {
      // --- Arrange ---
      const appliedDamage = mockLeftLeg.data.hp.max! - 1;
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15

      // --- Act ---
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockLeftLeg,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates).toStrictEqual({
        data: {
          hitLocationHealthState: "wounded",
          actorHealthImpact: "wounded",
          wounds: [appliedDamage],
        },
      });
      expect(notification).toBe("");
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            hitPoints: {
              value: actorTotalHp - appliedDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([]);
    });

    it(">= HP should make limb useless", () => {
      // --- Arrange ---
      const appliedDamage = mockLeftLeg.data.hp.max!; // 5
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15

      // --- Act ---
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockLeftLeg,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates).toStrictEqual({
        data: {
          actorHealthImpact: "wounded",
          hitLocationHealthState: "useless",
          wounds: [appliedDamage],
        },
      });
      expect(notification).toBe(
        "Crash Test Dummys leftLeg is useless and cannot hold anything / support standing. You can fight with whatever limbs are still functional."
      );
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            hitPoints: {
              value: actorTotalHp - appliedDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([]);
    });

    it("should be maxed out to 2*Limb HP", () => {
      // --- Arrange ---
      const appliedDamage = mockLeftLeg.data.hp.max! * 2; // 10
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15

      // --- Act ---
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockLeftLeg,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates).toStrictEqual({
        data: {
          actorHealthImpact: "shock",
          hitLocationHealthState: "useless",
          wounds: [appliedDamage],
        },
      });
      expect(notification).toBe(
        "Crash Test Dummy is functionally incapacitated: you can no longer fight until healed and am in shock. You may try to heal yourself."
      );
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            hitPoints: {
              value: actorTotalHp - appliedDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([]);
    });

    it(">= 3 * HP should severe the limb", () => {
      // --- Arrange ---
      const appliedDamage = mockLeftLeg.data.hp.max! * 3; // 15
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15
      const maxDamage = mockLeftLeg.data.hp.max! * 2; // Limbs can't take more damage

      // --- Act ---
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockLeftLeg,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates).toStrictEqual({
        data: {
          actorHealthImpact: "shock",
          hitLocationHealthState: "severed",
          wounds: [maxDamage],
        },
      });
      expect(notification).toBe(
        "Crash Test Dummys leftLeg is severed or irrevocably maimed. Only a 6 point heal applied within ten minutes can restore a severed limb, assuming all parts are available. Crash Test Dummy is functionally incapacitated: and can no longer fight until healed and am in shock. You may try to heal yourself."
      );
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            hitPoints: {
              value: actorTotalHp - maxDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([]);
    });

    it("should not be affected by more damage if previously severed", () => {
      // --- Arrange --- (Sever arm)
      applyTestDamage(222, true, mockLeftLeg, mockActor);
      const appliedDamage = 3;

      // --- Act --- (Try to hit the same arm again)
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockLeftLeg,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates).toStrictEqual({});
      expect(actorUpdates).toStrictEqual({});
      expect(notification).toBe(
        "leftLeg is gone and cannot be hit anymore, reroll to get a new hit location!"
      );
      expect(uselessLegs).toStrictEqual([]);
    });
  });

  describe("Head Damage", () => {
    it("should be correct for smaller wounds", () => {
      // --- Arrange ---
      const appliedDamage = mockHead.data.hp.max! - 1;
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15

      // --- Act ---
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockHead,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates).toStrictEqual({
        data: {
          actorHealthImpact: "wounded",
          hitLocationHealthState: "wounded",
          wounds: [appliedDamage],
        },
      });
      expect(notification).toBe("");
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            // health: "wounded", // TODO this is added by the actorSheet itself for now
            hitPoints: {
              value: actorTotalHp - appliedDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([]);
    });

    it(">= HP should knock actor unconscious", () => {
      // --- Arrange ---
      const appliedDamage = mockHead.data.hp.max!; // 2
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15

      // --- Act ---
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockHead,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates).toStrictEqual({
        data: {
          actorHealthImpact: "unconscious",
          hitLocationHealthState: "wounded",
          wounds: [appliedDamage],
        },
      });
      expect(notification).toBe(
        "Crash Test Dummy is unconscious and must be healed or treated with First Aid within five minutes (one full turn) or die"
      );
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            hitPoints: {
              value: actorTotalHp - appliedDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([]);
    });

    it(">= 2*HP should knock actor unconscious", () => {
      // --- Arrange ---
      const appliedDamage = mockHead.data.hp.max! * 2; // 10
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15

      // --- Act ---
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockHead,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates).toStrictEqual({
        data: {
          actorHealthImpact: "unconscious",
          hitLocationHealthState: "wounded",
          wounds: [appliedDamage],
        },
      });
      expect(notification).toBe(
        "Crash Test Dummy becomes unconscious and begins to lose 1 hit point per melee round from bleeding unless healed or treated with First Aid."
      );
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            hitPoints: {
              value: actorTotalHp - appliedDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([]);
    });

    it(">= 3*HP kills the actor", () => {
      // --- Arrange ---
      const appliedDamage = mockHead.data.hp.max! * 3; // 15
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15

      // --- Act ---
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockHead,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates).toStrictEqual({
        data: {
          actorHealthImpact: "dead",
          hitLocationHealthState: "wounded",
          wounds: [appliedDamage],
        },
      });
      expect(notification).toBe("Crash Test Dummy dies instantly.");
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            hitPoints: {
              value: actorTotalHp - appliedDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([]);
    });
  });

  describe("Chest Damage", () => {
    it("should be correct for smaller wounds", () => {
      // --- Arrange ---
      const appliedDamage = mockChest.data.hp.max! - 1;
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15

      // --- Act ---
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockChest,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates).toStrictEqual({
        data: {
          actorHealthImpact: "wounded",
          hitLocationHealthState: "wounded",
          wounds: [appliedDamage],
        },
      });
      expect(notification).toBe("");
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            hitPoints: {
              value: actorTotalHp - appliedDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([]);
    });

    it(">= HP should put actor in shock", () => {
      // --- Arrange ---
      const appliedDamage = mockChest.data.hp.max!; // 6
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15

      // --- Act ---
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockChest,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates).toStrictEqual({
        data: {
          actorHealthImpact: "shock",
          hitLocationHealthState: "wounded",
          wounds: [appliedDamage],
        },
      });
      expect(notification).toBe(
        "Crash Test Dummy falls and is too busy coughing blood to do anything. Will bleed to death in ten minutes unless the bleeding is stopped by First Aid, and cannot take any action, including healing."
      );
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            hitPoints: {
              value: actorTotalHp - appliedDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([]);
    });

    it(">= 2*HP should knock actor unconscious", () => {
      // --- Arrange ---
      const appliedDamage = mockChest.data.hp.max! * 2; // 12
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15

      // --- Act ---
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockChest,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates).toStrictEqual({
        data: {
          actorHealthImpact: "unconscious",
          hitLocationHealthState: "wounded",
          wounds: [appliedDamage],
        },
      });
      expect(notification).toBe(
        "Crash Test Dummy becomes unconscious and begins to lose 1 hit point per melee round from bleeding unless healed or treated with First Aid."
      );
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            hitPoints: {
              value: actorTotalHp - appliedDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([]);
    });

    it(">= 3*HP kills the actor", () => {
      // --- Arrange ---
      const appliedDamage = mockChest.data.hp.max! * 3; // 18
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15

      // --- Act ---
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockChest,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates).toStrictEqual({
        data: {
          actorHealthImpact: "dead",
          hitLocationHealthState: "wounded",
          wounds: [appliedDamage],
        },
      });
      expect(notification).toBe("Crash Test Dummy dies instantly.");
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            hitPoints: {
              value: actorTotalHp - appliedDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([]);
    });
  });

  describe("Abdomen Damage", () => {
    it("should be correct for smaller wounds", () => {
      // --- Arrange ---
      const appliedDamage = mockAbdomen.data.hp.max! - 1;
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15

      // --- Act ---
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockAbdomen,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates.data.wounds).toStrictEqual([appliedDamage]);
      expect(hitLocationUpdates.data.hitLocationHealthState).toBe("wounded");
      expect(notification).toBe("");
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            // health: "wounded", // TODO this is added by the actorSheet itself for now
            hitPoints: {
              value: actorTotalHp - appliedDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([]);
    });

    it(">= HP should make actor fall", () => {
      // --- Arrange ---
      const appliedDamage = mockAbdomen.data.hp.max!;
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15

      // --- Act ---
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockAbdomen,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates.data.wounds).toStrictEqual([appliedDamage]);
      expect(hitLocationUpdates.data.hitLocationHealthState).toBe("wounded");
      expect(notification).toBe(
        "Both legs are useless and Crash Test Dummy falls to the ground. Crash Test Dummy may fight from the ground in subsequent melee rounds. Will bleed to death, if not healed or treated with First Aid within ten minutes."
      );
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            // health: "wounded", // TODO this is added by the actorSheet itself for now
            hitPoints: {
              value: actorTotalHp - appliedDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([
        {
          _id: "Dhm40qEh3Idp5HSE",
          data: {
            hitLocationHealthState: "useless",
          },
        },
        {
          _id: "RFt7m9xXHtjpVNeY",
          data: {
            hitLocationHealthState: "useless",
          },
        },
      ]);
    });

    it(">= 2*HP should knock actor unconscious", () => {
      // --- Arrange ---
      const appliedDamage = mockAbdomen.data.hp.max! * 2; // 10
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15

      // --- Act ---
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockAbdomen,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates).toStrictEqual({
        data: {
          actorHealthImpact: "unconscious",
          hitLocationHealthState: "wounded",
          wounds: [appliedDamage],
        },
      });
      expect(notification).toBe(
        "Crash Test Dummy becomes unconscious and begins to lose 1 hit point per melee round from bleeding unless healed or treated with First Aid."
      );
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            hitPoints: {
              value: actorTotalHp - appliedDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([
        {
          _id: "Dhm40qEh3Idp5HSE",
          data: {
            hitLocationHealthState: "useless",
          },
        },
        {
          _id: "RFt7m9xXHtjpVNeY",
          data: {
            hitLocationHealthState: "useless",
          },
        },
      ]);
    });

    it(">= 2*HP from 2 smaller wounds should still knock actor unconscious", () => {
      // --- Arrange ---
      const appliedDamage = mockAbdomen.data.hp.max!; // 10
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15

      // --- Act ---
      applyTestDamage(appliedDamage, true, mockAbdomen, mockActor);
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockAbdomen,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates).toStrictEqual({
        data: {
          actorHealthImpact: "unconscious",
          hitLocationHealthState: "wounded",
          wounds: [appliedDamage, appliedDamage],
        },
      });
      expect(notification).toBe(
        "Crash Test Dummy becomes unconscious and begins to lose 1 hit point per melee round from bleeding unless healed or treated with First Aid."
      );
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            hitPoints: {
              value: actorTotalHp - appliedDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([
        {
          _id: "Dhm40qEh3Idp5HSE",
          data: {
            hitLocationHealthState: "useless",
          },
        },
        {
          _id: "RFt7m9xXHtjpVNeY",
          data: {
            hitLocationHealthState: "useless",
          },
        },
      ]);
    });

    it(">= 3*HP kills the actor", () => {
      // --- Arrange ---
      const appliedDamage = mockAbdomen.data.hp.max! * 3; // 15
      const actorTotalHp = mockActor.data.attributes.hitPoints.value; // 15

      // --- Act ---
      const { hitLocationUpdates, actorUpdates, notification, uselessLegs } = applyTestDamage(
        appliedDamage,
        true,
        mockAbdomen,
        mockActor
      );

      // --- Assert ---
      expect(hitLocationUpdates).toStrictEqual({
        data: {
          actorHealthImpact: "dead",
          hitLocationHealthState: "wounded",
          wounds: [appliedDamage],
        },
      });
      expect(notification).toBe("Crash Test Dummy dies instantly.");
      expect(actorUpdates).toStrictEqual({
        data: {
          attributes: {
            hitPoints: {
              value: actorTotalHp - appliedDamage,
            },
          },
        },
      });
      expect(uselessLegs).toStrictEqual([]);
    });
  });
});

export function applyTestDamage(
  damage: number,
  applyDamageToTotalHp: boolean,
  hitLocationData: HitLocationItemData,
  actorData: CharacterActorData
) {
  const damageEffects = DamageCalculations.addWound(damage, true, hitLocationData, actorData);
  mergeObject(hitLocationData, damageEffects.hitLocationUpdates);
  mergeObject(actorData, damageEffects.actorUpdates);
  actorData.data.attributes.health = DamageCalculations.getCombinedActorHealth(actorData);
  return damageEffects;
}