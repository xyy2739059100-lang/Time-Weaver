import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SUBJECT_COLORS, SUBJECT_TEXT_COLORS, TimeBlock } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

const SUBJECTS = Object.keys(SUBJECT_COLORS);
const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 8);
const DURATIONS = [1, 1.5, 2, 2.5, 3];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (block: Omit<TimeBlock, "id">) => void;
  onDelete?: () => void;
  defaultDay?: number;
  defaultHour?: number;
  editBlock?: TimeBlock;
}

export function AddTimeBlockModal({
  visible,
  onClose,
  onSave,
  onDelete,
  defaultDay = 0,
  defaultHour = 9,
  editBlock,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("其他");
  const [dayOfWeek, setDayOfWeek] = useState(defaultDay);
  const [startHour, setStartHour] = useState(defaultHour);
  const [durationHours, setDurationHours] = useState(1);

  useEffect(() => {
    if (editBlock) {
      setTitle(editBlock.title);
      setSubject(editBlock.subject);
      setDayOfWeek(editBlock.dayOfWeek);
      setStartHour(editBlock.startHour);
      setDurationHours(editBlock.durationHours);
    } else {
      setTitle("");
      setSubject("其他");
      setDayOfWeek(defaultDay);
      setStartHour(defaultHour);
      setDurationHours(1);
    }
  }, [editBlock, defaultDay, defaultHour, visible]);

  const handleSave = () => {
    if (!title.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave({
      title: title.trim(),
      subject,
      dayOfWeek,
      startHour,
      durationHours,
      color: SUBJECT_COLORS[subject] ?? SUBJECT_COLORS["其他"],
      textColor: SUBJECT_TEXT_COLORS[subject] ?? SUBJECT_TEXT_COLORS["其他"],
    });
    onClose();
  };

  const formatHour = (h: number) => {
    const hour = Math.floor(h);
    const min = h % 1 === 0.5 ? "30" : "00";
    return `${hour.toString().padStart(2, "0")}:${min}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.separator }]} />

          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {editBlock ? "编辑时间块" : "添加时间块"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 16, paddingHorizontal: 20 }}
          >
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.muted, color: colors.foreground },
              ]}
              placeholder="如：高等数学、自习时间..."
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>学科颜色</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                <View style={styles.row}>
                  {SUBJECTS.map((s) => {
                    const bg = SUBJECT_COLORS[s];
                    const tc = SUBJECT_TEXT_COLORS[s];
                    const selected = s === subject;
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.subjectChip,
                          { backgroundColor: bg, borderWidth: selected ? 1.5 : 0, borderColor: tc },
                        ]}
                        onPress={() => setSubject(s)}
                      >
                        <Text style={[styles.subjectChipText, { color: tc }]}>{s}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>星期</Text>
              <View style={[styles.row, { marginTop: 8, flexWrap: "wrap" }]}>
                {DAYS.map((d, i) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.dayBtn,
                      {
                        backgroundColor: dayOfWeek === i ? colors.primary : colors.muted,
                      },
                    ]}
                    onPress={() => setDayOfWeek(i)}
                  >
                    <Text
                      style={{
                        color: dayOfWeek === i ? "#fff" : colors.foreground,
                        fontWeight: "600",
                        fontSize: 13,
                      }}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>开始时间</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                <View style={styles.row}>
                  {HOURS.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[
                        styles.hourBtn,
                        {
                          backgroundColor: startHour === h ? colors.primary : colors.muted,
                        },
                      ]}
                      onPress={() => setStartHour(h)}
                    >
                      <Text
                        style={{
                          color: startHour === h ? "#fff" : colors.foreground,
                          fontWeight: "500",
                          fontSize: 12,
                        }}
                      >
                        {formatHour(h)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>时长</Text>
              <View style={[styles.row, { marginTop: 8 }]}>
                {DURATIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.durationBtn,
                      {
                        backgroundColor: durationHours === d ? colors.primary : colors.muted,
                      },
                    ]}
                    onPress={() => setDurationHours(d)}
                  >
                    <Text
                      style={{
                        color: durationHours === d ? "#fff" : colors.foreground,
                        fontWeight: "500",
                        fontSize: 12,
                      }}
                    >
                      {d}小时
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {editBlock && onDelete && (
              <TouchableOpacity
                style={[styles.deleteBtn, { borderColor: colors.destructive }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onDelete();
                  onClose();
                }}
              >
                <Text style={{ color: colors.destructive, fontWeight: "600", fontSize: 15 }}>
                  删除时间块
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: title.trim() ? colors.primary : colors.border },
              ]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 }}>
                {editBlock ? "保存修改" : "添加时间块"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(44,42,40,0.3)" },
  keyboardView: { justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 12,
    maxHeight: "92%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", letterSpacing: 0.2 },
  input: { paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12, fontSize: 15 },
  label: { fontSize: 11, fontWeight: "600", letterSpacing: 0.8 },
  row: { flexDirection: "row", gap: 8 },
  subjectChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20 },
  subjectChipText: { fontSize: 13, fontWeight: "600" },
  dayBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 },
  hourBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  durationBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: "center" },
  deleteBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
  },
  saveBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center", marginBottom: 4 },
});
