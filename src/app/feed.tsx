import { router } from 'expo-router';
import { View } from 'react-native';

import { AchievementBadge, Avatar, BackHeader, Card, DemoNote, Icon, Row, Screen, T } from '@/components/ui';
import { achievementById, cosmeticById } from '@/data/achievements';
import { feed } from '@/data/mock';
import { base, seasonPalette, space } from '@/theme/theme';

export default function FeedScreen() {
  return (
    <Screen bottomPad={40}>
      <BackHeader title="Лента" />
      <View style={{ gap: space.m }}>
        {feed.map((p) => {
          const a = p.achievementId ? achievementById(p.achievementId) : null;
          return (
            <Card key={p.id}>
              <Row gap={space.m}>
                <Avatar name={p.author} frameId={p.frameId} size={44} />
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: '800' }} color={cosmeticById(p.nameColorId).color}>{p.author}</T>
                  <T v="label" style={{ marginTop: 0 }}>{p.title} · {p.time}</T>
                </View>
                <Icon name={p.season === 'winter' ? 'snow' : 'leaf'} size={16} color={seasonPalette[p.season].accentText} />
              </Row>
              <T style={{ marginTop: space.m }}>{p.text}</T>
              <Row gap={space.l} style={{ marginTop: space.m }}>
                {p.stats.map((s) => (
                  <View key={s.label}>
                    <T style={{ fontWeight: '800', fontSize: 17 }}>{s.value}</T>
                    <T v="label" style={{ marginTop: 0 }}>{s.label}</T>
                  </View>
                ))}
              </Row>
              {a ? (
                <Card onPress={() => router.push({ pathname: '/achievement/[id]', params: { id: a.id } })} style={{ marginTop: space.m, padding: space.s, backgroundColor: base.surface2, flexDirection: 'row', gap: space.s, alignItems: 'center' }}>
                  <AchievementBadge icon={a.icon} tier="gold" size={34} />
                  <T v="small" style={{ fontWeight: '700', flex: 1 }}>Новая награда: {a.title}</T>
                </Card>
              ) : null}
              <Row gap={space.l} style={{ marginTop: space.m }}>
                <Row gap={4}><Icon name="heart-outline" size={18} color={base.textDim} /><T v="small" color={base.textDim}>12</T></Row>
                <Row gap={4}><Icon name="flag-outline" size={16} color={base.textMute} /><T v="small" color={base.textMute}>Пожаловаться</T></Row>
              </Row>
            </Card>
          );
        })}
      </View>
      <View style={{ marginTop: space.l }}>
        <DemoNote text="В ленте только то, что люди опубликовали сами. Друзей и подписок нет, лидербордов нет. Посты — примеры." />
      </View>
    </Screen>
  );
}
