import type { Bindings } from './types';

export interface MayarInvoice {
  id: string;
  amount: number;
  status: string;
  customer?: { email?: string };
}

function apiBase(env: Bindings): string {
  const base = env.MAYAR_BASE_URL || 'https://api.mayar.io/hl/v2';
  if (
    base !== 'https://api.mayar.io/hl/v2' &&
    base !== 'https://api.mayar.id/hl/v2'
  )
    throw new Error('URL Mayar tidak valid.');
  return base;
}

async function request(
  env: Bindings,
  path: string,
  init: RequestInit,
): Promise<Record<string, unknown>> {
  if (!env.MAYAR_API_KEY) throw new Error('Mayar belum dikonfigurasi.');
  const response = await fetch(`${apiBase(env)}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.MAYAR_API_KEY}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  if (!response.ok) throw new Error('Mayar tidak bisa memproses permintaan.');
  const envelope: unknown = await response.json();
  if (
    !envelope ||
    typeof envelope !== 'object' ||
    !('statusCode' in envelope) ||
    typeof envelope.statusCode !== 'number' ||
    !('data' in envelope) ||
    !envelope.data ||
    typeof envelope.data !== 'object'
  )
    throw new Error('Respons Mayar tidak valid.');
  if (envelope.statusCode < 200 || envelope.statusCode >= 300)
    throw new Error('Mayar menolak permintaan.');
  return envelope.data as Record<string, unknown>;
}

export async function createMayarInvoice(
  env: Bindings,
  input: {
    name: string;
    email: string;
    mobile: string;
    businessName: string;
    orderId: string;
    amount: number;
  },
): Promise<{ id: string; link: string; expiredAt: number }> {
  const now = Date.now();
  const data = await request(env, '/invoices/create', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      mobile: input.mobile,
      description: 'Takaran Pro',
      expiredAt: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      items: [{ quantity: 1, rate: input.amount, description: 'Takaran Pro' }],
      extraData: { orderId: input.orderId },
    }),
  });
  let link: URL;
  try {
    link = new URL(String(data.link));
  } catch {
    throw new Error('Tautan invoice Mayar tidak valid.');
  }
  if (
    typeof data.id !== 'string' ||
    !data.id ||
    link.protocol !== 'https:' ||
    link.username ||
    link.password ||
    !(
      link.hostname === 'myr.id' ||
      link.hostname.endsWith('.myr.id') ||
      link.hostname === 'mayar.id' ||
      link.hostname.endsWith('.mayar.id')
    ) ||
    typeof data.expiredAt !== 'number' ||
    !Number.isSafeInteger(data.expiredAt) ||
    data.expiredAt <= 0
  )
    throw new Error('Respons invoice Mayar tidak valid.');
  return { id: data.id, link: link.toString(), expiredAt: data.expiredAt };
}

export async function getMayarInvoice(
  env: Bindings,
  id: string,
): Promise<MayarInvoice> {
  const data = await request(env, `/invoices/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
  const customer = data.customer;
  const email =
    customer &&
    typeof customer === 'object' &&
    'email' in customer &&
    typeof customer.email === 'string'
      ? customer.email
      : undefined;
  if (
    typeof data.id !== 'string' ||
    !data.id ||
    typeof data.amount !== 'number' ||
    !Number.isSafeInteger(data.amount) ||
    data.amount < 0 ||
    typeof data.status !== 'string' ||
    (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  )
    throw new Error('Respons detail invoice Mayar tidak valid.');
  return {
    id: data.id,
    amount: data.amount,
    status: data.status,
    ...(email ? { customer: { email } } : {}),
  };
}
