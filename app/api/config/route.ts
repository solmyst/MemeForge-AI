import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    modelA: process.env.OLLAMA_MODEL_A || process.env.OLLAMA_MODEL || 'llama3.2',
    modelB: process.env.OLLAMA_MODEL_B || 'llama3.1',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  });
}
