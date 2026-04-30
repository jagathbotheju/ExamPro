'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { subjects, grades } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

async function assertAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const _user = await currentUser();
  if (_user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');
}

export async function getSubjects() {
  return db.query.subjects.findMany({ orderBy: (s, { asc }) => [asc(s.name)] });
}

export async function createSubject(data: { slug: string; name: string; color: string; icon: string }) {
  await assertAdmin();
  const [s] = await db.insert(subjects).values(data).returning();
  revalidatePath('/admin/settings');
  return s;
}

export async function updateSubject(id: string, data: { name: string; color: string; icon: string }) {
  await assertAdmin();
  await db.update(subjects).set(data).where(eq(subjects.id, id));
  revalidatePath('/admin/settings');
}

export async function deleteSubject(id: string) {
  await assertAdmin();
  await db.delete(subjects).where(eq(subjects.id, id));
  revalidatePath('/admin/settings');
}

export async function getGrades() {
  return db.query.grades.findMany({ orderBy: (g, { asc }) => [asc(g.order)] });
}

export async function createGrade(data: { label: string; order: number }) {
  await assertAdmin();
  const [g] = await db.insert(grades).values(data).returning();
  revalidatePath('/admin/settings');
  return g;
}

export async function updateGrade(id: string, label: string) {
  await assertAdmin();
  await db.update(grades).set({ label }).where(eq(grades.id, id));
  revalidatePath('/admin/settings');
}

export async function deleteGrade(id: string) {
  await assertAdmin();
  await db.delete(grades).where(eq(grades.id, id));
  revalidatePath('/admin/settings');
}
