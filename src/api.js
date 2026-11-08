import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  signOut,
  signInWithEmailAndPassword
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { seedEvents } from './data/events';
import { auth, db, functions, isFirebaseReady } from './firebase';

const EVENTS_KEY = 'app-eventos-events';
const USERS_KEY = 'app-eventos-users';

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getLocalEvents() {
  const storedEvents = readStorage(EVENTS_KEY, null);
  if (Array.isArray(storedEvents) && storedEvents.length > 0) {
    return storedEvents;
  }

  return seedEvents();
}

function asEventDocument(rawEvent = {}) {
  const safeEvent = {
    ...rawEvent,
    title: rawEvent.title || 'Evento sin nombre',
    category: rawEvent.category || 'Academico',
    date: rawEvent.date || new Date().toISOString().slice(0, 10),
    location: rawEvent.location || 'Sin ubicación',
    capacity: Number(rawEvent.capacity ?? 0),
    price: Number(rawEvent.price ?? 0),
    description: rawEvent.description || '',
    registrations: Array.isArray(rawEvent.registrations) ? rawEvent.registrations : []
  };

  return {
    ...safeEvent,
    id: Number(safeEvent.id ?? Date.now())
  };
}

export async function loginUser(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (isFirebaseReady && auth) {
    try {
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const profileSnapshot = await getDoc(doc(db, 'users', credential.user.uid));
      const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};

      if (profile.active === false) {
        await signOut(auth);
        throw new Error('Esta cuenta está inactiva. Contacta al administrador.');
      }

      return {
        user: {
          uid: credential.user.uid,
          name: profile.name || credential.user.displayName || normalizedEmail.split('@')[0],
          email: credential.user.email,
          contactEmail: profile.contactEmail || credential.user.email,
          phone: profile.phone || '',
          role: profile.role || 'estudiante'
        },
        token: credential.user.accessToken
      };
    } catch (error) {
      throw new Error(error?.message || 'No se pudo iniciar sesión');
    }
  }

  const users = readStorage(USERS_KEY, []);
  const user = users.find((entry) => entry.email.toLowerCase() === normalizedEmail);

  if (!user || user.password !== String(password)) {
    throw new Error('Credenciales inválidas');
  }

  const { password: _, ...safeUser } = user;
  return {
    user: {
      ...safeUser,
      name: safeUser.name || normalizedEmail.split('@')[0],
      email: safeUser.email
    },
    token: `demo-${safeUser.email}`
  };
}

export async function resetPassword(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!isFirebaseReady || !auth) {
    throw new Error('Firebase no está configurado.');
  }

  try {
    await sendPasswordResetEmail(auth, normalizedEmail);
  } catch (error) {
    throw new Error(error?.message || 'No se pudo enviar el correo de recuperación');
  }
}

export async function logoutUser() {
  if (isFirebaseReady && auth) {
    await signOut(auth);
  }
}

export async function updateUserProfile(uid, profile) {
  const safeName = String(profile?.name || '').trim();
  const contactEmail = String(profile?.contactEmail || '').trim().toLowerCase();
  const phone = String(profile?.phone || '').trim();
  if (!safeName) throw new Error('El nombre es obligatorio.');
  if (safeName.length > 80) throw new Error('El nombre no puede superar 80 caracteres.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail) || contactEmail.length > 254) {
    throw new Error('Escribe un correo de contacto válido.');
  }
  if (!phone || phone.length > 25) {
    throw new Error('El teléfono es obligatorio y no puede superar 25 caracteres.');
  }
  const savedProfile = { name: safeName, contactEmail, phone };

  if (isFirebaseReady && db) {
    if (!auth?.currentUser || auth.currentUser.uid !== uid) {
      throw new Error('Tu sesión no coincide con el perfil que intentas editar.');
    }

    await updateDoc(doc(db, 'users', uid), savedProfile);
    return savedProfile;
  }

  const users = readStorage(USERS_KEY, []);
  const userIndex = users.findIndex((entry) => entry.uid === uid);
  if (userIndex === -1) {
    throw new Error('No se encontró el perfil local para actualizar.');
  }

  users[userIndex] = { ...users[userIndex], ...savedProfile };
  writeStorage(USERS_KEY, users);
  return savedProfile;
}

export async function fetchUserProfile(uid) {
  if (!uid) throw new Error('No se encontró el usuario de la sesión.');

  if (isFirebaseReady && db) {
    if (!auth?.currentUser || auth.currentUser.uid !== uid) {
      throw new Error('Tu sesión no coincide con el perfil que intentas consultar.');
    }

    const snapshot = await getDoc(doc(db, 'users', uid));
    if (!snapshot.exists()) throw new Error('No se encontró tu perfil en Firebase.');
    const profile = snapshot.data();
    return {
      name: profile.name || '',
      contactEmail: profile.contactEmail || '',
      phone: profile.phone || ''
    };
  }

  const profile = readStorage(USERS_KEY, []).find((entry) => entry.uid === uid);
  if (!profile) throw new Error('No se encontró el perfil local para consultar.');
  return {
    name: profile.name || '',
    contactEmail: profile.contactEmail || '',
    phone: profile.phone || ''
  };
}

