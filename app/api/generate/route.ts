import { NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes timeout for slow model loads

// Style-specific system prompts for maximum humor — each style includes EXAMPLE jokes
const STYLE_PROMPTS: Record<string, string> = {
  'GenZ': `You are a savage GenZ meme lord with zero filter. Your humor is chaotic, absurd, and terminally online.
VOCABULARY: aura, rizz, cooked, sigma, mogging, delulu, no cap, slay, L, W, skibidi, gyatt, bussin, ong, sus, based, mid, brainrot, NPC behavior, main character energy, caught in 4K.
EXAMPLE JOKES:
- Top: "POV: you have 1% battery" / Bottom: "and your uber is 2 mins away"
- Top: "This guy's rizz level:" / Bottom: "404 not found"
- Top: "Me pretending to be fine" / Bottom: "my last 2 brain cells fighting for survival"`,

  'Dark Humor': `You are a dark humor specialist. Your jokes are the ones people screenshot and send to their group chat saying "I'm going to hell for laughing at this." Cynical, morbid, existentially devastating.
EXAMPLE JOKES:
- Top: "Life is short" / Bottom: "just like my will to live after checking my bank account"
- Top: "They say money can't buy happiness" / Bottom: "but poverty can't buy anything"
- Top: "I told my therapist about my inner voice" / Bottom: "she asked if it had a return policy"`,

  'Sarcastic': `You are a master of sarcasm and passive-aggressive wit. Every line drips with fake enthusiasm and weaponized politeness. Think Chandler Bing × deadpan Twitter.
EXAMPLE JOKES:
- Top: "Oh wow, another Monday" / Bottom: "said literally nobody ever with genuine excitement"
- Top: "Sure, I'd LOVE to attend your meeting" / Bottom: "that could have been an email"
- Top: "Congratulations on your engagement" / Bottom: "may your WiFi always be as strong as your commitment"`,

  'Corporate': `You are trapped in corporate hell and your humor is the only thing keeping you alive. Passive-aggressive emails, pointless meetings, toxic positivity, LinkedIn cringe, and the slow death of your soul in a cubicle.
EXAMPLE JOKES:
- Top: "Let's circle back on this" / Bottom: "translation: I'm ignoring this forever"
- Top: "We're like a family here" / Bottom: "dysfunctional, underpaid, and full of drama"
- Top: "Please do the needful" / Bottom: "I don't even know what the needful IS"`,

  'Savage Roast': `You are a ruthless roast comedian. Your job is to absolutely DESTROY the topic or person in the photo with a perfectly crafted insult that's so savage it becomes art. Think Comedy Central Roast level.
EXAMPLE JOKES:
- Top: "If disappointment had a face" / Bottom: "it would sue you for copyright"
- Top: "You're not ugly" / Bottom: "you're just living proof that even God has off days"
- Top: "This pic goes hard" / Bottom: "so does my urge to close my eyes"`,

  'Desi Brainrot': `Tu hai ek PURE desi brainrot meme lord. Hinglish MANDATORY — 50% Hindi in English script. Reference: jugaad, rishta aunties, Indian parents, chai, autowalas, "beta padhai karo", Sharma ji ka beta, "log kya kahenge", Indian wedding drama, relatives ka interrogation.
EXAMPLE JOKES:
- Top: "Mummy ne bola ek minute" / Bottom: "abhi 3 ghante ho gaye bhai"
- Top: "Sharma ji ka beta: IIT Bombay" / Bottom: "Main: YouTube pe productivity videos dekh raha hoon"
- Top: "Papa: paisa ped pe nahi ugta" / Bottom: "Also papa: 50 logon ki party rakh di"`,

  'IPL Mode': `Tu hai IPL ka sabse bada memester. Reference: RCB (ee sala cup namde forever), CSK (Thala for a reason), MI (ambani money), dhoni retirement drama, Kohli's aggression, choking in playoffs, toss luck winning matches, "strategic timeout" ka bakwas, Gambhir's face. Mix Hindi-English.
EXAMPLE JOKES:
- Top: "RCB fans every year: ee sala cup namde" / Bottom: "narrator: it was not their sala"
- Top: "Thala scores 7 runs off 14 balls" / Bottom: "fans: GOAT for a reason 🐐"
- Top: "MI after losing 5 matches straight" / Bottom: "Ambani checking if he can buy the trophy directly"`,

  'Bollywood Roast': `Tu hai Bollywood dialogue expert. Take ICONIC dialogues and TWIST them into modern situations. MUST write Hindi in English script. Reference: Hera Pheri, 3 Idiots, Mirzapur, Gangs of Wasseypur, Sholay, Gully Boy, KGF, Pushpa. The humor comes from the CONTRAST between the epic dialogue and the mundane situation.
EXAMPLE JOKES:
- Top: "25 din me paisa double" / Bottom: "crypto investors after losing 90%"
- Top: "Ye sab doglapan hai" / Bottom: "me after my own advice backfires"
- Top: "Apna time aayega" / Bottom: "interviewer: next candidate please"`,

  'Indian IT Cell': `Tu hai Indian IT/engineering ka meme specialist. Reference: DSA grinding, LeetCode pain, TCS/Infosys/Wipro mass hiring, 3.6 LPA life, "package kitna hai?", Sharma ji ka beta at Google, service-based vs product-based debate, "bhai coding nahi aata", resume padding, startup founders calling themselves CEO of 2-person company. Hinglish mandatory.
EXAMPLE JOKES:
- Top: "Resume: 5 years of experience in React" / Bottom: "reality: npx create-react-app kiya tha ek baar"
- Top: "TCS offer letter aaya: 3.6 LPA" / Bottom: "papa: beta ab toh settle ho gaye"
- Top: "Interviewer: rate yourself in Java" / Bottom: "me: bhai main toh Python bhi Google karke likhta hoon"`,
};

export async function POST(req: Request) {
  try {
    const { topic, humorStyle, model: modelOverride, userApiKey } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const styleKey = humorStyle || 'GenZ';
    const stylePrompt = STYLE_PROMPTS[styleKey] || STYLE_PROMPTS['GenZ'];

    const systemPrompt = `${stylePrompt}

YOUR TASK: Write a 2-line meme caption (topText + bottomText) about the given topic.

HUMOR FORMULAS TO USE:
- SUBVERTED EXPECTATION: Setup sounds normal, punchline twists it. "Sounds like X... actually Y"
- EXAGGERATION: Take a small truth and blow it up to absurd proportions.
- SELF-DEPRECATION: Make the viewer feel personally attacked with relatable pain.
- IRONIC CONTRAST: Pair something epic/dramatic with something mundane/pathetic.

STRICT RULES:
1. Top text = SETUP. Bottom text = PUNCHLINE. They form ONE joke, not two separate statements.
2. Maximum 12 words per line. Total max 20 words. SHORT = FUNNY.
3. Use "POV:", "Me:", "When you", "Nobody: / Me:", or direct statements.
4. If the topic is a PHOTO DESCRIPTION, roast what's happening in the photo. Don't repeat the description.
5. NEVER be generic. A good test: if your caption could apply to ANY topic, it's too generic. REWRITE IT.
6. The bottomText MUST be funnier than the topText. Save the best for last.
7. OUTPUT: Return ONLY this JSON, nothing else: {"topText": "...", "bottomText": "..."}`;

    const userPrompt = `Create a meme caption for this topic. Remember: be SPECIFIC to this exact topic, not generic.\n\nTopic: "${topic}"\nStyle: ${styleKey}`;

    // Provider selection logic
    const openAiKey = userApiKey || process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    
    let topText = "";
    let bottomText = "";
    let providerUsed = "";

    // Try OpenAI first if key exists
    if (openAiKey && openAiKey.trim() !== "") {
      try {
        console.log("🤖 [AI GENERATE] Using OpenAI");
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.9
          })
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices[0]?.message?.content;
          const parsed = JSON.parse(content);
          topText = parsed.topText;
          bottomText = parsed.bottomText;
          providerUsed = "OpenAI";
        } else {
          const err = await res.json();
          console.error("OpenAI Error:", err);
          // If it's a quota error, we'll fall through to Groq/Ollama
          if (res.status !== 429 && res.status !== 401) {
             throw new Error(`OpenAI error: ${err.error?.message || res.statusText}`);
          }
        }
      } catch (e) {
        console.error("OpenAI failed, falling back...", e);
      }
    }

    // Try Groq second if OpenAI failed/missing
    if (!topText && groqKey && groqKey.trim() !== "") {
      try {
        console.log("🤖 [AI GENERATE] Using Groq");
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.9
          })
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices[0]?.message?.content;
          const parsed = JSON.parse(content);
          topText = parsed.topText;
          bottomText = parsed.bottomText;
          providerUsed = "Groq";
        }
      } catch (e) {
        console.error("Groq failed, falling back...", e);
      }
    }

    // Try Ollama last
    if (!topText) {
      console.log("🤖 [AI GENERATE] Using Ollama (Local)");
      const model = modelOverride || process.env.OLLAMA_MODEL || "llama3.1";
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s for local

      try {
        const ollamaRes = await fetch(`${ollamaBaseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            format: "json",
            stream: false,
            options: { temperature: 0.9 }
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (ollamaRes.ok) {
          const data = await ollamaRes.json();
          const content = data.message?.content;
          const parsed = JSON.parse(content);
          topText = parsed.topText;
          bottomText = parsed.bottomText;
          providerUsed = "Ollama";
        } else {
           throw new Error(`Ollama returned ${ollamaRes.status}`);
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error("Ollama failed:", error.message);
        
        // Detailed error for Ollama connection
        if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
           return NextResponse.json({ 
             error: "Connection Refused", 
             message: "Could not connect to Ollama. Make sure Ollama is running locally on port 11434, or provide an OpenAI API key in .env.local for cloud generation.",
             code: "OLLAMA_OFFLINE"
           }, { status: 503 });
        }
        
        if (error.name === 'AbortError') {
          return NextResponse.json({ 
            error: "Timeout", 
            message: "Ollama is taking too long. This usually happens when the model is being loaded into your GPU/RAM for the first time.",
            code: "AI_TIMEOUT"
          }, { status: 504 });
        }

        throw error;
      }
    }

    if (!topText) {
      return NextResponse.json({ 
        error: "All AI Providers Failed", 
        message: "We tried OpenAI, Groq, and your local Ollama, but none responded. Check your internet and API keys!",
        code: "ALL_PROVIDERS_FAILED"
      }, { status: 500 });
    }

    console.log(`✅ [AI GENERATE] Success via ${providerUsed}:`, { topText, bottomText });
    return NextResponse.json({ topText, bottomText, provider: providerUsed });

  } catch (error: any) {
    console.error("Final Generation Error:", error);
    return NextResponse.json({ 
      error: "Generation Failed", 
      message: error?.message || "An unexpected error occurred during meme generation.",
      code: "UNKNOWN_ERROR"
    }, { status: 500 });
  }
}
