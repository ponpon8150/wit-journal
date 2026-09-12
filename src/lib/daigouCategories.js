import { Sparkles, Pill, Cookie, Shirt, Smartphone, Gift, MoreHorizontal } from "lucide-react";
import { C } from "./helpers";

export const DAIGOU_CATEGORIES = [
  { id: "beauty", label: "美妝保養", icon: Sparkles, color: "#C98EA0" },
  { id: "pharmacy", label: "藥妝保健", icon: Pill, color: C.primary },
  { id: "snack", label: "零食", icon: Cookie, color: C.warn },
  { id: "fashion", label: "服飾配件", icon: Shirt, color: C.secondary },
  { id: "electronics", label: "3C電器", icon: Smartphone, color: C.accent },
  { id: "gift", label: "伴手禮", icon: Gift, color: C.success },
  { id: "other", label: "其他", icon: MoreHorizontal, color: "#9A8C7A" },
];

export const daigouCatMeta = (id) => DAIGOU_CATEGORIES.find((c) => c.id === id) || DAIGOU_CATEGORIES.find((c) => c.id === "other");
