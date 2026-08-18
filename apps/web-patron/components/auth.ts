'use client';

// Autenticación del cliente (ADR-0006).
//  - Con NEXT_PUBLIC_FIREBASE_API_KEY: Google/Apple vía Firebase (ID token real).
//  - Sin ella: login DEV (token base64url sin firmar) para desarrollo.
// El token se guarda en localStorage y se manda como Bearer al API.

const FB = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigurado = Boolean(FB.apiKey);

const KEY = 'casana_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(KEY);
}

function setToken(t: string) {
  window.localStorage.setItem(KEY, t);
}

export function logout() {
  window.localStorage.removeItem(KEY);
}

function base64url(obj: unknown): string {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Login de desarrollo: arma un token dev que el API acepta en modo dev. */
export function loginDev(email: string, nombre?: string) {
  setToken(base64url({ uid: `dev-${email}`, email, nombre: nombre || email }));
}

async function firebaseAuth() {
  const { initializeApp, getApps } = await import('firebase/app');
  const authMod = await import('firebase/auth');
  const app = getApps().length ? getApps()[0] : initializeApp(FB);
  return { auth: authMod.getAuth(app), authMod };
}

export async function loginGoogle() {
  const { auth, authMod } = await firebaseAuth();
  const cred = await authMod.signInWithPopup(auth, new authMod.GoogleAuthProvider());
  setToken(await cred.user.getIdToken());
}

export async function loginApple() {
  const { auth, authMod } = await firebaseAuth();
  const provider = new authMod.OAuthProvider('apple.com');
  const cred = await authMod.signInWithPopup(auth, provider);
  setToken(await cred.user.getIdToken());
}
