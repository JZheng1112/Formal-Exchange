import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

import { useAppLanguage } from "../lib/language";

/**
 * Date and time are chosen, never typed: a month calendar for the date and
 * a scrolling list for the time. Built from plain views rather than the
 * native picker so it ships as an over-the-air update and looks the same on
 * iOS, Android and the web.
 *
 * Values stay in the formats the rest of the app already stores:
 * "YYYY-MM-DD" and "HH:MM".
 */

const NAVY = "#071B3A";
const MUTED = "#64748B";
const LINE = "#E2E8F0";
const ACCENT = "#9A3412";
const PAPER = "#FFFFFF";

const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_ZH = ["一", "二", "三", "四", "五", "六", "日"];

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function todayKey() {
  const now = new Date();
  return toKey(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

type FieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  // Filters can be emptied again; form fields cannot.
  clearable?: boolean;
};

export function DatePickerField({ value, onChange, placeholder, style, textStyle, clearable, allowPast = false }: FieldProps & { allowPast?: boolean }) {
  const { language, text } = useAppLanguage();
  const [open, setOpen] = useState(false);
  const selected = parseKey(value);
  const today = todayKey();

  const label = selected
    ? language === "zh"
      ? `${selected.y}年${selected.m + 1}月${selected.d}日`
      : `${selected.d} ${MONTHS_EN[selected.m].slice(0, 3)} ${selected.y}`
    : placeholder ?? text("Choose a date", "选择日期");

  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={label} style={[f.field, style]} onPress={() => setOpen(true)}>
      <Ionicons name="calendar-outline" size={17} color={MUTED} />
      <Text style={[f.fieldText, textStyle, !selected && f.placeholder]} numberOfLines={1}>{label}</Text>
      {clearable && selected
        ? <Pressable hitSlop={10} accessibilityLabel={text("Clear date", "清除日期")} onPress={() => onChange("")}><Ionicons name="close-circle" size={17} color={MUTED} /></Pressable>
        : <Ionicons name="chevron-down" size={16} color={MUTED} />}
    </Pressable>
    {open ? <CalendarSheet
      initial={selected ?? parseKey(today)!}
      selectedKey={value}
      todayKey={today}
      allowPast={allowPast}
      onPick={(key) => { onChange(key); setOpen(false); }}
      onClose={() => setOpen(false)}
    /> : null}
  </>;
}

function CalendarSheet({ initial, selectedKey, todayKey: today, allowPast, onPick, onClose }: {
  initial: { y: number; m: number };
  selectedKey: string;
  todayKey: string;
  allowPast: boolean;
  onPick: (key: string) => void;
  onClose: () => void;
}) {
  const { language, text } = useAppLanguage();
  const [view, setView] = useState({ y: initial.y, m: initial.m });

  // Leading blanks so the 1st lands under its weekday, weeks starting Monday.
  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1).getDay();
    const lead = (first + 6) % 7;
    const days = new Date(view.y, view.m + 1, 0).getDate();
    return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)] as (number | null)[];
  }, [view]);

  const t = parseKey(today)!;
  const atCurrentMonth = view.y === t.y && view.m === t.m;
  const move = (step: number) => setView(({ y, m }) => {
    const next = new Date(y, m + step, 1);
    return { y: next.getFullYear(), m: next.getMonth() };
  });

  const title = language === "zh" ? `${view.y}年${view.m + 1}月` : `${MONTHS_EN[view.m]} ${view.y}`;

  return <Modal transparent animationType="fade" visible onRequestClose={onClose}>
    <Pressable style={f.backdrop} onPress={onClose}>
      <Pressable style={f.sheet} onPress={() => {}}>
        <View style={f.monthBar}>
          <Pressable accessibilityLabel={text("Previous month", "上个月")} style={[f.monthButton, !allowPast && atCurrentMonth && f.disabled]} disabled={!allowPast && atCurrentMonth} onPress={() => move(-1)}>
            <Ionicons name="chevron-back" size={20} color={NAVY} />
          </Pressable>
          <Text style={f.monthTitle}>{title}</Text>
          <Pressable accessibilityLabel={text("Next month", "下个月")} style={f.monthButton} onPress={() => move(1)}>
            <Ionicons name="chevron-forward" size={20} color={NAVY} />
          </Pressable>
        </View>
        <View style={f.grid}>
          {(language === "zh" ? WEEKDAYS_ZH : WEEKDAYS_EN).map((w) => <Text key={w} style={f.weekday}>{w}</Text>)}
          {cells.map((day, i) => {
            if (day === null) return <View key={`b${i}`} style={f.cell} />;
            const key = toKey(view.y, view.m, day);
            const past = !allowPast && key < today;
            const isSelected = key === selectedKey;
            const isToday = key === today;
            return <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: past }}
              disabled={past}
              style={f.cell}
              onPress={() => onPick(key)}
            >
              <View style={[f.day, isToday && f.today, isSelected && f.daySelected]}>
                <Text style={[f.dayText, past && f.dayPast, isSelected && f.dayTextSelected]}>{day}</Text>
              </View>
            </Pressable>;
          })}
        </View>
        <View style={f.sheetActions}>
          <Pressable style={f.textButton} onPress={() => onPick(today)}><Text style={f.textButtonLabel}>{text("Today", "今天")}</Text></Pressable>
          <Pressable style={f.textButton} onPress={onClose}><Text style={[f.textButtonLabel, { color: MUTED }]}>{text("Cancel", "取消")}</Text></Pressable>
        </View>
      </Pressable>
    </Pressable>
  </Modal>;
}

