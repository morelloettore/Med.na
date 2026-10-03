const SECRET_KEY = "medna_secret_key_2025";

export function decryptCredentials(encryptedBase64: string): string {
  if (!encryptedBase64) return "";
  let decodedBinary = "";
  if (typeof window === "undefined") {
    decodedBinary = Buffer.from(encryptedBase64, "base64").toString("binary");
  } else {
    decodedBinary = atob(encryptedBase64);
  }

  const keyCodes = Array.from(SECRET_KEY).map((c) => c.charCodeAt(0));
  let result = "";
  for (let i = 0; i < decodedBinary.length; i++) {
    result += String.fromCharCode(
      decodedBinary.charCodeAt(i) ^ keyCodes[i % keyCodes.length]
    );
  }
  return result;
}

export const ENCRYPTED_SUPABASE_URL = "BREQHhJlXEoZAAMFKBMGADtAWkdQDg0OGAonCksQBxUVPQoWHHFRXw==";
export const ENCRYPTED_SUPABASE_PUBLISHABLE_KEY = "Hgc7HhQ9HwwQGgQWMw46NjAAY2dGKVc1AzNpHQIOFiMXOzEjHgB3fnRaPxMxXw==";

export function getSupabaseConfig() {
  return {
    supabaseUrl: decryptCredentials(ENCRYPTED_SUPABASE_URL),
    publishableKey: decryptCredentials(ENCRYPTED_SUPABASE_PUBLISHABLE_KEY),
  };
}
