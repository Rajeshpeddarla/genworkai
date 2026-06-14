import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob;
    const format = formData.get('format') as string;
    
    if (!file || !format) {
      return NextResponse.json({ error: "Missing file or format" }, { status: 400 });
    }

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

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="converted.${format.toLowerCase()}"`,
      },
    });

  } catch (error: any) {
    console.error("Sharp Conversion Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
