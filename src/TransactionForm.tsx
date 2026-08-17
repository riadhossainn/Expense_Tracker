import { useEffect, useState } from "react";
import { CATEGORIES, METHODS, type Tx, type TxType } from "./data";
import { Icon } from "./icons";
import { Modal } from "./ui";

export interface TxDraft {
  id?: string;
  type: TxType;
  amount: number;
  categoryId: string;
  merchant: string;
  note: string;
  date: string;
  method: string;
}

export function TransactionForm({
  open,
  initial,
  defaultDate,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: Tx | null;
  defaultDate: string;
  onClose: () => void;
  onSave: (draft: TxDraft) => void;
}) {
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("groceries");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [method, setMethod] = useState<string>("Card");
  const [err, setErr] = useState("");
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setType(initial.type);
      setAmount(String(initial.amount));
      setCategoryId(initial.categoryId);
      setMerchant(initial.merchant);
      setNote(initial.note);
      setDate(initial.date);
      setMethod(initial.method);
    } else {
      setType("expense");
      setAmount("");
      setCategoryId("groceries");
      setMerchant("");
      setNote("");
      setDate(defaultDate);
      setMethod("Card");
    }
    setErr("");
  }, [open, initial, defaultDate]);

  const cats = CATEGORIES.filter((c) => c.type === type);

  const switchType = (t: TxType) => {
    setType(t);
    if (!CATEGORIES.some((c) => c.id === categoryId && c.type === t)) {
      setCategoryId(CATEGORIES.find((c) => c.type === t)?.id ?? "other-x");
    }
  };

  const submit = () => {
    const n = Number.parseFloat(amount);
    if (!amount.trim() || !Number.isFinite(n) || n <= 0) {
      setErr("Enter an amount greater than zero.");
      setShaking(true);
      setTimeout(() => setShaking(false), 520);
      return;
    }
    if (!date) {
      setErr("Pick a date for this transaction.");
      setShaking(true);
      setTimeout(() => setShaking(false), 520);
      return;
    }
    onSave({
      id: initial?.id,
      type,
      amount: Math.round(n * 100) / 100,
      categoryId,
      merchant: merchant.trim() || (type === "income" ? "Income" : "Expense"),
      note: note.trim(),
      date,
      method,
    });
  };

  return (
    <Modal open={open} onClose={onClose} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="p-6 sm:p-7"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-bold tracking-tight">
            {initial ? "Edit transaction" : "New transaction"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-fog-500 hover:text-fog-100 hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <Icon name="x" size={17} />
          </button>
        </div>

        {/* type toggle */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-pine-800/80 border border-white/[0.06] p-1">
          {(["expense", "income"] as TxType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchType(t)}
              className={`rounded-md py-2 text-[13.5px] font-semibold capitalize transition-all duration-200 ${
                type === t
                  ? t === "expense"
                    ? "bg-coral-400/15 text-coral-300 shadow-[inset_0_0_0_1px_rgba(242,112,89,0.35)]"
                    : "bg-lime-400/15 text-lime-300 shadow-[inset_0_0_0_1px_rgba(192,239,94,0.35)]"
                  : "text-fog-500 hover:text-fog-200"
              }`}
            >
              {t === "expense" ? "− Expense" : "+ Income"}
            </button>
          ))}
        </div>

        {/* amount + date */}
        <div className={`mt-5 grid gap-4 sm:grid-cols-[1fr_190px] ${shaking ? "shake" : ""}`}>
          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-fog-500">
              Amount
            </label>
            <div
              className={`flex items-center rounded-lg border bg-pine-800/80 transition-colors ${
                err ? "border-coral-400/60" : "border-white/[0.07] focus-within:border-lime-400/50"
              }`}
            >
              <span className="pl-3.5 font-mono text-lg text-fog-500">$</span>
              <input
                autoFocus
                inputMode="decimal"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (err) setErr("");
                }}
                className="w-full bg-transparent px-2 py-2.5 font-mono text-xl font-semibold text-fog-100 placeholder-fog-600 focus:outline-none"
              />
            </div>
            {err && <p className="mt-1.5 text-[12.5px] text-coral-300 fadein">{err}</p>}
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-fog-500">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field font-mono text-[14px]"
            />
          </div>
        </div>

        {/* category */}
        <label className="mt-5 mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-fog-500">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => {
            const active = c.id === categoryId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-all duration-150 active:scale-[0.96] ${
                  active ? "text-pine-950" : "border-white/[0.08] text-fog-300 hover:border-white/20 hover:text-fog-100"
                }`}
                style={active ? { background: c.color, borderColor: c.color } : undefined}
              >
                <Icon name={c.icon} size={15} strokeWidth={2} />
                {c.label}
              </button>
            );
          })}
        </div>

        {/* merchant + note */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-fog-500">
              {type === "income" ? "Source" : "Merchant"}
            </label>
            <input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder={type === "income" ? "e.g. Acme Payroll" : "e.g. Trader Joe's"}
              className="field"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-fog-500">
              Note <span className="text-fog-600 normal-case tracking-normal">(optional)</span>
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything worth remembering"
              className="field"
            />
          </div>
        </div>

        {/* method */}
        <label className="mt-5 mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-fog-500">
          Paid with
        </label>
        <div className="flex flex-wrap gap-2">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`rounded-lg border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 active:scale-[0.96] ${
                method === m
                  ? "border-lime-400/50 bg-lime-400/10 text-lime-300"
                  : "border-white/[0.08] text-fog-400 hover:border-white/20 hover:text-fog-100"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-[14px] font-medium text-fog-300 border border-white/8 hover:bg-white/5 hover:text-fog-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg px-5 py-2.5 text-[14px] font-bold transition-all active:scale-[0.97] bg-lime-400 text-pine-950 hover:bg-lime-300 shadow-[0_6px_24px_-8px_rgba(192,239,94,0.5)]"
          >
            {initial ? "Save changes" : type === "expense" ? "Add expense" : "Add income"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
