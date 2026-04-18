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

import { SUBJECT_COLORS, SUBJECT_TEXT_COLORS, Task } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

const SUBJECTS = Object.keys(SUBJECT_COLORS);
const PRIORITIES: Task["priority"][] = ["低", "中", "高"];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, "id" | "completed">) => void;
  defaultDate?: string;
  editTask?: Task;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function AddTaskModal({ visible, onClose, onSave, defaultDate, editTask }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("其他");
  const [date, setDate] = useState(defaultDate ?? todayStr());
  const [priority, setPriority] = useState<Task["priority"]>("中");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setSubject(editTask.subject);
      setDate(editTask.date);
      setPriority(editTask.priority);
      setNotes(editTask.notes ?? "");
    } else {
      setTitle("");
      setSubject("其他");
      setDate(defaultDate ?? todayStr());
      setPriority("中");
      setNotes("");
    }
  }, [editTask, defaultDate, visible]);

  const handleSave = () => {
    if (!title.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave({ title: title.trim(), subject, date, priority, notes });
    onClose();
  };

  const PRIORITY_COLORS: Record<Task["priority"], string> = {
    低: "#8FAF96",
    中: "#C4A882",
    高: "#B88A8A",
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
            {
              backgroundColor: colors.card,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.separator }]} />

          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {editTask ? "编辑任务" : "新建任务"}
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
              placeholder="任务名称..."
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="done"
            />

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>学科</Text>
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
                          {
                            backgroundColor: bg,
                            borderWidth: selected ? 1.5 : 0,
                            borderColor: tc,
                          },
                        ]}
                        onPress={() => setSubject(s)}
                      >
                        <Text style={[styles.subjectChipText, { color: tc }]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>优先级</Text>
              <View style={[styles.row, { marginTop: 8 }]}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityBtn,
                      {
                        backgroundColor:
                          priority === p ? PRIORITY_COLORS[p] : colors.muted,
                      },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        { color: priority === p ? "#fff" : colors.mutedForeground },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>日期</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.muted, color: colors.foreground, marginTop: 8 },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
                value={date}
                onChangeText={setDate}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>备注（选填）</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.notesInput,
                  { backgroundColor: colors.muted, color: colors.foreground, marginTop: 8 },
                ]}
                placeholder="添加备注..."
                placeholderTextColor={colors.mutedForeground}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: title.trim() ? colors.primary : colors.border },
              ]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Text style={[styles.saveBtnText, { color: "#fff" }]}>
                {editTask ? "保存修改" : "添加任务"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(44,42,40,0.3)",
  },
  keyboardView: {
    justifyContent: "flex-end",
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    fontSize: 15,
    letterSpacing: 0.1,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  subjectChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
  },
  subjectChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
  },
  priorityText: {
    fontSize: 14,
    fontWeight: "600",
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
