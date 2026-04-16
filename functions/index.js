const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

async function requireManagementRole(callerUid) {
  const snap = await admin.firestore().doc(`users/${callerUid}`).get();
  const role = (snap.exists ? snap.data().role : "") || "";
  const clean = String(role).trim().toLowerCase();
  if (clean !== "admin" && clean !== "manager") {
    throw new HttpsError("permission-denied", "Not authorized.");
  }
  return clean;
}

exports.deleteUserAuthAndProfile = onCall(async (request) => {
  const callerUid = request.auth?.uid;
  if (!callerUid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  const role = await requireManagementRole(callerUid);
  const targetUid = request.data?.uid;
  if (!targetUid || typeof targetUid !== "string") {
    throw new HttpsError("invalid-argument", "uid is required.");
  }
  if (targetUid === callerUid) {
    throw new HttpsError("failed-precondition", "You cannot delete your own account.");
  }

  // Managers cannot delete admins/managers (same rule as UI)
  if (role === "manager") {
    const targetSnap = await admin.firestore().doc(`users/${targetUid}`).get();
    const targetRole = (targetSnap.exists ? targetSnap.data().role : "") || "";
    const targetClean = String(targetRole).trim().toLowerCase();
    if (targetClean === "admin" || targetClean === "manager") {
      throw new HttpsError("permission-denied", "Managers cannot delete admin/manager accounts.");
    }
  }

  // Delete Firestore profile first (best-effort), then Auth user.
  await admin.firestore().doc(`users/${targetUid}`).delete().catch(() => {});
  await admin.auth().deleteUser(targetUid);

  return { ok: true };
});

