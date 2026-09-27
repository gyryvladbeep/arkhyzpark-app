import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

import { cosmeticById } from '@/data/achievements';
import { useStore } from '@/logic/store';
import { base, radius, seasonPalette, space, tierColors, type Tier } from '@/theme/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function usePalette() {
  const { season } = useStore();
  return seasonPalette[season];
}

export function Icon({ name, size = 20, color = base.text }: { name: string; size?: number; color?: string }) {
  return <Ionicons name={name as IconName} size={size} color={color} />;
}

export function T({
  children, style, v = 'body', color, numberOfLines, selectable,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  v?: 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'label' | 'num';
  color?: string;
  numberOfLines?: number;
  selectable?: boolean;
}) {
  return (
    <Text numberOfLines={numberOfLines} selectable={selectable} style={[styles[v], color ? { color } : null, style]}>
      {children}
    </Text>
  );
}

export function Screen({ children, scroll = true, padded = true, bottomPad = 110 }: { children: ReactNode; scroll?: boolean; padded?: boolean; bottomPad?: number }) {
  const insets = useSafeAreaInsets();
  const inner = (
    <View style={[styles.inner, padded && { paddingHorizontal: space.l }]}>{children}</View>
  );
  if (!scroll) return <View style={[styles.screen, { paddingTop: insets.top }]}>{inner}</View>;
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + space.s, paddingBottom: bottomPad + insets.bottom }}
      showsVerticalScrollIndicator={false}>
      {inner}
    </ScrollView>
  );
}

export function Card({ children, style, onPress, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; accent?: string }) {
  const content = <View style={[styles.card, accent ? { borderColor: accent } : null, style]}>{children}</View>;
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] }]}>
      {content}
    </Pressable>
  );
}

export function Row({ children, style, gap = space.s }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Stat({ label, value, unit, big, color }: { label: string; value: string; unit?: string; big?: boolean; color?: string }) {
  return (
    <View style={{ flex: 1, minWidth: 90 }}>
      <Row gap={4} style={{ alignItems: 'baseline' }}>
        <T v="num" style={big ? { fontSize: 30 } : null} color={color}>{value}</T>
        {unit ? <T v="small" color={base.textDim}>{unit}</T> : null}
      </Row>
      <T v="label">{label}</T>
    </View>
  );
}

export function Button({
  title, onPress, icon, kind = 'primary', style, disabled,
}: {
  title: string;
  onPress?: () => void;
  icon?: string;
  kind?: 'primary' | 'ghost' | 'danger' | 'soft';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const pal = usePalette();
  const bg = kind === 'primary' ? pal.accent : kind === 'danger' ? base.danger : kind === 'soft' ? pal.accentSoft : 'transparent';
  const fg = kind === 'primary' || kind === 'danger' ? '#fff' : kind === 'soft' ? pal.accentText : base.text;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderWidth: kind === 'ghost' ? 1 : 0, borderColor: base.border, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        style,
      ]}>
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <T style={{ color: fg, fontWeight: '700', fontSize: 15 }}>{title}</T>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: string }) {
  const pal = usePalette();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: pal.accentSoft, borderColor: pal.accent }]}>
      {icon ? <Icon name={icon} size={14} color={active ? pal.accentText : base.textDim} /> : null}
      <T v="small" style={{ fontWeight: '600' }} color={active ? pal.accentText : base.textDim}>{label}</T>
    </Pressable>
  );
}

export function Section({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children?: ReactNode }) {
  const pal = usePalette();
  return (
    <View style={{ marginTop: space.xl }}>
      <Row style={{ justifyContent: 'space-between', marginBottom: space.m }}>
        <T v="h3">{title}</T>
        {action ? (
          <Pressable onPress={onAction} hitSlop={10}>
            <T v="small" color={pal.accentText} style={{ fontWeight: '600' }}>{action}</T>
          </Pressable>
        ) : null}
      </Row>
      {children}
    </View>
  );
}

