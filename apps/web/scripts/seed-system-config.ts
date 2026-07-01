import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const configs = [
  { key: "credit_value_usd", value: 0.01 }, // 1 Credit = $0.01 USD
  { key: "deepseek_input_cost", value: 0.14 }, // DeepSeek Chat Input: $0.14 per 1M tokens
  { key: "deepseek_output_cost", value: 0.28 }, // DeepSeek Chat Output: $0.28 per 1M tokens
  { key: "jina_embedding_cost", value: 0.02 }, // Jina Embeddings: $0.02 per 1M tokens
  { key: "jina_reranker_cost", value: 0.02 }, // Jina Reranker: $0.02 per 1M tokens
];

async function main() {
  console.log("Seeding System Configs...");
  const { db } = await import("../db");
  const { systemConfig } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");

  for (const conf of configs) {
    try {
      const existing = await db.query.systemConfig.findFirst({
        where: eq(systemConfig.key, conf.key)
      });

      if (!existing) {
        await db.insert(systemConfig).values({
          key: conf.key,
          value: conf.value
        });
        console.log(`Inserted ${conf.key}`);
      } else {
        await db.update(systemConfig)
          .set({ value: conf.value, updatedAt: new Date() })
          .where(eq(systemConfig.key, conf.key));
        console.log(`Updated ${conf.key}`);
      }
    } catch (e) {
      console.error(`Failed to upsert config ${conf.key}:`, e);
    }
  }

  console.log("Done seeding system configs.");
  process.exit(0);
}

main();
