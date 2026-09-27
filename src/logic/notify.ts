// Локальные уведомления: их создаёт само приложение, без сервера.
// Push-уведомления (с сервера) устроены так же для пользователя, но требуют бэкенд и полной сборки.
//
// Что важно для тестирования: уведомление ведёт себя по-разному, когда приложение
// открыто (foreground), свёрнуто (background) и полностью закрыто (killed).
// Нажатие должно открывать нужный экран: для этого в data лежит адрес экрана (url).
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const supported = Platform.OS !== 'web';

// Как показывать уведомление, если приложение сейчас открыто: без этого на iOS баннер не появится
if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (!supported) return 'unsupported';
  try {
    if (Platform.OS === 'android') {
      // На Android 8+ уведомление обязано принадлежать каналу. Пользователь может отключать каналы по отдельности.
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Награды и брони',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return 'granted';
    if (!current.canAskAgain) return 'denied';
    const res = await Notifications.requestPermissionsAsync();
    return res.granted ? 'granted' : 'denied';
  } catch {
    return 'unsupported';
  }
}

export async function notificationStatus(): Promise<string> {
  if (!supported) return 'не поддерживается в браузере';
  try {
    const s = await Notifications.getPermissionsAsync();
    if (s.granted) return 'разрешены';
    return s.canAskAgain ? 'не спрашивали или отказ' : 'запрещены в настройках';
  } catch {
    return 'недоступны';
  }
}

async function send(title: string, body: string, url: string, seconds = 0) {
  if ((await ensureNotificationPermission()) !== 'granted') return false;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { url } },
    trigger: seconds > 0 ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds } : null,
  });
  return true;
}

export function notifyAchievements(items: { title: string; tier: string; id: string }[]) {
  if (!items.length) return;
  const first = items[0];
  const more = items.length > 1 ? ` и ещё ${items.length - 1}` : '';
  return send('Новая награда', `«${first.title}», ${first.tier.toLowerCase()}${more}`, `/achievement/${first.id}`);
}

// Демо: напоминание о брони приходит через 15 секунд, чтобы успеть свернуть приложение и проверить
export function scheduleBookingReminder(instructor: string, when: string) {
  return send('Напоминание о занятии', `${when} — занятие с инструктором ${instructor}`, '/bookings', 15);
}

export function sendTest(seconds: number) {
  return send('Проверка уведомлений', seconds ? `Отправлено ${seconds} с назад` : 'Приложение открыто — баннер всё равно виден', '/debug', seconds);
}

// Подписка на нажатие по уведомлению. Вызывается один раз в корневом layout.
export function onNotificationTap(handler: (url: string) => void) {
  if (!supported) return () => {};
  // Приложение было закрыто, и его открыли нажатием на уведомление
  const last = Notifications.getLastNotificationResponse();
  const lastUrl = last?.notification.request.content.data?.url;
  if (typeof lastUrl === 'string') setTimeout(() => handler(lastUrl), 300);
  // Приложение было открыто или свёрнуто
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const url = r.notification.request.content.data?.url;
    if (typeof url === 'string') handler(url);
  });
  return () => sub.remove();
}
