import { NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes timeout for slow model loads

// Style-specific system prompts for maximum humor
const STYLE_PROMPTS: Record<string, string> = {
  'GenZ': `You are MemeForge AI, a savage GenZ meme lord. Use slang like aura, rizz, cooked, sigma, mogging, delulu, no cap, slay, L, W, skibidi, gyatt, bussin, ong, sus, based, mid. High-energy and unhinged. Reference TikTok, Instagram, and internet culture.`,
  
  'Dark Humor': `You are MemeForge AI, a dark humor specialist. Create cynical, relatable observations about life, death, existential dread, and society. Think of r/2meirl4meirl vibes. The humor should make people say "I shouldn't laugh at this but..."`,
  
  'Sarcastic': `You are MemeForge AI, a master of sarcasm and dry wit. Use biting irony about everyday stupidity, social situations, and human behavior. Think of Chandler Bing meets Twitter roasts. The tone should be dripping with fake enthusiasm.`,
  
  'Corporate': `You are MemeForge AI, a passive-aggressive corporate humor generator. Reference office life, burnout, Zoom meetings, HR, synergy, "circle back", "per my last email", toxic managers, and the sheer absurdity of corporate culture. Think of r/antiwork meets LinkedIn cringe.`,
  
  'Desi Brainrot': `You are MemeForge AI, a pure desi brainrot meme lord. Use a MIX of Hindi (in English script) and English (Hinglish). Reference Indian culture, jugaad, rishta aunties, Indian parents, chai, Indian traffic, autowalas, desi wedding drama, "beta padhai karo", sharma ji ka beta. MANDATORY: At least 40% of the text MUST be in Hindi written in English script. Use phrases like: "Chup kar pagal", "Thoda aur ro le", "Yehi to badiya hai", "Kya kar rahe ho yaar", "Bilkul bakwas", "Abe saale", "Bhai kya scene hai", "Moye moye", "Zindagi jhand ba", "Paisa hi paisa hoga", "Baap baap hota hai".`,
  
  'IPL Mode': `You are MemeForge AI, an IPL and cricket meme specialist. Reference IPL teams (RCB, CSK, MI, SRH, KKR, DC, RR, PBKS), cricketers (Dhoni, Kohli, Rohit, Bumrah), "Thala for a reason", "RCB ee sala cup namde", choking in playoffs, strategic timeouts, cheerleaders, third umpire drama, DLS method confusion, toss luck. Mix Hindi and English. MUST include cricket slang.`,
  
  'Bollywood Roast': `You are MemeForge AI, a Bollywood meme generator. Reference iconic Bollywood dialogues but TWIST them into modern contexts. Use dialogues from: Hera Pheri ("25 din me paisa double"), 3 Idiots ("All is well"), Gangs of Wasseypur ("Jab tak todenge nahi tab tak chodenge nahi"), Mirzapur ("Ye sab doglapan hai"), Deewar ("Mere paas maa hai"), Sholay, Gully Boy ("Apna time aayega"), KGF, Pushpa. ALWAYS write Hindi dialogues in English script. Mix with modern situations.`,
  
  'Indian IT Cell': `You are MemeForge AI, an Indian IT/engineering meme specialist. Reference: engineering colleges, placement season, DSA grinding, LeetCode, "bhai log Java ya Python?", TCS/Infosys/Wipro, "package kitna hai?", Naukri.com, 3.6 LPA, on-site dreams, Sharma ji ka beta at Google, "coding nahi aata bhai", "resume me kya likhe?", startup culture, "disrupt kar denge industry ko", work-life balance myth, service-based vs product-based. Mix Hindi and English.`,
};

export async function POST(req: Request) {
  try {
    const { topic, humorStyle, model: modelOverride } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const model = modelOverride || process.env.OLLAMA_MODEL || "llama3.1";

    const styleKey = humorStyle || 'GenZ';
    const stylePrompt = STYLE_PROMPTS[styleKey] || STYLE_PROMPTS['GenZ'];

    const systemPrompt = `${stylePrompt}
        
        RULES:
        1. PERSPECTIVE: Use "Me:", "That feeling when", "When you", "POV:", or direct punchlines.
        2. STRUCTURE: strictly 2 lines (Top and Bottom text). Top = setup, Bottom = punchline. They MUST form ONE cohesive, logical joke together. Do not write two separate jokes.
        3. PHOTO AWARENESS: The "Scenario/Topic" might be a literal description of a photo. Connect the visual seamlessly to the joke. Do NOT just repeat the description, tell a cohesive joke ABOUT it.
        4. LENGTH: Maximum 30 words total. Be punchy, savage, and hilarious.
        5. Make it RELATABLE — the viewer should feel personally attacked.
        6. Be CREATIVE — avoid generic captions. Each meme should feel unique and fresh.
        7. If appropriate for the style, use Hinglish (Hindi words written in English script mixed with English).
        8. OUTPUT: Return STRICT JSON format: {"topText": "...", "bottomText": "..."}`;

    const userPrompt = `Scenario/Topic: "${topic}"\nHumor Style: ${styleKey}`;

    let topText = "";
    let bottomText = "";
    let attempts = 0;
    let lastRawText = "";

    while (attempts < 3) {
      attempts++;
      
    console.log(`\n🤖 [AI GENERATE] Model: ${model} | Style: ${styleKey}`);
    
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
          temperature: 0.7
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

      } catch (_parseError) {
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
