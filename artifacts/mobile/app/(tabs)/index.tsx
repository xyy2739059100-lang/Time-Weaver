import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddTaskModal } from "@/components/AddTaskModal";
import { TaskCard } from "@/components/TaskCard";
import { Task, useTasks } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

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

const GREETINGS = [
  "好好努力，前途无量。",
  "今天也要加油哦。",
  "专注当下，成就未来。",
  "每一步都算数。",
  "你比你想象的更强。",
  "静下心来，慢慢来。",
  "今天的努力，明天的收获。",
];

const WEEK_DAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const MONTH_NAMES = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, addTask, editTask, deleteTask, toggleTask } = useTasks();
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  const today = todayStr();
  const now = new Date();
  const dayName = WEEK_DAYS[now.getDay()];
  const dateLabel = `${now.getFullYear()}年${MONTH_NAMES[now.getMonth()]}${now.getDate()}日`;
  const greeting = GREETINGS[now.getDay() % GREETINGS.length];

  const week = getWeekRange();
  const month = getMonthRange();

  const todayTasks = useMemo(
    () => tasks.filter((t) => t.date === today && !t.completed),
    [tasks, today]
  );
  const completedToday = useMemo(
    () => tasks.filter((t) => t.date === today && t.completed),
    [tasks, today]
  );
  const weekTasks = useMemo(
    () =>
      tasks
        .filter(
          (t) =>
            t.date > today &&
            t.date >= week.start &&
            t.date <= week.end &&
            !t.completed
        )
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5),
    [tasks, today, week]
  );
  const monthCount = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.date > week.end &&
          t.date >= month.start &&
          t.date <= month.end &&
          !t.completed
      ).length,
    [tasks, week, month]
  );

  const completionRate =
    todayTasks.length + completedToday.length > 0
      ? Math.round(
          (completedToday.length /
            (todayTasks.length + completedToday.length)) *
            100
        )
      : 0;

  const topPaddingWeb = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPaddingWeb + 20,
          paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100,
          paddingHorizontal: 22,
          gap: 28,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.dayName, { color: colors.mutedForeground }]}>
              {dayName}　{dateLabel}
            </Text>
            <Text style={[styles.greeting, { color: colors.foreground }]}>
              {greeting}
            </Text>
          </View>
          <View
            style={[
              styles.progressRing,
              {
                borderColor:
                  completionRate === 100 ? colors.success : colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.progressNum,
                {
                  color:
                    completionRate === 100 ? colors.success : colors.primary,
                },
              ]}
            >
              {completionRate}
            </Text>
            <Text
              style={[
                styles.progressPct,
                {
                  color:
                    completionRate === 100 ? colors.success : colors.mutedForeground,
                },
              ]}
            >
              %
            </Text>
          </View>
        </View>

        {/* Today */}
        <View>
          <View style={styles.sectionRow}>
            <View
              style={[styles.sectionDot, { backgroundColor: colors.today }]}
            />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              今天
            </Text>
            <Text style={[styles.sectionBadge, { color: colors.mutedForeground }]}>
              {todayTasks.length > 0 ? `还剩 ${todayTasks.length} 项` : "全部完成"}
            </Text>
          </View>

          {todayTasks.length === 0 && completedToday.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Feather name="sun" size={26} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
                今天没有安排
              </Text>
              <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
                好好休息，或者计划点什么？
              </Text>
            </View>
          ) : (
            <>
              {todayTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onComplete={() => toggleTask(t.id)}
                  onPress={() => setEditingTask(t)}
                  onDelete={() => deleteTask(t.id)}
                />
              ))}
              {completedToday.length > 0 && (
                <Text style={[styles.completedHint, { color: colors.mutedForeground }]}>
                  已完成 {completedToday.length} 项
                </Text>
              )}
            </>
          )}
        </View>

        {/* This Week */}
        <View>
          <View style={styles.sectionRow}>
            <View
              style={[styles.sectionDot, { backgroundColor: colors.primary }]}
            />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              本周待办
            </Text>
            <Text style={[styles.sectionBadge, { color: colors.mutedForeground }]}>
              {weekTasks.length} 项即将到来
            </Text>
          </View>

          {weekTasks.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Feather name="calendar" size={26} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
                本周轻松无事
              </Text>
              <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
                趁机规划一些学习目标吧
              </Text>
            </View>
          ) : (
            weekTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onComplete={() => toggleTask(t.id)}
                onPress={() => setEditingTask(t)}
                onDelete={() => deleteTask(t.id)}
              />
            ))
          )}
        </View>

        {/* Monthly */}
        <View style={[styles.monthCard, { backgroundColor: colors.card }]}>
          <View style={styles.sectionRow}>
            <View
              style={[styles.sectionDot, { backgroundColor: colors.warning }]}
            />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              本月计划
            </Text>
          </View>
          <Text style={[styles.monthBigNum, { color: colors.primary }]}>
            {monthCount}
          </Text>
          <Text style={[styles.monthSub, { color: colors.mutedForeground }]}>
            项任务安排在 {MONTH_NAMES[now.getMonth()]}
          </Text>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: Platform.OS === "web" ? 100 : insets.bottom + 80,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowAdd(true);
        }}
      >
        <Feather name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      <AddTaskModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={(t) => addTask(t)}
      />
      <AddTaskModal
        visible={!!editingTask}
        editTask={editingTask}
        onClose={() => setEditingTask(undefined)}
        onSave={(t) => {
          if (editingTask) editTask(editingTask.id, t);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  dayName: {
    fontSize: 13,
    fontWeight: "400",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.2,
    lineHeight: 30,
  },
  progressRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 1,
  },
  progressNum: { fontSize: 16, fontWeight: "700" },
  progressPct: { fontSize: 10, fontWeight: "500", alignSelf: "flex-end", marginBottom: 2 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionDot: { width: 7, height: 7, borderRadius: 3.5 },
  sectionTitle: { fontSize: 16, fontWeight: "700", flex: 1, letterSpacing: 0.2 },
  sectionBadge: { fontSize: 12, letterSpacing: 0.1 },
  emptyCard: {
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: "600" },
  emptyHint: { fontSize: 12 },
  completedHint: { fontSize: 12, marginTop: 4, marginLeft: 2 },
  monthCard: {
    borderRadius: 18,
    padding: 22,
    gap: 6,
  },
  monthBigNum: {
    fontSize: 52,
    fontWeight: "800",
    lineHeight: 58,
    letterSpacing: -1,
  },
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
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
});
