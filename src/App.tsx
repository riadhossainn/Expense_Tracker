import { useEffect, useMemo, useRef, useState } from "react";
import {
  type Tx,
  type TxType,
  catOf,
  clearTxs,
  daysInMonth,
  exportCSV,
  fmtDay,
  fmtMoney,
  fmtMoney0,
  loadBudget,
  loadTxs,
  monthKeyOf,
  monthLabel,
  MONTHS,
  newId,
  saveBudget,
  saveTxs,
  seedData,
  toISO,
  todayISO,
} from "./data";
import { Icon, LogoMark, type IconName } from "./icons";
import { ConfirmModal, CountUp, ToastHost, type ToastItem, type ToastTone } from "./ui";
import { DailyBars, type DayPoint, Ring, Sparkline } from "./charts";
import { TransactionForm, type TxDraft } from "./TransactionForm";

/* ------------------------------ small pieces ------------------------------ */

function StatMini({
  label,
  value,
  sub,
  icon,
  tint,
  delay,
}: {
  label: string;
  value: string;
  sub: string;
  icon: IconName;
  tint: string;
  delay: number;
}) {
  return (
    <div className="panel p-4 rise" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2">
        <span className={`grid h-7 w-7 place-items-center rounded-md border ${tint}`}>
          <Icon name={icon} size={14} strokeWidth={2} />
        </span>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-fog-500">{label}</p>
      </div>
      <p className="mt-2.5 font-mono text-[19px] font-semibold leading-none text-fog-100">{value}</p>
      <p className="mt-1.5 text-[11.5px] text-fog-500">{sub}</p>
    </div>
  );
}

function CatDot({ id, size = 36 }: { id: string; size?: number }) {
  const c = catOf(id);
  return (
    <span
      className="grid shrink-0 place-items-center rounded-lg"
      style={{ width: size, height: size, background: `${c.color}1c`, color: c.color }}
    >
      <Icon name={c.icon} size={size * 0.46} strokeWidth={2} />
    </span>
  );
}

const QUICK_ADDS = [
  { label: "Coffee", amount: 5.25, categoryId: "dining", merchant: "Blue Bottle Coffee" },
  { label: "Lunch", amount: 14.5, categoryId: "dining", merchant: "Chipotle" },
  { label: "Groceries", amount: 62.4, categoryId: "groceries", merchant: "Trader Joe's" },
  { label: "Metro", amount: 2.75, categoryId: "transport", merchant: "Metro Transit" },
];

const GIT_CMDS = [
  "git init && git add . && git commit -m \"expense-tracker: first commit\"",
  "git branch -M main",
  "git remote add origin git@github.com:YOUR_USERNAME/expense-tracker.git",
  "git push -u origin main",
];

/* ----------------------------------- app ----------------------------------- */

