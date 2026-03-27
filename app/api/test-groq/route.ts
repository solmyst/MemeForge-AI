import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function GET() {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY in .env.local" }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Say hello!" }],
      model: "llama-3.3-70b-versatile",
    });

    return NextResponse.json({ message: chatCompletion.choices[0]?.message?.content });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error?.message || "Unknown error", 
      details: error?.error || error 
    }, { status: 500 });
  }
}
