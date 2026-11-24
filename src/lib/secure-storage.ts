import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Storage for the Supabase auth session.
 * - iOS/Android: Keychain / Keystore via expo-secure-store. Sessions can exceed the ~2 KB value
 *   size some iOS versions accept, so values are split across numbered chunks.
 * - Web: localStorage (the browser has no secure enclave available to JavaScript).
 */
export interface AuthStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const CHUNK_SIZE = 1800;

/** SecureStore keys may only contain alphanumerics, ".", "-" and "_". */
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');
const countKey = (key: string) => `${key}__count`;
const chunkKey = (key: string, i: number) => `${key}__${i}`;

async function removeChunks(key: string): Promise<void> {
  const count = await SecureStore.getItemAsync(countKey(key));
  if (count === null) return;
  const n = Number(count) || 0;
  for (let i = 0; i < n; i++) await SecureStore.deleteItemAsync(chunkKey(key, i));
  await SecureStore.deleteItemAsync(countKey(key));
}

export const chunkedSecureStorage: AuthStorage = {
  async getItem(rawKey) {
    const key = safeKey(rawKey);
    const count = await SecureStore.getItemAsync(countKey(key));
    if (count === null) return null;
    const parts: string[] = [];
    for (let i = 0; i < (Number(count) || 0); i++) {
      const part = await SecureStore.getItemAsync(chunkKey(key, i));
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  },
  async setItem(rawKey, value) {
    const key = safeKey(rawKey);
    await removeChunks(key);
    const n = Math.max(1, Math.ceil(value.length / CHUNK_SIZE));
    for (let i = 0; i < n; i++) {
      await SecureStore.setItemAsync(chunkKey(key, i), value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(countKey(key), String(n));
  },
  async removeItem(rawKey) {
    await removeChunks(safeKey(rawKey));
  },
};

const hasWindow = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const webLocalStorage: AuthStorage = {
  async getItem(key) {
    return hasWindow() ? window.localStorage.getItem(key) : null;
  },
  async setItem(key, value) {
    if (hasWindow()) window.localStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (hasWindow()) window.localStorage.removeItem(key);
  },
};

export const authStorage: AuthStorage = Platform.OS === 'web' ? webLocalStorage : chunkedSecureStorage;
