import { NextResponse } from 'next/server';
import { generateWithFallbacks, ProviderConfig } from '@repo/ai';
import { createClient } from '../../../../../utils/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const providerConfig: ProviderConfig = {
      provider: body.provider,
      apiKey: body.apiKey,
      baseUrl: body.baseUrl,
      defaultModel: body.defaultModel || 'gpt-3.5-turbo'
    };

    // Test the provider by sending a fast "Hello" prompt
    const result = await generateWithFallbacks({
      messages: [{ role: 'user', content: 'Say "OK"' }],
      maxTokens: 5,
      temperature: 0,
      providerConfig
    }, 'dummy', 'dummy', 1);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('BYOK test failed:', error.message);
    return NextResponse.json({ error: 'Validation Failed: ' + error.message }, { status: 400 });
  }
}