export async function registerUser(name, email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const safeName = String(name || '').trim();

  if (isFirebaseReady && auth && db) {
    let credential;
    try {
      credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const profile = {
        uid: credential.user.uid,
        name: safeName,
        email: normalizedEmail,
        role: 'estudiante',
        active: true,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', credential.user.uid), profile);

      return {
        user: {
          uid: profile.uid,
          name: profile.name,
          email: profile.email,
          role: profile.role
        },
        token: credential.user.accessToken
      };
    } catch (error) {
      if (credential) {
        try {
          await deleteUser(credential.user);
        } catch (cleanupError) {
          console.error('No se pudo limpiar la cuenta incompleta de Firebase:', cleanupError);
          await signOut(auth);
          throw new Error(
            `${error?.message || 'No se pudo guardar el perfil.'} La cuenta de autenticación quedó creada sin perfil; un administrador debe eliminarla en Firebase Authentication para permitir otro intento.`
          );
        }
      }
      throw new Error(error?.message || 'No se pudo crear la cuenta');
    }
  }

  const users = readStorage(USERS_KEY, []);
  if (users.some((entry) => entry.email.toLowerCase() === normalizedEmail)) {
    throw new Error('Ya existe un usuario con este correo');
  }

  const newUser = {
    uid: `demo-${Date.now()}`,
    name: safeName || normalizedEmail.split('@')[0],
    email: normalizedEmail,
    password: String(password),
    role: 'student',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeStorage(USERS_KEY, users);

  return {
    user: {
      uid: newUser.uid,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    },
    token: `demo-${newUser.email}`
  };
}

export async function fetchEvents() {
  if (isFirebaseReady && db) {
    const snapshot = await getDocs(collection(db, 'events'));
    return snapshot.docs.map((eventDoc) => {
      const rawEvent = eventDoc.data();
      return {
        ...rawEvent,
        id: Number(rawEvent.id ?? eventDoc.id),
        capacity: Number(rawEvent.capacity ?? 0),
        price: Number(rawEvent.price ?? 0),
        registrations: Array.isArray(rawEvent.registrations) ? rawEvent.registrations : []
      };
    });
  }

  return getLocalEvents();
}

export async function fetchUserRegistrationDetails(emails) {
  const normalizedEmails = [...new Set(
    emails.map((email) => String(email || '').trim().toLowerCase()).filter(Boolean)
  )];

  if (normalizedEmails.length === 0) return {};

  if (isFirebaseReady && db) {
    const detailsByEmail = {};
    for (let index = 0; index < normalizedEmails.length; index += 30) {
      const emailBatch = normalizedEmails.slice(index, index + 30);
      const usersQuery = query(collection(db, 'users'), where('email', 'in', emailBatch));
      const snapshot = await getDocs(usersQuery);
      snapshot.docs.forEach((userDoc) => {
        const user = userDoc.data();
        if (user.email) {
          detailsByEmail[String(user.email).toLowerCase()] = {
            name: user.name || '',
            phone: user.phone || '',
            contactEmail: user.contactEmail || user.email
          };
        }
      });
    }
    return detailsByEmail;
  }

  const users = readStorage(USERS_KEY, []);
  return users.reduce((detailsByEmail, user) => {
    const email = String(user.email || '').toLowerCase();
    if (normalizedEmails.includes(email)) {
      detailsByEmail[email] = {
        name: user.name || '',
        phone: user.phone || '',
        contactEmail: user.contactEmail || user.email
      };
    }
    return detailsByEmail;
  }, {});
}

export async function fetchManagedUsers() {
  if (!isFirebaseReady || !functions) {
    throw new Error('Firebase no está configurado.');
  }

  const result = await httpsCallable(functions, 'listManagedUsers')();
  return result.data.users;
}

export async function createManagedUser({ name, email, role }) {
  const safeName = String(name || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const allowedRoles = ['estudiante', 'administrador'];

  if (!safeName) throw new Error('El nombre completo es obligatorio.');
  if (!/^[^@\s]+@unadeca\.net$/i.test(normalizedEmail)) {
    throw new Error('El correo debe terminar en @unadeca.net.');
  }
  if (!allowedRoles.includes(role)) throw new Error('El rol seleccionado no es válido.');
  if (!isFirebaseReady || !functions) {
    throw new Error('Firebase no está configurado.');
  }

  try {
    const result = await httpsCallable(functions, 'createManagedUser')({
      name: safeName,
      email: normalizedEmail,
      role
    });
    return result.data.user;
  } catch (error) {
    if (error?.code === 'functions/already-exists') {
      throw new Error('Ya existe una cuenta con ese correo.');
    }
    throw new Error(error?.message || 'No se pudo crear la cuenta.');
  }
}

export async function sendManagedUserPasswordReset(email) {
  if (!isFirebaseReady || !auth) {
    throw new Error('Firebase no está configurado.');
  }

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(error?.message || 'No se pudo enviar el correo para definir la contraseña.');
  }
}

export async function createEvent(event) {
  const normalizedEvent = asEventDocument(event);

  if (isFirebaseReady && db) {
    await setDoc(doc(db, 'events', String(normalizedEvent.id)), normalizedEvent);
    return normalizedEvent;
  }

  const existingEvents = getLocalEvents();
  const nextEvents = [normalizedEvent, ...existingEvents.filter((entry) => entry.id !== normalizedEvent.id)];
  writeStorage(EVENTS_KEY, nextEvents);
  return normalizedEvent;
}

export async function updateEvent(id, event) {
  const normalizedEvent = asEventDocument({ ...event, id });

  if (isFirebaseReady && db) {
    await updateDoc(doc(db, 'events', String(id)), normalizedEvent);
    return normalizedEvent;
  }

  const existingEvents = getLocalEvents();
  const nextEvents = existingEvents.map((entry) => (entry.id === Number(id) ? normalizedEvent : entry));
  writeStorage(EVENTS_KEY, nextEvents);
  return normalizedEvent;
}

export async function deleteEventRequest(id) {
  if (isFirebaseReady && db) {
    await deleteDoc(doc(db, 'events', String(id)));
    return true;
  }

  const existingEvents = getLocalEvents();
  const nextEvents = existingEvents.filter((entry) => entry.id !== Number(id));
  writeStorage(EVENTS_KEY, nextEvents);
  return true;
}

export async function saveAttendance(eventId, attendance) {
  if (!isFirebaseReady || !db) {
    throw new Error('Firebase no está configurado.');
  }

  await updateDoc(doc(db, 'events', String(eventId)), { attendance });
}

export async function registerEvent(id, registration) {
  const eventId = Number(id);
  const details = {
    name: String(registration?.name || '').trim(),
    email: String(registration?.authEmail || '').trim(),
    contactEmail: String(registration?.email || '').trim().toLowerCase(),
    phone: String(registration?.phone || '').trim(),
    uid: String(registration?.uid || '').trim()
  };
  const email = details.email;
  const normalizedEmail = email.toLowerCase();
  if (!details.name || !email || !details.contactEmail || !details.phone || !details.uid) {
    throw new Error('Completa tu nombre, correo de contacto y teléfono para inscribirte.');
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(details.contactEmail)) {
    throw new Error('Escribe un correo de contacto válido.');
  }
  if (details.name.length > 80 || details.phone.length > 25 || details.contactEmail.length > 254) {
    throw new Error('Revisa la longitud del nombre, correo de contacto y teléfono.');
  }

  if (isFirebaseReady && db) {
    const eventRef = doc(db, 'events', String(eventId));
    const userRef = doc(db, 'users', details.uid);
    return runTransaction(db, async (transaction) => {
      const currentEvent = await transaction.get(eventRef);
      if (!currentEvent.exists()) throw new Error('Evento no encontrado');
      const currentUser = await transaction.get(userRef);
      if (!currentUser.exists()) throw new Error('No se encontró el perfil del estudiante.');

      const data = currentEvent.data();
      const registrations = Array.isArray(data.registrations) ? data.registrations : [];
      const currentCapacity = Number(data.capacity ?? 0);

      if (registrations.some((registeredEmail) => String(registeredEmail).toLowerCase() === normalizedEmail)) {
        return {
          success: true,
          alreadyRegistered: true,
          capacity: currentCapacity,
          registrations
        };
      }

      if (currentCapacity <= 0) throw new Error('No hay cupos disponibles');

      const nextRegistrations = [...registrations, email];
      const nextCapacity = currentCapacity - 1;
      transaction.update(eventRef, {
        registrations: nextRegistrations,
        capacity: nextCapacity
      });
      transaction.update(userRef, {
        name: details.name,
        phone: details.phone,
        contactEmail: details.contactEmail
      });

      return {
        success: true,
        alreadyRegistered: false,
        capacity: nextCapacity,
        registrations: nextRegistrations
      };
    });
  }

  const events = getLocalEvents();
  const currentEvent = events.find((event) => event.id === eventId);
  if (!currentEvent) throw new Error('Evento no encontrado');

  const registrations = Array.isArray(currentEvent.registrations) ? currentEvent.registrations : [];
  if (registrations.some((registeredEmail) => String(registeredEmail).toLowerCase() === normalizedEmail)) {
    return {
      success: true,
      alreadyRegistered: true,
      capacity: Number(currentEvent.capacity),
      registrations
    };
  }
  if (Number(currentEvent.capacity) <= 0) throw new Error('No hay cupos disponibles');

  const nextEvent = {
    ...currentEvent,
    capacity: Number(currentEvent.capacity) - 1,
    registrations: [...registrations, email]
  };
  const nextEvents = events.map((event) => (event.id === eventId ? nextEvent : event));

  writeStorage(EVENTS_KEY, nextEvents);
  const users = readStorage(USERS_KEY, []);
  writeStorage(USERS_KEY, users.map((user) => (
    String(user.email || '').toLowerCase() === normalizedEmail
      ? { ...user, name: details.name, phone: details.phone, contactEmail: details.contactEmail }
      : user
  )));
  return {
    success: true,
    alreadyRegistered: false,
    capacity: nextEvent.capacity,
    registrations: nextEvent.registrations
  };
}
