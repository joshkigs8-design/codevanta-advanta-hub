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

