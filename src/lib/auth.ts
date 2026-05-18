const SALT = 'cms-aufbereitung-2026';

export async function hashPasswort(passwort: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passwort + SALT);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
