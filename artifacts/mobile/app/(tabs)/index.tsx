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
  "You've got this!",
  "Stay focused today.",
  "Make it count!",
  "One step at a time.",
  "You're doing great!",
];

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, addTask, editTask, deleteTask, toggleTask } = useTasks();
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  const today = todayStr();
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const dateLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const greeting = GREETINGS[new Date().getDay() % GREETINGS.length];

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
        .filter((t) => t.date > today && t.date >= week.start && t.date <= week.end && !t.completed)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5),
    [tasks, today, week]
  );
  const monthTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.date > week.end && t.date >= month.start && t.date <= month.end && !t.completed
      ).length,
    [tasks, week, month]
  );

  const completionRate =
    todayTasks.length + completedToday.length > 0
      ? Math.round(
          (completedToday.length / (todayTasks.length + completedToday.length)) * 100
        )
      : 0;

  const topPaddingWeb = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPaddingWeb + 16,
          paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100,
          paddingHorizontal: 20,
          gap: 24,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.dayName, { color: colors.mutedForeground }]}>
              {todayName}, {dateLabel}
            </Text>
            <Text style={[styles.greeting, { color: colors.foreground }]}>{greeting}</Text>
          </View>
          <View
            style={[
              styles.progressCircle,
              { borderColor: completionRate === 100 ? colors.success : colors.primary },
            ]}
          >
            <Text
              style={[
                styles.progressText,
                { color: completionRate === 100 ? colors.success : colors.primary },
              ]}
            >
              {completionRate}%
            </Text>
          </View>
        </View>

        {/* Today */}
        <View>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: colors.today }]} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today</Text>
            <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
              {todayTasks.length} remaining
            </Text>
          </View>

          {todayTasks.length === 0 && completedToday.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Feather name="sun" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Nothing scheduled today.
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                Time to recharge!
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
                <Text
                  style={[styles.completedLabel, { color: colors.mutedForeground }]}
                >
                  {completedToday.length} completed
                </Text>
              )}
            </>
          )}
        </View>

        {/* This Week */}
        <View>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>This Week</Text>
            <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
              {weekTasks.length} upcoming
            </Text>
          </View>

          {weekTasks.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Feather name="calendar" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Clear week ahead!
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                Plan something amazing.
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

        {/* Monthly Goals */}
        <View style={[styles.monthCard, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <View
              style={[styles.sectionDot, { backgroundColor: colors.warning }]}
            />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Month Ahead
            </Text>
          </View>
          <Text style={[styles.monthCount, { color: colors.primary }]}>
            {monthTasks}
          </Text>
          <Text style={[styles.monthLabel, { color: colors.mutedForeground }]}>
            tasks planned for{" "}
            {new Date().toLocaleDateString("en-US", { month: "long" })}
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
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayName: { fontSize: 14, fontWeight: "500", marginBottom: 4 },
  greeting: { fontSize: 24, fontWeight: "700" },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: { fontSize: 14, fontWeight: "700" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", flex: 1 },
  sectionCount: { fontSize: 13 },
  emptyCard: {
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptySubtext: { fontSize: 13 },
  completedLabel: { fontSize: 13, marginTop: 4, marginLeft: 2 },
  monthCard: {
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  monthCount: { fontSize: 48, fontWeight: "800", lineHeight: 52 },
  monthLabel: { fontSize: 15 },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
