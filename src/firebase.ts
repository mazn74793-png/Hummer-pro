import { initializeApp, setLogLevel } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Set Firebase log level to 'error' to suppress transient WebChannel stream transport warning logs in proxy/iframe environments
setLogLevel('error');

// Initialize Firebase app with our secure credentials
const app = initializeApp(firebaseConfig);

// Initialize Auth & Firestore with specific Database ID, forcing HTTP long polling to prevent connection warning noise
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();

// Standard operation enum for diagnostics
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Interface for rich diagnostic tracking
export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

/**
 * Catches any permission and connection errors and throws a descriptive diagnostic payload to the framework logs
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
    },
    operationType,
    path
  };
  console.error('Firestore Hardened Error Log: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively cleans an object to ensure no fields are `undefined`,
 * which would otherwise cause Firestore writes to fail on the client.
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreData(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    // If it is a native Date object, don't clean it as an plain object
    if (obj instanceof Date) {
      return obj;
    }
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val === undefined) {
          continue;
        }
        cleaned[key] = cleanFirestoreData(val);
      }
    }
    return cleaned as T;
  }
  
  return obj;
}

