import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Receipt, Wallet, ArrowLeftRight, Gift, Users, Plus, Loader2 } from "lucide-react";
import { C, FONT_BODY, FONT_DISPLAY, computeBalances, buildDays, defaultDayFor, loadMyTrips, saveMyTrips, loadDaigou, saveDaigouLocal } from "./lib/helpers";
import { supabaseReady } from "./lib/supabase";
import {
  fetchTrip, fetchMembers, fetchExpenses, fetchSettlements,
  createTrip, joinTrip, addMember, deleteMember, updateTripInfo, updateRate, updateLastCurrency,
  saveExpense, deleteExpense, addSettlement, finalizeSettlement, unfreezeSettlement, subscribeTrip,
} from "./lib/db";
import { Toast } from "./components/ui";
import Landing from "./components/Landing";
import MembersView from "./components/MembersView";
import ExpensesView from "./components/ExpensesView";
import DashboardView from "./components/DashboardView";
import SettlementView from "./components/SettlementView";
import DaigouListView from "./components/DaigouListView";
import AddExpenseModal from "./components/AddExpenseModal";
import AddMemberModal from "./components/AddMemberModal";
import RecordSettlementModal from "./components/RecordSettlementModal";
import { AddDaigouItemModal, DaigouPurchaseModal } from "./components/DaigouModals";

const TABS = [
  { id: "members", label: "旅伴", icon: Users },
  { id: "expenses", label: "花費", icon: Receipt },
  { id: "dashboard", label: "總覽", icon: Wallet },
  { id: "daigou", label: "代購", icon: Gift },
  { id: "settlement", label: "結算", icon: ArrowLeftRight },
];

