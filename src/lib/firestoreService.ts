import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  DocumentData,
} from "firebase/firestore";
import { firestore, isFirebaseConfigured } from "./firebase";
import type { Resource, Category, Tutorial } from "@/types";

// ============================================================================
// FIRESTORE COLLECTIONS & DATA HELPERS
// ============================================================================

export interface FirestoreUserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: "user" | "member" | "admin";
  planId?: string;
  accountStatus: "active" | "suspended" | "pending";
  paymentStatus: "unpaid" | "paid" | "refunded";
  referralCode?: string;
  referredBy?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface FirestoreBookmark {
  id?: string;
  userId: string;
  resourceId: string;
  resourceName?: string;
  resourceSlug?: string;
  categorySlug?: string;
  notes?: string;
  createdAt: any;
}

/**
 * Fetch a user profile document from Firestore by UID
 */
export async function getFirestoreUserProfile(uid: string): Promise<FirestoreUserProfile | null> {
  if (!isFirebaseConfigured() || !firestore) return null;
  try {
    const userDocRef = doc(firestore, "users", uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as FirestoreUserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error reading user profile from Firestore:", error);
    return null;
  }
}

/**
 * Synchronize confirmed membership activation and payment records into Firestore.
 */
export async function syncMembershipActivationToFirestore(params: {
  userId: string;
  planSlug: string;
  planName: string;
  amountKes: number;
  paymentId: string;
  reference: string;
  phoneNumber?: string;
}): Promise<boolean> {
  if (!isFirebaseConfigured() || !firestore) {
    return false;
  }
  try {
    const { userId, planSlug, planName, amountKes, paymentId, reference, phoneNumber } = params;

    // 1. Update user profile document in Firestore
    const userDocRef = doc(firestore, "users", userId);
    await setDoc(
      userDocRef,
      {
        planId: planSlug,
        planName: planName,
        role: "member",
        paymentStatus: "paid",
        accountStatus: "active",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Record subscription document in Firestore
    const subDocRef = doc(firestore, "subscriptions", `sub_${paymentId}`);
    await setDoc(
      subDocRef,
      {
        userId,
        planId: planSlug,
        planName,
        status: "active",
        amount_paid_kes: amountKes,
        paymentReference: reference,
        startsAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 3. Record payment document in Firestore
    const paymentDocRef = doc(firestore, "payments", paymentId);
    await setDoc(
      paymentDocRef,
      {
        id: paymentId,
        userId,
        planId: planSlug,
        planName,
        amount_kes: amountKes,
        currency: "KES",
        provider: "paystack_mpesa",
        provider_reference: reference,
        phone_number: phoneNumber || null,
        status: "completed",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error("Firestore membership activation sync error:", error);
    return false;
  }
}

/**
 * Fetch published resources from Firestore
 */
export async function getFirestorePublishedResources(): Promise<Resource[]> {
  if (!isFirebaseConfigured() || !firestore) return [];
  try {
    const resourcesCol = collection(firestore, "resources");
    const q = query(resourcesCol, where("published", "==", true), orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Resource[];
  } catch (error) {
    console.error("Error fetching resources from Firestore:", error);
    return [];
  }
}

/**
 * Fetch published categories from Firestore
 */
export async function getFirestoreCategories(): Promise<Category[]> {
  if (!isFirebaseConfigured() || !firestore) return [];
  try {
    const categoriesCol = collection(firestore, "categories");
    const snapshot = await getDocs(categoriesCol);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Category[];
  } catch (error) {
    console.error("Error fetching categories from Firestore:", error);
    return [];
  }
}

/**
 * Fetch published tutorials from Firestore
 */
export async function getFirestoreTutorials(): Promise<Tutorial[]> {
  if (!isFirebaseConfigured() || !firestore) return [];
  try {
    const tutorialsCol = collection(firestore, "tutorials");
    const q = query(tutorialsCol, where("published", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Tutorial[];
  } catch (error) {
    console.error("Error fetching tutorials from Firestore:", error);
    return [];
  }
}

/**
 * Save or toggle a bookmark in Firestore
 */
export async function addFirestoreBookmark(userId: string, resource: Partial<Resource>, notes?: string) {
  if (!isFirebaseConfigured() || !firestore) throw new Error("Firebase not initialized");
  const bookmarkRef = doc(firestore, "bookmarks", `${userId}_${resource.id}`);
  await setDoc(
    bookmarkRef,
    {
      userId,
      resourceId: resource.id,
      resourceName: resource.name || "",
      resourceSlug: resource.slug || "",
      categorySlug: resource.category_slug || "",
      notes: notes || "",
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
  return { success: true };
}

/**
 * Remove a bookmark in Firestore
 */
export async function removeFirestoreBookmark(userId: string, resourceId: string) {
  if (!isFirebaseConfigured() || !firestore) throw new Error("Firebase not initialized");
  const bookmarkRef = doc(firestore, "bookmarks", `${userId}_${resourceId}`);
  await deleteDoc(bookmarkRef);
  return { success: true };
}

/**
 * Get user bookmarks from Firestore
 */
export async function getUserFirestoreBookmarks(userId: string): Promise<FirestoreBookmark[]> {
  if (!isFirebaseConfigured() || !firestore) return [];
  try {
    const bookmarksCol = collection(firestore, "bookmarks");
    const q = query(bookmarksCol, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as FirestoreBookmark[];
  } catch (error) {
    console.error("Error fetching user bookmarks from Firestore:", error);
    return [];
  }
}

