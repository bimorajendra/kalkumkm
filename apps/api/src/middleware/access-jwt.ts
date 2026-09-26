import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types';

type AccessJwk = JsonWebKey & { kid?: string };

const keyCache = new Map<string, { expiresAt: number; keys: AccessJwk[] }>();

type JwtHeader = { alg?: string; kid?: string };
type JwtClaims = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
};

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = atob(
    normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='),
  );
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

function decodeJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;
}

async function getKeys(issuer: string): Promise<AccessJwk[]> {
  const cached = keyCache.get(issuer);
  if (cached && cached.expiresAt > Date.now()) return cached.keys;
  const response = await fetch(`${issuer}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error('Access keys unavailable');
  const payload: unknown = await response.json();
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('keys' in payload) ||
    !Array.isArray(payload.keys)
  )
    throw new Error('Invalid Access keys');
  const keys = payload.keys as AccessJwk[];
  keyCache.set(issuer, { expiresAt: Date.now() + 5 * 60_000, keys });
  return keys;
}

async function isValidAccessJwt(
  token: string,
  teamDomain: string,
  audience: string,
): Promise<boolean> {
  try {
    const issuer = `https://${teamDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !encodedSignature) return false;
    const header = decodeJson<JwtHeader>(encodedHeader);
    const claims = decodeJson<JwtClaims>(encodedPayload);
    if (header.alg !== 'RS256' || !header.kid || claims.iss !== issuer)
      return false;
    if (typeof claims.exp !== 'number' || claims.exp <= Date.now() / 1000)
      return false;
    if (typeof claims.nbf === 'number' && claims.nbf > Date.now() / 1000)
      return false;
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!audiences.includes(audience)) return false;
    const jwk = (await getKeys(issuer)).find(
      (candidate) => candidate.kid === header.kid,
    );
    if (!jwk) return false;
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    return crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
    );
  } catch {
    return false;
  }
}

export const requireAccessJwt: MiddlewareHandler<AppEnv> = async (
  context,
  next,
) => {
  const token = context.req.header('Cf-Access-Jwt-Assertion');
  if (
    !token ||
    !(await isValidAccessJwt(
      token,
      context.env.ACCESS_TEAM_DOMAIN,
      context.env.ACCESS_AUD,
    ))
  ) {
    return context.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Perlu masuk melalui Cloudflare Access.',
        },
      },
      401,
    );
  }
  await next();
};
