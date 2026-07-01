import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const paddle = new Paddle(process.env.PADDLE_API_KEY || "", {
  environment: process.env.PADDLE_API_KEY?.startsWith("pdl_live") ? Environment.production : Environment.sandbox,
});

const packsToCreate = [
  { displayOrder: 1, name: "AI Credit Pack Small", priceUSD: 5, requestCount: 500, value: "Standard" },
  { displayOrder: 2, name: "AI Credit Pack Medium", priceUSD: 10, requestCount: 1100, value: "Bonus Value" },
  { displayOrder: 3, name: "AI Credit Pack Large", priceUSD: 25, requestCount: 3000, value: "Great Value" },
  { displayOrder: 4, name: "Developer AI Pack", priceUSD: 50, requestCount: 6500, value: "Developer Tier" },
  { displayOrder: 5, name: "Enterprise AI Pack", priceUSD: 100, requestCount: 15000, value: "Enterprise Tier" }
];

async function main() {
  console.log("Seeding Request Packs...");

  for (const pack of packsToCreate) {
    try {
      console.log(`Creating product for ${pack.name}...`);
      
      const paddleProduct = await paddle.products.create({
        name: pack.name,
        description: `${pack.requestCount.toLocaleString()} API Requests. ${pack.value}`,
        taxCategory: "standard", // usually standard for digital goods
      });

      console.log(`Created Paddle Product: ${paddleProduct.id}`);

      console.log(`Creating price for ${pack.name}...`);
      const paddlePrice = await paddle.prices.create({
        productId: paddleProduct.id,
        description: pack.name,
        unitPrice: {
          amount: (pack.priceUSD * 100).toString(),
          currencyCode: "USD"
        },
        billingCycle: null // one-time charge
      });

      console.log(`Created Paddle Price: ${paddlePrice.id}`);

      console.log(`Inserting into Database...`);
      const { db } = await import("../db");
      const { aiCreditPackProducts } = await import("../db/schema");
      
      await db.insert(aiCreditPackProducts).values({
        name: pack.name,
        priceCents: pack.priceUSD * 100,
        credits: pack.requestCount,
        paddleProductId: paddleProduct.id,
        paddlePriceId: paddlePrice.id,
        isActive: true,
        displayOrder: pack.displayOrder,
      });

      console.log(`Successfully seeded ${pack.name}!\n`);
    } catch (e) {
      console.error(`Failed to create pack ${pack.name}:`, e);
    }
  }

  console.log("Done seeding request packs.");
  process.exit(0);
}

main();
