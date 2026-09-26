export async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp?: string,
): Promise<boolean> {
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set('remoteip', remoteIp);
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body,
      },
    );
    if (!response.ok) return false;
    const result: unknown = await response.json();
    return (
      typeof result === 'object' &&
      result !== null &&
      'success' in result &&
      result.success === true
    );
  } catch {
    return false;
  }
}
