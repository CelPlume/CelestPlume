/**
 * 受保护内容加密（构建期加密 / 客户端解密共用，同构模块）。
 *
 * 密码学标准（与 Shirone 对齐，AAD 域改为本项目）：
 * - 认证加密：AES-256-GCM（防篡改 + 完整性校验），随机 12 字节 IV；
 * - 密钥派生：PBKDF2-SHA-256，310,000 次迭代（OWASP 建议），随机 16 字节盐；
 * - 作用域绑定（AAD）：`celplume-protected-content:1:${scope}`，
 *   防止跨页面密文重放；
 * - 零明文泄露：静态产物只含密文与公钥参数，绝不包含明文密码或正文。
 *
 * 运行环境：globalThis.crypto.subtle（Node 18+ 与所有现代浏览器原生的
 * Web Crypto API），构建期与浏览器跑同一份代码。
 */

export const PROTECTED_CONTENT_VERSION = 1 as const;
export const PROTECTED_ITERATIONS = 310_000;

export type ProtectedContentType = 'text/html' | 'application/json';

export interface ProtectedPayload {
  v: number;
  alg: 'AES-GCM';
  kdf: 'PBKDF2';
  hash: 'SHA-256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  contentType: ProtectedContentType;
  scope: string;
}

export class ProtectedContentError extends Error {
  constructor(message = 'Protected content could not be unlocked') {
    super(message);
    this.name = 'ProtectedContentError';
  }
}

function cryptoApi(): Crypto {
  if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
    throw new ProtectedContentError('Web Crypto is unavailable');
  }
  return globalThis.crypto;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function aadFor(scope: string, version: number): Uint8Array {
  return new TextEncoder().encode(`celplume-protected-content:${version}:${scope}`);
}

function bufferSource(bytes: Uint8Array): BufferSource {
  return bytes as unknown as BufferSource;
}

/** 严格校验载荷形状与密码学参数（防篡改/防降级），不合法即抛错。 */
export function parseProtectedPayload(value: unknown): ProtectedPayload {
  const payload = value as ProtectedPayload;
  if (
    payload?.v !== PROTECTED_CONTENT_VERSION ||
    payload.alg !== 'AES-GCM' ||
    payload.kdf !== 'PBKDF2' ||
    payload.hash !== 'SHA-256' ||
    payload.iterations !== PROTECTED_ITERATIONS ||
    !payload.scope ||
    !payload.salt ||
    !payload.iv ||
    !payload.ciphertext ||
    !payload.contentType
  ) {
    throw new ProtectedContentError('Unsupported protected content payload');
  }

  try {
    if (
      base64UrlToBytes(payload.salt).byteLength !== 16 ||
      base64UrlToBytes(payload.iv).byteLength !== 12 ||
      base64UrlToBytes(payload.ciphertext).byteLength < 16
    ) {
      throw new ProtectedContentError('Invalid protected content payload');
    }
  } catch {
    throw new ProtectedContentError('Invalid protected content payload');
  }
  return payload;
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const crypto = cryptoApi();
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: bufferSource(salt), iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** 构建期：把已渲染 HTML 加密为载荷（每次构建随机盐/IV）。 */
export async function encryptProtectedContent(
  content: string,
  password: string,
  scope: string,
  contentType: ProtectedContentType = 'text/html',
): Promise<ProtectedPayload> {
  if (!password || !scope) {
    throw new ProtectedContentError('Password and scope are required');
  }
  const crypto = cryptoApi();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, PROTECTED_ITERATIONS);
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: bufferSource(iv),
      additionalData: bufferSource(aadFor(scope, PROTECTED_CONTENT_VERSION)),
    },
    key,
    new TextEncoder().encode(content),
  );
  return {
    v: PROTECTED_CONTENT_VERSION,
    alg: 'AES-GCM',
    kdf: 'PBKDF2',
    hash: 'SHA-256',
    iterations: PROTECTED_ITERATIONS,
    salt: bytesToBase64Url(salt),
    iv: bytesToBase64Url(iv),
    ciphertext: bytesToBase64Url(new Uint8Array(ciphertext)),
    contentType,
    scope,
  };
}

/** 客户端：用密码解密载荷；作用域不匹配 / 密码错误 → GCM 校验失败抛错。 */
export async function decryptProtectedContent(
  payload: ProtectedPayload,
  password: string,
  expectedScope: string = payload.scope,
): Promise<string> {
  parseProtectedPayload(payload);
  if (payload.scope !== expectedScope) {
    throw new ProtectedContentError('Protected content scope mismatch');
  }
  const crypto = cryptoApi();
  const key = await deriveKey(
    password,
    base64UrlToBytes(payload.salt),
    payload.iterations,
  );
  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: bufferSource(base64UrlToBytes(payload.iv)),
        additionalData: bufferSource(aadFor(payload.scope, payload.v)),
      },
      key,
      bufferSource(base64UrlToBytes(payload.ciphertext)),
    );
  } catch {
    throw new ProtectedContentError('Wrong password');
  }
  return new TextDecoder().decode(plaintext);
}
