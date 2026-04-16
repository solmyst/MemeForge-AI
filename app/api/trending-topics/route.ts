import { NextResponse } from 'next/server';

// Curated viral trending topics — mix of global + Indian
const TRENDING_TOPICS = [
  // Global viral
  "When the WiFi drops during an online exam",
  "Me pretending to work when boss walks by",
  "Monday morning hitting different",
  "When someone says 'we need to talk'",
  "The group project where you did everything",
  "When the code works but you don't know why",
  "When you realize you were on mute the whole time",
  "Sending risky text then airplane mode",
  "That one friend who never replies but is always online",
  "When the delivery guy calls and you have to adult",
  "When autocorrect ruins your love life",
  "Trust issues after someone said 'Im fine'",
  "POV: Its 3am and your brain starts a TED talk",
  "When you skip the tutorial and nothing makes sense",
  "Internet explorer trying its best",
  
  // Indian / Desi
  "When mom says 'Sharma ji ka beta' one more time",
  "Me after eating mom's rajma chawal",
  "When your relatives ask about your salary",
  "Indian parents when you score 99 instead of 100",
  "Auto driver driving like he's in Fast and Furious",
  "Engineering students during placement season",
  "When Zomato says 10 mins but its been 40",
  "IPL final over and your team needs 20 runs",
  "When the WiFi dies during Hotstar IPL streaming",
  "Me on Monday vs Me on Friday evening",
  "When chai is the answer to everything",
  "IRCTC website during Tatkal booking",
  "That one uncle at every Indian wedding",
  "Bhai log after eating pani puri in the rain",
  "Delhi metro during rush hour",
  "When gf says Im outside your house",
  "Watching Hera Pheri for the 100th time and still laughing",
  "JEE preparation vs actual JEE exam",
  "Indian parents when you say you want to be an artist",
  "UPI payment declined at the chai tapri",
  "When your Mom finds your phone at 2am",
  "Dhoni finishing the match with a six",
  "When the teacher says This wont come in the exam",
  "Jugaad that actually works",
  "When you open LinkedIn and everyone is CEO",
  "Board exam results day in an Indian household",
  "When the AC bill hits in Indian summer",
  "Auto wala refusing to go by meter",
  "Bhai log planning Goa trip that never happens",
  "When your crush watches your story but doesnt reply",
  "POV youre the last person to reach the meeting",
  "Indian IT engineer on a Monday standup call",
  "When Swiggy and Zomato are both showing surge pricing",
  "Train getting delayed by 3 hours - Indian Railways moment",
  "Startup bro telling everyone hes disrupting the industry",
];

const RANDOM_STYLES = [
  'GenZ', 'Dark Humor', 'Sarcastic', 'Corporate',
  'Desi Brainrot', 'IPL Mode', 'Bollywood Roast', 'Indian IT Cell'
];

export async function GET() {
  // Seed based on current date so it rotates daily
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Simple seeded shuffle
  const shuffled = [...TRENDING_TOPICS];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Return top 20 for today with random style pairings
  const trending = shuffled.slice(0, 20).map((topic, i) => ({
    topic,
    style: RANDOM_STYLES[(seed + i) % RANDOM_STYLES.length],
    id: i,
  }));

  return NextResponse.json({ trending, styles: RANDOM_STYLES });
}
