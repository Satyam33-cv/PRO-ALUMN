export interface JwtPayload {
  id: string;
  email?: string;
  role?: string;
  profileStatus?: string;
  isVerified?: boolean;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Verifies and decodes a JWT using Web Crypto API.
 * This is safe to use in Next.js Edge Runtime (e.g., middleware.ts).
 */
export async function verifyJwtEdge(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    // 1. Import the secret key for HMAC-SHA256
    const secretBuffer = new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      secretBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // 2. Verify the signature
    const dataToVerify = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    
    // Convert base64url signature to Uint8Array
    const padding = "=".repeat((4 - (signatureB64.length % 4)) % 4);
    const base64 = (signatureB64 + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const signatureArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      signatureArray[i] = rawData.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureArray,
      dataToVerify
    );

    if (!isValid) {
      return null;
    }

    // 3. Decode payload
    const payloadPadding = "=".repeat((4 - (payloadB64.length % 4)) % 4);
    const payloadBase64 = (payloadB64 + payloadPadding).replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(payloadBase64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload) as JwtPayload;
    
    // 4. Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}
