// Криптоутилиты: PBKDF2-HMAC-SHA256 для вывода ключа из логин:пароль + соль
// и дешифрование AES-256-GCM.
// Формат шифротекста: [12 байт IV][ciphertext || authTag] (tag в конце блока CT).

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
  const ct = data.slice(12); // включает тэг в конце
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
}
