import Constants from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

let _mod: NotificationsModule | null | undefined = undefined;

function load(): NotificationsModule | null {
  if (_mod !== undefined) return _mod;

  const executionEnv = Constants.executionEnvironment;
  const isExpoGo = executionEnv === 'storeClient';
  if (isExpoGo && Platform.OS === 'android') {
    _mod = null;
    return null;
  }

  try {
    _mod = require('expo-notifications');
    return _mod;
  } catch {
    _mod = null;
    return null;
  }
}

export const Notifications = {
  setBadgeCountAsync: async (count: number): Promise<void> => {
    const mod = load();
    if (!mod) return;
    try { await mod.setBadgeCountAsync(count); } catch { /* best-effort */ }
  },

  setNotificationHandler: (handler: Parameters<NonNullable<NotificationsModule['setNotificationHandler']>>[0]): void => {
    const mod = load();
    if (!mod) return;
    try { mod.setNotificationHandler(handler); } catch { /* best-effort */ }
  },

  setNotificationChannelAsync: async (channelId: string, channel: Parameters<NonNullable<NotificationsModule['setNotificationChannelAsync']>>[1]): Promise<any> => {
    const mod = load();
    if (!mod) return null;
    try { return await mod.setNotificationChannelAsync(channelId, channel); } catch { return null; }
  },

  getPermissionsAsync: async (): Promise<{ granted: boolean; status: string; ios?: Record<string, any> }> => {
    const mod = load();
    if (!mod) return { granted: false, status: 'undetermined' };
    try { return await mod.getPermissionsAsync(); } catch { return { granted: false, status: 'undetermined' }; }
  },

  requestPermissionsAsync: async (permissions?: any): Promise<{ granted: boolean; status: string }> => {
    const mod = load();
    if (!mod) return { granted: false, status: 'undetermined' };
    try { return await mod.requestPermissionsAsync(permissions); } catch { return { granted: false, status: 'undetermined' }; }
  },

  getExpoPushTokenAsync: async (options?: { projectId?: string }): Promise<{ data: string }> => {
    const mod = load();
    if (!mod) throw new Error('Push notifications not available in this environment');
    return await mod.getExpoPushTokenAsync(options);
  },

  getLastNotificationResponse: (): { notification: { request: { content: { data: Record<string, unknown> } } } } | null => {
    const mod = load();
    if (!mod) return null;
    try { return mod.getLastNotificationResponse(); } catch { return null; }
  },

  addNotificationResponseReceivedListener: (listener: (response: any) => void): { remove: () => void } => {
    const mod = load();
    if (!mod) return { remove: () => {} };
    try { return mod.addNotificationResponseReceivedListener(listener); } catch { return { remove: () => {} }; }
  },

  AndroidImportance: {
    HIGH: 6,
    DEFAULT: 5,
    MAX: 7,
    LOW: 4,
    MIN: 3,
    NONE: 2,
    UNSPECIFIED: 1,
    UNKNOWN: 0,
  },

  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
};
