// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 */
const MAPPING = {
  // Tab bar icons
  "house.fill": "home",
  "dumbbell.fill": "fitness-center",
  "calendar": "calendar-today",
  "fork.knife": "restaurant",
  "person.fill": "person",
  // Navigation icons
  "chevron.left": "chevron-left",
  "chevron.right": "chevron-right",
  "chevron.down": "keyboard-arrow-down",
  "chevron.up": "keyboard-arrow-up",
  // Action icons
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "minus": "remove",
  "minus.circle.fill": "remove-circle",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "checkmark": "check",
  "checkmark.circle.fill": "check-circle",
  "trash": "delete",
  "trash.fill": "delete",
  "pencil": "edit",
  "pencil.circle.fill": "edit",
  // Timer icons
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
  "arrow.counterclockwise": "replay",
  "timer": "timer",
  // Content icons
  "list.bullet": "list",
  "square.grid.2x2": "grid-view",
  "doc.text": "description",
  "chart.bar": "bar-chart",
  "chart.line.uptrend.xyaxis": "show-chart",
  // AI icons
  "brain": "psychology",
  "bubble.left.and.bubble.right": "chat",
  "paperplane.fill": "send",
  // Settings icons
  "gearshape.fill": "settings",
  "arrow.up.doc": "upload-file",
  "arrow.down.doc": "download",
  "info.circle": "info",
  // Body/Health icons
  "figure.stand": "accessibility",
  "scalemass": "monitor-weight",
  "heart.fill": "favorite",
  // Misc
  "magnifyingglass": "search",
  "ellipsis": "more-horiz",
  "ellipsis.vertical": "more-vert",
  "star": "star-outline",
  "star.fill": "star",
  "flame.fill": "local-fire-department",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name] || "help-outline";
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
