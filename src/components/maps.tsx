import { View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polyline, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { lifts, MAP_H, MAP_W, routes, trails, village } from '@/data/geo';
import type { Point } from '@/data/types';
import { base, seasonPalette, trailColors } from '@/theme/theme';

const toStr = (p: Point[]) => p.map(([x, y]) => `${x},${y}`).join(' ');

export function ResortMap({
  highlight, marker, height = 300, dimOthers,
}: {
  highlight?: string[];
  marker?: Point;
  height?: number;
  dimOthers?: boolean;
}) {
  return (
    <View style={{ height, borderRadius: 18, overflow: 'hidden', backgroundColor: '#0E1621', borderWidth: 1, borderColor: base.border }}>
      <Svg width="100%" height="100%" viewBox={`-4 -4 ${MAP_W + 8} ${MAP_H + 8}`} preserveAspectRatio="xMidYMid meet">
        <Defs>
          <LinearGradient id="snow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1E3147" />
            <Stop offset="1" stopColor="#0E1621" />
          </LinearGradient>
        </Defs>
        <Rect x={-4} y={-4} width={MAP_W + 8} height={MAP_H + 8} fill="url(#snow)" />
        <Path d="M0 30 L20 10 L35 18 L55 4 L75 16 L100 6 L100 0 L0 0 Z" fill="#E8F1FA" opacity={0.08} />
        {lifts.map((l) => (
          <G key={l.id}>
            <Line x1={l.from[0]} y1={l.from[1]} x2={l.to[0]} y2={l.to[1]} stroke="#8A97A8" strokeWidth={0.6} strokeDasharray="1.5,1.2" />
            <Circle cx={l.from[0]} cy={l.from[1]} r={1.3} fill="#8A97A8" />
            <Circle cx={l.to[0]} cy={l.to[1]} r={1.3} fill="#8A97A8" />
          </G>
        ))}
        {trails.map((t) => {
          const hl = highlight?.includes(t.id);
          const op = dimOthers && highlight && !hl ? 0.25 : 1;
          return (
            <G key={t.id} opacity={op}>
              {hl ? <Polyline points={toStr(t.path)} stroke={trailColors[t.level]} strokeWidth={4.5} opacity={0.25} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
              <Polyline points={toStr(t.path)} stroke={trailColors[t.level]} strokeWidth={hl ? 2 : 1.3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <SvgText x={t.path[1][0] + 2} y={t.path[1][1]} fontSize={3.2} fill={base.textDim}>{t.name}</SvgText>
            </G>
          );
        })}
        {marker ? (
          <G>
            <Circle cx={marker[0]} cy={marker[1]} r={4} fill={seasonPalette.winter.accent} opacity={0.3} />
            <Circle cx={marker[0]} cy={marker[1]} r={2} fill="#fff" stroke={seasonPalette.winter.accent} strokeWidth={0.8} />
          </G>
        ) : null}
        <SvgText x={2} y={MAP_H + 2} fontSize={3} fill={base.textMute}>Черновая схема, не в масштабе</SvgText>
      </Svg>
    </View>
  );
}

export function ValleyMap({ highlight, marker, height = 300, progress }: { highlight?: string; marker?: Point; height?: number; progress?: Point[] }) {
  const accent = seasonPalette.summer.accent;
  return (
    <View style={{ height, borderRadius: 18, overflow: 'hidden', backgroundColor: '#0D1812', borderWidth: 1, borderColor: base.border }}>
      <Svg width="100%" height="100%" viewBox={`-4 -4 ${MAP_W + 8} ${MAP_H + 8}`} preserveAspectRatio="xMidYMid meet">
        <Defs>
          <LinearGradient id="vall" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1D2A26" />
            <Stop offset="1" stopColor="#0F2418" />
          </LinearGradient>
        </Defs>
        <Rect x={-4} y={-4} width={MAP_W + 8} height={MAP_H + 8} fill="url(#vall)" />
        <Path d="M0 40 L15 20 L30 30 L50 8 L70 22 L90 10 L100 18 L100 0 L0 0 Z" fill="#DDE7EE" opacity={0.08} />
        <Path d="M50 140 C48 120 60 110 58 90 C56 70 70 50 66 20" stroke="#2D6E8E" strokeWidth={1.2} fill="none" opacity={0.6} />
        {routes.map((r) => {
          const hl = highlight === r.id;
          const end = r.path[r.path.length - 1];
          return (
            <G key={r.id} opacity={highlight && !hl ? 0.3 : 1}>
              <Polyline points={toStr(r.path)} stroke={hl ? accent : '#9FB7A6'} strokeWidth={hl ? 1.8 : 1} strokeDasharray={hl ? undefined : '2,1.5'} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx={end[0]} cy={end[1]} r={1.6} fill={hl ? accent : '#9FB7A6'} />
              <SvgText x={end[0] + 2.5} y={end[1] + 1} fontSize={3.2} fill={hl ? '#fff' : base.textDim}>{r.name}</SvgText>
            </G>
          );
        })}
        {progress && progress.length > 1 ? (
          <Polyline points={toStr(progress)} stroke="#fff" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        <Rect x={village[0] - 2} y={village[1] - 2} width={4} height={4} fill="#fff" rx={0.8} />
        <SvgText x={village[0] + 4} y={village[1] + 1.5} fontSize={3.2} fill={base.text}>Архыз</SvgText>
        {marker ? (
          <G>
            <Circle cx={marker[0]} cy={marker[1]} r={4} fill={accent} opacity={0.3} />
            <Circle cx={marker[0]} cy={marker[1]} r={2} fill="#fff" stroke={accent} strokeWidth={0.8} />
          </G>
        ) : null}
        <SvgText x={2} y={MAP_H + 2} fontSize={3} fill={base.textMute}>Черновая схема, не в масштабе</SvgText>
      </Svg>
    </View>
  );
}

// Профиль высоты: значения в метрах
export function ElevationChart({ values, color, height = 90 }: { values: number[]; color: string; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const W = 300;
  const H = 80;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - ((v - min) / span) * (H - 8) - 4]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return (
    <View style={{ height }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="elev" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.45} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={`${line} L${W} ${H} L0 ${H} Z`} fill="url(#elev)" />
        <Path d={line} stroke={color} strokeWidth={2} fill="none" vectorEffect="non-scaling-stroke" />
      </Svg>
    </View>
  );
}
