require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  try {
    // Read existing packs
    const res = await pool.query(`SELECT * FROM ai_credit_pack_products ORDER BY display_order ASC;`);
    const packs = res.rows;
    console.log("Current packs:", packs.length);

    if (packs.length >= 5) {
      // We will map displayOrder 1 to 5 to the new packs:
      // 1. AI Credit Pack 500K - $5
      // 2. AI Credit Pack 1.5M - $10
      // 3. AI Credit Pack 5M - $25
      // 4. Developer AI Pack 15M - $50
      // 5. Enterprise AI Pack 40M - $100

      const updates = [
        { display_order: 1, name: "AI Credit Pack 500K", priceCents: 500, credits: 500000 },
        { display_order: 2, name: "AI Credit Pack 1.5M", priceCents: 1000, credits: 1500000 },
        { display_order: 3, name: "AI Credit Pack 5M", priceCents: 2500, credits: 5000000 },
        { display_order: 4, name: "Developer AI Pack 15M", priceCents: 5000, credits: 15000000 },
        { display_order: 5, name: "Enterprise AI Pack 40M", priceCents: 10000, credits: 40000000 }
      ];

      for (const update of updates) {
        await pool.query(
          `UPDATE ai_credit_pack_products SET name = $1, price_cents = $2, credits = $3 WHERE display_order = $4 OR id = $4`,
          [update.name, update.priceCents, update.credits, update.display_order]
        );
        console.log(`Updated pack to ${update.name}`);
      }
    } else {
      console.log("Not enough packs to update! Must create them.");
    }
    console.log('Done');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

migrate();
