export async function hashIp(ip: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${salt}:${ip}`),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function consumePreorderRateLimit(
  db: D1Database,
  ip: string,
  salt: string,
  now = new Date(),
): Promise<boolean> {
  const windowStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
    ),
  ).toISOString();
  const key = await hashIp(ip, salt);
  const result = await db
    .prepare(`
    INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
    ON CONFLICT (key, window_start) DO UPDATE SET count = count + 1
    WHERE count < 5
    RETURNING count
  `)
    .bind(key, windowStart)
    .first<{ count: number }>();
  return result !== null;
}
