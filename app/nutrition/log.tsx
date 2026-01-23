import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function LogFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date: string; mealType: string }>();
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<any | null>(null);
  const [amount, setAmount] = useState("1");

  const { data: foods = [], isLoading } = trpc.nutrition.searchFoods.useQuery({ query });

  const utils = trpc.useUtils();
  const addLogItem = trpc.nutrition.addLogItem.useMutation({
    onSuccess: () => {
      utils.nutrition.getDailyLog.invalidate();
      Alert.alert("Success", "Food logged!");
      setSelectedFood(null);
      setAmount("1");
      // Optional: go back or stay to add more
      // router.back(); 
    },
    onError: (err) => {
      Alert.alert("Error", err.message);
    }
  });

  const handleLog = () => {
    if (!selectedFood || !amount) return;
    
    addLogItem.mutate({
      date: params.date!,
      mealType: params.mealType as any,
      foodId: selectedFood.id,
      amount: parseFloat(amount),
    });
  };

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: `Add to ${params.mealType}` }} />
      
      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search foods..."
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity onPress={() => router.push("/nutrition/create-food")}>
           <IconSymbol name="plus" size={24} color={colors.tint} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={foods}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.foodItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setSelectedFood(item)}
          >
            <View>
              <Text style={[styles.foodName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.foodDetail, { color: colors.muted }]}>
                {item.brand ? `${item.brand} • ` : ""}{Math.round(item.calories)} kcal / {item.servingSize}{item.servingUnit}
              </Text>
            </View>
            <IconSymbol name="plus.circle" size={24} color={colors.tint} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>No foods found. Try creating one!</Text>
          ) : null
        }
      />

      {/* Amount Modal */}
      <Modal
        visible={!!selectedFood}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedFood(null)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedFood?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedFood(null)}>
                <IconSymbol name="xmark" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.amountContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                Serving Amount (x {selectedFood?.servingSize}{selectedFood?.servingUnit})
              </Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text, borderColor: colors.border }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            
            <View style={styles.summary}>
               <Text style={{ color: colors.text }}>
                 Calories: {selectedFood ? Math.round(selectedFood.calories * (parseFloat(amount) || 0)) : 0}
               </Text>
               <Text style={{ color: colors.text }}>
                 Protein: {selectedFood ? Math.round(selectedFood.protein * (parseFloat(amount) || 0)) : 0}g
               </Text>
            </View>

            <TouchableOpacity 
              style={[styles.logButton, { backgroundColor: colors.tint }]}
              onPress={handleLog}
            >
              <Text style={styles.logButtonText}>Log Food</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  foodItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  foodDetail: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  amountContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
  },
  amountInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
  },
  summary: {
    flexDirection: "row",
    gap: 16,
  },
  logButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  logButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