const ROW = 48;
// Every 15 minutes covers coach, train and flight times without a list too
// long to scroll.
const TIMES = Array.from({ length: 96 }, (_, i) => `${pad(Math.floor(i / 4))}:${pad((i % 4) * 15)}`);

export function TimePickerField({ value, onChange, placeholder, style, textStyle, clearable }: FieldProps) {
  const { text } = useAppLanguage();
  const [open, setOpen] = useState(false);
  const current = /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : "";
  // Open on the chosen time, or on the evening for a fresh field.
  const anchor = Math.max(0, TIMES.findIndex((t) => t >= (current || "18:00")));
  // contentOffset is ignored on the web, and a scroll issued while the modal
  // is still fading in is dropped, so scroll just after it opens.
  const list = useRef<ScrollView>(null);
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => list.current?.scrollTo({ y: Math.max(0, (anchor - 2) * ROW), animated: false }), 80);
    return () => clearTimeout(id);
  }, [open, anchor]);

  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={current || text("Choose a time", "选择时间")} style={[f.field, style]} onPress={() => setOpen(true)}>
      <Ionicons name="time-outline" size={17} color={MUTED} />
      <Text style={[f.fieldText, textStyle, !current && f.placeholder]}>{current || (placeholder ?? text("Choose a time", "选择时间"))}</Text>
      {clearable && current
        ? <Pressable hitSlop={10} accessibilityLabel={text("Clear time", "清除时间")} onPress={() => onChange("")}><Ionicons name="close-circle" size={17} color={MUTED} /></Pressable>
        : <Ionicons name="chevron-down" size={16} color={MUTED} />}
    </Pressable>
    {open ? <Modal transparent animationType="fade" visible onRequestClose={() => setOpen(false)}>
      <Pressable style={f.backdrop} onPress={() => setOpen(false)}>
        <Pressable style={f.sheet} onPress={() => {}}>
          <Text style={f.monthTitle}>{text("Choose a time", "选择时间")}</Text>
          <ScrollView ref={list} style={f.timeList}>
            {TIMES.map((t) => <Pressable key={t} style={[f.timeRow, t === current && f.timeRowSelected]} onPress={() => { onChange(t); setOpen(false); }}>
              <Text style={[f.timeText, t === current && f.dayTextSelected]}>{t}</Text>
            </Pressable>)}
          </ScrollView>
          <View style={f.sheetActions}>
            <Pressable style={f.textButton} onPress={() => setOpen(false)}><Text style={[f.textButtonLabel, { color: MUTED }]}>{text("Cancel", "取消")}</Text></Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal> : null}
  </>;
}

const f = StyleSheet.create({
  field: { minHeight: 46, borderWidth: 1, borderColor: LINE, borderRadius: 14, paddingHorizontal: 12, backgroundColor: "#FAFAF8", flexDirection: "row", alignItems: "center", gap: 8 },
  fieldText: { flex: 1, fontSize: 15, color: NAVY, fontWeight: "600" },
  placeholder: { color: "#94A3B8", fontWeight: "400" },
  backdrop: { flex: 1, backgroundColor: "rgba(7,27,58,0.45)", alignItems: "center", justifyContent: "center", padding: 16 },
  sheet: { width: "100%", maxWidth: 380, backgroundColor: PAPER, borderRadius: 22, padding: 16, gap: 10 },
  monthBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F5F9" },
  disabled: { opacity: 0.3 },
  monthTitle: { fontSize: 17, fontWeight: "900", color: NAVY, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  weekday: { width: `${100 / 7}%`, textAlign: "center", fontSize: 12, fontWeight: "800", color: MUTED, paddingVertical: 6 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  today: { borderWidth: 1.5, borderColor: ACCENT },
  daySelected: { backgroundColor: NAVY, borderColor: NAVY },
  dayText: { fontSize: 15, fontWeight: "700", color: NAVY },
  dayPast: { color: "#CBD5E1" },
  dayTextSelected: { color: "#fff" },
  sheetActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  textButton: { paddingHorizontal: 14, paddingVertical: 10 },
  textButtonLabel: { fontSize: 15, fontWeight: "900", color: ACCENT },
  timeList: { maxHeight: ROW * 6 },
  timeRow: { height: ROW, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  timeRowSelected: { backgroundColor: NAVY },
  timeText: { fontSize: 17, fontWeight: "700", color: NAVY, fontVariant: ["tabular-nums"] },
});