export default function App() {
  /* ---------------------------------- 「這台裝置」記得的旅程列表 ---------------------------------- */
  const [myTrips, setMyTrips] = useState(() => loadMyTrips());
  const [screen, setScreen] = useState("landing"); // "landing" | "trip"
  const [currentCode, setCurrentCode] = useState(null);
  const [currentMeId, setCurrentMeId] = useState(null);
  const [pendingJoinCode, setPendingJoinCode] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  /* ---------------------------------- 目前旅程資料（來自 Supabase） ---------------------------------- */
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [daigouItems, setDaigouItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [activeTab, setActiveTab] = useState("expenses");
  const [selectedDayId, setSelectedDayId] = useState("pre");

  const [toast, setToast] = useState({ text: "", tone: "info" });
  const toastTimer = useRef(null);
  const showToast = useCallback((text, tone = "info") => {
    setToast({ text, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ text: "", tone: "info" }), 2200);
  }, []);

  /* ---------------------------------- Modal 狀態 ---------------------------------- */
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [settlementSuggestion, setSettlementSuggestion] = useState(null);
  const [daigouItemModalOpen, setDaigouItemModalOpen] = useState(false);
  const [editingDaigouItem, setEditingDaigouItem] = useState(null);
  const [presetTargetName, setPresetTargetName] = useState("");
  const [purchaseModalItem, setPurchaseModalItem] = useState(null);

  /* ---------------------------------- 網址 <-> 旅程代碼 同步 ---------------------------------- */
  useEffect(() => {
    const url = new URL(window.location.href);
    if (currentCode) url.searchParams.set("code", currentCode);
    else url.searchParams.delete("code");
    window.history.replaceState(null, "", url.toString());
  }, [currentCode]);

  // 第一次載入時，如果網址帶著旅程代碼（朋友分享的連結），嘗試自動接續
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get("code");
    if (!codeFromUrl) return;
    const upper = codeFromUrl.trim().toUpperCase();
    const existing = myTrips.find((t) => t.code === upper);
    if (existing) enterTrip(existing.code, existing.meId);
    else setPendingJoinCode(upper);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------- 進入 / 離開旅程 ---------------------------------- */
  function enterTrip(code, meId) {
    setErr("");
    setCurrentCode(code);
    setCurrentMeId(meId);
    setScreen("trip");
    setActiveTab("expenses");
  }

  function leaveTrip() {
    setScreen("landing");
    setCurrentCode(null);
    setCurrentMeId(null);
    setTrip(null);
    setMembers([]);
    setExpenses([]);
    setSettlements([]);
    setDaigouItems([]);
    setLoadError("");
    setPendingJoinCode("");
  }

  function addToMyTrips(code, meId, name, startDate) {
    setMyTrips((prev) => {
      const next = [...prev.filter((t) => t.code !== code), { code, meId, name, startDate: startDate || "" }];
      saveMyTrips(next);
      return next;
    });
  }

  function syncMyTripsMeta(tripData) {
    setMyTrips((prev) => {
      if (!prev.some((t) => t.code === tripData.code)) return prev;
      const next = prev.map((t) => (t.code === tripData.code ? { ...t, name: tripData.name, startDate: tripData.start_date || "" } : t));
      saveMyTrips(next);
      return next;
    });
  }

  function handleRemoveTrip(code) {
    setMyTrips((prev) => {
      const next = prev.filter((t) => t.code !== code);
      saveMyTrips(next);
      return next;
    });
  }

  /* ---------------------------------- 建立 / 加入旅程 ---------------------------------- */
  async function handleCreate({ tripName, baseCurrency, startDate, dayCount, myName }) {
    if (!tripName.trim()) return setErr("請輸入旅程名稱");
    if (!myName.trim()) return setErr("請輸入你的名字");
    setErr("");
    setBusy(true);
    try {
      const { code, meId } = await createTrip({ tripName: tripName.trim(), baseCurrency, startDate, dayCount, myName: myName.trim() });
      addToMyTrips(code, meId, tripName.trim(), startDate);
      enterTrip(code, meId);
    } catch (e) {
      setErr("建立失敗，請檢查網路連線後再試一次");
    }
    setBusy(false);
  }

  async function handleJoin({ joinCode, joinName }) {
    const code = (joinCode || "").trim().toUpperCase();
    if (!code) return setErr("請輸入旅程代碼");
    if (!joinName.trim()) return setErr("請輸入你的名字");
    setErr("");
    setBusy(true);
    try {
      const res = await joinTrip({ code, myName: joinName });
      if (res.notFound) {
        setErr("找不到這個旅程代碼，請向旅伴確認代碼是否正確");
      } else {
        addToMyTrips(code, res.meId, res.trip.name, res.trip.start_date);
        enterTrip(code, res.meId);
      }
    } catch (e) {
      setErr("加入失敗，請檢查網路連線後再試一次");
    }
    setBusy(false);
  }

  /* ---------------------------------- 載入旅程資料 + 即時同步 ---------------------------------- */
  const refreshTimer = useRef(null);
  const refreshAll = useCallback(async (code) => {
    try {
      const [tripData, membersData, expensesData, settlementsData] = await Promise.all([
        fetchTrip(code), fetchMembers(code), fetchExpenses(code), fetchSettlements(code),
      ]);
      if (!tripData) return;
      setTrip(tripData);
      setMembers(membersData);
      setExpenses(expensesData);
      setSettlements(settlementsData);
      syncMyTripsMeta(tripData);
    } catch (e) {
      // 即時同步失敗時保持沉默，等下一次事件或手動操作觸發的重新整理
    }
  }, []);

  const scheduleRefresh = useCallback((code) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => refreshAll(code), 300);
  }, [refreshAll]);

  useEffect(() => {
    if (!currentCode) return;
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    (async () => {
      try {
        const [tripData, membersData, expensesData, settlementsData] = await Promise.all([
          fetchTrip(currentCode), fetchMembers(currentCode), fetchExpenses(currentCode), fetchSettlements(currentCode),
        ]);
        if (cancelled) return;
        if (!tripData) {
          setLoadError("找不到這趟旅程，可能已經被刪除，或代碼有誤");
          setLoading(false);
          return;
        }
        setTrip(tripData);
        setMembers(membersData);
        setExpenses(expensesData);
        setSettlements(settlementsData);
        setDaigouItems(loadDaigou(currentCode));
        setSelectedDayId(defaultDayFor(tripData));
        syncMyTripsMeta(tripData);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setLoadError("連線失敗，請檢查網路連線後重試");
          setLoading(false);
        }
      }
    })();
    const unsubscribe = subscribeTrip(currentCode, () => scheduleRefresh(currentCode));
    return () => {
      cancelled = true;
      unsubscribe();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [currentCode, scheduleRefresh]);

  // 代購清單只存在本機，異動時直接寫回 localStorage
  useEffect(() => {
    if (!currentCode) return;
    saveDaigouLocal(currentCode, daigouItems);
  }, [daigouItems, currentCode]);

  const balances = useMemo(() => (trip ? computeBalances(members, expenses, settlements) : {}), [trip, members, expenses, settlements]);
  const days = useMemo(() => (trip ? buildDays(trip.start_date, trip.day_count) : []), [trip]);
  const previousTargets = useMemo(
    () => Array.from(new Set(daigouItems.map((i) => i.targetName))).sort((a, b) => a.localeCompare(b, "zh-Hant")),
    [daigouItems]
  );

  /* ---------------------------------- 花費 ---------------------------------- */
  const openAddExpense = () => { setEditingExpense(null); setExpenseModalOpen(true); };
  const openEditExpense = (e) => { setEditingExpense(e); setExpenseModalOpen(true); };
  const closeExpenseModal = () => { setExpenseModalOpen(false); setEditingExpense(null); };

  const handleSaveExpense = async (expense, rateUpdate, currencyUsed) => {
    await saveExpense(currentCode, expense, rateUpdate);
    if (currencyUsed) await updateLastCurrency(currentCode, currencyUsed);
    closeExpenseModal();
    scheduleRefresh(currentCode);
    showToast("已儲存花費");
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id);
      scheduleRefresh(currentCode);
      showToast("已刪除這筆花費");
    } catch (e) {
      showToast("刪除失敗，請稍後再試", "error");
    }
  };

  /* ---------------------------------- 旅伴 / 旅程設定 ---------------------------------- */
  const handleSaveMember = async (name) => {
    try {
      await addMember(currentCode, name);
      setMemberModalOpen(false);
      scheduleRefresh(currentCode);
      showToast("已新增旅伴");
    } catch (e) {
      showToast("新增失敗，請稍後再試", "error");
    }
  };

  const handleDeleteMember = async (id) => {
    try {
      await deleteMember(id);
      scheduleRefresh(currentCode);
      showToast("已移除旅伴");
    } catch (e) {
      showToast("移除失敗，請稍後再試", "error");
    }
  };

  const handleUpdateTripInfo = async (name, startDate, dayCount) => {
    try {
      await updateTripInfo(currentCode, { name, startDate, dayCount });
      scheduleRefresh(currentCode);
      showToast("已更新旅程設定");
    } catch (e) {
      showToast("更新失敗，請稍後再試", "error");
    }
  };

  const handleUpdateRate = async (currency, rateValue) => {
    try {
      await updateRate(currentCode, currency, rateValue);
      scheduleRefresh(currentCode);
    } catch (e) {
      showToast("匯率更新失敗，請稍後再試", "error");
    }
  };

  /* ---------------------------------- 結算 ---------------------------------- */
  const openRecordSettlement = (suggestion) => { setSettlementSuggestion(suggestion); setSettlementModalOpen(true); };
  const closeRecordSettlement = () => { setSettlementModalOpen(false); setSettlementSuggestion(null); };

  const handleSaveSettlement = async (s) => {
    try {
      await addSettlement(currentCode, s);
      closeRecordSettlement();
      scheduleRefresh(currentCode);
      showToast("已登記還款");
    } catch (e) {
      showToast("登記失敗，請稍後再試", "error");
    }
  };

  const handleFinalize = async (suggestions) => {
    try {
      await finalizeSettlement(currentCode, suggestions);
      scheduleRefresh(currentCode);
      showToast("已完成旅程總結算");
    } catch (e) {
      showToast("操作失敗，請稍後再試", "error");
    }
  };

  const handleUnfreeze = async () => {
    try {
      await unfreezeSettlement(currentCode);
      scheduleRefresh(currentCode);
      showToast("已解除總結算");
    } catch (e) {
      showToast("操作失敗，請稍後再試", "error");
    }
  };

  /* ---------------------------------- 代購（僅本機，不上雲端） ---------------------------------- */
  const openAddDaigouItem = (presetTarget) => { setEditingDaigouItem(null); setPresetTargetName(presetTarget || ""); setDaigouItemModalOpen(true); };
  const openEditDaigouItem = (item) => { setEditingDaigouItem(item); setPresetTargetName(""); setDaigouItemModalOpen(true); };
  const closeDaigouItemModal = () => { setDaigouItemModalOpen(false); setEditingDaigouItem(null); setPresetTargetName(""); };

  const handleSaveDaigouItem = (item) => {
    setDaigouItems((prev) => (prev.some((i) => i.id === item.id) ? prev.map((i) => (i.id === item.id ? item : i)) : [...prev, item]));
    closeDaigouItemModal();
  };
  const handleDeleteDaigouItem = (id) => setDaigouItems((prev) => prev.filter((i) => i.id !== id));
  const handleUnmarkBought = (id) => setDaigouItems((prev) => prev.map((i) => (i.id === id ? { ...i, bought: false } : i)));
  const handleToggleCollected = (id) =>
    setDaigouItems((prev) => prev.map((i) => (i.id === id && i.purchase ? { ...i, purchase: { ...i.purchase, collected: !i.purchase.collected } } : i)));
  const handleSavePurchase = (purchaseData) => {
    setDaigouItems((prev) => prev.map((i) => (i.id === purchaseModalItem.id ? { ...i, bought: true, purchase: purchaseData } : i)));
    setPurchaseModalItem(null);
  };

  /* ---------------------------------- 尚未設定 Supabase ---------------------------------- */
  if (!supabaseReady) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT_BODY, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.text, marginBottom: 10 }}>尚未設定 Supabase</div>
          <div style={{ fontSize: 13.5, color: C.textSoft, lineHeight: 1.8 }}>
            請在專案根目錄建立 <code>.env</code> 檔（可參考 <code>.env.example</code>），填入 <code>VITE_SUPABASE_URL</code> 與 <code>VITE_SUPABASE_ANON_KEY</code>，儲存後重新啟動網頁即可。
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------- 首頁（旅程口袋清單） ---------------------------------- */
  if (screen === "landing") {
    return (
      <Landing
        myTrips={myTrips}
        onCreate={handleCreate}
        onJoin={handleJoin}
        onResume={enterTrip}
        onRemoveTrip={handleRemoveTrip}
        busy={busy}
        err={err}
        setErr={setErr}
        initialJoinCode={pendingJoinCode}
      />
    );
  }

  /* ---------------------------------- 載入中 / 錯誤 ---------------------------------- */
  if (loading || !trip) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT_BODY, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, padding: 24 }}>
        {loadError ? (
          <>
            <div style={{ fontSize: 14, color: C.danger, textAlign: "center" }}>{loadError}</div>
            <button onClick={leaveTrip} style={{ background: "none", border: "none", color: C.primary, cursor: "pointer", fontSize: 13.5, fontWeight: 600 }}>返回旅程列表</button>
          </>
        ) : (
          <>
            <Loader2 size={26} color={C.primary} className="tl-spin" />
            <div style={{ fontSize: 13, color: C.textSoft }}>載入旅程中…</div>
          </>
        )}
      </div>
    );
  }

  const showFab = activeTab === "expenses" || activeTab === "daigou";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT_BODY, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: C.surface, borderBottom: `1px solid ${C.line}`, padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.name}</div>
            <div style={{ fontSize: 11, color: C.textSoft, marginTop: 1 }}>代碼 {trip.code} · {trip.base_currency} · 即時同步中</div>
          </div>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.success, flexShrink: 0 }} title="即時同步中" />
        </div>
      </div>

      <div style={{ flex: 1, padding: "16px 16px 100px", maxWidth: 640, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {activeTab === "expenses" && (
          <ExpensesView trip={trip} members={members} expenses={expenses} onDelete={handleDeleteExpense} onEdit={openEditExpense} selectedDayId={selectedDayId} onSelectDay={setSelectedDayId} days={days} />
        )}
        {activeTab === "dashboard" && (
          <DashboardView trip={trip} members={members} expenses={expenses} balances={balances} meId={currentMeId} />
        )}
        {activeTab === "settlement" && (
          <SettlementView trip={trip} members={members} balances={balances} settlements={settlements} onOpenRecord={openRecordSettlement} meId={currentMeId} onFinalize={handleFinalize} onUnfreeze={handleUnfreeze} />
        )}
        {activeTab === "daigou" && (
          <DaigouListView
            trip={trip}
            daigouItems={daigouItems}
            onEdit={openEditDaigouItem}
            onDelete={handleDeleteDaigouItem}
            onOpenPurchase={(item) => setPurchaseModalItem(item)}
            onUnmarkBought={handleUnmarkBought}
            onToggleCollected={handleToggleCollected}
            onAddForTarget={openAddDaigouItem}
          />
        )}
        {activeTab === "members" && (
          <MembersView trip={trip} members={members} onAddMember={() => setMemberModalOpen(true)} onLeave={leaveTrip} onUpdateTripInfo={handleUpdateTripInfo} onUpdateRate={handleUpdateRate} onDeleteMember={handleDeleteMember} meId={currentMeId} />
        )}
      </div>

      {showFab && (
        <button
          onClick={() => (activeTab === "expenses" ? openAddExpense() : openAddDaigouItem(""))}
          style={{
            position: "fixed", right: 20, bottom: 84, width: 54, height: 54, borderRadius: "50%",
            background: C.accent, border: "none", boxShadow: "0 6px 18px rgba(63,184,196,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 30,
          }}
        >
          <Plus size={24} color="#fff" />
        </button>
      )}

      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, background: C.surface, borderTop: `1px solid ${C.line}`,
        display: "flex", justifyContent: "space-around", padding: "8px 4px calc(8px + env(safe-area-inset-bottom))", zIndex: 25,
        overflow: "visible",
      }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          if (t.id === "dashboard") {
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex",
                flexDirection: "column", alignItems: "center", gap: 3, padding: 0,
                color: active ? C.primary : C.textSoft,
              }}>
                <div style={{
                  width: 54, height: 54, borderRadius: "50%",
                  background: active ? C.surfaceAlt : C.surface,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: -20, border: `3px solid ${C.surface}`,
                  boxShadow: active ? "0 4px 14px rgba(91,143,168,0.3)" : "0 2px 8px rgba(0,0,0,0.1)",
                }}>
                  <Icon size={24} color={active ? C.primary : C.textSoft} strokeWidth={2.2} />
                </div>
                <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 600, marginTop: 2 }}>{t.label}</span>
              </button>
            );
          }
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3, padding: "4px 10px", color: active ? C.primary : C.textSoft, flex: 1,
            }}>
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {expenseModalOpen && (
        <AddExpenseModal
          trip={trip}
          members={members}
          onClose={closeExpenseModal}
          onSave={handleSaveExpense}
          meId={currentMeId}
          defaultDayId={selectedDayId === "all" ? defaultDayFor(trip) : selectedDayId}
          editingExpense={editingExpense}
          days={days}
        />
      )}
      {memberModalOpen && <AddMemberModal onClose={() => setMemberModalOpen(false)} onSave={handleSaveMember} />}
      {settlementModalOpen && (
        <RecordSettlementModal trip={trip} members={members} suggestion={settlementSuggestion} onClose={closeRecordSettlement} onSave={handleSaveSettlement} meId={currentMeId} />
      )}
      {daigouItemModalOpen && (
        <AddDaigouItemModal editingItem={editingDaigouItem} presetTargetName={presetTargetName} previousTargets={previousTargets} onClose={closeDaigouItemModal} onSave={handleSaveDaigouItem} />
      )}
      {purchaseModalItem && (
        <DaigouPurchaseModal trip={trip} item={purchaseModalItem} onClose={() => setPurchaseModalItem(null)} onSave={handleSavePurchase} />
      )}

      <Toast text={toast.text} tone={toast.tone} />
    </div>
  );
}
