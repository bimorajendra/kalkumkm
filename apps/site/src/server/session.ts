import 'server-only';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import { getAuth } from './auth';
import { adminEmails } from './env';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

/** Pengguna yang sedang masuk, atau null. Satu kali baca per permintaan. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email, image } = session.user;
  return { id, name, email, image: image ?? null };
});

/** Untuk halaman: arahkan ke halaman masuk bila belum login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/masuk');
  return user;
}

export function isAdmin(user: Pick<SessionUser, 'email'>): boolean {
  return adminEmails().includes(user.email.toLowerCase());
}

/** Untuk halaman admin: selain admin mendapat 404, bukan petunjuk bahwa halaman ada. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || !isAdmin(user)) notFound();
  return user;
}
