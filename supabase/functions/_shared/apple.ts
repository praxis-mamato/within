import { importPKCS8, SignJWT } from 'npm:jose@5';

/**
 * Revokes a Sign in with Apple token, as Apple requires when an account is deleted
 * (App Store Guideline 5.1.1(v); https://developer.apple.com/documentation/sign_in_with_apple/revoke_tokens).
 * Needs the secrets APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (the .p8 contents), and
 * APPLE_CLIENT_ID (the Services ID for web, or the bundle ID for the iOS app).
 */
const env = (k: string) => Deno.env.get(k) ?? '';

export const appleConfigured = () => Boolean(env('APPLE_TEAM_ID') && env('APPLE_KEY_ID') && env('APPLE_PRIVATE_KEY') && env('APPLE_CLIENT_ID'));

/** Apple's client secret: a short-lived ES256 JWT signed with the Sign in with Apple key. */
async function clientSecret(clientId: string): Promise<string> {
  const key = await importPKCS8(env('APPLE_PRIVATE_KEY').replace(/\\n/g, '\n'), 'ES256');
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: env('APPLE_KEY_ID') })
    .setIssuer(env('APPLE_TEAM_ID'))
    .setAudience('https://appleid.apple.com')
    .setSubject(clientId)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key);
}

export async function revokeAppleToken(token: string, hint: 'refresh_token' | 'access_token'): Promise<boolean> {
  if (!appleConfigured() || !token) return false;
  const clientId = env('APPLE_CLIENT_ID');
  const res = await fetch('https://appleid.apple.com/auth/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: await clientSecret(clientId), token, token_type_hint: hint }),
  });
  return res.ok;
}
