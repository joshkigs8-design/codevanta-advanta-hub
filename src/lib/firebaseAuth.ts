import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, firestore, googleProvider, isFirebaseConfigured } from "./firebase";

export interface FirebaseUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: "user" | "member" | "admin";
  planId: "free" | "basic" | "pro" | "vip";
  referralCode: string;
  referredBy?: string | null;
  accountStatus: "active" | "suspended" | "pending";
  createdAt: any;
  updatedAt: any;
}

/**
 * Generate a random 6-character referral code formatted as CVXXXX
 */
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "CV";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Synchronize Firebase authenticated user with Firestore `users/{uid}`
 * and issue backend session cookie via `/api/auth/firebase-session`.
 */
export async function syncUserWithFirestoreAndBackend(
  user: User,
  additionalData?: {
    displayName?: string;
    referralCode?: string;
  }
): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const userRef = doc(firestore, "users", user.uid);
  const docSnap = await getDoc(userRef);

  let referralCode = "";
  if (!docSnap.exists()) {
    // Generate new unique referral code
    referralCode = generateReferralCode();
    const cleanEmail = user.email || "";
    const cleanName = additionalData?.displayName || user.displayName || cleanEmail.split("@")[0] || "Developer";

    await setDoc(userRef, {
      uid: user.uid,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: user.photoURL || null,
      role: "user", // Security constraint: default role is always user
      planId: "free",
      referralCode,
      referredBy: additionalData?.referralCode || null,
      accountStatus: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Update last login timestamp without overwriting role or planId
    await setDoc(
      userRef,
      {
        displayName: user.displayName || docSnap.data().displayName,
        photoURL: user.photoURL || docSnap.data().photoURL,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  // Synchronize with backend session cookie
  try {
    await fetch("/api/auth/firebase-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: additionalData?.displayName || user.displayName,
        referralCode: additionalData?.referralCode,
      }),
    });
  } catch (err) {
    console.error("Failed to sync backend session cookie:", err);
  }
}

/**
 * Map Firebase Auth error codes to user-friendly messages
 */
export function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please verify your credentials.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please sign in instead.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 8 characters.";
    case "auth/popup-closed-by-user":
      return "Sign in was cancelled. Please try again.";
    case "auth/popup-blocked":
      return "The sign-in popup was blocked by your browser. Please allow popups for this site.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a few moments before trying again.";
    default:
      return "An authentication error occurred. Please try again.";
  }
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  await syncUserWithFirestoreAndBackend(credential.user);
  return credential.user;
}

export async function registerWithEmail(
  email: string,
  password: string,
  fullName: string,
  referralCode?: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  
  if (fullName.trim()) {
    try {
      await updateProfile(credential.user, { displayName: fullName.trim() });
    } catch {
      // ignore
    }
  }

  await syncUserWithFirestoreAndBackend(credential.user, {
    displayName: fullName.trim(),
    referralCode,
  });

  return credential.user;
}

export async function loginWithGoogle(referralCode?: string): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  await syncUserWithFirestoreAndBackend(credential.user, { referralCode });
  return credential.user;
}

export async function resetUserPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
}

