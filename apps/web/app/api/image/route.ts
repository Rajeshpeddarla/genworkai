import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob;
    const action = formData.get('action') as string; // 'resize', 'format', 'bg-remove', 'upscale'
    
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let processedBuffer: Buffer = buffer;
    let contentType = file.type || 'image/png';

    const image = sharp(buffer);

    if (action === 'format') {
      const format = formData.get('format') as string || 'webp';
      if (format === 'webp') {
        processedBuffer = await image.webp().toBuffer();
        contentType = 'image/webp';
      } else if (format === 'jpeg' || format === 'jpg') {
        processedBuffer = await image.jpeg().toBuffer();
        contentType = 'image/jpeg';
      } else if (format === 'png') {
        processedBuffer = await image.png().toBuffer();
        contentType = 'image/png';
      }
    } else if (action === 'resize' || action === 'upscale') {
      // Basic Sharp resizing (Note: True AI upscaling requires external API)
      const width = Number(formData.get('width'));
      if (width) {
        processedBuffer = await image.resize({ width }).toBuffer();
      }
    } else if (action === 'bg-remove') {
      // Mock background removal: In production, call remove.bg or BiRefNet API here
      // For now, we'll just return the original image and log a warning
      console.warn("Background removal requires external AI API like remove.bg");
      processedBuffer = await image.png().toBuffer();
      contentType = 'image/png';
    }

    return new NextResponse(new Uint8Array(processedBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="processed-image"`,
      },
    });

  } catch (error: any) {
    console.error("Image Processing Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
