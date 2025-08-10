// Криптоутилиты: KDF PBKDF2(HMAC-SHA256, 200k) => AES-256-GCM key, и дешифрование AES-GCM.
// Формат шифротекста: [12 байт IV][ciphertext || authTag].

async function deriveKeyFromCredentials(login, password, salt) {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey(
    'raw',
    enc.encode(`${login}:${password}`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function decryptAesGcm(buffer, key) {
  const data = new Uint8Array(buffer);
  const iv = data.slice(0, 12);
  const ct = data.slice(12);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
}
