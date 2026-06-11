import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { pushApi } from '@/services/push.api';
import { useAuthStore } from '@/stores/auth.store';

const PUSH_TOKEN_KEY = 'whisper_push_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function getDeviceName(): Promise<string | undefined> {
  try {
    const deviceName = await Device.deviceName;
    return deviceName ?? undefined;
  } catch {
    return undefined;
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
    await Notifications.setNotificationChannelAsync('groups', {
      name: 'Group Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B5CF6',
    });
    await Notifications.setNotificationChannelAsync('system', {
      name: 'System Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 100, 100, 100],
      lightColor: '#6B7280',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined,
    });
    return tokenData.data;
  } catch {
    return null;
  }
}

export async function registerTokenWithBackend(): Promise<void> {
  try {
    const pushToken = await registerForPushNotifications();
    if (!pushToken) return;

    const storedToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY).catch(() => null);
    if (storedToken === pushToken) return;

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const deviceName = await getDeviceName();

    await pushApi.registerToken({
      token: pushToken,
      platform,
      deviceName,
    });

    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, pushToken).catch(() => {});
  } catch {
    // Silently fail — push registration is best-effort
  }
}

export async function unregisterPushToken(): Promise<void> {
  try {
    const storedToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY).catch(() => null);
    if (storedToken) {
      await pushApi.unregisterToken(storedToken).catch(() => {});
      await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY).catch(() => {});
    }
  } catch {
    // Best-effort cleanup
  }
}

function redirectToConversation(data: Record<string, unknown>): void {
  const conversationId = data?.conversationId as string | undefined;
  if (conversationId) {
    router.push(`/chat/${conversationId}`);
  }
}

export function useNotificationObserver(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data?.conversationId) {
        setTimeout(() => {
          redirectToConversation(data);
        }, 500);
      }
    }

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        redirectToConversation(data);
      },
    );

    return () => {
      responseSubscription.remove();
    };
  }, [isAuthenticated]);
}

export function usePushTokenRegistration(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || registeredRef.current) return;
    registeredRef.current = true;

    registerTokenWithBackend();
  }, [isAuthenticated]);
}
