import { NextResponse } from 'next/server';
import { validateUpload } from "../../../../lib/security/uploads";
import sharp from 'sharp';
import { requireUser } from '../../../../lib/auth';
import { CreditService } from '../../../../lib/billing/CreditService';
import crypto from 'crypto';

export async function POST(req: Request) {
  let usageId: number | undefined;
  try {
    const { user, error: authError } = await requireUser();
    if (authError) return authError;
    const formData = await req.formData();
    const file = formData.get('file') as Blob;
    const format = formData.get('format') as string;
    
    const { valid, error, status } = validateUpload(file as any, 'image');
    if (!valid) {
      return NextResponse.json({ error }, { status: status || 400 });
    }

    const idempotencyKey = req.headers.get('x-idempotency-key') || crypto.randomUUID();
    const reserveResult = await CreditService.reserve(user.id, 'file_convert', {
      requestId: idempotencyKey,
      endpoint: '/api/image/convert',
      billingMode: 'platform'
    });

    if (!reserveResult.success) {
      return NextResponse.json({ error: reserveResult.reason || "Insufficient AI Credits." }, { status: 403 });
    }

    usageId = reserveResult.usageId;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let outputBuffer: Buffer;
    let contentType = `image/${format.toLowerCase()}`;

    // Use sharp to convert
    const s = sharp(buffer);
    
    switch (format.toUpperCase()) {
      case 'GIF':
        outputBuffer = await s.gif().toBuffer();
        break;
      case 'TIFF':
        outputBuffer = await s.tiff().toBuffer();
        break;
      case 'BMP':
        outputBuffer = await s.toFormat('bmp' as any).toBuffer().catch(() => s.png().toBuffer()); // Fallback to png if bmp fails in sharp
        break;
      case 'WEBP':
        outputBuffer = await s.webp().toBuffer();
        break;
      case 'AVIF':
        outputBuffer = await s.avif().toBuffer();
        break;
      case 'JPG':
      case 'JPEG':
        outputBuffer = await s.jpeg().toBuffer();
        contentType = 'image/jpeg';
        break;
      default:
        outputBuffer = await s.png().toBuffer();
        contentType = 'image/png';
    }

    if (usageId) {
      await CreditService.finalize(usageId, { actualCredits: undefined });
    }

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="converted.${format.toLowerCase()}"`,
      },
    });

  } catch (error: any) {
    if (usageId) {
      await CreditService.refund(usageId, error.message || "Image conversion failed");
    }
    console.error("Sharp Conversion Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


