import { v4 as uuid } from "uuid";
import type { IconName } from "./icons";

/* ---------------------------------- types --------------------------------- */

export type TxType = "expense" | "income";

export interface Tx {
  id: string;
  type: TxType;
  amount: number;
  categoryId: string;
  merchant: string;
  note: string;
  date: string; // YYYY-MM-DD
  method: string;
  created: number;
}

export interface Category {
  id: string;
  label: string;
  color: string;
  icon: IconName;
  type: TxType;
}

export const METHODS = ["Card", "Cash", "Bank", "Other"] as const;

/* -------------------------------- categories ------------------------------- */

export const CATEGORIES: Category[] = [
  { id: "groceries", label: "Groceries", color: "#9bd770", icon: "basket", type: "expense" },
  { id: "dining", label: "Dining out", color: "#f2a93b", icon: "utensils", type: "expense" },
  { id: "transport", label: "Transport", color: "#62b6e4", icon: "bus", type: "expense" },
  { id: "housing", label: "Housing", color: "#b48cf2", icon: "home", type: "expense" },
  { id: "utilities", label: "Utilities", color: "#f26d5b", icon: "bolt", type: "expense" },
  { id: "entertainment", label: "Entertainment", color: "#ec7fb0", icon: "film", type: "expense" },
  { id: "health", label: "Health", color: "#4fcfaf", icon: "pulse", type: "expense" },
  { id: "shopping", label: "Shopping", color: "#f2e15c", icon: "bag", type: "expense" },
  { id: "travel", label: "Travel", color: "#7c8cf2", icon: "plane", type: "expense" },
  { id: "other-x", label: "Other", color: "#8ca393", icon: "dots", type: "expense" },
  { id: "salary", label: "Salary", color: "#7ed491", icon: "briefcase", type: "income" },
  { id: "freelance", label: "Freelance", color: "#6fc1e8", icon: "laptop", type: "income" },
  { id: "investments", label: "Investments", color: "#b48cf2", icon: "trend", type: "income" },
  { id: "gifts", label: "Gifts", color: "#ec7fb0", icon: "gift", type: "income" },
  { id: "other-i", label: "Other", color: "#8ca393", icon: "dots", type: "income" },
];

export const CAT_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

export const catOf = (id: string): Category =>
  CAT_MAP[id] ?? { id, label: id, color: "#8ca393", icon: "dots", type: "expense" };

/* ------------------------------- formatting ------------------------------- */

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const fmtMoney = (n: number) => usd.format(n);
export const fmtMoney0 = (n: number) => usdWhole.format(n);
export const fmtCompact = (n: number) => usdCompact.format(n);

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const monthLabel = (y: number, m: number) => `${MONTHS[m]} ${y}`;

/* --------------------------------- dates ---------------------------------- */

export const toISO = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const todayISO = () => toISO(new Date());

export const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

export const monthKeyOf = (iso: string) => iso.slice(0, 7);

