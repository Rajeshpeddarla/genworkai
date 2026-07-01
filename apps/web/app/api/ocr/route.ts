import { NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
import { requireUser } from '../../../lib/auth';
import { RateLimitService } from '../../../lib/security/rate-limit';
import { CreditService } from '../../../lib/billing/CreditService';
import crypto from 'crypto';

export async function POST(req: Request) {
  let usageId: number | undefined;
  try {
    const { user, error: authError } = await requireUser();
    if (authError) return authError;

    const rateLimitResponse = await RateLimitService.check(user.id, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image base64 is required' }, { status: 400 });
    }

    const idempotencyKey = req.headers.get('x-idempotency-key') || crypto.randomUUID();
    const reserveResult = await CreditService.reserve(user.id, 'ocr', {
      requestId: idempotencyKey,
      endpoint: '/api/ocr',
      billingMode: 'platform'
    });

    if (!reserveResult.success) {
      return NextResponse.json({ error: reserveResult.reason || "Insufficient AI Credits." }, { status: 403 });
    }

    usageId = reserveResult.usageId;

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    try {
      const { data } = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: m => console.log(m)
      });
      
      const finalText = data.text || '';
      if (!finalText.trim()) {
        return NextResponse.json({ error: "Tesseract processed the image but could not extract any text. Please try an image with clearer text." }, { status: 400 });
      }

      if (usageId) {
        await CreditService.finalize(usageId, { actualCredits: undefined }); // uses default reserved amount
      }

      return NextResponse.json({ text: finalText });
    } catch (error: any) {
      console.error("Tesseract Execution Failed:", error.message);
      throw error; // Re-throw so the outer catch can refund
    }
  } catch (err: any) {
    if (usageId) {
      await CreditService.refund(usageId, err.message || "OCR failed");
    }
    return NextResponse.json({ error: `Internal Server Error: ${err.message}` }, { status: 500 });
  }
}
