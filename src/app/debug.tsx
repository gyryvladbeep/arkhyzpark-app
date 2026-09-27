// Экран для тестировщика. В релизной сборке такие экраны прячут (например, за 7 нажатиями на номер версии).
import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, Switch, View } from 'react-native';
import { router } from 'expo-router';

import { BackHeader, Button, Card, Chip, Row, Screen, Section, T, usePalette } from '@/components/ui';
import { clearServer, serverBookingsCount } from '@/logic/api';
import { getFailureRate, setFailureRate, setSimulateOffline, useOnline } from '@/logic/network';
import { notificationStatus, sendTest } from '@/logic/notify';
import { getLocationStatus, openSettings, type LocationStatus } from '@/logic/permissions';
import { storageInfo } from '@/logic/persist';
import { useStore } from '@/logic/store';
import { bufferSize, canUseBackground, isExpoGo } from '@/logic/tracker';
import { base, space } from '@/theme/theme';

const permText = { unknown: 'не спрашивали', granted: 'выдано', denied: 'отказ', blocked: 'запрещено в настройках' };

export default function DebugScreen() {
  const { resetAll, sessions, restartOnboarding, bookings } = useStore();
  const pal = usePalette();
  const net = useOnline();
  const [fail, setFail] = useState(getFailureRate());
  const [serverCount, setServerCount] = useState(0);
  const [crash, setCrash] = useState(false);
  if (crash) throw new Error('Тестовая ошибка с экрана «Для тестировщика»');
  const [loc, setLoc] = useState<LocationStatus | null>(null);
  const [notif, setNotif] = useState('…');
  const [store, setStore] = useState<{ bytes: number; savedAt: string | null; version: number } | null>(null);
  const [buffer, setBuffer] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const refresh = useCallback(() => {
    getLocationStatus().then(setLoc).catch(() => {});
    notificationStatus().then(setNotif);
    storageInfo().then(setStore);
    bufferSize().then(setBuffer).catch(() => {});
    serverBookingsCount().then(setServerCount).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') refresh(); });
    return () => sub.remove();
  }, [refresh]);

  const rows: [string, string][] = [
    ['Платформа', `${Platform.OS} ${Platform.Version ?? ''}`],
    ['Среда', Platform.OS === 'web' ? 'браузер' : isExpoGo ? 'Expo Go' : 'полная сборка'],
    ['Версия приложения', Constants.expoConfig?.version ?? '—'],
    ['Фоновая геолокация', canUseBackground ? 'поддерживается' : 'нет (Expo Go или браузер)'],
    ['Службы геолокации', loc ? (loc.servicesEnabled ? 'включены' : 'выключены') : '…'],
    ['Геопозиция: при использовании', loc ? permText[loc.foreground] : '…'],
    ['Геопозиция: всегда', loc ? permText[loc.background] : '…'],
    ['Точная геопозиция', loc ? (loc.precise ? 'да' : 'нет, приблизительная') : '…'],
    ['Уведомления', notif],
    ['Сеть (реальная)', net.real ? `есть${net.type ? `, ${String(net.type).toLowerCase()}` : ''}` : 'нет'],
    ['Заявок в очереди', String(bookings.filter((b) => b.status === 'В очереди').length)],
    ['Заявок получено «сервером»', String(serverCount)],
    ['Записей в дневнике', String(sessions.length)],
    ['Сохранено на устройстве', store ? `${(store.bytes / 1024).toFixed(1)} КБ, схема v${store.version}` : '…'],
    ['Последнее сохранение', store?.savedAt ? new Date(store.savedAt).toLocaleTimeString('ru-RU') : 'ещё не было'],
    ['Точек в буфере трекера', String(buffer)],
  ];

  return (
    <Screen bottomPad={40}>
      <BackHeader title="Для тестировщика" />
      <Card style={{ paddingVertical: space.s }}>
        {rows.map(([k, v]) => (
          <Row key={k} style={{ justifyContent: 'space-between', paddingVertical: 7 }}>
            <T v="small" color={base.textDim} style={{ flex: 1 }}>{k}</T>
            <T v="small" style={{ fontWeight: '700', textAlign: 'right', flexShrink: 1 }}>{v}</T>
          </Row>
        ))}
      </Card>
      <Button title="Обновить" icon="refresh" kind="ghost" onPress={refresh} style={{ marginTop: space.s }} />

      <Section title="Сеть">
        <Card style={{ gap: space.m }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: '700' }}>Имитация офлайна</T>
              <T v="small" color={base.textDim}>Как режим полёта, но только для приложения</T>
            </View>
            <Switch value={net.simulated} onValueChange={setSimulateOffline} trackColor={{ true: pal.accent, false: base.surface3 }} thumbColor="#fff" />
          </Row>
          <View>
            <T style={{ fontWeight: '700' }}>Сбои сервера</T>
            <T v="small" color={base.textDim}>Доля запросов, на которые «сервер» не ответит</T>
            <Row gap={space.s} style={{ marginTop: space.s }}>
              {[0, 0.5, 1].map((v) => (
                <Chip key={v} label={`${v * 100}%`} active={fail === v} onPress={() => { setFailureRate(v); setFail(v); }} />
              ))}
            </Row>
          </View>
        </Card>
        <T v="label" style={{ marginTop: space.s }}>
          Сценарий: включите офлайн, отправьте заявку, закройте приложение, откройте снова и выключите офлайн. Заявка должна уйти одна, без дубля.
        </T>
      </Section>

      <Section title="Уведомления">
        <View style={{ gap: space.s }}>
          <Button title="Показать сейчас" icon="notifications" kind="soft" onPress={async () => setMsg((await sendTest(0)) ? 'Отправлено. Приложение открыто — должен появиться баннер.' : 'Нет разрешения на уведомления.')} />
          <Button title="Через 10 секунд" icon="timer" kind="soft" onPress={async () => setMsg((await sendTest(10)) ? 'Сверните или закройте приложение и дождитесь уведомления. Нажатие откроет этот экран.' : 'Нет разрешения на уведомления.')} />
        </View>
      </Section>

      <Section title="Системные настройки">
        <Button title="Открыть настройки приложения" icon="settings" kind="ghost" onPress={openSettings} />
        <T v="label" style={{ marginTop: space.s }}>Заберите или выдайте разрешение и вернитесь: статусы обновятся сами.</T>
      </Section>

      <Section title="Сбои и первый запуск">
        <View style={{ gap: space.s }}>
          <Button title="Вызвать тестовую ошибку" icon="bug" kind="ghost" onPress={() => setCrash(true)} />
          <Button title="Показать знакомство заново" icon="sparkles" kind="ghost" onPress={() => { restartOnboarding(); router.replace('/onboarding'); }} />
        </View>
        <T v="label" style={{ marginTop: space.s }}>Ошибка должна показать экран «Что-то пошло не так», а не белый экран или вылет.</T>
      </Section>

      <Section title="Данные">
        {confirmReset ? (
          <Card accent={base.danger}>
            <T style={{ fontWeight: '700' }}>Сбросить все данные?</T>
            <T v="small" color={base.textDim} style={{ marginTop: 4 }}>Удалятся ваши записи, брони и настройки профиля. Вернутся демо-данные.</T>
            <Row gap={space.s} style={{ marginTop: space.m }}>
              <Button title="Сбросить" kind="danger" onPress={async () => { await resetAll(); await clearServer(); setConfirmReset(false); setMsg('Данные сброшены'); refresh(); }} style={{ flex: 1, height: 42 }} />
              <Button title="Отмена" kind="ghost" onPress={() => setConfirmReset(false)} style={{ flex: 1, height: 42 }} />
            </Row>
          </Card>
        ) : (
          <Button title="Сбросить к демо-данным" icon="trash" kind="ghost" onPress={() => setConfirmReset(true)} />
        )}
      </Section>

      {msg ? (
        <Card style={{ marginTop: space.l }}>
          <T v="small">{msg}</T>
        </Card>
      ) : null}
    </Screen>
  );
}
