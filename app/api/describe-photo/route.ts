import { NextResponse } from 'next/server';

export const maxDuration = 300; // Allow 5 minutes for slow vision analysis

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const model = process.env.OLLAMA_VISION_MODEL || process.env.OLLAMA_MODEL || "llava";
    const isVisionModel = /llava|vision|moondream|gemma4|paligemma/i.test(model);

    console.log(`\n📷 [AI VISION] Identifying photo content using: ${model}`);
    if (!isVisionModel) {
      console.warn(`\n⚠️  WARNING: "${model}" might not support vision! We recommend using "llava", "moondream", or "gemma4".`);
    }

    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const ollamaRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: 'Analyze this photo and provide a detailed 1-2 sentence description. Identify the main subjects, their expressions, important objects, and the situational context. Focus on details that would be great for a funny meme.',
            images: [image]
          }
        ],
        stream: false,
        keep_alive: "5m",
        options: {
          num_predict: 80,
          num_ctx: 2048,
          temperature: 0.5
        }
      }),
    });

    if (!ollamaRes.ok) {
      const errBody = await ollamaRes.text();
      console.error('Ollama vision error:', errBody);
      throw new Error(`Ollama returned status ${ollamaRes.status}. Make sure the model supports vision!`);
    }

    const data = await ollamaRes.json();
    const description = data.message?.content?.trim();

    if (!description) {
      throw new Error('No description returned from Ollama');
    }

    console.log('Photo description (Local):', description);
    return NextResponse.json({ description });

  } catch (error: any) {
    console.error('Describe-photo error:', error);
    if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      return NextResponse.json({ error: "Could not connect to Ollama. Make sure it's running locally on port 11434!" }, { status: 500 });
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to describe photo' },
      { status: 500 }
    );
  }
}
