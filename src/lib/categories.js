import { Plane, Bed, Utensils, ShoppingBag, Pill, Ticket, MoreHorizontal } from "lucide-react";
import { C } from "./helpers";

export const CATEGORIES = [
  { id: "transport", label: "交通", icon: Plane, color: C.accent },
  { id: "stay", label: "住宿", icon: Bed, color: C.primary },
  { id: "food", label: "餐飲", icon: Utensils, color: C.warn },
  { id: "shopping", label: "購物", icon: ShoppingBag, color: C.secondary },
  { id: "pharmacy", label: "藥妝", icon: Pill, color: "#C98EA0" },
  { id: "fun", label: "娛樂", icon: Ticket, color: C.success },
  { id: "other", label: "其他", icon: MoreHorizontal, color: "#9A8C7A" },
];

export const catMeta = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES.find((c) => c.id === "other");
