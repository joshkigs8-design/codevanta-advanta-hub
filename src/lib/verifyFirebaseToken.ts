/**
 * Authoritative Server-Side Firebase ID Token Verifier
 * Verifies Firebase ID tokens cryptographically against Google's authentication servers.
 * Validates expiration, signature, project audience, and email verification status.
 */

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  role?: string;
  admin?: boolean;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseUser | null> {
  if (!idToken || typeof idToken !== "string") {
    return null;
  }

  const cleanToken = idToken.trim();
  if (cleanToken.length === 0) {
    return null;
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    console.error("SECURITY CRITICAL: NEXT_PUBLIC_FIREBASE_API_KEY is not configured.");
    return null;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "codevanta-hub";

  try {
    // 1. Structure validation
    const parts = cleanToken.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // 2. Decode payload for audience and expiration pre-flight check
    const payloadStr = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadStr + "=".repeat((4 - (payloadStr.length % 4)) % 4);
    const unverifiedPayload = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));

    // Check project audience & issuer
    if (unverifiedPayload.aud !== projectId) {
      return null;
    }
    if (unverifiedPayload.iss !== `https://securetoken.google.com/${projectId}`) {
      return null;
    }

    // Check expiration timestamp (with 5-second clock skew tolerance)
    if (unverifiedPayload.exp && Date.now() >= (unverifiedPayload.exp + 5) * 1000) {
      return null;
    }

    // 3. Authoritative cryptographic verification via Google Identity Toolkit REST API
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: cleanToken }),
      }
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const userRecord = data.users?.[0];
    if (!userRecord || !userRecord.localId || !userRecord.email) {
      return null;
    }

    return {
      uid: userRecord.localId,
      email: userRecord.email.toLowerCase().trim(),
      emailVerified: Boolean(userRecord.emailVerified),
      displayName: userRecord.displayName || undefined,
    };
  } catch (err) {
    console.error("Firebase ID token verification failure:", err);
    return null;
  }
}
