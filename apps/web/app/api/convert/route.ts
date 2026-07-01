import { NextResponse } from 'next/server';
import { requireUser } from '../../../lib/auth';
import { RateLimitService } from '../../../lib/security/rate-limit';
import { CreditService } from '../../../lib/billing/CreditService';
import crypto from 'crypto';

// Mock Conversion API
// In production, you would integrate CloudConvert API here:
// import CloudConvert from 'cloudconvert';
// const cloudConvert = new CloudConvert('YOUR_API_KEY');

export async function POST(req: Request) {
  let usageId: number | undefined;
  try {
    const { user, error: authError } = await requireUser();
    if (authError) return authError;

    const rateLimitResponse = await RateLimitService.check(user.id, 'default');
    if (rateLimitResponse) return rateLimitResponse;

    const formData = await req.formData();
    const file = formData.get('file') as Blob;
    const targetFormat = formData.get('targetFormat') as string;
    
    if (!file || !targetFormat) {
      return NextResponse.json({ error: "File and targetFormat are required" }, { status: 400 });
    }

    let operationKey = 'file_convert';
    if (targetFormat === 'pdf') operationKey = 'document_generation';
    else if (targetFormat === 'docx') operationKey = 'document_generation';
    else if (targetFormat === 'md') operationKey = 'document_generation';

    const idempotencyKey = req.headers.get('x-idempotency-key') || crypto.randomUUID();
    const reserveResult = await CreditService.reserve(user.id, operationKey, {
      requestId: idempotencyKey,
      endpoint: '/api/convert',
      billingMode: 'platform'
    });

    if (!reserveResult.success) {
      return NextResponse.json({ error: reserveResult.reason || "Insufficient AI Credits." }, { status: 403 });
    }

    usageId = reserveResult.usageId;

    console.log(`Mocking conversion of ${(file as File).name || 'file'} to ${targetFormat}`);

    // Simulate Cloud API latency
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return a dummy buffer representing the converted file
    const mockBuffer = Buffer.from(`This is a mocked ${targetFormat} file content. Integrate CloudConvert for real conversions.`);

    let contentType = 'application/octet-stream';
    if (targetFormat === 'pdf') contentType = 'application/pdf';
    else if (targetFormat === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (targetFormat === 'md') contentType = 'text/markdown';

    if (usageId) {
      await CreditService.finalize(usageId, { actualCredits: undefined }); // undefined will use the default reserved credits
    }

    return new NextResponse(mockBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="converted.${targetFormat}"`,
      },
    });

  } catch (error: any) {
    if (usageId) {
      await CreditService.refund(usageId, error.message || "Conversion failed");
    }
    console.error("Conversion Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
