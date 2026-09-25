import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { AchievementBadge, BackHeader, Button, Card, Icon, ProgressBar, Row, Screen, Section, T, usePalette } from '@/components/ui';
import { achievementById, categoryName, cosmeticById } from '@/data/achievements';
import { fmtNum, progressOf } from '@/logic/stats';
import { useStore } from '@/logic/store';
import { base, space, tierColors } from '@/theme/theme';

const verificationText = {
  auto: { icon: 'hardware-chip-outline', title: 'Засчитывается автоматически', text: 'Сервер проверяет трек: правдоподобность скорости, высоты и геометрии. Треки из файлов не засчитываются.' },
  instructor: { icon: 'school-outline', title: 'Подтверждает инструктор', text: 'Инструктор отмечает навык или занятие в своём режиме приложения после проверки на склоне.' },
  guide: { icon: 'flag-outline', title: 'Подтверждает гид', text: 'Гид подтверждает прохождение маршрута группой. Трек сверяется с маршрутом.' },
};

const kindSingle = { frame: 'Рамка', title: 'Титул', nameColor: 'Цвет имени', theme: 'Тема профиля', badge: 'Бейдж' };

export default function AchievementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { metrics, equipped, equip } = useStore();
  const pal = usePalette();
  const a = achievementById(id);
  const p = progressOf(a, metrics);
  const hidden = a.secret && !p.reached.length;
  const v = verificationText[a.verification];
  const onShowcase = equipped.showcase.includes(a.id);

  return (
    <Screen bottomPad={40}>
      <BackHeader title={categoryName[a.category]} />
      <View style={{ alignItems: 'center' }}>
        <AchievementBadge icon={a.icon} tier={p.current} locked={!p.current} size={120} />
        <T v="h1" style={{ marginTop: space.l, textAlign: 'center' }}>{hidden ? 'Секретное достижение' : a.title}</T>
        <T color={base.textDim} style={{ textAlign: 'center', marginTop: 6 }}>
          {hidden ? 'Условие откроется, когда вы его выполните.' : a.description}
        </T>
        {p.current ? (
          <T style={{ marginTop: space.s, fontWeight: '800' }} color={tierColors[p.current].main}>{tierColors[p.current].label}</T>
        ) : null}
      </View>

      {p.next && !hidden ? (
        <Card style={{ marginTop: space.xl }}>
          <Row style={{ justifyContent: 'space-between', marginBottom: space.s }}>
            <T v="small" color={base.textDim}>До ступени «{tierColors[p.next.tier].label}»</T>
            <T v="small" style={{ fontWeight: '700' }}>{fmtNum(p.value)} / {fmtNum(p.next.goal)} {a.unit ?? ''}</T>
          </Row>
          <ProgressBar ratio={p.ratio} color={tierColors[p.next.tier].main} height={8} />
        </Card>
      ) : null}

      <Section title="Ступени и награды">
        <View style={{ gap: space.s }}>
          {a.tiers.map((t) => {
            const got = p.reached.includes(t);
            const c = t.cosmeticId ? cosmeticById(t.cosmeticId) : null;
            return (
              <Card key={t.tier} accent={got ? tierColors[t.tier].main : undefined} style={{ flexDirection: 'row', gap: space.m, alignItems: 'center', opacity: got ? 1 : 0.75 }}>
                <AchievementBadge icon={a.icon} tier={t.tier} locked={!got} size={44} />
                <View style={{ flex: 1 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <T style={{ fontWeight: '700' }} color={tierColors[t.tier].main}>{tierColors[t.tier].label}</T>
                    <T v="small" color={base.textDim}>{hidden ? '???' : `${fmtNum(t.goal)} ${a.unit ?? ''}`}</T>
                  </Row>
                  {c ? <T v="small" color={base.textDim}>{kindSingle[c.kind]}: {c.name}</T> : null}
                  {t.prize ? (
                    <Row gap={4} style={{ marginTop: 2 }}>
                      <Icon name="gift-outline" size={14} color={base.warning} />
                      <T v="small" color={base.warning}>{t.prize}</T>
                    </Row>
                  ) : null}
                  {!c && !t.prize ? <T v="small" color={base.textMute}>Значок в профиль и очки статуса</T> : null}
                </View>
                {got ? <Icon name="checkmark-circle" size={20} color={base.green} /> : null}
              </Card>
            );
          })}
        </View>
      </Section>

      <Section title="Как засчитывается">
        <Card style={{ flexDirection: 'row', gap: space.m }}>
          <Icon name={v.icon} size={22} color={pal.accentText} />
          <View style={{ flex: 1 }}>
            <T style={{ fontWeight: '700' }}>{v.title}</T>
            <T v="small" color={base.textDim} style={{ marginTop: 2 }}>{v.text}</T>
          </View>
        </Card>
        {a.partner ? (
          <Card style={{ flexDirection: 'row', gap: space.m, marginTop: space.s }}>
            <Icon name="business-outline" size={22} color={base.warning} />
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: '700' }}>Партнёрская награда</T>
              <T v="small" color={base.textDim} style={{ marginTop: 2 }}>Приз предоставляет партнёр программы. В прототипе партнёр условный.</T>
            </View>
          </Card>
        ) : null}
      </Section>

      {p.current ? (
        <Button
          title={onShowcase ? 'Уже на витрине профиля' : 'Поставить на витрину'}
          icon="star"
          kind={onShowcase ? 'ghost' : 'primary'}
          disabled={onShowcase}
          onPress={() => equip({ showcase: [a.id, ...equipped.showcase.filter((x) => x !== a.id)].slice(0, 3) })}
          style={{ marginTop: space.xl }}
        />
      ) : null}
    </Screen>
  );
}
