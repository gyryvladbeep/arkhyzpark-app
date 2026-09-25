import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ProfileHero } from '@/components/profile';
import { AchievementBadge, BackHeader, Icon, Row, Screen, Section, T, usePalette } from '@/components/ui';
import { achievements, cosmetics, kindName } from '@/data/achievements';
import type { Cosmetic } from '@/data/types';
import { progressOf } from '@/logic/stats';
import { useStore, type Equipped } from '@/logic/store';
import { base, radius, space } from '@/theme/theme';

const kinds: { kind: Cosmetic['kind']; key: keyof Equipped }[] = [
  { kind: 'frame', key: 'frame' },
  { kind: 'title', key: 'title' },
  { kind: 'nameColor', key: 'nameColor' },
  { kind: 'theme', key: 'theme' },
];

function sourceOf(id: string) {
  for (const a of achievements) for (const t of a.tiers) if (t.cosmeticId === id) return a.title;
  return null;
}

export default function WardrobeScreen() {
  const { owned, equipped, equip, metrics } = useStore();
  const pal = usePalette();
  const earned = achievements.filter((a) => progressOf(a, metrics).reached.length);
  return (
    <Screen bottomPad={40}>
      <BackHeader title="Оформление" />
      <ProfileHero />
      <T v="small" color={base.textDim} style={{ marginTop: space.m }}>
        Украшения открываются только за достижения. Их нельзя купить.
      </T>
      {kinds.map(({ kind, key }) => (
        <Section key={kind} title={kindName[kind]}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
            {cosmetics.filter((c) => c.kind === kind).map((c) => {
              const has = owned.has(c.id);
              const on = equipped[key] === c.id;
              const src = sourceOf(c.id);
              return (
                <Pressable key={c.id} disabled={!has} onPress={() => equip({ [key]: c.id } as Partial<Equipped>)}
                  style={{ width: '48%', flexGrow: 1, padding: space.m, borderRadius: radius.m, borderWidth: 1.5, borderColor: on ? pal.accent : base.border, backgroundColor: base.surface, opacity: has ? 1 : 0.5 }}>
                  <Row gap={space.s}>
                    <View style={{ width: 22, height: 22, borderRadius: kind === 'frame' ? 7 : 11, backgroundColor: c.color, borderWidth: c.color2 ? 3 : 0, borderColor: c.color2 }} />
                    <T style={{ fontWeight: '700', flex: 1 }} numberOfLines={1} color={kind === 'nameColor' || kind === 'title' ? c.color : base.text}>{c.name}</T>
                    {!has ? <Icon name="lock-closed" size={14} color={base.textMute} /> : on ? <Icon name="checkmark-circle" size={16} color={pal.accentText} /> : null}
                  </Row>
                  <T v="label" numberOfLines={1}>{has ? (on ? 'Надето' : 'Открыто') : src ? `За «${src}»` : 'Базовое'}</T>
                </Pressable>
              );
            })}
          </View>
        </Section>
      ))}
      <Section title="Витрина: выберите до 3 наград">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
          {earned.map((a) => {
            const p = progressOf(a, metrics);
            const on = equipped.showcase.includes(a.id);
            return (
              <Pressable key={a.id} onPress={() => equip({ showcase: on ? equipped.showcase.filter((x) => x !== a.id) : [...equipped.showcase, a.id].slice(-3) })}
                style={{ width: '31%', alignItems: 'center', padding: space.s, borderRadius: radius.m, borderWidth: 1.5, borderColor: on ? pal.accent : base.border, backgroundColor: base.surface, gap: 4 }}>
                <AchievementBadge icon={a.icon} tier={p.current} size={44} />
                <T v="label" style={{ textAlign: 'center' }} numberOfLines={2}>{a.title}</T>
              </Pressable>
            );
          })}
        </View>
      </Section>
      <Pressable onPress={() => router.push('/achievements')} style={{ marginTop: space.l, alignSelf: 'center' }}>
        <T v="small" color={pal.accentText} style={{ fontWeight: '700' }}>Как открыть больше украшений</T>
      </Pressable>
    </Screen>
  );
}
