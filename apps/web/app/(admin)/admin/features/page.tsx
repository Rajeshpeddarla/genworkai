import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import FeaturesClient from "./FeaturesClient";
import { asc } from "drizzle-orm";

export default async function FeatureFlagsPage() {
  const flags = await db.select().from(featureFlags).orderBy(asc(featureFlags.id));

  return <FeaturesClient initialFlags={flags} />;
}
