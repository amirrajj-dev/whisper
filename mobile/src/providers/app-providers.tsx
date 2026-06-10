import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
