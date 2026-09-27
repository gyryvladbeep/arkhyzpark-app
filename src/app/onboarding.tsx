// Первый запуск. Задача онбординга — за 3 экрана объяснить ценность и собрать минимум данных.
// Разрешения здесь НЕ запрашиваем: их спрашиваем в момент, когда они нужны (на экране трекера),
// так пользователь понимает зачем, и соглашается чаще.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AchievementBadge, Button, Icon, Ridge, Row, Screen, T, usePalette } from '@/components/ui';
import { useStore, type Sport } from '@/logic/store';
import { base, radius, space } from '@/theme/theme';

const sportsList: { id: Sport; label: string; icon: string }[] = [
  { id: 'ski', label: 'Горные лыжи', icon: 'snow' },
  { id: 'snowboard', label: 'Сноуборд', icon: 'snow-outline' },
  { id: 'hiking', label: 'Походы и экскурсии', icon: 'walk' },
];

export default function Onboarding() {
  const { completeOnboarding, userName } = useStore();
  const pal = usePalette();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(userName === 'Влад' ? '' : userName);
  const [sports, setSports] = useState<Sport[]>([]);

  const finish = () => {
    completeOnboarding(name, sports);
    router.replace('/');
  };

  const toggle = (s: Sport) => setSports((arr) => (arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]));

  return (
    <View style={{ flex: 1, backgroundColor: base.bg }}>
      <Ridge height={260} />
      <Screen bottomPad={40}>
        <Row style={{ justifyContent: 'space-between', marginTop: space.s }}>
          <T v="small" color={pal.accentText} style={{ fontWeight: '800', letterSpacing: 2 }}>АРХЫЗПАРК</T>
          {step < 2 ? (
            <Pressable onPress={finish} hitSlop={10} accessibilityRole="button" accessibilityLabel="Пропустить знакомство">
              <T v="small" color={base.textDim}>Пропустить</T>
            </Pressable>
          ) : null}
        </Row>

        <Row gap={6} style={{ marginTop: space.l }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? pal.accent : base.surface3 }} />
          ))}
        </Row>

        {step === 0 ? (
          <View style={{ marginTop: 120 }}>
            <Row gap={space.s}>
              <AchievementBadge icon="speedometer" tier="bronze" size={56} />
              <AchievementBadge icon="trending-down" tier="silver" size={56} />
              <AchievementBadge icon="water" tier="gold" size={56} />
              <AchievementBadge icon="snow" tier="legend" size={56} />
            </Row>
            <T v="h1" style={{ marginTop: space.xl }}>Горы, которые остаются с вами</T>
            <T color={base.textDim} style={{ marginTop: space.m, fontSize: 16, lineHeight: 23 }}>
              Приложение само записывает катание и походы и собирает из них дневник. За реальные результаты — трассы, скорость, пройденные маршруты — вы получаете награды и призы.
            </T>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={{ marginTop: 120 }}>
            <T v="h1">Как вас зовут?</T>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Имя"
              placeholderTextColor={base.textMute}
              autoFocus
              maxLength={30}
              accessibilityLabel="Имя"
              style={{ marginTop: space.l, backgroundColor: base.surface, borderWidth: 1, borderColor: base.border, borderRadius: radius.m, color: base.text, fontSize: 18, paddingHorizontal: space.l, height: 54 }}
            />
            <T v="h3" style={{ marginTop: space.xl }}>Чем занимаетесь в горах?</T>
            <View style={{ gap: space.s, marginTop: space.m }}>
              {sportsList.map((s) => {
                const on = sports.includes(s.id);
                return (
                  <Pressable key={s.id} onPress={() => toggle(s.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, padding: space.l, borderRadius: radius.m, borderWidth: 1.5, borderColor: on ? pal.accent : base.border, backgroundColor: on ? pal.accentSoft : base.surface }}>
                    <Icon name={s.icon} size={22} color={on ? pal.accentText : base.textDim} />
                    <T style={{ fontWeight: '700', flex: 1 }}>{s.label}</T>
                    {on ? <Icon name="checkmark-circle" size={20} color={pal.accentText} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={{ marginTop: 120, gap: space.l }}>
            <T v="h1">Ваши данные под вашим контролем</T>
            {[
              ['lock-closed-outline', 'Записи приватны', 'Треки и дневник видите только вы, пока сами не опубликуете запись.'],
              ['eye-off-outline', 'Дом не на карте', 'В опубликованных треках первые и последние 200 м скрыты.'],
              ['navigate-outline', 'Геопозиция по запросу', 'Спросим доступ, только когда вы впервые запустите трекер.'],
              ['happy-outline', 'Дети без публичности', 'Профили детей не попадают в ленту и чаты.'],
            ].map(([icon, title, text]) => (
              <Row key={title} gap={space.m} style={{ alignItems: 'flex-start' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: pal.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={icon} size={20} color={pal.accentText} />
                </View>
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: '700' }}>{title}</T>
                  <T v="small" color={base.textDim}>{text}</T>
                </View>
              </Row>
            ))}
          </View>
        ) : null}

        <View style={{ marginTop: space.xxl }}>
          {step < 2 ? (
            <Button title="Дальше" onPress={() => setStep(step + 1)} disabled={step === 1 && !name.trim()} style={{ height: 56 }} />
          ) : (
            <Button title="Начать" onPress={finish} style={{ height: 56 }} />
          )}
          {step > 0 ? <Button title="Назад" kind="ghost" onPress={() => setStep(step - 1)} style={{ marginTop: space.s }} /> : null}
        </View>
      </Screen>
    </View>
  );
}
