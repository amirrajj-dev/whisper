import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          <BottomSheetModalProvider>
            {children}
          </BottomSheetModalProvider>
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
