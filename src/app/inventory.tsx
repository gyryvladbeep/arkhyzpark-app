import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { BackHeader, Button, Card, Icon, ProgressBar, Row, Screen, SeasonToggle, Section, Stat, T, usePalette } from '@/components/ui';
import { requiredGear } from '@/data/mock';
import type { GearItem } from '@/data/types';
import { useStore } from '@/logic/store';
import { base, radius, space } from '@/theme/theme';

const BODY = 75;

export default function InventoryScreen() {
  const { season, gear, updateGear, addGear } = useStore();
  const pal = usePalette();
  const [rented, setRented] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');

  const items = gear.filter((g) => g.season === season || g.season === 'all');
  const req = requiredGear[season];
  const reqItems = items.filter((g) => req.includes(g.id));
  const readyCount = reqItems.filter((g) => g.packed).length;
  const ready = reqItems.length ? readyCount / reqItems.length : 1;
  const packedW = items.filter((g) => g.packed).reduce((a, g) => a + g.weightG, 0) / 1000;
  const share = packedW / BODY;
  const missing = reqItems.filter((g) => !g.packed);
  const cats = [...new Set(items.map((g) => g.category))];

  const verdict = ready === 1
    ? { t: 'Готов к выходу', c: base.green, i: 'checkmark-circle' }
    : ready >= 0.7 ? { t: 'Почти готов', c: base.warning, i: 'alert-circle' } : { t: 'Не готов', c: base.danger, i: 'close-circle' };

  return (
    <Screen bottomPad={40}>
      <BackHeader title="Инвентарь" right={<SeasonToggle />} />
      <Card accent={verdict.c}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={space.s}>
            <Icon name={verdict.i} size={24} color={verdict.c} />
            <T v="h3">{verdict.t}</T>
          </Row>
          <T v="num" color={verdict.c}>{Math.round(ready * 100)}%</T>
        </Row>
        <View style={{ marginTop: space.m }}><ProgressBar ratio={ready} color={verdict.c} height={8} /></View>
        <Row gap={space.m} style={{ marginTop: space.l }}>
          <Stat label="вес в рюкзаке" value={packedW.toFixed(1).replace('.', ',')} unit="кг" />
          <Stat label={`от веса тела (${BODY} кг)`} value={`${Math.round(share * 100)}%`} color={share > 0.2 ? base.warning : undefined} />
          <Stat label="обязательных" value={`${readyCount}/${reqItems.length}`} />
        </Row>
        {missing.length ? (
          <T v="small" color={base.textDim} style={{ marginTop: space.m }}>
            Не хватает: {missing.map((m) => m.name.toLowerCase()).join(', ')}
          </T>
        ) : null}
        <T v="label" style={{ marginTop: space.s }}>
          {season === 'summer' ? 'Для однодневного похода рекомендуем не больше 15% от веса тела.' : 'Зимой вес не так важен, считаем комплектность.'} Список обязательного — черновой, его задаёт компания.
        </T>
      </Card>

      {cats.map((cat) => (
        <Section key={cat} title={cat}>
          <Card style={{ padding: space.s }}>
            {items.filter((g) => g.category === cat).map((g) => (
              <ItemRow key={g.id} g={g} required={req.includes(g.id)} rented={rented.includes(g.id)}
                onPack={() => g.have || rented.includes(g.id) ? updateGear(g.id, { packed: !g.packed }) : null}
                onRent={() => { setRented((r) => [...r, g.id]); updateGear(g.id, { packed: true }); }} />
            ))}
          </Card>
        </Section>
      ))}

      <Section title="Добавить вещь">
        <Card style={{ gap: space.s }}>
          <TextInput value={name} onChangeText={setName} placeholder="Название" placeholderTextColor={base.textMute} style={inputStyle} />
          <TextInput value={weight} onChangeText={setWeight} placeholder="Вес, г" keyboardType="number-pad" placeholderTextColor={base.textMute} style={inputStyle} />
          <Button title="Добавить" icon="add" kind="soft" disabled={!name.trim() || !Number(weight)} onPress={() => {
            addGear({ id: 'u' + Date.now(), name: name.trim(), weightG: Number(weight), season, category: 'Моё', have: true, packed: true, rentable: false });
            setName(''); setWeight('');
          }} />
        </Card>
      </Section>
    </Screen>
  );
}

const inputStyle = { backgroundColor: base.surface2, borderRadius: radius.m, paddingHorizontal: space.l, height: 46, color: base.text, fontSize: 16, borderWidth: 1, borderColor: base.border } as const;

function ItemRow({ g, required, rented, onPack, onRent }: { g: GearItem; required: boolean; rented: boolean; onPack: () => void; onRent: () => void }) {
  const pal = usePalette();
  const available = g.have || rented;
  return (
    <Pressable onPress={onPack} style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, padding: space.s }}>
      <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: g.packed ? pal.accent : base.border, backgroundColor: g.packed ? pal.accent : 'transparent', alignItems: 'center', justifyContent: 'center', opacity: available ? 1 : 0.4 }}>
        {g.packed ? <Icon name="checkmark" size={16} color="#fff" /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Row gap={6}>
          <T style={{ fontWeight: '600' }} color={available ? base.text : base.textDim}>{g.name}</T>
          {required ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: base.warning }} /> : null}
        </Row>
        <T v="label" style={{ marginTop: 0 }}>
          {g.weightG} г{rented ? ' · прокат Архызпарка' : !g.have ? ' · нет в наличии' : ''}
        </T>
      </View>
      {!available && g.rentable ? (
        <Pressable onPress={onRent} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: pal.accentSoft }}>
          <T v="small" color={pal.accentText} style={{ fontWeight: '700' }}>В прокат</T>
        </Pressable>
      ) : null}
    </Pressable>
  );
}
