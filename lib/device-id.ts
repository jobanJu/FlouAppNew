import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const KEY = 'flou_device_id_v1';

function randomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}-${Platform.OS}`;
}

export async function getDeviceId() {
  try {
    const existing = await AsyncStorage.getItem(KEY);
    if (existing) return existing;
    const id = randomId();
    await AsyncStorage.setItem(KEY, id);
    return id;
  } catch (e) {
    return randomId();
  }
}
