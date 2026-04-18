import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddTimeBlockModal } from "@/components/AddTimeBlockModal";
import { TimeBlock, useTasks } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START_HOUR = 8;
const END_HOUR = 23;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
const CELL_HEIGHT = 52;
const TIME_COL_WIDTH = 44;

function getCurrentTimeOffset(): number | null {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  if (hour < START_HOUR || hour >= END_HOUR) return null;
  return (hour - START_HOUR + minute / 60) * CELL_HEIGHT;
}

function getCurrentDayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export default function ScheduleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { timeBlocks, addTimeBlock, editTimeBlock, deleteTimeBlock, copyLastWeekBlocks } = useTasks();

  const [showAdd, setShowAdd] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedHour, setSelectedHour] = useState(9);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | undefined>();

  const scrollRef = useRef<ScrollView>(null);

  const timeOffset = getCurrentTimeOffset();
  const todayIdx = getCurrentDayIndex();

  const topPaddingWeb = Platform.OS === "web" ? 67 : insets.top;

  const blocksByDay = useMemo(() => {
    const map: Record<number, TimeBlock[]> = {};
    timeBlocks.forEach((b) => {
      if (!map[b.dayOfWeek]) map[b.dayOfWeek] = [];
      map[b.dayOfWeek].push(b);
    });
    return map;
  }, [timeBlocks]);

  const openAdd = useCallback((day: number, hour: number) => {
    setSelectedDay(day);
    setSelectedHour(hour);
    setShowAdd(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed header */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: topPaddingWeb + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>
          Weekly Schedule
        </Text>
        <TouchableOpacity
          style={[styles.copyBtn, { borderColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            copyLastWeekBlocks();
          }}
        >
          <Feather name="copy" size={14} color={colors.primary} />
          <Text style={[styles.copyBtnText, { color: colors.primary }]}>Copy Week</Text>
        </TouchableOpacity>
      </View>

      {/* Day headers row */}
      <View
        style={[
          styles.dayHeaders,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View style={{ width: TIME_COL_WIDTH }} />
        {DAYS.map((d, i) => (
          <View key={d} style={styles.dayHeaderCell}>
            <Text
              style={[
                styles.dayHeaderText,
                {
                  color:
                    i === todayIdx ? colors.primary : colors.mutedForeground,
                  fontWeight: i === todayIdx ? "700" : "500",
                },
              ]}
            >
              {d}
            </Text>
            {i === todayIdx && (
              <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />
            )}
          </View>
        ))}
      </View>

      {/* Scrollable grid */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100,
        }}
        onLayout={() => {
          if (timeOffset !== null) {
            scrollRef.current?.scrollTo({
              y: Math.max(0, timeOffset - 80),
              animated: true,
            });
          }
        }}
      >
        <View style={styles.gridWrapper}>
          {/* Time column */}
          <View style={{ width: TIME_COL_WIDTH }}>
            {HOURS.map((h) => (
              <View key={h} style={[styles.timeCell, { height: CELL_HEIGHT }]}>
                <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                  {h.toString().padStart(2, "0")}
                </Text>
              </View>
            ))}
          </View>

          {/* Day columns */}
          {DAYS.map((d, dayIdx) => (
            <View key={d} style={styles.dayColumn}>
              {/* Hour cells */}
              {HOURS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.hourCell,
                    {
                      height: CELL_HEIGHT,
                      borderColor: colors.border,
                      backgroundColor:
                        dayIdx === todayIdx
                          ? colors.primary + "06"
                          : "transparent",
                    },
                  ]}
                  onPress={() => openAdd(dayIdx, h)}
                />
              ))}

              {/* Time blocks */}
              {(blocksByDay[dayIdx] ?? []).map((block) => {
                const topOffset = (block.startHour - START_HOUR) * CELL_HEIGHT;
                const blockHeight = block.durationHours * CELL_HEIGHT - 2;
                return (
                  <TouchableOpacity
                    key={block.id}
                    style={[
                      styles.block,
                      {
                        top: topOffset,
                        height: blockHeight,
                        backgroundColor: block.color,
                        borderLeftColor: block.textColor,
                      },
                    ]}
                    onPress={() => setEditingBlock(block)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[styles.blockTitle, { color: block.textColor }]}
                      numberOfLines={2}
                    >
                      {block.title}
                    </Text>
                    {block.durationHours >= 1 && (
                      <Text style={[styles.blockTime, { color: block.textColor }]}>
                        {block.startHour.toString().padStart(2, "0")}:00–
                        {(block.startHour + block.durationHours)
                          .toString()
                          .padStart(2, "0")}
                        :00
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Current time line */}
              {dayIdx === todayIdx && timeOffset !== null && (
                <View
                  style={[
                    styles.currentTimeLine,
                    { top: timeOffset, backgroundColor: colors.today },
                  ]}
                >
                  <View style={[styles.currentTimeDot, { backgroundColor: colors.today }]} />
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <AddTimeBlockModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={(b) => addTimeBlock(b)}
        defaultDay={selectedDay}
        defaultHour={selectedHour}
      />
      <AddTimeBlockModal
        visible={!!editingBlock}
        editBlock={editingBlock}
        onClose={() => setEditingBlock(undefined)}
        onSave={(b) => {
          if (editingBlock) editTimeBlock(editingBlock.id, b);
        }}
        onDelete={() => {
          if (editingBlock) deleteTimeBlock(editingBlock.id);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  screenTitle: { fontSize: 22, fontWeight: "700" },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  copyBtnText: { fontSize: 13, fontWeight: "600" },
  dayHeaders: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  dayHeaderText: { fontSize: 12 },
  todayDot: { width: 4, height: 4, borderRadius: 2 },
  gridWrapper: { flexDirection: "row" },
  timeCell: {
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingRight: 8,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  timeText: { fontSize: 10, fontWeight: "500" },
  dayColumn: { flex: 1, position: "relative" },
  hourCell: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  block: {
    position: "absolute",
    left: 1,
    right: 1,
    borderRadius: 6,
    borderLeftWidth: 3,
    paddingHorizontal: 4,
    paddingVertical: 3,
    overflow: "hidden",
  },
  blockTitle: { fontSize: 10, fontWeight: "700", lineHeight: 13 },
  blockTime: { fontSize: 9, fontWeight: "400", lineHeight: 12, marginTop: 1 },
  currentTimeLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
    left: -4,
    top: -3,
  },
});
