import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddTaskModal } from "@/components/AddTaskModal";
import { TaskCard } from "@/components/TaskCard";
import { ScreenEnter } from "@/components/ScreenEnter";
import { DashboardSkeleton } from "@/components/SkeletonLoader";
import { Task, useTasks } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

const GREETING_KEY = "@timeflow_greeting";
const DEFAULT_GREETINGS = [
  "今天的努力，明天的收获。",
  "好好努力，前途无量。",
  "专注当下，成就未来。",
  "每一步都算数。",
  "你比你想象的更强。",
  "静下心来，慢慢来。",
  "一分耕耘，一分收获。",
];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function getWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const toStr = (d: Date) => d.toISOString().split("T")[0];
  return { start: toStr(monday), end: toStr(sunday) };
}
function getMonthRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const toStr = (d: Date) => d.toISOString().split("T")[0];
  return { start: toStr(start), end: toStr(end) };
}

const WEEK_DAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const MONTH_NAMES = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

type SectionItem =
  | { type: "task"; task: Task }
  | { type: "empty"; icon: string; title: string; hint: string }
  | { type: "completed-hint"; count: number }
  | { type: "month-stats"; count: number };

interface SectionDef {
  key: string;
  title: string;
  badge: string;
  dotColor: string;
  data: SectionItem[];
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, addTask, editTask, deleteTask, toggleTask } = useTasks();
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [greeting, setGreeting] = useState<string | null>(null);
  const [editingGreeting, setEditingGreeting] = useState(false);
  const [draftGreeting, setDraftGreeting] = useState("");
  const [loading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(GREETING_KEY).then((v) => { if (v) setGreeting(v); });
  }, []);

  const displayGreeting =
    greeting ?? DEFAULT_GREETINGS[new Date().getDay() % DEFAULT_GREETINGS.length];

  const openGreetingEdit = () => {
    setDraftGreeting(displayGreeting);
    setEditingGreeting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const saveGreeting = async () => {
    const val = draftGreeting.trim();
    if (val) { setGreeting(val); await AsyncStorage.setItem(GREETING_KEY, val); }
    setEditingGreeting(false);
  };
  const resetGreeting = async () => {
    setGreeting(null);
    await AsyncStorage.removeItem(GREETING_KEY);
    setEditingGreeting(false);
  };

  const today = todayStr();
  const now = new Date();
  const dayName = WEEK_DAYS[now.getDay()];
  const dateLabel = `${now.getFullYear()}年${MONTH_NAMES[now.getMonth()]}${now.getDate()}日`;
  const week = getWeekRange();
  const month = getMonthRange();

  const todayTasks = useMemo(() => tasks.filter((t) => t.date === today && !t.completed), [tasks, today]);
  const completedToday = useMemo(() => tasks.filter((t) => t.date === today && t.completed), [tasks, today]);
  const weekTasks = useMemo(() =>
    tasks.filter((t) => t.date > today && t.date >= week.start && t.date <= week.end && !t.completed)
      .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6),
    [tasks, today, week]
  );
  const monthCount = useMemo(() =>
    tasks.filter((t) => t.date > week.end && t.date >= month.start && t.date <= month.end && !t.completed).length,
    [tasks, week, month]
  );
  const completionRate =
    todayTasks.length + completedToday.length > 0
      ? Math.round((completedToday.length / (todayTasks.length + completedToday.length)) * 100)
      : 0;

  const sections: SectionDef[] = useMemo(() => {
    const todayItems: SectionItem[] =
      todayTasks.length === 0 && completedToday.length === 0
        ? [{ type: "empty", icon: "sun", title: "今天没有安排", hint: "好好休息，或者计划点什么？" }]
        : [
            ...todayTasks.map((t): SectionItem => ({ type: "task", task: t })),
            ...(completedToday.length > 0 ? [{ type: "completed-hint" as const, count: completedToday.length }] : []),
          ];

    const weekItems: SectionItem[] =
      weekTasks.length === 0
        ? [{ type: "empty", icon: "calendar", title: "本周轻松无事", hint: "趁机规划一些学习目标吧" }]
        : weekTasks.map((t): SectionItem => ({ type: "task", task: t }));

    return [
      {
        key: "today",
        title: "今天",
        badge: todayTasks.length > 0 ? `还剩 ${todayTasks.length} 项` : "全部完成",
        dotColor: colors.today,
        data: todayItems,
      },
      {
        key: "week",
        title: "本周待办",
        badge: `${weekTasks.length} 项即将到来`,
        dotColor: colors.primary,
        data: weekItems,
      },
      {
        key: "month",
        title: "本月计划",
        badge: `共 ${monthCount} 项`,
        dotColor: colors.warning,
        data: [{ type: "month-stats", count: monthCount }],
      },
    ];
  }, [todayTasks, completedToday, weekTasks, monthCount, colors]);

  const topPaddingWeb = Platform.OS === "web" ? 67 : insets.top;

  const renderSectionHeader = ({ section }: { section: SectionDef }) => (
    <View
      style={[
        styles.stickyHeader,
        { backgroundColor: colors.background },
      ]}
    >
      <View style={styles.sectionRow}>
        <View style={[styles.sectionDot, { backgroundColor: section.dotColor }]} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {section.title}
        </Text>
        <Text style={[styles.sectionBadge, { color: colors.mutedForeground }]}>
          {section.badge}
        </Text>
      </View>
    </View>
  );

  const renderItem = ({ item, section }: { item: SectionItem; section: SectionDef }) => {
    if (item.type === "task") {
      return (
        <TaskCard
          task={item.task}
          onComplete={() => toggleTask(item.task.id)}
          onPress={() => setEditingTask(item.task)}
          onDelete={() => deleteTask(item.task.id)}
        />
      );
    }
    if (item.type === "empty") {
      return loading ? (
        <DashboardSkeleton />
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
          <Feather name={item.icon as any} size={26} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>{item.title}</Text>
          <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>{item.hint}</Text>
        </View>
      );
    }
    if (item.type === "completed-hint") {
      return (
        <Text style={[styles.completedHint, { color: colors.mutedForeground }]}>
          已完成 {item.count} 项
        </Text>
      );
    }
    if (item.type === "month-stats") {
      return (
        <View style={[styles.monthCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.monthBigNum, { color: colors.primary }]}>{item.count}</Text>
          <Text style={[styles.monthSub, { color: colors.mutedForeground }]}>
            项任务安排在 {MONTH_NAMES[now.getMonth()]}
          </Text>
        </View>
      );
    }
    return null;
  };

  const listHeader = (
    <View style={[styles.header, { paddingTop: topPaddingWeb + 20 }]}>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={[styles.dayName, { color: colors.mutedForeground }]}>
          {dayName}　{dateLabel}
        </Text>
        <TouchableOpacity style={styles.greetingRow} onPress={openGreetingEdit} activeOpacity={0.75}>
          <Text style={[styles.greeting, { color: colors.foreground }]} numberOfLines={2}>
            {displayGreeting}
          </Text>
          <View style={[styles.editGreetingBtn, { backgroundColor: colors.muted }]}>
            <Feather name="edit-2" size={12} color={colors.mutedForeground} />
          </View>
        </TouchableOpacity>
      </View>
      <View style={[styles.progressRing, {
        borderColor: completionRate === 100 ? colors.success : colors.primary,
      }]}>
        <Text style={[styles.progressNum, { color: completionRate === 100 ? colors.success : colors.primary }]}>
          {completionRate}
        </Text>
        <Text style={[styles.progressPct, { color: completionRate === 100 ? colors.success : colors.mutedForeground }]}>
          %
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenEnter>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SectionList
          sections={sections as any}
          keyExtractor={(item: any, index) => item?.task?.id ?? item?.type ?? String(index)}
          renderItem={renderItem as any}
          renderSectionHeader={renderSectionHeader as any}
          stickySectionHeadersEnabled
          ListHeaderComponent={listHeader}
          contentContainerStyle={{
            paddingHorizontal: 22,
            paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100,
            gap: 0,
          }}
          showsVerticalScrollIndicator={false}
          SectionSeparatorComponent={() => <View style={{ height: 20 }} />}
        />

        {/* FAB */}
        <TouchableOpacity
          style={[styles.fab, {
            backgroundColor: colors.primary,
            bottom: Platform.OS === "web" ? 100 : insets.bottom + 80,
          }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAdd(true);
          }}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={26} color="#fff" />
        </TouchableOpacity>

        {/* Edit Greeting Modal */}
        <Modal
          visible={editingGreeting}
          transparent
          animationType="slide"
          onRequestClose={() => setEditingGreeting(false)}
        >
          <TouchableOpacity
            style={styles.greetingOverlay}
            activeOpacity={1}
            onPress={() => setEditingGreeting(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.greetingKeyboard}
          >
            <View style={[styles.greetingModal, {
              backgroundColor: colors.card,
              paddingBottom: insets.bottom + 20,
            }]}>
              <View style={[styles.handle, { backgroundColor: colors.separator }]} />
              <Text style={[styles.greetingModalTitle, { color: colors.foreground }]}>
                编辑激励语
              </Text>
              <TextInput
                style={[styles.greetingInput, {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderColor: colors.border,
                }]}
                value={draftGreeting}
                onChangeText={setDraftGreeting}
                placeholder="写下你的专属激励语..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                autoFocus
                maxLength={60}
              />
              <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
                {draftGreeting.length} / 60
              </Text>
              <View style={styles.greetingBtns}>
                <TouchableOpacity style={[styles.resetBtn, { borderColor: colors.border }]} onPress={resetGreeting}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 14, fontWeight: "600" }}>恢复默认</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveGreetingBtn, { backgroundColor: draftGreeting.trim() ? colors.primary : colors.border }]}
                  onPress={saveGreeting}
                  disabled={!draftGreeting.trim()}
                >
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <AddTaskModal
          visible={showAdd}
          onClose={() => setShowAdd(false)}
          onSave={(t) => addTask(t)}
        />
        <AddTaskModal
          visible={!!editingTask}
          editTask={editingTask}
          onClose={() => setEditingTask(undefined)}
          onSave={(t) => { if (editingTask) editTask(editingTask.id, t); }}
        />
      </View>
    </ScreenEnter>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingBottom: 24 },
  dayName: { fontSize: 13, letterSpacing: 0.2 },
  greetingRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  greeting: { fontSize: 21, fontWeight: "700", letterSpacing: 0.2, lineHeight: 30, flex: 1 },
  editGreetingBtn: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", marginTop: 2 },
  progressRing: { width: 58, height: 58, borderRadius: 29, borderWidth: 2.5, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 1 },
  progressNum: { fontSize: 16, fontWeight: "700" },
  progressPct: { fontSize: 10, fontWeight: "500", alignSelf: "flex-end", marginBottom: 2 },
  stickyHeader: { paddingVertical: 6 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionDot: { width: 7, height: 7, borderRadius: 3.5 },
  sectionTitle: { fontSize: 16, fontWeight: "700", flex: 1, letterSpacing: 0.2 },
  sectionBadge: { fontSize: 12 },
  emptyCard: { borderRadius: 16, padding: 30, alignItems: "center", gap: 8, marginTop: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "600" },
  emptyHint: { fontSize: 12 },
  completedHint: { fontSize: 12, marginTop: 4, marginLeft: 2 },
  monthCard: { borderRadius: 18, padding: 22, gap: 4, marginTop: 8 },
  monthBigNum: { fontSize: 52, fontWeight: "800", lineHeight: 58, letterSpacing: -1 },
  monthSub: { fontSize: 14 },
  fab: {
    position: "absolute",
    right: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  greetingOverlay: { flex: 1, backgroundColor: "rgba(44,42,40,0.3)" },
  greetingKeyboard: { justifyContent: "flex-end" },
  greetingModal: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 12, paddingHorizontal: 22, gap: 14 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center" },
  greetingModalTitle: { fontSize: 17, fontWeight: "700" },
  greetingInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, lineHeight: 24, minHeight: 80, textAlignVertical: "top" },
  charCount: { fontSize: 11, textAlign: "right", marginTop: -8 },
  greetingBtns: { flexDirection: "row", gap: 10 },
  resetBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1 },
  saveGreetingBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  separator: { height: StyleSheet.hairlineWidth },
});
