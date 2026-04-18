import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Platform,
  PanResponder,
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

const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const START_HOUR = 8;
const END_HOUR = 23;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => i + START_HOUR
);

const BASE_CELL = 52;
const MIN_CELL = 24;
const MAX_CELL = 88;
const TIME_COL_WIDTH = 40;

function getCurrentTimeOffset(cellH: number): number | null {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  if (hour < START_HOUR || hour >= END_HOUR) return null;
  return (hour - START_HOUR + minute / 60) * cellH;
}

function getCurrentDayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export default function ScheduleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    timeBlocks,
    addTimeBlock,
    editTimeBlock,
    deleteTimeBlock,
    copyLastWeekBlocks,
  } = useTasks();

  const [showAdd, setShowAdd] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedHour, setSelectedHour] = useState(9);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | undefined>();

  const [cellHeight, setCellHeight] = useState(BASE_CELL);
  const pinchBaseRef = useRef<number>(BASE_CELL);
  const pinchStartDistRef = useRef<number>(0);

  const scrollRef = useRef<ScrollView>(null);
  const todayIdx = getCurrentDayIndex();
  const timeOffset = getCurrentTimeOffset(cellHeight);
  const topPaddingWeb = Platform.OS === "web" ? 67 : insets.top;

  const zoomIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCellHeight((h) => Math.min(h + 14, MAX_CELL));
  };
  const zoomOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCellHeight((h) => Math.max(h - 14, MIN_CELL));
  };
  const zoomReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCellHeight(BASE_CELL);
  };

  const pinchResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
      onPanResponderGrant: (e) => {
        const touches = e.nativeEvent.touches;
        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          pinchStartDistRef.current = Math.sqrt(dx * dx + dy * dy);
          pinchBaseRef.current = BASE_CELL;
        }
      },
      onPanResponderMove: (e) => {
        const touches = e.nativeEvent.touches;
        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (pinchStartDistRef.current > 0) {
            const scale = dist / pinchStartDistRef.current;
            const newH = Math.min(
              MAX_CELL,
              Math.max(MIN_CELL, pinchBaseRef.current * scale)
            );
            setCellHeight(Math.round(newH));
          }
        }
      },
    })
  ).current;

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

  const showHourLabel = cellHeight >= 36;
  const showBlockTime = cellHeight >= 40;

  const zoomPercent = Math.round(
    ((cellHeight - MIN_CELL) / (MAX_CELL - MIN_CELL)) * 100
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: topPaddingWeb + 14,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>
          课程表
        </Text>

        <View style={styles.topBarRight}>
          {/* Zoom controls */}
          <View style={[styles.zoomGroup, { backgroundColor: colors.muted }]}>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={zoomOut}
              disabled={cellHeight <= MIN_CELL}
            >
              <Feather
                name="minus"
                size={14}
                color={cellHeight <= MIN_CELL ? colors.border : colors.foreground}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={zoomReset}>
              <Text style={[styles.zoomLabel, { color: colors.mutedForeground }]}>
                {zoomPercent}%
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={zoomIn}
              disabled={cellHeight >= MAX_CELL}
            >
              <Feather
                name="plus"
                size={14}
                color={cellHeight >= MAX_CELL ? colors.border : colors.foreground}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.copyBtn, { borderColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              copyLastWeekBlocks();
            }}
          >
            <Feather name="copy" size={13} color={colors.primary} />
            <Text style={[styles.copyBtnText, { color: colors.primary }]}>复制上周</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Day headers */}
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
                  color: i === todayIdx ? colors.primary : colors.mutedForeground,
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

      {/* Grid with pinch support */}
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
        {...(Platform.OS !== "web" ? pinchResponder.panHandlers : {})}
      >
        <View style={styles.gridWrapper}>
          {/* Time column */}
          <View style={{ width: TIME_COL_WIDTH }}>
            {HOURS.map((h) => (
              <View key={h} style={[styles.timeCell, { height: cellHeight }]}>
                {showHourLabel && (
                  <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                    {h}时
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Day columns */}
          {DAYS.map((d, dayIdx) => (
            <View key={d} style={styles.dayColumn}>
              {HOURS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.hourCell,
                    {
                      height: cellHeight,
                      borderColor: colors.border,
                      backgroundColor:
                        dayIdx === todayIdx
                          ? colors.primary + "08"
                          : "transparent",
                    },
                  ]}
                  onPress={() => openAdd(dayIdx, h)}
                />
              ))}

              {(blocksByDay[dayIdx] ?? []).map((block) => {
                const topOffset =
                  (block.startHour - START_HOUR) * cellHeight;
                const blockH = block.durationHours * cellHeight - 2;
                return (
                  <TouchableOpacity
                    key={block.id}
                    style={[
                      styles.block,
                      {
                        top: topOffset,
                        height: Math.max(blockH, 12),
                        backgroundColor: block.color,
                        borderLeftColor: block.textColor,
                      },
                    ]}
                    onPress={() => setEditingBlock(block)}
                    activeOpacity={0.82}
                  >
                    <Text
                      style={[styles.blockTitle, { color: block.textColor }]}
                      numberOfLines={cellHeight > 30 ? 2 : 1}
                    >
                      {block.title}
                    </Text>
                    {showBlockTime && block.durationHours >= 1 && (
                      <Text style={[styles.blockTime, { color: block.textColor }]}>
                        {block.startHour}–{block.startHour + block.durationHours}时
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}

              {dayIdx === todayIdx && timeOffset !== null && (
                <View
                  style={[
                    styles.timeLine,
                    { top: timeOffset, backgroundColor: colors.today },
                  ]}
                >
                  <View style={[styles.timeDot, { backgroundColor: colors.today }]} />
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Zoom hint */}
      {Platform.OS !== "web" && (
        <View
          style={[
            styles.zoomHint,
            {
              backgroundColor: colors.card + "E0",
              bottom: Platform.OS === "web" ? 90 : insets.bottom + 90,
            },
          ]}
        >
          <Text style={[styles.zoomHintText, { color: colors.mutedForeground }]}>
            双指缩放调整视图
          </Text>
        </View>
      )}

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
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  screenTitle: { fontSize: 20, fontWeight: "700", letterSpacing: 0.2 },
  topBarRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  zoomGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    overflow: "hidden",
    height: 32,
  },
  zoomBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomLabel: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 34,
    textAlign: "center",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  copyBtnText: { fontSize: 12, fontWeight: "600" },
  dayHeaders: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayHeaderCell: { flex: 1, alignItems: "center", gap: 3 },
  dayHeaderText: { fontSize: 10 },
  todayDot: { width: 4, height: 4, borderRadius: 2 },
  gridWrapper: { flexDirection: "row" },
  timeCell: {
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingRight: 6,
    paddingTop: 3,
  },
  timeText: { fontSize: 9, fontWeight: "500" },
  dayColumn: { flex: 1, position: "relative" },
  hourCell: { borderTopWidth: StyleSheet.hairlineWidth },
  block: {
    position: "absolute",
    left: 1,
    right: 1,
    borderRadius: 5,
    borderLeftWidth: 2.5,
    paddingHorizontal: 3,
    paddingVertical: 3,
    overflow: "hidden",
  },
  blockTitle: { fontSize: 9, fontWeight: "700", lineHeight: 12 },
  blockTime: { fontSize: 8, lineHeight: 11, marginTop: 1 },
  timeLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1.5,
    borderRadius: 1,
  },
  timeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    position: "absolute",
    left: -3,
    top: -2.5,
  },
  zoomHint: {
    position: "absolute",
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  zoomHintText: { fontSize: 11 },
});
