import { db } from '@/db';
import { systemConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface GlobalContactInfo {
  support_email: string;
  sales_email: string;
  phone_number: string;
  linkedin_url: string;
  twitter_url: string;
}

export async function getGlobalConfig(): Promise<GlobalContactInfo> {
  try {
    const config = await db.select().from(systemConfig).where(eq(systemConfig.key, 'global_contact_info')).limit(1);
    const item = config[0];
    if (item && item.value) {
      return item.value as GlobalContactInfo;
    }
  } catch (error) {
    console.error("Failed to fetch global config:", error);
  }

  // Fallback defaults
  return {
    support_email: 'support@genworkai.com',
    sales_email: 'sales@genworkai.com',
    phone_number: '+1-800-000-0000',
    linkedin_url: 'https://linkedin.com/company/genworkai',
    twitter_url: 'https://twitter.com/genworkai'
  };
}
