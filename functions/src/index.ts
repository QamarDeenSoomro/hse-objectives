import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const createUser = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated and is an admin.
  if (context.auth?.token.role !== 'admin' && context.auth?.token.role !== 'superadmin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can create users.');
  }

  const { email, password, fullName, role } = data;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
    });

    // Set custom claims to store the user's role.
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    // Also store the user's profile in Firestore.
    await admin.firestore().collection('profiles').doc(userRecord.uid).set({
        email,
        full_name: fullName,
        role,
    });

    return { uid: userRecord.uid };
  } catch (error) {
    throw new functions.https.HttpsError('internal', (error as Error).message);
  }
});

export const adminUpdatePassword = functions.https.onCall(async (data, context) => {
    if (context.auth?.token.role !== 'admin' && context.auth?.token.role !== 'superadmin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can update passwords.');
    }

    const { uid, password } = data;

    try {
        await admin.auth().updateUser(uid, { password });
        return { success: true };
    } catch (error) {
        throw new functions.https.HttpsError('internal', (error as Error).message);
    }
});

export const toggleUserStatus = functions.https.onCall(async (data, context) => {
    if (context.auth?.token.role !== 'superadmin') {
        throw new functions.https.HttpsError('permission-denied', 'Only superadmins can toggle user status.');
    }

    const { uid, disabled } = data;

    try {
        await admin.auth().updateUser(uid, { disabled });
        return { success: true };
    } catch (error) {
        throw new functions.https.HttpsError('internal', (error as Error).message);
    }
});

// The following functions are placeholders and need to be implemented based on the specific requirements of the application.
// They are likely to involve more complex logic and data manipulation in Firestore.

// Placeholder for superadmin-manage-users
export const superadminManageUsers = functions.https.onCall(async (data, context) => {
    // TODO: Implement this function. It could be used for bulk user operations, etc.
    console.log("superadminManageUsers called with:", data);
    return { status: "not implemented" };
});

// Placeholder for superadmin-system-settings
export const superadminSystemSettings = functions.https.onCall(async (data, context) => {
    // TODO: Implement this function. It could be used for managing system-wide settings stored in Firestore.
    console.log("superadminSystemSettings called with:", data);
    return { status: "not implemented" };
});

export const deleteUser = functions.https.onCall(async (data, context) => {
    if (context.auth?.token.role !== 'superadmin') {
        throw new functions.https.HttpsError('permission-denied', 'Only superadmins can delete users.');
    }

    const { uid } = data;

    try {
        await admin.auth().deleteUser(uid);
        await admin.firestore().collection('profiles').doc(uid).delete();
        return { success: true };
    } catch (error) {
        throw new functions.https.HttpsError('internal', (error as Error).message);
    }
});
