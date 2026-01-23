import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TYPES = ["High", "Medium", "Low"];

export default function NutritionSettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  
  const { data: settings, isLoading } = trpc.nutrition.getSettings.useQuery();
  const utils = trpc.useUtils();
  
  const updateMutation = trpc.nutrition.updateSettings.useMutation({
    onSuccess: () => {
      utils.nutrition.getSettings.invalidate();
      Alert.alert("Success", "Settings saved");
    },
    onError: (err) => {
      Alert.alert("Error", err.message);
    }
  });

  const [enabled, setEnabled] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, string>>({});
  const [targets, setTargets] = useState<Record<string, { protein: string; carbs: string; fat: string }>>({
    High: { protein: "150", carbs: "300", fat: "50" },
    Medium: { protein: "150", carbs: "200", fat: "60" },
    Low: { protein: "180", carbs: "50", fat: "80" },
  });

  useEffect(() => {
    if (settings) {
      setEnabled(true);
      if (settings.cycleSchedule) setSchedule(settings.cycleSchedule as any);
      if (settings.macroTargets) {
         // Convert numbers to strings for inputs
         const t = settings.macroTargets as any;
         const newTargets: any = {};
         for (const type of TYPES) {
           if (t[type]) {
             newTargets[type] = {
               protein: String(t[type].protein),
               carbs: String(t[type].carbs),
               fat: String(t[type].fat),
             };
           }
         }
         setTargets(prev => ({ ...prev, ...newTargets }));
      }
    } else {
      // Default schedule
      const defSchedule: any = {};
      DAYS.forEach(d => defSchedule[d] = "Medium");
      setSchedule(defSchedule);
    }
  }, [settings]);

  const handleSave = () => {
    if (!enabled) {
      // Logic to disable/delete not implemented in backend explicitly, 
      // but we can just ignore it or add a delete mutation.
      // For now, let's just save the state.
      Alert.alert("Info", "Carb cycling disabled (UI only for now)");
      return;
    }

    // Convert strings back to numbers
    const apiTargets: any = {};
    for (const type of TYPES) {
      apiTargets[type] = {
        protein: parseFloat(targets[type].protein) || 0,
        carbs: parseFloat(targets[type].carbs) || 0,
        fat: parseFloat(targets[type].fat) || 0,
      };
    }

    updateMutation.mutate({
      cycleType: "weekly",
      cycleSchedule: schedule,
      macroTargets: apiTargets,
    });
  };

  const updateTarget = (type: string, field: string, value: string) => {
    setTargets(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Carb Cycling</Text>
          <Switch value={enabled} onValueChange={setEnabled} />
        </View>

        {enabled && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Schedule</Text>
              {DAYS.map(day => (
                <View key={day} style={[styles.scheduleRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.dayName, { color: colors.text }]}>{day}</Text>
                  <View style={styles.typeSelector}>
                    {TYPES.map(type => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeButton,
                          schedule[day] === type && { backgroundColor: colors.tint }
                        ]}
                        onPress={() => setSchedule(prev => ({ ...prev, [day]: type }))}
                      >
                        <Text style={[
                          styles.typeText,
                          schedule[day] === type ? { color: "white" } : { color: colors.text }
                        ]}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Macro Targets</Text>
              {TYPES.map(type => (
                <View key={type} style={[styles.targetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.targetTitle, { color: colors.text }]}>{type} Day</Text>
                  <View style={styles.macroInputs}>
                    <View style={styles.macroInput}>
                      <Text style={[styles.inputLabel, { color: colors.muted }]}>Protein</Text>
                      <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                        value={targets[type].protein}
                        onChangeText={v => updateTarget(type, "protein", v)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={styles.macroInput}>
                      <Text style={[styles.inputLabel, { color: colors.muted }]}>Carbs</Text>
                      <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                        value={targets[type].carbs}
                        onChangeText={v => updateTarget(type, "carbs", v)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={styles.macroInput}>
                      <Text style={[styles.inputLabel, { color: colors.muted }]}>Fat</Text>
                      <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                        value={targets[type].fat}
                        onChangeText={v => updateTarget(type, "fat", v)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.tint }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dayName: {
    fontSize: 16,
    width: 100,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  typeText: {
    fontSize: 12,
  },
  targetCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  targetTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  macroInputs: {
    flexDirection: "row",
    gap: 12,
  },
  macroInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
