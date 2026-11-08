const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { HttpsError, onCall } = require('firebase-functions/v2/https');

initializeApp();

const db = getFirestore();
const allowedRoles = new Set(['estudiante', 'administrador']);
const administratorRoles = new Set(['admin', 'administrador']);
const institutionalEmailPattern = /^[^@\s]+@unadeca\.net$/i;

async function requireAdministrator(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para continuar.');
  }

  const profile = await db.collection('users').doc(request.auth.uid).get();
  const user = profile.data();
  if (!profile.exists || !administratorRoles.has(user?.role) || user?.active === false) {
    throw new HttpsError('permission-denied', 'Solo un administrador puede gestionar usuarios.');
  }
}

exports.listManagedUsers = onCall(async (request) => {
  await requireAdministrator(request);

  const profilesSnapshot = await db.collection('users').get();
  const profilesByUid = new Map(
    profilesSnapshot.docs.map((userDoc) => [userDoc.id, userDoc.data()])
  );
  const users = [];
  let pageToken;

  do {
    const page = await getAuth().listUsers(1000, pageToken);
    for (const authUser of page.users) {
      const profile = profilesByUid.get(authUser.uid) || {};
      users.push({
        uid: authUser.uid,
        name: profile.name || authUser.displayName || '',
        email: profile.email || authUser.email || '',
        role: profile.role || 'estudiante',
        active: !authUser.disabled && profile.active !== false
      });
    }
    pageToken = page.pageToken;
  } while (pageToken);

  return { users };
});

exports.createManagedUser = onCall(async (request) => {
  await requireAdministrator(request);

  const name = typeof request.data?.name === 'string' ? request.data.name.trim() : '';
  const email = typeof request.data?.email === 'string'
    ? request.data.email.trim().toLowerCase()
    : '';
  const role = request.data?.role;

  if (!name) {
    throw new HttpsError('invalid-argument', 'El nombre completo es obligatorio.');
  }
  if (!institutionalEmailPattern.test(email)) {
    throw new HttpsError('invalid-argument', 'El correo debe terminar en @unadeca.net.');
  }
  if (!allowedRoles.has(role)) {
    throw new HttpsError('invalid-argument', 'El rol seleccionado no es válido.');
  }

  let createdUser;
  try {
    createdUser = await getAuth().createUser({
      email,
      displayName: name,
      emailVerified: false,
      disabled: false
    });
  } catch (error) {
    if (error?.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Ya existe una cuenta con ese correo.');
    }
    console.error('No se pudo crear el usuario en Firebase Authentication:', error);
    throw new HttpsError('internal', 'No se pudo crear la cuenta en Firebase Authentication.');
  }

  try {
    await db.collection('users').doc(createdUser.uid).create({
      uid: createdUser.uid,
      name,
      email,
      role,
      active: true,
      createdAt: FieldValue.serverTimestamp()
    });
  } catch (error) {
    try {
      await getAuth().deleteUser(createdUser.uid);
    } catch (cleanupError) {
      console.error('No se pudo limpiar la cuenta incompleta:', cleanupError);
    }
    console.error('No se pudo guardar el perfil de usuario:', error);
    throw new HttpsError('internal', 'No se pudo guardar el perfil de usuario.');
  }

  return {
    user: {
      uid: createdUser.uid,
      name,
      email,
      role,
      active: true
    }
  };
});
