import { 
  collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, 
  query, where, serverTimestamp, Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { CSVState } from "./csv-utils";
import { AppSettings } from "./settings-context";

// ── Subject Types ────────────────────────────────────────────────────────────
export interface Subject {
  id: string;
  subjectName: string;
  subjectCode: string;
  userId: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  studentCount: number;
  gradedCount: number;
}

export interface SubjectData {
  subjectName: string;
  subjectCode: string;
  spreadsheetData: CSVState;
  settings: AppSettings;
}

// ── Subject CRUD ─────────────────────────────────────────────────────────────

/** Get all subjects for the current user */
export async function getUserSubjects(userId: string): Promise<Subject[]> {
  const q = query(
    collection(db, "subjects"),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  const subjects = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  })) as Subject[];
  
  // Sort client-side (newest first) to avoid needing a composite index
  return subjects.sort((a, b) => {
    const aTime = a.updatedAt?.toMillis?.() || 0;
    const bTime = b.updatedAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

/** Create a new subject */
export async function createSubject(
  userId: string,
  subjectName: string,
  subjectCode: string,
  settings: AppSettings
): Promise<string> {
  const subjectRef = doc(collection(db, "subjects"));
  await setDoc(subjectRef, {
    subjectName,
    subjectCode,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    studentCount: 0,
    gradedCount: 0,
    spreadsheetData: JSON.stringify({ dataRows: [] }),
    settings: JSON.stringify(settings),
  });
  return subjectRef.id;
}

/** Save spreadsheet data for a subject */
export async function saveSubjectData(
  subjectId: string,
  csvState: CSVState,
  gradedCount: number
): Promise<void> {
  const subjectRef = doc(db, "subjects", subjectId);
  await updateDoc(subjectRef, {
    spreadsheetData: JSON.stringify(csvState),
    studentCount: csvState.dataRows.length,
    gradedCount,
    updatedAt: serverTimestamp(),
  });
}

/** Load spreadsheet data for a subject */
export async function loadSubjectData(subjectId: string): Promise<SubjectData | null> {
  const subjectRef = doc(db, "subjects", subjectId);
  const snap = await getDoc(subjectRef);
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    subjectName: data.subjectName,
    subjectCode: data.subjectCode,
    spreadsheetData: JSON.parse(data.spreadsheetData || '{"dataRows":[]}'),
    settings: data.settings ? JSON.parse(data.settings) : null,
  };
}

/** Delete a subject */
export async function deleteSubject(subjectId: string): Promise<void> {
  await deleteDoc(doc(db, "subjects", subjectId));
}

// ── Daily Credit Reset ───────────────────────────────────────────────────────

const DAILY_CREDIT_LIMIT = 50;

/** Check and reset daily credits if needed (runs on the frontend) */
export async function checkAndResetDailyCredits(userId: string): Promise<number> {
  const userRef = doc(db, "user", userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // First time user login -> initialize with 50 credits
    await setDoc(userRef, {
      credits_remaining: DAILY_CREDIT_LIMIT,
      last_credit_reset: serverTimestamp(),
    });
    return DAILY_CREDIT_LIMIT;
  }

  const userData = snap.data();
  const lastResetDate = userData.last_credit_reset?.toDate?.() || null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const needsReset = !lastResetDate || 
    new Date(lastResetDate.getFullYear(), lastResetDate.getMonth(), lastResetDate.getDate()).getTime() < today.getTime();

  if (needsReset) {
    await updateDoc(userRef, {
      credits_remaining: DAILY_CREDIT_LIMIT,
      last_credit_reset: serverTimestamp(),
    });
    return DAILY_CREDIT_LIMIT;
  }

  return userData.credits_remaining || 0;
}
