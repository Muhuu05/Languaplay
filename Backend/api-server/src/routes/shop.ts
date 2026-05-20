import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  ListShopItemsResponse,
  PurchaseShopItemBody,
  PurchaseShopItemResponse,
} from "@workspace/api-zod";
import { db, schema } from "../lib/db";
import { isLeague } from "../lib/leagues";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/shop/items", async (req, res) => {
  const items = await db
    .select()
    .from(schema.shopItems)
    .orderBy(asc(schema.shopItems.sortOrder));
  const inv = await db
    .select()
    .from(schema.userInventory)
    .where(eq(schema.userInventory.userId, req.userId!));
  const ownedSet = new Set(inv.map((i) => i.itemId));

  res.json(
    ListShopItemsResponse.parse(
      items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        priceGems: i.priceGems,
        category: i.category,
        owned: ownedSet.has(i.id),
      })),
    ),
  );
});

router.post("/shop/purchase", async (req, res) => {
  const userId = req.userId!;
  const body = PurchaseShopItemBody.parse(req.body);
  const [item] = await db
    .select()
    .from(schema.shopItems)
    .where(eq(schema.shopItems.id, body.itemId));
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  if (!user) throw new Error("User missing");

  if (user.gems < item.priceGems) {
    res.status(400).json({ error: "Not enough gems" });
    return;
  }

  let newHearts = user.hearts;
  if (item.effect === "refill_hearts") {
    newHearts = user.maxHearts;
  }

  await db
    .update(schema.users)
    .set({ gems: user.gems - item.priceGems, hearts: newHearts })
    .where(eq(schema.users.id, userId));

  if (item.effect === "streak_freeze") {
    await db
      .insert(schema.userInventory)
      .values({
        id: randomUUID(),
        userId,
        itemId: item.id,
      })
      .onConflictDoNothing();
  }

  const [updated] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  let activeCourse = null;
  if (updated?.activeCourseId) {
    const [c] = await db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.id, updated.activeCourseId));
    if (c) activeCourse = c;
  }

  res.json(
    PurchaseShopItemResponse.parse({
      id: updated!.id,
      username: updated!.username,
      displayName: updated!.displayName,
      avatarColor: updated!.avatarColor,
      xp: updated!.xp,
      gems: updated!.gems,
      hearts: updated!.hearts,
      maxHearts: updated!.maxHearts,
      heartsRefillAt: updated!.heartsRefillAt
        ? updated!.heartsRefillAt.toISOString()
        : null,
      streakDays: updated!.streakDays,
      league: isLeague(updated!.league) ? updated!.league : "bronze",
      dailyGoalXp: updated!.dailyGoalXp,
      activeCourseId: updated!.activeCourseId,
      activeCourse,
    }),
  );
});

export default router;
