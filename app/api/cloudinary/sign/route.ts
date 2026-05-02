import { createHash } from 'crypto';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const user = await currentUser();
  if (user?.publicMetadata?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { paramsToSign } = await request.json();

  const str =
    Object.keys(paramsToSign)
      .sort()
      .map(k => `${k}=${paramsToSign[k]}`)
      .join('&') + process.env.CLOUDINARY_API_SECRET;

  const signature = createHash('sha256').update(str).digest('hex');
  return Response.json({ signature, timestamp: paramsToSign.timestamp });
}
