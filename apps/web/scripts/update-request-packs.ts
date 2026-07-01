import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const paddle = new Paddle(process.env.PADDLE_API_KEY || "", {
  environment: process.env.PADDLE_API_KEY?.startsWith("pdl_live") ? Environment.production : Environment.sandbox,
});

const packsToUpdate = [
  { oldPrefix: "AI Credit Pack 500K", newName: "AI Credit Pack Small", newCredits: 500 },
  { oldPrefix: "AI Credit Pack 1.5M", newName: "AI Credit Pack Medium", newCredits: 1100 },
  { oldPrefix: "AI Credit Pack 5M", newName: "AI Credit Pack Large", newCredits: 3000 },
  { oldPrefix: "Developer AI Pack", newName: "Developer AI Pack", newCredits: 6500 },
  { oldPrefix: "Enterprise AI Pack", newName: "Enterprise AI Pack", newCredits: 15000 }
];

async function main() {
  console.log("Updating existing Request Packs...");
  const { db } = await import("../db");
  const { aiCreditPackProducts } = await import("../db/schema");
  const { like } = await import("drizzle-orm");

  for (const pack of packsToUpdate) {
    try {
      console.log(`Looking for product matching ${pack.oldPrefix}...`);
      
      const existingProducts = await db.query.aiCreditPackProducts.findMany({
        where: like(aiCreditPackProducts.name, `${pack.oldPrefix}%`)
      });

      for (const product of existingProducts) {
        if (!product.paddleProductId) continue;
        console.log(`Found DB product ${product.name}, updating to ${pack.newName} with ${pack.newCredits} credits...`);
        
        // Update DB
        await db.update(aiCreditPackProducts)
          .set({
            name: pack.newName,
            credits: pack.newCredits,
            description: `${pack.newCredits.toLocaleString()} AI Credits`
          })
          .where(like(aiCreditPackProducts.name, `${pack.oldPrefix}%`));

        // Update Paddle Product Name
        await paddle.products.update(product.paddleProductId, {
          name: pack.newName,
          description: `${pack.newCredits.toLocaleString()} AI Credits`
        });

        // Update Paddle Price Name
        if (product.paddlePriceId) {
          await paddle.prices.update(product.paddlePriceId, {
            description: pack.newName
          });
        }
        
        console.log(`Successfully updated ${pack.newName}!`);
      }

    } catch (e) {
      console.error(`Failed to update pack ${pack.newName}:`, e);
    }
  }

  console.log("Done updating request packs.");
  process.exit(0);
}

main();
