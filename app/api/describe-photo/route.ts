import { NextResponse } from 'next/server';

export const maxDuration = 300; // Allow 5 minutes for slow vision analysis

export async function POST(req: Request) {
  try {
    const { image, userApiKey } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const openAiKey = userApiKey || process.env.OPENAI_API_KEY;
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    let description = "";
    let providerUsed = "";

    const visionPrompt = `Describe this photo in 2-3 sentences for a meme caption writer. Answer these questions:
1. WHO or WHAT is in the photo? (person, animal, object)
2. What is their EXPRESSION or MOOD? (confused, angry, tired, excited, smug, dead inside)
3. What are they DOING or what SITUATION are they in?
4. Is there anything ABSURD, IRONIC, or FUNNY about the scene?
Be specific and vivid. Do NOT be generic. Example good output: "A college student sitting at a desk at 3AM surrounded by energy drink cans, staring at a laptop with dead eyes and messy hair, looking completely defeated by an assignment."`;

    // Try OpenAI Vision first if key exists
    if (openAiKey && openAiKey.trim() !== "") {
      try {
        console.log("📷 [AI VISION] Using OpenAI Vision");
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`
          },
          body: JSON.stringify({
            model: process.env.OPENAI_VISION_MODEL || "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: visionPrompt },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${image}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 300
          })
        });

        if (res.ok) {
          const data = await res.json();
          description = data.choices[0]?.message?.content?.trim();
          providerUsed = "OpenAI";
        } else {
          const err = await res.json();
          console.error("OpenAI Vision Error:", err);
        }
      } catch (e) {
        console.error("OpenAI Vision failed, falling back...", e);
      }
    }

    // Try Ollama fallback
    if (!description) {
      console.log("📷 [AI VISION] Using Ollama (Local)");
      const model = process.env.OLLAMA_VISION_MODEL || "llava";
      
      try {
        const ollamaRes = await fetch(`${ollamaBaseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: visionPrompt,
                images: [image]
              }
            ],
            stream: false,
            options: { temperature: 0.6 }
          }),
        });

        if (ollamaRes.ok) {
          const data = await ollamaRes.json();
          description = data.message?.content?.trim();
          providerUsed = "Ollama";
        } else {
          const errBody = await ollamaRes.text();
          console.error('Ollama vision error:', errBody);
        }
      } catch (error: any) {
        console.error('Ollama Vision connection failed:', error.message);
        if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
           return NextResponse.json({ 
             error: "Vision Provider Offline", 
             message: "Could not connect to Ollama for vision analysis. Make sure Ollama is running with 'llava' or 'moondream' installed, or provide an OpenAI key.",
             code: "VISION_OFFLINE"
           }, { status: 503 });
        }
        throw error;
      }
    }

    if (!description) {
      return NextResponse.json({ 
        error: "Vision Analysis Failed", 
        message: "None of the vision providers were able to describe the photo. Check your connection!",
        code: "VISION_FAILED"
      }, { status: 500 });
    }

    console.log(`✅ [AI VISION] Success via ${providerUsed}:`, description.substring(0, 100) + "...");
    return NextResponse.json({ description, provider: providerUsed });

  } catch (error: any) {
    console.error('Describe-photo error:', error);
    return NextResponse.json(
      { error: "Vision Error", message: error?.message || 'Failed to describe photo' },
      { status: 500 }
    );
  }
}
