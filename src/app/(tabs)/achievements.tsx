import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AchievementBadge, Card, Chip, ProgressBar, Row, Screen, SeasonToggle, Stat, T, usePalette } from '@/components/ui';
import { achievements, categoryName } from '@/data/achievements';
import type { Achievement } from '@/data/types';
import { fmtNum, progressOf } from '@/logic/stats';
import { useStore } from '@/logic/store';
import { base, space, tierColors } from '@/theme/theme';

type Filter = 'season' | 'all' | Achievement['category'];

export default function AchievementsScreen() {
  const { metrics, level, season } = useStore();
  const pal = usePalette();
  const [filter, setFilter] = useState<Filter>('season');

  const list = achievements.filter((a) => {
    if (filter === 'season') return a.season === season || a.season === 'all';
    if (filter === 'all') return true;
    return a.category === filter;
  });
  const sorted = [...list].sort((a, b) => {
    const pa = progressOf(a, metrics);
    const pb = progressOf(b, metrics);
    return (pb.reached.length ? 1 : 0) - (pa.reached.length ? 1 : 0) || pb.ratio - pa.ratio;
  });

  const cats = [...new Set(achievements.map((a) => a.category))];
  const R = 34;
  const C = 2 * Math.PI * R;

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', marginTop: space.s }}>
        <T v="h1">Награды</T>
        <SeasonToggle />
      </Row>

      <Card style={{ marginTop: space.l, flexDirection: 'row', gap: space.l, alignItems: 'center' }}>
        <View style={{ width: 84, height: 84, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={84} height={84} style={{ position: 'absolute' }}>
            <Circle cx={42} cy={42} r={R} stroke={base.surface3} strokeWidth={7} fill="none" />
            <Circle cx={42} cy={42} r={R} stroke={pal.accent} strokeWidth={7} fill="none" strokeDasharray={`${C * level.ratio} ${C}`} strokeLinecap="round" transform="rotate(-90 42 42)" />
          </Svg>
          <T v="num" style={{ fontSize: 28 }}>{level.level}</T>
        </View>
        <View style={{ flex: 1 }}>
          <T v="small" color={base.textDim} style={{ fontWeight: '600' }}>УРОВЕНЬ</T>
          <T v="h3">{level.name}</T>
          <T v="small" color={base.textDim} style={{ marginTop: 4 }}>
            До следующего уровня {fmtNum(level.toNext)} очков статуса
          </T>
          <Row gap={space.l} style={{ marginTop: space.s }}>
            <Stat label="ступеней открыто" value={`${level.unlocked}/${level.totalTiers}`} />
          </Row>
        </View>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: space.l, marginHorizontal: -space.l }} contentContainerStyle={{ gap: space.s, paddingHorizontal: space.l }}>
        <Chip label={season === 'winter' ? 'Зимние' : 'Летние'} active={filter === 'season'} onPress={() => setFilter('season')} />
        <Chip label="Все" active={filter === 'all'} onPress={() => setFilter('all')} />
        {cats.map((c) => (
          <Chip key={c} label={categoryName[c]} active={filter === c} onPress={() => setFilter(c)} />
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.m, marginTop: space.l }}>
        {sorted.map((a) => <Tile key={a.id} a={a} />)}
      </View>
    </Screen>
  );
}

function Tile({ a }: { a: Achievement }) {
  const { metrics } = useStore();
  const p = progressOf(a, metrics);
  const hidden = a.secret && !p.reached.length;
  const top = a.tiers[a.tiers.length - 1];
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/achievement/[id]', params: { id: a.id } })}
      style={({ pressed }) => [{ width: '47.5%', flexGrow: 1 }, pressed && { opacity: 0.8 }]}>
      <Card style={{ alignItems: 'center', padding: space.m, gap: 6, minHeight: 190 }}>
        <AchievementBadge icon={a.icon} tier={p.current} locked={!p.current} size={62} />
        <T style={{ fontWeight: '700', textAlign: 'center' }} numberOfLines={2}>{hidden ? 'Секретное' : a.title}</T>
        <T v="small" color={p.current ? tierColors[p.current].main : base.textMute} style={{ fontWeight: '600' }}>
          {p.current ? tierColors[p.current].label : 'Не открыто'}
        </T>
        <Row gap={3}>
          {a.tiers.map((t) => (
            <View key={t.tier} style={{ width: 14, height: 4, borderRadius: 2, backgroundColor: p.reached.includes(t) ? tierColors[t.tier].main : base.surface3 }} />
          ))}
        </Row>
        <View style={{ width: '100%', marginTop: 'auto' }}>
          {p.next ? (
            <>
              <ProgressBar ratio={p.ratio} color={tierColors[p.next.tier].main} height={4} />
              <T v="label" style={{ textAlign: 'center' }}>
                {hidden ? 'Условие скрыто' : `${fmtNum(p.value)} / ${fmtNum(p.next.goal)}${a.unit ? ' ' + a.unit : ''}`}
              </T>
            </>
          ) : (
            <T v="label" style={{ textAlign: 'center' }} color={tierColors[top.tier].main}>Максимум</T>
          )}
        </View>
      </Card>
    </Pressable>
  );
}