export function ProgressBar({ ratio, color, height = 6 }: { ratio: number; color?: string; height?: number }) {
  const pal = usePalette();
  return (
    <View style={{ height, borderRadius: height, backgroundColor: base.surface3, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`, height: '100%', backgroundColor: color ?? pal.accent, borderRadius: height }} />
    </View>
  );
}

export function SeasonToggle() {
  const { season, setSeason } = useStore();
  return (
    <View style={styles.toggle}>
      {(['winter', 'summer'] as const).map((s) => {
        const active = s === season;
        const p = seasonPalette[s];
        return (
          <Pressable key={s} onPress={() => setSeason(s)} style={[styles.toggleItem, active && { backgroundColor: p.accent }]}>
            <Icon name={s === 'winter' ? 'snow' : 'leaf'} size={14} color={active ? '#fff' : base.textDim} />
            <T v="small" style={{ fontWeight: '700' }} color={active ? '#fff' : base.textDim}>{p.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

// Шестиугольный значок достижения. Иконка поверх SVG.
export function AchievementBadge({ icon, tier, size = 64, locked }: { icon: string; tier?: Tier; size?: number; locked?: boolean }) {
  const c = tier && !locked ? tierColors[tier] : { main: '#3A4757', dark: '#1A222C' };
  const id = `g${tier ?? 'none'}${locked ? 'l' : ''}`;
  const h = size;
  const w = size * 0.9;
  const pts = `${w / 2},2 ${w - 2},${h * 0.26} ${w - 2},${h * 0.74} ${w / 2},${h - 2} 2,${h * 0.74} 2,${h * 0.26}`;
  const inset = size * 0.12;
  const pts2 = `${w / 2},${2 + inset} ${w - 2 - inset * 0.85},${h * 0.26 + inset * 0.5} ${w - 2 - inset * 0.85},${h * 0.74 - inset * 0.5} ${w / 2},${h - 2 - inset} ${2 + inset * 0.85},${h * 0.74 - inset * 0.5} ${2 + inset * 0.85},${h * 0.26 + inset * 0.5}`;
  return (
    <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c.main} />
            <Stop offset="1" stopColor={c.dark} />
          </LinearGradient>
        </Defs>
        <Polygon points={pts} fill={`url(#${id})`} />
        <Polygon points={pts2} fill={base.bg} opacity={0.55} />
      </Svg>
      <Icon name={locked ? 'lock-closed' : icon} size={size * 0.36} color={locked ? base.textMute : c.main} />
    </View>
  );
}

export function Avatar({ name, frameId, size = 72 }: { name: string; frameId: string; size?: number }) {
  const f = cosmeticById(frameId);
  const id = `af${frameId}`;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={f.color} />
            <Stop offset="1" stopColor={f.color2 ?? f.color} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={size} height={size} rx={size * 0.32} fill={`url(#${id})`} />
        <Rect x={4} y={4} width={size - 8} height={size - 8} rx={size * 0.28} fill={base.surface2} />
      </Svg>
      <T style={{ fontSize: size * 0.38, fontWeight: '800' }}>{name.slice(0, 1)}</T>
    </View>
  );
}

// Силуэт гор для шапок экранов
export function Ridge({ height = 120 }: { height?: number }) {
  const pal = usePalette();
  return (
    <Svg width="100%" height={height} viewBox="0 0 400 120" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={pal.sky[0]} />
          <Stop offset="1" stopColor={pal.sky[1]} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="400" height="120" fill="url(#sky)" />
      <Path d="M0 120 L0 78 L40 58 L70 70 L110 34 L150 64 L190 44 L230 72 L270 30 L300 52 L340 40 L400 70 L400 120 Z" fill={pal.ridge} opacity={0.7} />
      <Path d="M110 34 L100 44 L112 42 L120 48 Z M270 30 L260 42 L272 40 L282 46 Z" fill={pal.ridge2} opacity={0.5} />
      <Path d="M0 120 L0 96 L60 82 L120 98 L180 80 L240 100 L300 84 L360 96 L400 88 L400 120 Z" fill={base.bg} />
    </Svg>
  );
}

export function DemoNote({ text }: { text: string }) {
  return (
    <View style={styles.demo}>
      <Icon name="information-circle" size={16} color={base.warning} />
      <T v="small" color={base.textDim} style={{ flex: 1 }}>{text}</T>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: base.border, marginVertical: space.m }} />;
}

export function ListItem({ icon, title, subtitle, onPress, right }: { icon: string; title: string; subtitle?: string; onPress?: () => void; right?: ReactNode }) {
  const pal = usePalette();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.listItem, pressed && { backgroundColor: base.surface2 }]}>
      <View style={[styles.listIcon, { backgroundColor: pal.accentSoft }]}>
        <Icon name={icon} size={18} color={pal.accentText} />
      </View>
      <View style={{ flex: 1 }}>
        <T style={{ fontWeight: '600' }}>{title}</T>
        {subtitle ? <T v="small" color={base.textDim}>{subtitle}</T> : null}
      </View>
      {right ?? <Icon name="chevron-forward" size={18} color={base.textMute} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: base.bg },
  inner: { width: '100%', maxWidth: 520, alignSelf: 'center', flex: 1 },
  h1: { color: base.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  h2: { color: base.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  h3: { color: base.text, fontSize: 17, fontWeight: '700' },
  body: { color: base.text, fontSize: 15, lineHeight: 21 },
  small: { color: base.text, fontSize: 13, lineHeight: 18 },
  label: { color: base.textDim, fontSize: 12, marginTop: 2 },
  num: { color: base.text, fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  card: { backgroundColor: base.surface, borderRadius: radius.l, padding: space.l, borderWidth: 1, borderColor: base.border },
  btn: { height: 50, borderRadius: radius.m, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.s, paddingHorizontal: space.l },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 34, borderRadius: 17, borderWidth: 1, borderColor: base.border, backgroundColor: base.surface },
  toggle: { flexDirection: 'row', backgroundColor: base.surface2, borderRadius: 20, padding: 3, borderWidth: 1, borderColor: base.border },
  toggleItem: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 30, borderRadius: 16 },
  demo: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: space.m, borderRadius: radius.m, backgroundColor: 'rgba(242,184,75,0.08)', borderWidth: 1, borderColor: 'rgba(242,184,75,0.25)' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: space.m, paddingVertical: space.m, paddingHorizontal: space.s, borderRadius: radius.m },
  listIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});

export const isWeb = Platform.OS === 'web';

export function BackHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: space.s, marginBottom: space.l }}>
      <Row gap={space.s} style={{ flex: 1 }}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={10}
          style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: base.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: base.border }}>
          <Icon name="chevron-back" size={20} />
        </Pressable>
        <T v="h2" numberOfLines={1} style={{ flex: 1 }}>{title}</T>
      </Row>
      {right}
    </Row>
  );
}

export function Tag({ text, color }: { text: string; color: string }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: base.border }}>
      <T v="label" style={{ marginTop: 0, fontWeight: '600' }} color={color}>{text}</T>
    </View>
  );
}
