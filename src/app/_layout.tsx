import { DarkTheme, router, Stack, ThemeProvider, useSegments, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Row, T } from '@/components/ui';
import { useOnline } from '@/logic/network';
import { onNotificationTap } from '@/logic/notify';
import { StoreProvider, useStore } from '@/logic/store';
// Импорт регистрирует фоновую задачу геолокации до запуска интерфейса
import '@/logic/tracker';
import { base, space } from '@/theme/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: base.bg, card: base.bg, border: base.border, text: base.text },
};

// Плашка «нет сети» поверх всех экранов
function OfflineBanner() {
  const { online, simulated } = useOnline();
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', bottom: Math.max(insets.bottom, 10) + 78, left: 0, right: 0, alignItems: 'center' }}>
      <Row gap={6} style={{ backgroundColor: 'rgba(242,184,75,0.95)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 }}>
        <Icon name="cloud-offline" size={14} color="#2A1D00" />
        <T v="small" color="#2A1D00" style={{ fontWeight: '700' }}>
          {simulated ? 'Имитация офлайна' : 'Нет сети'} · заявки уйдут позже
        </T>
      </Row>
    </View>
  );
}

function Root() {
  const { hydrated, onboarded } = useStore();
  const segments = useSegments();

  // Заставку убираем только после загрузки сохранённых данных, иначе мелькнёт демо-набор
  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  // Первый запуск — показываем знакомство
  useEffect(() => {
    if (hydrated && !onboarded && segments[0] !== 'onboarding') router.replace('/onboarding');
  }, [hydrated, onboarded, segments]);

  // Нажатие на уведомление открывает нужный экран
  useEffect(() => onNotificationTap((url) => router.push(url as never)), []);

  if (!hydrated) return null;
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: base.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack>
      <OfflineBanner />
    </>
  );
}

// Если любой экран упал с ошибкой, пользователь увидит этот экран, а не белый экран или вылет.
// В полной версии здесь же ошибка отправляется в сервис мониторинга (Sentry, Crashlytics).
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, backgroundColor: base.bg, justifyContent: 'center', padding: space.xl }}>
      <Icon name="warning-outline" size={44} color={base.warning} />
      <T v="h2" style={{ marginTop: space.l }}>Что-то пошло не так</T>
      <T color={base.textDim} style={{ marginTop: space.s }}>
        Ваши записи сохранены на телефоне. Попробуйте открыть экран ещё раз.
      </T>
      <View style={{ marginTop: space.l, padding: space.m, borderRadius: 12, backgroundColor: base.surface, borderWidth: 1, borderColor: base.border }}>
        <T v="small" color={base.textMute} style={{ fontFamily: 'monospace' }}>{error.name}: {error.message}</T>
      </View>
      {/* Здесь нельзя использовать компоненты, зависящие от хранилища: ошибка могла случиться в нём самом */}
      <Pressable onPress={retry} style={{ marginTop: space.xl, height: 50, borderRadius: 14, backgroundColor: base.blue, alignItems: 'center', justifyContent: 'center' }}>
        <T style={{ fontWeight: '700' }}>Попробовать снова</T>
      </Pressable>
      <Pressable onPress={() => { retry(); router.replace('/'); }} style={{ marginTop: space.s, height: 50, borderRadius: 14, borderWidth: 1, borderColor: base.border, alignItems: 'center', justifyContent: 'center' }}>
        <T style={{ fontWeight: '700' }}>На главную</T>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ThemeProvider value={theme}>
          <StatusBar style="light" />
          <Root />
        </ThemeProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
