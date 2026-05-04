'use server';

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/db';
import { studentProfiles, examAssignments, examSubmissions } from '@/db/schema';
import { eq, count, avg, sql, ilike, or } from 'drizzle-orm';
import type { StudentSummary } from '@/app/_lib/types';

const PAGE_SIZE = 5;

export async function getStudents(page = 1, search = ''): Promise<{ students: StudentSummary[]; total: number; pages: number }> {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const _user = await currentUser();
  if (_user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');

  const client = await clerkClient();
  const { data: clerkUsers } = await client.users.getUserList({ limit: 500 });
  const adminUserIds = new Set(
    clerkUsers
      .filter(u => u.publicMetadata?.role === 'admin')
      .map(u => u.id)
  );

  const allProfiles = await db.query.studentProfiles.findMany({
    orderBy: (p, { asc }) => [asc(p.name)],
  });

  const nonAdminProfiles = allProfiles.filter(p => !adminUserIds.has(p.userId));

  const filtered = search
    ? nonAdminProfiles.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.school ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : nonAdminProfiles;

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const students: StudentSummary[] = await Promise.all(slice.map(async p => {
    const [pendingRow] = await db.select({ count: count() })
      .from(examAssignments)
      .where(eq(examAssignments.studentId, p.id) && eq(examAssignments.status, 'pending') as never);
    const [completedRow] = await db.select({ count: count() })
      .from(examSubmissions)
      .where(eq(examSubmissions.studentId, p.id));
    const [avgRow] = await db.select({ avg: avg(examSubmissions.score) })
      .from(examSubmissions)
      .where(eq(examSubmissions.studentId, p.id));

    return {
      id: p.id,
      userId: p.userId,
      name: p.name,
      email: p.email ?? null,
      grade: p.grade ?? null,
      school: p.school ?? null,
      studyStreak: p.studyStreak,
      avgScore: Math.round(Number(avgRow?.avg ?? 0)),
      completedCount: completedRow?.count ?? 0,
      pendingCount: pendingRow?.count ?? 0,
      lastActive: 'recently',
      status: 'active' as const,
    };
  }));

  return { students, total, pages };
}
