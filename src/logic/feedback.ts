// Тактильный отклик (вибрация) и «Поделиться».
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { Platform, Share } from 'react-native';

const native = Platform.OS !== 'web';

// Вибрация — приятное дополнение. Если устройство её не поддерживает, просто молчим.
export const hapticSuccess = () => { if (native) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); };
export const hapticTap = () => { if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); };

// Deep link — ссылка, которая открывает конкретный экран приложения.
// createURL сам подставляет правильную схему: exp://… в Expo Go, arkhyzpark://… в полной сборке.
export const deepLink = (path: string) => Linking.createURL(path);

export async function shareText(message: string): Promise<'shared' | 'dismissed' | 'unsupported'> {
  try {
    const r = await Share.share({ message });
    return r.action === Share.dismissedAction ? 'dismissed' : 'shared';
  } catch {
    return 'unsupported'; // в части браузеров системного окна «Поделиться» нет
  }
}
