import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// ============================================================
// Firebase Admin SDK Initialization
// ============================================================

let messaging: ReturnType<typeof getMessaging> | null = null;

try {
  // Validate required env vars
  const requiredVars = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ];

  const missingVars = requiredVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missingVars.join(", ")}`
    );
  }

  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(
              /\\n/g,
              "\n"
            ),
          }),
        });

  messaging = getMessaging(app);
  console.log("[Firebase Admin] Initialized successfully");
} catch (error) {
  console.error(
    "[Firebase Admin] Initialization failed:",
    error instanceof Error ? error.message : String(error)
  );
  // Don't throw - let route handler handle gracefully
}

export { messaging };