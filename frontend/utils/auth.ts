import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { auth } from '@/utils/firebaseConfig';
import {
  GoogleAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

/* Google OAuth discovery document */
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint:         'https://oauth2.googleapis.com/token',
  revocationEndpoint:    'https://oauth2.googleapis.com/revoke',
};

/* ---------- Google sign-in ---------- */
export async function googleLogin() {
  const redirectUri = AuthSession.makeRedirectUri();           // Expo Go → proxy
  const request = new AuthSession.AuthRequest({
    clientId:
      Platform.OS === 'ios'
        ? '38602504569-el8gbbg5mm9qgqegsvdpibs4u0pv85nv.apps.googleusercontent.com'
        : 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
  });

  const result = await request.promptAsync(discovery);
  if (result.type !== 'success' || !result.params.id_token) {
    throw new Error('Google sign-in cancelled');
  }

  const credential = GoogleAuthProvider.credential(result.params.id_token);
  await signInWithCredential(auth, credential);
}

/* ---------- e-mail / password helpers ---------- */
export async function registerWithEmail(email: string, password: string) {
  await createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithEmail(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
}
