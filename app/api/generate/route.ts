import { NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes timeout for slow model loads

export async function POST(req: Request) {
  try {
    const { topic, humorStyle } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const systemPrompt = `You are the MemeForge AI, a savage, elite meme generator. Your goal is to create the most relatable, viral, and often "out of pocket" humorous captions.
        
        RULES:
        1. PERSPECTIVE: Use "Me:", "That feeling when", "When you", or direct punchlines.
        2. HUMOR STYLES:
           - GenZ/Brainrot: Use slang like aura, rizz, cooked, sigma, mogging, delulu. High-energy and nonsensical.
           - Dark: Cynical, relatable pain, or dark observations about life/society.
           - Sarcastic: Dry, biting ironies about everyday stupidity.
           - Corporate: Passive-aggressive office life, burnout, and HR-hating humor.
        3. HINGLISH: IMPORTANT! 50% of the time, mix Hindi words (written in English script) into the caption (e.g., "Moye Moye", "Thala for a reason", "Kat gaya", "Systumm", "Zindagi jhand ba").
        4. STRUCTURE: strictly 2 lines (Top and Bottom text).
        5. LENGTH: Maximum 30 words total. Be punchy but descriptive enough to be funny.
        6. OUTPUT: Return STRICT JSON format: {"topText": "...", "bottomText": "..."}`;

    const userPrompt = `Scenario/Topic: "${topic}"\nHumor Style: ${humorStyle}`;

    let topText = "";
    let bottomText = "";
    let attempts = 0;
    let lastRawText = "";

    while (attempts < 3) {
      attempts++;
      
    const model = process.env.OLLAMA_MODEL || "llama3.1";
    console.log(`\n🤖 [AI GENERATE] Model: ${model}`);
    
    // Connect to Local Ollama Instance with 120s timeout (increased for slow model swaps)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const ollamaRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        format: attempts < 3 ? "json" : undefined, // Try without JSON format on last attempt
        stream: false,
        keep_alive: "5m",
        options: {
          num_predict: 150,
          temperature: 0.8
        }
      }),
      signal: controller.signal
    });
      clearTimeout(timeoutId);

      if (!ollamaRes.ok) {
        throw new Error(`Ollama returned status ${ollamaRes.status}. Make sure Ollama is running!`);
      }

      lastRawText = await ollamaRes.text();
      console.log(`=== ATTEMPT ${attempts} RAW OLLAMA RESPONSE ===\n`, lastRawText);

      try {
        const parsed = JSON.parse(lastRawText);
        const responseText = parsed.message?.content || "";
        console.log(`[AI] Cleaned response text:`, responseText.substring(0, 100) + '...');
        
        // More aggressive JSON cleaning
        const cleanJson = responseText
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .replace(/^[\s\S]*?({[\s\S]*})[\s\S]*$/, '$1') // Extract only the first JSON object
          .trim();
          
        const innerParsed = JSON.parse(cleanJson || "{}");
        
        // Deep search for strings
        topText = innerParsed.topText || innerParsed.top || innerParsed.top_text;
        bottomText = innerParsed.bottomText || innerParsed.bottom || innerParsed.bottom_text;

        if (!topText || !bottomText) {
          const extractStrings = (obj: any): string[] => {
            if (typeof obj === 'string') return [obj];
            if (Array.isArray(obj)) return obj.flatMap(extractStrings);
            if (typeof obj === 'object' && obj !== null) return Object.values(obj).flatMap(extractStrings);
            return [];
          };
          
          const allStrings = extractStrings(innerParsed);
          topText = topText || allStrings[0];
          bottomText = bottomText || (allStrings.length > 1 ? allStrings[allStrings.length - 1] : "");
        }

        // If we successfully got text, break out of loop
        if (topText && topText.trim() !== "") {
           break;
        }

        // LAST RESORT: If the JSON was valid but empty, or if we couldn't find keys,
        // and it's the last attempt, just use the raw responseText if it exists.
        if (attempts === 3 && responseText.trim() !== "" && responseText !== "{}") {
            const lines = responseText.split('\n').map((l: string) => l.trim()).filter(Boolean);
            topText = lines[0] || "ai generated";
            bottomText = lines[1] || (lines.length > 2 ? lines[lines.length-1] : "");
            break;
        }

      } catch (parseError) {
        console.error("Retrying due to JSON parse error on attempt", attempts);
        // If it's the 3rd attempt and JSON parsing failed, try to treat lastRawText as raw text
        if (attempts === 3 && lastRawText.trim() !== "" && !lastRawText.startsWith('{')) {
             const lines = lastRawText.split('\n').map((l: string) => l.trim()).filter(Boolean);
             topText = lines[0] || "ai generated";
             bottomText = lines[1] || (lines.length > 2 ? lines[lines.length-1] : "");
        }
      }
    }

    if (!topText || topText.trim() === "") {
        console.warn("AI failed to generate text after multiple attempts. Falling back to topic.");
        topText = topic.substring(0, 40);
        bottomText = humorStyle || "real";
    }

    console.log("FINAL GENERATED CAPTION:", { topText, bottomText });
    return NextResponse.json({ topText, bottomText });

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    // If fetch failed completely, it signifies Ollama is simply off.
    if (error.name === 'AbortError' || error.message.includes('aborted')) {
      return NextResponse.json({ 
        error: "Generation timed out. The model took too long to respond. You might want to try a smaller model like 'llama3.1' or 'moondream' for better performance on your CPU." 
      }, { status: 504 });
    }
    if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      return NextResponse.json({ error: "Could not connect to Ollama. Make sure 'Ollama' is running locally on port 11434!" }, { status: 500 });
    }
    return NextResponse.json({ error: error?.message || "Failed to generate caption" }, { status: 500 });
  }
}