export const fmtDay = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1].slice(0, 3)} ${d}`;
};

export const fmtWeekday = (y: number, m: number, day: number) =>
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(y, m, day).getDay()];

/* --------------------------------- storage -------------------------------- */

const TX_KEY = "ledge.transactions.v1";
const BUDGET_KEY = "ledge.budget.v1";
const CLEARED_KEY = "ledge.cleared.v1";

export function loadTxs(): Tx[] {
  try {
    const raw = localStorage.getItem(TX_KEY);
    if (raw) return JSON.parse(raw) as Tx[];
    if (localStorage.getItem(CLEARED_KEY)) return [];
    const seeded = seedData();
    localStorage.setItem(TX_KEY, JSON.stringify(seeded));
    return seeded;
  } catch {
    return [];
  }
}

export function saveTxs(txs: Tx[]) {
  try {
    localStorage.setItem(TX_KEY, JSON.stringify(txs));
  } catch {
    /* storage full or unavailable — app keeps working in memory */
  }
}

export function clearTxs() {
  localStorage.removeItem(TX_KEY);
  localStorage.setItem(CLEARED_KEY, "1");
}

export function loadBudget(): number {
  try {
    const raw = localStorage.getItem(BUDGET_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 2400;
  } catch {
    return 2400;
  }
}

export function saveBudget(n: number) {
  try {
    localStorage.setItem(BUDGET_KEY, String(n));
  } catch {
    /* noop */
  }
}

/* ------------------------------- sample data ------------------------------ */

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MERCHANTS: Record<string, string[]> = {
  groceries: ["Whole Foods", "Trader Joe's", "Kroger", "Safeway", "Farmers Market"],
  dining: ["Chipotle", "Ramen Bar Ippo", "Blue Bottle Coffee", "Thai Basil", "Shake Shack", "Starbucks", "Nopa Grill"],
  transport: ["Uber", "Lyft", "Shell Gas", "Metro Transit", "Chevron"],
  housing: ["Rent — Maple St."],
  utilities: ["PG&E Electric", "Comcast Internet", "Water Dept."],
  entertainment: ["AMC Theatres", "Steam", "Spotify", "Netflix", "Bowling Night"],
  health: ["CVS Pharmacy", "Planet Fitness", "Kaiser Clinic"],
  shopping: ["Amazon", "REI", "Target", "IKEA"],
  travel: ["Delta Air", "Airbnb"],
  salary: ["Acme Corp Payroll"],
  freelance: ["Client — Design sprint", "Client — Web audit"],
  investments: ["Dividends — VTI"],
  gifts: ["Birthday from Mom"],
};

const pick = <T,>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)];
const between = (r: () => number, lo: number, hi: number) =>
  Math.round((lo + r() * (hi - lo)) * 100) / 100;

export function seedData(): Tx[] {
  const r = mulberry32(20260214);
  const now = new Date();
  const out: Tx[] = [];
  let seq = 0;

  const push = (
    y: number, m: number, day: number, type: TxType, categoryId: string,
    amount: number, merchant?: string, method = "Card", note = ""
  ) => {
    const dim = daysInMonth(y, m);
    const d = Math.min(day, dim);
    if (type === "expense" && y === now.getFullYear() && m === now.getMonth() && d > now.getDate()) return;
    out.push({
      id: `seed-${++seq}`,
      type,
      categoryId,
      amount,
      merchant: merchant ?? pick(r, MERCHANTS[categoryId] ?? ["Misc"]),
      note,
      date: toISO(new Date(y, m, d)),
      method,
      created: new Date(y, m, d, 12, seq % 60).getTime(),
    });
  };

  const month = (y: number, m: number) => {
    push(y, m, 1, "income", "salary", 4350, undefined, "Bank");
    if (r() > 0.35) push(y, m, 9 + Math.floor(r() * 12), "income", "freelance", between(r, 480, 1400), undefined, "Bank");
    if (r() > 0.6) push(y, m, 15, "income", "investments", between(r, 40, 130), undefined, "Bank");
    push(y, m, 2, "expense", "housing", 1480, undefined, "Bank", "Monthly rent");
    push(y, m, 1, "expense", "health", 49, "Planet Fitness", "Card", "Gym membership");
    push(y, m, 3, "expense", "entertainment", 15.49, "Netflix", "Card");
    push(y, m, 5, "expense", "entertainment", 11.99, "Spotify", "Card");
    push(y, m, 7, "expense", "utilities", between(r, 78, 148), "PG&E Electric", "Bank");
    push(y, m, 8, "expense", "utilities", 65, "Comcast Internet", "Bank");

    for (let d = 2; d <= 27; d += 3) {
      if (r() > 0.25) push(y, m, d + Math.floor(r() * 2), "expense", "groceries", between(r, 26, 96));
    }
    for (let i = 0; i < 7; i++) {
      push(y, m, 1 + Math.floor(r() * 27), "expense", "dining", between(r, 14, 68));
    }
    for (let i = 0; i < 5; i++) {
      push(y, m, 1 + Math.floor(r() * 27), "expense", "dining", between(r, 4.1, 6.9), "Blue Bottle Coffee", "Card", "Coffee");
    }
    for (let i = 0; i < 4; i++) {
      push(y, m, 1 + Math.floor(r() * 27), "expense", "transport", between(r, 11, 42));
    }
    push(y, m, 11, "expense", "transport", between(r, 32, 55), "Shell Gas");
    push(y, m, 14 + Math.floor(r() * 6), "expense", "entertainment", between(r, 18, 52));
    push(y, m, 6 + Math.floor(r() * 14), "expense", "health", between(r, 22, 74), "CVS Pharmacy");
    push(y, m, 4 + Math.floor(r() * 20), "expense", "shopping", between(r, 34, 158));
    if (r() > 0.5) push(y, m, 10 + Math.floor(r() * 14), "expense", "shopping", between(r, 40, 210), "REI");
    if (r() > 0.65) push(y, m, 16, "expense", "travel", between(r, 220, 430), "Delta Air", "Card", "Weekend trip");
  };

  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  month(prev.getFullYear(), prev.getMonth());
  month(now.getFullYear(), now.getMonth());

  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.created - a.created));
}

/* ---------------------------------- export -------------------------------- */

const csvEsc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

export function exportCSV(txs: Tx[], label: string) {
  const rows = [
    ["date", "type", "category", "merchant", "note", "method", "amount"],
    ...txs.map((t) => [
      t.date,
      t.type,
      catOf(t.categoryId).label,
      t.merchant,
      t.note,
      t.method,
      (t.type === "expense" ? -t.amount : t.amount).toFixed(2),
    ]),
  ];
  const csv = rows.map((r) => r.map(csvEsc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ledge-${label.toLowerCase().replace(/\s+/g, "-")}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const newId = () => uuid();
