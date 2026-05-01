import { auth, currentUser } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages';

export const maxDuration = 120;

const client = new Anthropic();

const EXTRACT_PROMPT = `Extract every multiple-choice question (MCQ) from this document.

Return ONLY a raw JSON array — no markdown fences, no extra text.

Schema for each element:
{
  "body": "full question text, no leading number or bullet",
  "options": ["option A text", "option B text", "option C text", "option D text"],
  "correctIndex": 0,
  "difficulty": "Easy" | "Medium" | "Hard"
}

Rules:
- Include ONLY questions that have exactly 4 options.
- correctIndex is 0-based (0 = A, 1 = B, 2 = C, 3 = D).
- If the correct answer is marked (e.g. underlined, circled, asterisked, bold, or annotated), use it. Otherwise make your best inference.
- difficulty: Easy = recall/fact, Medium = application/understanding, Hard = analysis/evaluation.
- Strip leading question numbers and bullets from body.
- If no MCQ questions are found, return an empty array: []`;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Forbidden', { status: 403 });
  const user = await currentUser();
  if (user?.publicMetadata?.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

  const maxBytes = 20 * 1024 * 1024; // 20 MB
  if (file.size > maxBytes) return Response.json({ error: 'File exceeds 20 MB limit' }, { status: 400 });

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: 'Unsupported file type. Upload a JPG, PNG, WebP, GIF, or PDF.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');

  const fileBlock: ContentBlockParam = file.type === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    : { type: 'image', source: { type: 'base64', media_type: file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data: base64 } };

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: [fileBlock, { type: 'text', text: EXTRACT_PROMPT }],
      },
    ],
  });

  const raw = message.content.find(b => b.type === 'text')?.text ?? '[]';

  let questions: unknown[];
  try {
    questions = JSON.parse(raw);
    if (!Array.isArray(questions)) throw new Error('Not an array');
  } catch {
    return Response.json({ error: 'Claude returned unparseable output', raw }, { status: 422 });
  }

  const validated = questions.filter((q): q is { body: string; options: string[]; correctIndex: number; difficulty: string } => {
    if (typeof q !== 'object' || q === null) return false;
    const r = q as Record<string, unknown>;
    return (
      typeof r.body === 'string' && r.body.length > 0 &&
      Array.isArray(r.options) && r.options.length === 4 &&
      (r.options as unknown[]).every(o => typeof o === 'string') &&
      typeof r.correctIndex === 'number' && r.correctIndex >= 0 && r.correctIndex <= 3 &&
      ['Easy', 'Medium', 'Hard'].includes(r.difficulty as string)
    );
  });

  return Response.json({ questions: validated, total: validated.length });
}
