export interface MayarConfig {
  apiKey: string;
  baseUrl: string;
  /** Untuk test. Produksi memakai fetch bawaan. */
  fetch?: typeof fetch;
}

export interface MayarInvoice {
  id: string;
  amount: number;
  status: string;
  customer?: { email?: string };
}

async function request(
  config: MayarConfig,
  path: string,
  init: RequestInit,
): Promise<Record<string, unknown>> {
  const response = await (config.fetch ?? fetch)(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    signal: AbortSignal.timeout(10_000),
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
  config: MayarConfig,
  input: {
    name: string;
    email: string;
    mobile: string;
    orderId: string;
    amount: number;
  },
): Promise<{ id: string; link: string; expiredAt: number }> {
  const data = await request(config, '/invoices/create', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      mobile: input.mobile,
      description: 'Takaran Pro',
      expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
  config: MayarConfig,
  id: string,
): Promise<MayarInvoice> {
  const data = await request(config, `/invoices/${encodeURIComponent(id)}`, {
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
