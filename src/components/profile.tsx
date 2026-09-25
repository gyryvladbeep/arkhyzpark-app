import { router } from 'expo-router';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Avatar, Card, Icon, Row, T, Tag, usePalette } from '@/components/ui';
import { cosmeticById } from '@/data/achievements';
import type { Instructor } from '@/data/types';
import { useStore } from '@/logic/store';
import { base, space, tierColors } from '@/theme/theme';

export function ProfileHero() {
  const { userName, equipped, level } = useStore();
  const th = cosmeticById(equipped.theme);
  const title = cosmeticById(equipped.title);
  const nc = cosmeticById(equipped.nameColor);
  return (
    <View style={{ marginTop: space.s, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: base.border }}>
      <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="th" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={th.color} />
            <Stop offset="1" stopColor={th.color2 ?? base.surface} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#th)" />
      </Svg>
      <View style={{ padding: space.l, alignItems: 'center' }}>
        <Avatar name={userName} frameId={equipped.frame} size={92} />
        <T v="h2" style={{ marginTop: space.m }} color={nc.color}>{userName}</T>
        <T v="small" color={title.color} style={{ fontWeight: '700', letterSpacing: 0.5 }}>{title.name.toUpperCase()}</T>
        <Row gap={space.s} style={{ marginTop: space.m }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <T v="small" style={{ fontWeight: '700' }}>Уровень {level.level}</T>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <T v="small" color={tierColors.gold.main} style={{ fontWeight: '700' }}>{level.unlocked} наград</T>
          </View>
        </Row>
      </View>
    </View>
  );
}

export function InstructorCard({ i }: { i: Instructor }) {
  const pal = usePalette();
  return (
    <Card onPress={() => router.push({ pathname: '/instructor/[id]', params: { id: i.id } })}>
      <Row gap={space.m} style={{ alignItems: 'flex-start' }}>
        <Avatar name={i.name} frameId={i.category === 'Международная' ? 'f_legend' : 'f_basic'} size={56} />
        <View style={{ flex: 1 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="h3">{i.name}</T>
            <Row gap={3}>
              <Icon name="star" size={14} color={base.warning} />
              <T v="small" style={{ fontWeight: '700' }}>{i.rating.toFixed(1)}</T>
              <T v="small" color={base.textMute}>({i.reviews})</T>
            </Row>
          </Row>
          <T v="small" color={base.textDim}>{i.discipline.join(', ')} · {i.years} лет опыта</T>
          <Row gap={6} style={{ marginTop: space.s, flexWrap: 'wrap' }}>
            <Tag text={i.category === 'Международная' ? 'Междунар. категория' : `Категория ${i.category}`} color={pal.accentText} />
            {i.kids ? <Tag text="Работает с детьми" color={base.green} /> : null}
            <Tag text={i.languages.join(' / ')} color={base.textDim} />
          </Row>
        </View>
      </Row>
    </Card>
  );
}

