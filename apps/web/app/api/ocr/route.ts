import { NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image base64 is required' }, { status: 400 });
    }

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

      return NextResponse.json({ text: finalText });
    } catch (error: any) {
      console.error("Tesseract Execution Failed:", error.message);
      return NextResponse.json({ error: `Tesseract Engine Crash: ${error.message}` }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: `Internal Server Error: ${err.message}` }, { status: 500 });
  }
}
