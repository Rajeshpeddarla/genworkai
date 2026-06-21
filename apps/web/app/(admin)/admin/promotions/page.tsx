import { db } from "@/db";
import { promotionTemplates } from "@/db/schema";
import PromotionsClient from "./PromotionsClient";
import { desc } from "drizzle-orm";

export default async function PromotionsPage() {
  const promos = await db.select().from(promotionTemplates).orderBy(desc(promotionTemplates.createdAt));

  return <PromotionsClient initialPromos={promos} />;
}
