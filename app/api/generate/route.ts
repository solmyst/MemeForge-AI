import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topic, humorStyle } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const prompt = `
      You are an expert at creating internet memes.
      Your task is to read the following scenario and create a funny 2-part meme caption.

      Scenario: "${topic}"
      Humor Style: ${humorStyle || 'GenZ'}

      RULES:
      1. Stay strictly on topic. Describe the EXACT scenario provided.
      2. Keep the text EXTREMELY short (Max 5 words per line).
      3. The top text sets up the joke. The bottom text is the funny punchline or reaction.

      EXAMPLES:
      Scenario: "teacher scolding me for being late while my best friend is still at home"
      {"topText": "me getting yelled at", "bottomText": "my bro still sleeping"}

      Scenario: "I studied for 8 hours but the exam is on the chapter I skipped"
      {"topText": "studied all night", "bottomText": "wrong chapter"}

      Return ONLY a JSON object in this format:
      {"topText": "...", "bottomText": "..."}
    `;

    let topText = "";
    let bottomText = "";
    let attempts = 0;
    let lastRawText = "";

    while (attempts < 3) {
      attempts++;
      
      // Connect to Local Ollama Instance with 60s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const ollamaRes = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || "llama3.1:latest",
          messages: [{ role: "user", content: prompt }],
          format: attempts < 3 ? "json" : undefined, // Try without JSON format on last attempt
          stream: false
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
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
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
    if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      return NextResponse.json({ error: "Could not connect to Ollama. Make sure 'Ollama' is running locally on port 11434!" }, { status: 500 });
    }
    return NextResponse.json({ error: error?.message || "Failed to generate caption" }, { status: 500 });
  }
}