export default function App() {
  const [txs, setTxs] = useState<Tx[]>(() => loadTxs());
  const [budget, setBudget] = useState<number>(() => loadBudget());
  const [view, setView] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TxType>("all");
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tx | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [budgetEditing, setBudgetEditing] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState("");
  const toastSeq = useRef(0);

  useEffect(() => saveTxs(txs), [txs]);

  const now = new Date();
  const isCurrentMonth = view.y === now.getFullYear() && view.m === now.getMonth();
  const viewKey = `${view.y}-${String(view.m + 1).padStart(2, "0")}`;
  const dim = daysInMonth(view.y, view.m);

  /* ------------------------------- derived ------------------------------- */

  const monthTxs = useMemo(
    () =>
      txs
        .filter((t) => monthKeyOf(t.date) === viewKey)
        .sort((a, b) => (a.date === b.date ? b.created - a.created : a.date < b.date ? 1 : -1)),
    [txs, viewKey]
  );

  const income = useMemo(() => monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0), [monthTxs]);
  const spent = useMemo(() => monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0), [monthTxs]);
  const incomeCount = monthTxs.filter((t) => t.type === "income").length;
  const expenseCount = monthTxs.filter((t) => t.type === "expense").length;

  const prevInfo = useMemo(() => {
    const d = new Date(view.y, view.m - 1, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const limitDay = isCurrentMonth ? now.getDate() : 99;
    let s = 0;
    txs.forEach((t) => {
      if (monthKeyOf(t.date) === key && t.type === "expense" && Number(t.date.slice(8)) <= limitDay) s += t.amount;
    });
    return { s, name: MONTHS[d.getMonth()] };
  }, [txs, view.y, view.m, isCurrentMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const delta = prevInfo.s > 0 ? (spent - prevInfo.s) / prevInfo.s : null;

  const balance = useMemo(
    () => txs.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0),
    [txs]
  );

  const spark = useMemo(() => {
    const pts: number[] = [];
    let cum = 0;
    for (let i = 13; i >= 0; i--) {
      const iso = toISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
      cum += txs.filter((t) => t.date === iso).reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
      pts.push(cum);
    }
    return pts;
  }, [txs]); // eslint-disable-line react-hooks/exhaustive-deps
  const net14 = spark[spark.length - 1] - spark[0];

  const byDay = useMemo(() => {
    const arr: DayPoint[] = Array.from({ length: dim }, (_, i) => ({ day: i + 1, total: 0 }));
    monthTxs.forEach((t) => {
      if (t.type === "expense") arr[Number(t.date.slice(8)) - 1].total += t.amount;
    });
    return arr.map((d) => ({ ...d, total: Math.round(d.total * 100) / 100 }));
  }, [monthTxs, dim]);

  const activeDays = byDay.filter((d) => d.total > 0).length;
  const dailyAvg = spent / Math.max(1, isCurrentMonth ? now.getDate() : dim);
  const avgPerActive = activeDays > 0 ? spent / activeDays : 0;

  const byCat = useMemo(() => {
    const m = new Map<string, { sum: number; count: number }>();
    monthTxs.forEach((t) => {
      if (t.type !== "expense") return;
      const e = m.get(t.categoryId) ?? { sum: 0, count: 0 };
      e.sum += t.amount;
      e.count++;
      m.set(t.categoryId, e);
    });
    return [...m.entries()]
      .map(([id, v]) => ({ cat: catOf(id), ...v }))
      .sort((a, b) => b.sum - a.sum);
  }, [monthTxs]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return monthTxs.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (catFilter && t.categoryId !== catFilter) return false;
      if (needle) {
        const hay = `${t.merchant} ${t.note} ${catOf(t.categoryId).label}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [monthTxs, q, typeFilter, catFilter]);

  const savingsRate = income > 0 ? ((income - spent) / income) * 100 : null;
  const budgetPct = budget > 0 ? spent / budget : 0;
  const budgetState =
    budgetPct > 1
      ? { label: "Over budget", cls: "bg-coral-400/12 text-coral-300 border-coral-400/25", ring: "#f27059" }
      : budgetPct > 0.8
        ? { label: "Getting tight", cls: "bg-gold-400/12 text-gold-300 border-gold-400/25", ring: "#f2b33d" }
        : { label: "On track", cls: "bg-lime-400/12 text-lime-300 border-lime-400/25", ring: "#c0ef5e" };

  const insights = useMemo(() => {
    const expenses = monthTxs.filter((t) => t.type === "expense");
    const biggest = expenses.reduce<Tx | null>((a, t) => (!a || t.amount > a.amount ? t : a), null);
    const coffees = expenses.filter((t) => /coffee|starbucks|espresso|blue bottle/i.test(`${t.merchant} ${t.note}`)).length;
    const merch = new Map<string, number>();
    expenses.forEach((t) => merch.set(t.merchant, (merch.get(t.merchant) ?? 0) + 1));
    const topMerch = [...merch.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
    return { biggest, coffees, topMerch };
  }, [monthTxs]);

  /* ------------------------------- handlers ------------------------------- */

  const pushToast = (msg: string, tone: ToastTone = "ok", actionLabel?: string, onAction?: () => void) => {
    const id = ++toastSeq.current;
    setToasts((t) => [...t.slice(-2), { id, msg, tone, actionLabel, onAction }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), actionLabel ? 6500 : 4200);
  };
  const dismissToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const jumpToTxMonth = (dateIso: string) => {
    if (monthKeyOf(dateIso) !== viewKey) {
      const [yy, mm] = dateIso.split("-").map(Number);
      setView({ y: yy, m: mm - 1 });
    }
  };

  const upsert = (draft: TxDraft) => {
    if (draft.id) {
      const id = draft.id;
      setTxs((prev) => prev.map((t) => (t.id === id ? { ...t, ...draft, id } : t)));
      pushToast(`Updated · ${draft.merchant} · ${fmtMoney(draft.amount)}`, "info");
    } else {
      const tx: Tx = { ...draft, id: newId(), created: Date.now() };
      setTxs((prev) => [tx, ...prev]);
      pushToast(`${draft.type === "expense" ? "Expense" : "Income"} added · ${draft.merchant} · ${fmtMoney(draft.amount)}`, "ok");
    }
    jumpToTxMonth(draft.date);
    setFormOpen(false);
    setEditing(null);
  };

  const removeTx = (tx: Tx) => {
    setTxs((prev) => prev.filter((t) => t.id !== tx.id));
    pushToast(`Deleted · ${tx.merchant} · ${fmtMoney(tx.amount)}`, "danger", "Undo", () =>
      setTxs((prev) => [tx, ...prev])
    );
  };

  const resetAll = () => {
    clearTxs();
    setTxs([]);
    pushToast("All data cleared from this browser", "info", "Load sample data", () => setTxs(seedData()));
  };

  const loadSample = () => {
    setTxs(seedData());
    pushToast("Sample data loaded — explore, then reset anytime", "ok");
  };

  const doExport = () => {
    if (monthTxs.length === 0) {
      pushToast(`Nothing to export in ${monthLabel(view.y, view.m)}`, "info");
      return;
    }
    exportCSV(monthTxs, monthLabel(view.y, view.m));
    pushToast(`Exported ${monthTxs.length} transactions to CSV`, "ok");
  };

  const copyCmd = (cmd: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(cmd).then(
        () => pushToast("Command copied to clipboard", "ok"),
        () => pushToast("Couldn't copy — select the text manually", "danger")
      );
    } else {
      pushToast("Clipboard unavailable in this browser", "danger");
    }
  };

  const commitBudget = () => {
    const n = Number.parseFloat(budgetDraft);
    if (Number.isFinite(n) && n > 0) {
      setBudget(n);
      saveBudget(n);
      setBudgetEditing(false);
      pushToast(`Monthly budget set to ${fmtMoney0(n)}`, "ok");
    } else {
      pushToast("Enter a budget greater than zero", "danger");
    }
  };

  const clearFilters = () => {
    setQ("");
    setTypeFilter("all");
    setCatFilter(null);
  };

  /* --------------------------------- render --------------------------------- */

  return (
    <div className="min-h-screen">
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-pine-900/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <LogoMark size={32} />
            <div className="flex items-baseline gap-2.5">
              <span className="font-display text-[21px] font-bold tracking-tight text-fog-100">Ledge</span>
              <span className="hidden rounded-md border border-lime-400/25 bg-lime-400/8 px-2 py-0.5 font-mono text-[10px] text-lime-300 sm:inline">
                expense-tracker
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <a
              href="#ship"
              className="hidden items-center gap-2 rounded-lg border border-white/8 px-3.5 py-2 text-[13px] font-semibold text-fog-300 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-fog-100 sm:flex"
            >
              <Icon name="github" size={16} />
              Ship to GitHub
            </a>
            <button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-lime-400 px-3.5 py-2 text-[13px] font-bold text-pine-950 shadow-[0_6px_22px_-8px_rgba(192,239,94,0.55)] transition-all hover:bg-lime-300 active:scale-[0.96]"
            >
              <Icon name="plus" size={15} strokeWidth={2.6} />
              New transaction
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {/* month header */}
        <div className="flex flex-wrap items-end justify-between gap-4 pt-8 pb-6">
          <div className="rise" style={{ animationDelay: "20ms" }}>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setView((v) => {
                  const d = new Date(v.y, v.m - 1, 1);
                  return { y: d.getFullYear(), m: d.getMonth() };
                })}
                aria-label="Previous month"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/8 text-fog-400 transition-all hover:border-white/20 hover:bg-white/5 hover:text-fog-100 active:scale-95"
              >
                <Icon name="chevron-left" size={16} strokeWidth={2.2} />
              </button>
              <h1 className="font-display text-[32px] sm:text-[38px] font-bold leading-none tracking-tight text-fog-100">
                {monthLabel(view.y, view.m)}
              </h1>
              <button
                onClick={() => setView((v) => {
                  const d = new Date(v.y, v.m + 1, 1);
                  return { y: d.getFullYear(), m: d.getMonth() };
                })}
                aria-label="Next month"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/8 text-fog-400 transition-all hover:border-white/20 hover:bg-white/5 hover:text-fog-100 active:scale-95"
              >
                <Icon name="chevron-right" size={16} strokeWidth={2.2} />
              </button>
              {!isCurrentMonth && (
                <button
                  onClick={() => setView({ y: now.getFullYear(), m: now.getMonth() })}
                  className="rounded-lg border border-lime-400/30 bg-lime-400/8 px-2.5 py-1.5 font-mono text-[11px] text-lime-300 transition-all hover:bg-lime-400/15 active:scale-95"
                >
                  → today
                </button>
              )}
            </div>
            <p className="mt-2.5 text-[14.5px] text-fog-400">
              Spent{" "}
              <span className="font-mono font-semibold text-fog-100">{fmtMoney(spent)}</span>
              {" "}across {expenseCount} payment{expenseCount === 1 ? "" : "s"}
              {delta !== null && (
                <span className={delta <= 0 ? "text-mint-400" : "text-coral-300"}>
                  {" · "}
                  {Math.abs(Math.round(delta * 100))}% {delta <= 0 ? "under" : "over"} {prevInfo.name}
                  {isCurrentMonth ? " (same period)" : ""}
                </span>
              )}
            </p>
          </div>
          <div className="rise flex items-center gap-2.5" style={{ animationDelay: "60ms" }}>
            <button
              onClick={doExport}
              className="flex items-center gap-2 rounded-lg border border-white/8 px-3.5 py-2.5 text-[13px] font-semibold text-fog-300 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-fog-100"
            >
              <Icon name="download" size={15} />
              Export CSV
            </button>
          </div>
        </div>

        {/* stat strip */}
        <div className="grid grid-cols-12 gap-4">
          {/* balance */}
          <section className="panel rise p-6 col-span-12 lg:col-span-6" style={{ animationDelay: "90ms" }}>
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fog-500">Net balance</p>
              <span className="flex items-center gap-1.5 rounded-md border border-white/8 px-2 py-1 font-mono text-[10px] text-fog-500">
                <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-lime-400" />
                all-time
              </span>
            </div>
            <CountUp
              value={balance}
              format={(n) => (n < 0 ? "−" : "") + fmtMoney(Math.abs(n))}
              className={`mt-2 block font-mono text-[40px] sm:text-[46px] font-semibold leading-none tracking-tight ${
                balance >= 0 ? "text-fog-100" : "text-coral-300"
              }`}
            />
            <div className="mt-5 flex items-end justify-between gap-5">
              <div className="min-w-0 flex-1">
                <Sparkline points={spark} color={net14 >= 0 ? "#c0ef5e" : "#f27059"} id="bal" height={54} />
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog-600">14-day trend</p>
                <p className={`mt-0.5 font-mono text-[13.5px] font-semibold ${net14 >= 0 ? "text-lime-300" : "text-coral-300"}`}>
                  {net14 >= 0 ? "+" : "−"}
                  {fmtMoney(Math.abs(net14))}
                </p>
              </div>
            </div>
          </section>

          {/* budget */}
          <section className="panel rise col-span-12 p-5 sm:col-span-6 lg:col-span-3" style={{ animationDelay: "140ms" }}>
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fog-500">Budget</p>
              <span className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold ${budgetState.cls}`}>
                {budgetState.label}
              </span>
            </div>
            <div className="mt-3 flex justify-center">
              <Ring pct={budgetPct} color={budgetState.ring} size={128} stroke={11}>
                <div className="text-center">
                  <p className="font-mono text-[24px] font-semibold leading-none text-fog-100">
                    {Math.round(budgetPct * 100)}%
                  </p>
                  <p className="mt-1 font-mono text-[9.5px] uppercase tracking-widest text-fog-600">used</p>
                </div>
              </Ring>
            </div>
            <div className="mt-3 text-center">
              {budgetEditing ? (
                <form
                  className="flex items-center justify-center gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    commitBudget();
                  }}
                >
                  <span className="font-mono text-[13px] text-fog-500">$</span>
                  <input
                    autoFocus
                    type="number"
                    min="1"
                    step="1"
                    value={budgetDraft}
                    onChange={(e) => setBudgetDraft(e.target.value)}
                    className="w-24 rounded-md border border-lime-400/40 bg-pine-800 px-2 py-1 text-center font-mono text-[14px] text-fog-100 focus:outline-none"
                  />
                  <button type="submit" aria-label="Save budget" className="grid h-7 w-7 place-items-center rounded-md bg-lime-400 text-pine-950 transition-transform active:scale-90">
                    <Icon name="check" size={14} strokeWidth={2.6} />
                  </button>
                  <button type="button" aria-label="Cancel" onClick={() => setBudgetEditing(false)} className="grid h-7 w-7 place-items-center rounded-md border border-white/10 text-fog-400 hover:text-fog-100">
                    <Icon name="x" size={13} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setBudgetDraft(String(Math.round(budget)));
                    setBudgetEditing(true);
                  }}
                  className="group inline-flex items-center gap-1.5 font-mono text-[14px] font-semibold text-fog-200 transition-colors hover:text-lime-300"
                >
                  of {fmtMoney0(budget)} this month
                  <Icon name="pencil" size={12} className="text-fog-600 transition-colors group-hover:text-lime-300" />
                </button>
              )}
            </div>
          </section>

          {/* mini stats */}
          <div className="col-span-12 grid grid-cols-2 gap-4 sm:col-span-6 lg:col-span-3">
            <StatMini
              label="Income"
              value={`+${fmtMoney0(income)}`}
              sub={`${incomeCount} deposit${incomeCount === 1 ? "" : "s"} this month`}
              icon="arrow-up"
              tint="bg-mint-400/10 text-mint-400 border-mint-400/20"
              delay={180}
            />
            <StatMini
              label="Spent"
              value={`−${fmtMoney0(spent)}`}
              sub={`${expenseCount} payment${expenseCount === 1 ? "" : "s"} this month`}
              icon="arrow-down"
              tint="bg-coral-400/10 text-coral-400 border-coral-400/20"
              delay={220}
            />
            <StatMini
              label="Daily avg"
              value={fmtMoney(dailyAvg)}
              sub={`over ${isCurrentMonth ? now.getDate() : dim} day${(isCurrentMonth ? now.getDate() : dim) === 1 ? "" : "s"}`}
              icon="calendar"
              tint="bg-sky-400/10 text-sky-400 border-sky-400/20"
              delay={260}
            />
            <StatMini
              label="Saved"
              value={savingsRate === null ? "—" : `${Math.round(savingsRate)}%`}
              sub={savingsRate === null ? "no income logged yet" : "of income kept"}
              icon="trend"
              tint="bg-lilac-400/10 text-lilac-400 border-lilac-400/20"
              delay={300}
            />
          </div>
        </div>

        {/* chart + categories */}
        <div className="mt-4 grid grid-cols-12 gap-4">
          <section className="panel rise col-span-12 p-6 lg:col-span-8" style={{ animationDelay: "200ms" }}>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-[19px] font-bold tracking-tight text-fog-100">Daily spending</h2>
                <p className="mt-0.5 font-mono text-[11px] text-fog-500">
                  {monthLabel(view.y, view.m)} · avg {fmtMoney(avgPerActive)} per active day
                </p>
              </div>
              <span className="rounded-lg border border-white/8 bg-pine-800/70 px-3 py-1.5 font-mono text-[13px] font-semibold text-fog-100">
                {fmtMoney(spent)} <span className="font-normal text-fog-500">total</span>
              </span>
            </div>
            <DailyBars data={byDay} year={view.y} month={view.m} animKey={viewKey} />
          </section>

          <section className="panel rise col-span-12 p-6 lg:col-span-4" style={{ animationDelay: "250ms" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-[19px] font-bold tracking-tight text-fog-100">By category</h2>
              {catFilter && (
                <button
                  onClick={() => setCatFilter(null)}
                  className="flex items-center gap-1 rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-1 font-mono text-[10.5px] text-lime-300 transition-colors hover:bg-lime-400/20"
                >
                  {catOf(catFilter).label}
                  <Icon name="x" size={11} strokeWidth={2.6} />
                </button>
              )}
            </div>
            {byCat.length === 0 ? (
              <p className="py-8 text-center text-[13.5px] text-fog-500">
                No expenses yet — categories will line up here.
              </p>
            ) : (
              <div className="space-y-1">
                {byCat.map((c, i) => {
                  const pct = spent > 0 ? (c.sum / spent) * 100 : 0;
                  const active = catFilter === c.cat.id;
                  return (
                    <button
                      key={c.cat.id}
                      onClick={() => setCatFilter(active ? null : c.cat.id)}
                      className={`w-full rounded-lg px-2 py-2 text-left transition-colors ${
                        active ? "bg-white/[0.05] shadow-[inset_0_0_0_1px_rgba(192,239,94,0.25)]" : "hover:bg-white/[0.03]"
                      }`}
                      title={active ? "Clear filter" : `Filter ledger to ${c.cat.label}`}
                    >
                      <div className="flex items-center gap-3">
                        <CatDot id={c.cat.id} size={34} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate text-[13.5px] font-medium text-fog-200">{c.cat.label}</p>
                            <p className="shrink-0 font-mono text-[12.5px] font-semibold text-fog-100">
                              {fmtMoney(c.sum)}
                              <span className="ml-1.5 font-normal text-fog-600">×{c.count}</span>
                            </p>
                          </div>
                          <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-white/[0.05]">
                            <div
                              className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                              style={{ width: `${pct}%`, background: c.cat.color, transitionDelay: `${i * 60}ms` }}
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ledger + insights */}
        <div className="mt-4 grid grid-cols-12 gap-4">
          <section className="panel rise col-span-12 p-6 lg:col-span-8" style={{ animationDelay: "300ms" }}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-[19px] font-bold tracking-tight text-fog-100">Ledger</h2>
              <span className="rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-[11px] text-fog-400">
                {filtered.length} shown
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Icon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog-600" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search merchant, note…"
                    className="field w-[190px] sm:w-[220px] py-2 pl-9 text-[13.5px]"
                  />
                </div>
                <div className="flex rounded-lg border border-white/[0.07] bg-pine-800/60 p-0.5">
                  {(["all", "income", "expense"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`rounded-md px-2.5 py-1.5 text-[12px] font-semibold capitalize transition-all ${
                        typeFilter === t ? "bg-white/[0.08] text-fog-100" : "text-fog-500 hover:text-fog-200"
                      }`}
                    >
                      {t === "all" ? "All" : t === "income" ? "In" : "Out"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="grid place-items-center py-14 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-2xl border border-dashed border-white/15 text-fog-500">
                  <Icon name="wallet" size={28} strokeWidth={1.4} />
                </span>
                {monthTxs.length === 0 ? (
                  <>
                    <h3 className="mt-4 font-display text-lg font-bold text-fog-100">A quiet month</h3>
                    <p className="mt-1 max-w-[300px] text-[13.5px] text-fog-400">
                      Nothing recorded in {monthLabel(view.y, view.m)}. Log your first transaction and the ledger comes alive.
                    </p>
                    <div className="mt-5 flex gap-2.5">
                      <button
                        onClick={() => {
                          setEditing(null);
                          setFormOpen(true);
                        }}
                        className="rounded-lg bg-lime-400 px-4 py-2.5 text-[13px] font-bold text-pine-950 transition-all hover:bg-lime-300 active:scale-[0.96]"
                      >
                        New transaction
                      </button>
                      {txs.length === 0 && (
                        <button
                          onClick={loadSample}
                          className="rounded-lg border border-white/10 px-4 py-2.5 text-[13px] font-semibold text-fog-300 transition-colors hover:bg-white/5 hover:text-fog-100"
                        >
                          Load sample data
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="mt-4 font-display text-lg font-bold text-fog-100">No matches</h3>
                    <p className="mt-1 text-[13.5px] text-fog-400">Your filters are hiding everything.</p>
                    <button
                      onClick={clearFilters}
                      className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-[13px] font-semibold text-fog-300 transition-colors hover:bg-white/5 hover:text-fog-100"
                    >
                      Clear filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="scroll-slim -mx-2 max-h-[560px] space-y-0.5 overflow-y-auto px-2">
                {filtered.map((t) => {
                  const c = catOf(t.categoryId);
                  return (
                    <div
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setEditing(t);
                        setFormOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setEditing(t);
                          setFormOpen(true);
                        }
                      }}
                      className="group flex cursor-pointer items-center gap-3.5 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-white/[0.035] focus-visible:bg-white/[0.035]"
                    >
                      <CatDot id={t.categoryId} size={38} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-fog-100">{t.merchant}</p>
                        <p className="truncate text-[12px] text-fog-500">
                          {c.label} · {t.method}
                          {t.note ? ` · ${t.note}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                        <button
                          aria-label="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(t);
                            setFormOpen(true);
                          }}
                          className="grid h-8 w-8 place-items-center rounded-md text-fog-500 transition-colors hover:bg-white/[0.06] hover:text-fog-100"
                        >
                          <Icon name="pencil" size={14} />
                        </button>
                        <button
                          aria-label="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTx(t);
                          }}
                          className="grid h-8 w-8 place-items-center rounded-md text-fog-500 transition-colors hover:bg-coral-400/15 hover:text-coral-400"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                      <div className="w-[110px] shrink-0 text-right">
                        <p className={`font-mono text-[14px] font-semibold ${t.type === "income" ? "text-lime-300" : "text-fog-100"}`}>
                          {t.type === "income" ? "+" : "−"}
                          {fmtMoney(t.amount)}
                        </p>
                        <p className="font-mono text-[10.5px] text-fog-600">{fmtDay(t.date)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* insights */}
          <section className="panel rise col-span-12 p-6 lg:col-span-4" style={{ animationDelay: "340ms" }}>
            <h2 className="font-display text-[19px] font-bold tracking-tight text-fog-100">The story so far</h2>
            <p className="mt-0.5 font-mono text-[11px] text-fog-500">{monthLabel(view.y, view.m)}</p>

            {expenseCount === 0 ? (
              <p className="mt-6 rounded-lg border border-dashed border-white/10 px-4 py-6 text-center text-[13px] leading-relaxed text-fog-500">
                Log a few expenses and the narrative writes itself.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-white/[0.05]">
                {insights.topMerch === null && insights.biggest === null ? null : (
                  <>
                    <div className="flex items-center gap-3 py-3">
                      <CatDot id={byCat[0]?.cat.id ?? "other-x"} size={34} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11.5px] text-fog-500">Top category</p>
                        <p className="truncate text-[14px] font-semibold text-fog-100">{byCat[0]?.cat.label ?? "—"}</p>
                      </div>
                      <p className="font-mono text-[13px] font-semibold text-fog-200">{byCat[0] ? fmtMoney(byCat[0].sum) : "—"}</p>
                    </div>
                    <div className="flex items-center gap-3 py-3">
                      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-lg bg-gold-400/12 text-gold-400">
                        <Icon name="sparkle" size={16} strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11.5px] text-fog-500">Biggest splurge</p>
                        <p className="truncate text-[14px] font-semibold text-fog-100">{insights.biggest?.merchant ?? "—"}</p>
                      </div>
                      <p className="font-mono text-[13px] font-semibold text-coral-300">
                        {insights.biggest ? fmtMoney(insights.biggest.amount) : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 py-3">
                      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-lg bg-blush-400/12 text-blush-400">
                        <Icon name="coffee" size={16} strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11.5px] text-fog-500">Coffee runs</p>
                        <p className="truncate text-[14px] font-semibold text-fog-100">
                          {insights.coffees} cup{insights.coffees === 1 ? "" : "s"}
                        </p>
                      </div>
                      <p className="font-mono text-[13px] text-fog-400">{insights.coffees > 0 ? "caffeinated" : "clean"}</p>
                    </div>
                    <div className="flex items-center gap-3 py-3">
                      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-lg bg-sky-400/12 text-sky-400">
                        <Icon name="wallet" size={16} strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11.5px] text-fog-500">Avg per expense</p>
                        <p className="truncate text-[14px] font-semibold text-fog-100">{fmtMoney(spent / Math.max(1, expenseCount))}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 py-3">
                      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-lg bg-lilac-400/12 text-lilac-400">
                        <Icon name="bag" size={16} strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11.5px] text-fog-500">Usual suspect</p>
                        <p className="truncate text-[14px] font-semibold text-fog-100">
                          {insights.topMerch ? `${insights.topMerch[0]}` : "—"}
                        </p>
                      </div>
                      <p className="font-mono text-[13px] text-fog-400">{insights.topMerch ? `×${insights.topMerch[1]}` : ""}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-fog-500">Quick add · today</p>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {QUICK_ADDS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() =>
                      upsert({
                        type: "expense",
                        amount: p.amount,
                        categoryId: p.categoryId,
                        merchant: p.merchant,
                        note: "",
                        date: todayISO(),
                        method: "Card",
                      })
                    }
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] px-3 py-2.5 text-[12.5px] font-semibold text-fog-300 transition-all hover:border-lime-400/40 hover:bg-lime-400/5 hover:text-lime-300 active:scale-[0.96]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Icon name="plus" size={12} strokeWidth={2.8} />
                      {p.label}
                    </span>
                    <span className="font-mono text-[11px] font-normal text-fog-500">${p.amount.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* footer */}
        <footer className="rise mt-10 border-t border-white/[0.06] pt-6" style={{ animationDelay: "380ms" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[11px] text-fog-600">
              Ledge · {txs.length} record{txs.length === 1 ? "" : "s"} · data never leaves this browser (localStorage)
            </p>
            <div className="flex items-center gap-2">
              {txs.length === 0 && (
                <button
                  onClick={loadSample}
                  className="rounded-lg border border-white/10 px-3 py-2 text-[12.5px] font-semibold text-fog-300 transition-colors hover:bg-white/5 hover:text-fog-100"
                >
                  Load sample data
                </button>
              )}
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={txs.length === 0}
                className="rounded-lg border border-white/10 px-3 py-2 text-[12.5px] font-semibold text-fog-400 transition-colors enabled:hover:border-coral-400/40 enabled:hover:bg-coral-400/10 enabled:hover:text-coral-300 disabled:opacity-40"
              >
                Reset data
              </button>
            </div>
          </div>

          {/* ship to github */}
          <section id="ship" className="panel mt-8 scroll-mt-24 p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-fog-100">
                  <Icon name="github" size={22} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold tracking-tight text-fog-100">Ship it to GitHub</h2>
                  <p className="mt-0.5 text-[13.5px] text-fog-400">
                    This app <em className="not-italic font-mono text-[12.5px] text-lime-300">is</em> the{" "}
                    <span className="font-mono text-[12.5px] text-lime-300">expense-tracker</span> repo, waiting to be pushed. Create the
                    empty repo first, then run:
                  </p>
                </div>
              </div>
              <a
                href="https://github.com/new"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2.5 text-[13px] font-semibold text-fog-200 transition-colors hover:border-lime-400/40 hover:bg-lime-400/5 hover:text-lime-300"
              >
                github.com/new
                <Icon name="arrow-up" size={14} strokeWidth={2.2} />
              </a>
            </div>
            <div className="mt-5 space-y-2">
              {GIT_CMDS.map((cmd) => (
                <div
                  key={cmd}
                  className="group flex items-center gap-3 rounded-lg border border-white/[0.06] bg-pine-900/70 px-3.5 py-2.5 transition-colors hover:border-white/[0.14]"
                >
                  <span className="select-none font-mono text-[12.5px] text-lime-400">$</span>
                  <code className="flex-1 truncate font-mono text-[12.5px] text-fog-200">{cmd}</code>
                  <button
                    onClick={() => copyCmd(cmd)}
                    aria-label="Copy command"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-fog-600 transition-all hover:bg-white/[0.06] hover:text-lime-300 active:scale-90"
                  >
                    <Icon name="copy" size={14} />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-3.5 flex items-center gap-1.5 text-[12px] text-fog-600">
              <Icon name="info" size={13} />
              Swap <span className="font-mono text-fog-400">YOUR_USERNAME</span> for your GitHub handle. HTTPS remote works too if you
              skip SSH keys.
            </p>
          </section>
        </footer>
      </main>

      {/* overlays */}
      <TransactionForm
        open={formOpen}
        initial={editing}
        defaultDate={todayISO()}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={upsert}
      />
      <ConfirmModal
        open={confirmOpen}
        title="Clear all data?"
        body={`This permanently deletes ${txs.length} transaction${txs.length === 1 ? "" : "s"} stored in this browser. Your budget setting is kept.`}
        confirmLabel="Delete everything"
        onConfirm={resetAll}
        onClose={() => setConfirmOpen(false)}
      />
      <ToastHost toasts={toasts} dismiss={dismissToast} />
    </div>
  );
}
