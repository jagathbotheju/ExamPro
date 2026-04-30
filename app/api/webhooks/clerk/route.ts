import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/db';
import { studentProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response('Invalid webhook signature', { status: 400 });
  }

  if (evt.type === 'user.created') {
    const { id, first_name, last_name, email_addresses } = evt.data;
    const name = [first_name, last_name].filter(Boolean).join(' ') || 'Student';
    const email = email_addresses?.[0]?.email_address ?? '';

    await db.insert(studentProfiles).values({
      userId: id,
      name,
      email,
      isComplete: false,
    }).onConflictDoNothing();
  }

  if (evt.type === 'user.updated') {
    const { id, first_name, last_name, email_addresses } = evt.data;
    const name = [first_name, last_name].filter(Boolean).join(' ') || 'Student';
    const email = email_addresses?.[0]?.email_address ?? '';

    await db.update(studentProfiles)
      .set({ name, email, updatedAt: new Date() })
      .where(eq(studentProfiles.userId, id));
  }

  return new Response('OK', { status: 200 });
}
