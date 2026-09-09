import { useState, useEffect, useMemo, useRef } from "react";
import type { AnigenreEntity, CategoryKey } from "@/types";
import { CATEGORIES, toValueArray } from "@/types";
import { Lock, Plus, Trash2, Pencil, Search, X, Check, Loader2 } from "lucide-react";

const ADMIN_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/anigenre-admin`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SESSION_KEY = "anigenre_admin_session";

type View = "password" | "main";

interface EditState {
  id: string;
  name: string;
  aliases: string;
  type: string[];
  anime: string[];
  format: string[];
  studio: string[];
  demographic: string[];
  year: string;
}

const EMPTY_FORM = {
  name: "",
  aliases: "",
  type: [] as string[],
  anime: [] as string[],
  format: [] as string[],
  studio: [] as string[],
  demographic: [] as string[],
  year: "",
};

export function AdminPage() {
  const [view, setView] = useState<View>(() =>
    sessionStorage.getItem(SESSION_KEY) ? "main" : "password",
  );
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${ADMIN_FUNCTION_URL}/entities`, {
        headers: { Authorization: `Bearer ${password}`, apikey: SUPABASE_ANON_KEY },
      });
      if (res.status === 401) {
        setAuthError("Incorrect password.");
        setAuthLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Server error");
      sessionStorage.setItem(SESSION_KEY, password);
      setView("main");
    } catch {
      setAuthError("Could not connect. Try again.");
    }
    setAuthLoading(false);
  };

  if (view === "password") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/15">
              <Lock className="h-7 w-7 text-teal-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Access</h1>
            <p className="mt-1 text-sm text-slate-400">
              Enter the admin password to manage entries.
            </p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Password"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            autoFocus
          />
          {authError && (
            <p className="mt-2 text-sm text-red-400">{authError}</p>
          )}
          <button
            onClick={handleLogin}
            disabled={authLoading || !password}
            className="mt-4 w-full rounded-xl bg-teal-500 py-3 text-sm font-semibold text-slate-900 transition hover:bg-teal-400 disabled:opacity-50 active:scale-[0.98]"
          >
            {authLoading ? "Checking..." : "Enter"}
          </button>
        </div>
      </div>
    );
  }

  return <AdminMain password={password} />;
}

function AdminMain({ password }: { password: string }) {
  const [entities, setEntities] = useState<AnigenreEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [filter, setFilter] = useState("");
  const [editState, setEditState] = useState<EditState | null>(null);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const headers = { Authorization: `Bearer ${password}`, apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" };

  const loadEntities = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_FUNCTION_URL}/entities`, { headers });
      if (res.status === 401) {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.reload();
        return;
      }
      const json = await res.json();
      setEntities(json.data ?? []);
    } catch {
      setError("Failed to load entries.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEntities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryValues = useMemo(() => {
    const vals: Record<Exclude<CategoryKey, "year">, string[]> = {
      type: [],
      anime: [],
      format: [],
      studio: [],
      demographic: [],
    };
    for (const e of entities) {
      for (const cat of CATEGORIES) {
        if (cat.kind === "numeric") continue;
        const key = cat.key as Exclude<CategoryKey, "year">;
        const vs = toValueArray(e[key]);
        for (const v of vs) {
          if (v && !vals[key].includes(v)) vals[key].push(v);
        }
      }
    }
    for (const k of Object.keys(vals) as Exclude<CategoryKey, "year">[]) vals[k].sort();
    return vals;
  }, [entities]);

  const handleSubmit = async () => {
    const yearNum = parseInt(form.year, 10);
    if (
      !form.name.trim() ||
      form.type.length === 0 ||
      form.anime.length === 0 ||
      form.format.length === 0 ||
      form.studio.length === 0 ||
      form.demographic.length === 0 ||
      !form.year.trim() ||
      Number.isNaN(yearNum)
    ) {
      setError("Please fill in all fields.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${ADMIN_FUNCTION_URL}/entities`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...form, year: yearNum }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to add entry");
      }
      setForm({ ...EMPTY_FORM });
      setConfirmMsg("Entry added!");
      setTimeout(() => setConfirmMsg(""), 1500);
      nameRef.current?.focus();
      loadEntities();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await fetch(`${ADMIN_FUNCTION_URL}/entities/${id}`, {
        method: "DELETE",
        headers,
      });
      loadEntities();
    } catch {
      setError("Failed to delete.");
    }
  };

  const handleEditSave = async () => {
    if (!editState) return;
    try {
      const yearNum = parseInt(editState.year, 10);
      const res = await fetch(`${ADMIN_FUNCTION_URL}/entities/${editState.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: editState.name,
          aliases: editState.aliases,
          type: editState.type,
          anime: editState.anime,
          format: editState.format,
          studio: editState.studio,
          demographic: editState.demographic,
          year: Number.isNaN(yearNum) ? null : yearNum,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditState(null);
      loadEntities();
    } catch {
      setError("Failed to update entry.");
    }
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return entities;
    return entities.filter((e) =>
      e.name.toLowerCase().includes(q) ||
      e.aliases.toLowerCase().includes(q) ||
      toValueArray(e.anime).some((v) => v.toLowerCase().includes(q)) ||
      toValueArray(e.type).some((v) => v.toLowerCase().includes(q)),
    );
  }, [entities, filter]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Entry Management</h1>
        <p className="text-sm text-slate-400 mt-1">
          {entities.length} {entities.length === 1 ? "entry" : "entries"} in the pool
        </p>
      </div>

      {/* Add form */}
      <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Plus className="h-4 w-4 text-teal-400" /> Add New Entry
        </h2>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Name</label>
              <input
                ref={nameRef}
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (document.getElementById("form-aliases") as HTMLInputElement)?.focus();
                  }
                }}
                placeholder="e.g. Boogie Woogie"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Aliases</label>
              <input
                id="form-aliases"
                type="text"
                value={form.aliases}
                onChange={(e) => setForm({ ...form, aliases: e.target.value })}
                placeholder="e.g. JJK, jujutsu, kaisen"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) =>
              cat.kind === "numeric" ? (
                <YearInput
                  key={cat.key}
                  label={cat.label}
                  value={form.year}
                  onChange={(v) => setForm({ ...form, year: v })}
                />
              ) : (
                <MultiCategorySelect
                  key={cat.key}
                  label={cat.label}
                  value={form[cat.key as Exclude<CategoryKey, "year">]}
                  options={categoryValues[cat.key as Exclude<CategoryKey, "year">]}
                  onChange={(v) => setForm({ ...form, [cat.key]: v })}
                />
              )
            )}
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {confirmMsg && (
            <p className="flex items-center gap-1.5 text-sm text-teal-400">
              <Check className="h-4 w-4" /> {confirmMsg}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-lg bg-teal-500 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-teal-400 disabled:opacity-50 active:scale-[0.98]"
          >
            {submitting ? "Adding..." : "Add Entry"}
          </button>
        </div>
      </div>

      {/* Existing entries */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Existing Entries</h2>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {entities.length === 0 ? "No entries yet. Add one above." : "No matches."}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((entity) => (
              <div
                key={entity.id}
                className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"
              >
                {editState?.id === entity.id ? (
                  <EditRow
                    editState={editState}
                    setEditState={setEditState}
                    categoryValues={categoryValues}
                    onSave={handleEditSave}
                    onCancel={() => setEditState(null)}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white">{entity.name}</div>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                        <span className="text-slate-400">{toValueArray(entity.type).join(', ')}</span>
                        <span>·</span>
                        <span>{toValueArray(entity.anime).join(', ')}</span>
                        <span>·</span>
                        <span>{entity.year ?? 'Unknown year'}</span>
                        <span>·</span>
                        <span>{toValueArray(entity.format).join(', ')}</span>
                        <span>·</span>
                        <span>{toValueArray(entity.studio).join(', ')}</span>
                        <span>·</span>
                        <span>{toValueArray(entity.demographic).join(', ')}</span>
                      </div>
                      {entity.aliases && (
                        <div className="mt-0.5 text-[10px] text-slate-600">
                          Aliases: {entity.aliases}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() =>
                          setEditState({
                            id: entity.id,
                            name: entity.name,
                            aliases: entity.aliases,
                            type: toValueArray(entity.type),
                            anime: toValueArray(entity.anime),
                            format: toValueArray(entity.format),
                            studio: toValueArray(entity.studio),
                            demographic: toValueArray(entity.demographic),
                            year: entity.year != null ? String(entity.year) : "",
                          })
                        }
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-teal-400 transition"
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(entity.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function YearInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 2018"
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500"
      />
    </div>
  );
}

function MultiCategorySelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string[];
  options: string[];
  onChange: (v: string[]) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [newVal, setNewVal] = useState("");
  const [justAdded, setJustAdded] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayOptions = useMemo(() => {
    const merged = [...options];
    for (const v of justAdded) {
      if (!merged.includes(v)) merged.push(v);
    }
    return merged;
  }, [options, justAdded]);

  const availableOptions = useMemo(
    () => displayOptions.filter((o) => !value.includes(o)),
    [displayOptions, value],
  );

  const addValue = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
  };

  const removeValue = (v: string) => {
    onChange(value.filter((x) => x !== v));
  };

  const handleAddNew = () => {
    const v = newVal.trim();
    if (v) {
      setJustAdded((prev) => (prev.includes(v) ? prev : [...prev, v]));
      addValue(v);
      setNewVal("");
      setShowInput(false);
    }
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>

      {value.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 px-2.5 py-1 text-xs font-medium text-teal-300"
            >
              {v}
              <button
                type="button"
                onClick={() => removeValue(v)}
                className="text-teal-400 hover:text-white"
                aria-label={`Remove ${v}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {showInput ? (
        <div className="flex gap-1">
          <input
            ref={inputRef}
            type="text"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddNew();
              }
              if (e.key === "Escape") {
                setShowInput(false);
                setNewVal("");
              }
            }}
            placeholder={`New ${label.toLowerCase()}`}
            className="w-full rounded-lg border border-teal-500 bg-slate-950 px-2.5 py-2 text-sm text-white placeholder-slate-600 outline-none"
            autoFocus
          />
          <button
            onClick={handleAddNew}
            className="rounded-lg bg-teal-500 px-2 text-slate-900"
            aria-label="Confirm new value"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setShowInput(false);
              setNewVal("");
            }}
            className="rounded-lg border border-slate-700 px-2 text-slate-400"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value === "__new__") {
              setShowInput(true);
            } else if (e.target.value) {
              addValue(e.target.value);
            }
          }}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-sm text-white outline-none focus:border-teal-500"
        >
          <option value="">
            {value.length > 0 ? "+ Add another..." : `Select ${label}...`}
          </option>
          {availableOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          <option value="__new__">+ Add new value...</option>
        </select>
      )}
    </div>
  );
}

function EditRow({
  editState,
  setEditState,
  categoryValues,
  onSave,
  onCancel,
}: {
  editState: EditState;
  setEditState: React.Dispatch<React.SetStateAction<EditState | null>>;
  categoryValues: Record<Exclude<CategoryKey, "year">, string[]>;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          type="text"
          value={editState.name}
          onChange={(e) => setEditState({ ...editState, name: e.target.value })}
          placeholder="Name"
          className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-white outline-none focus:border-teal-500"
        />
        <input
          type="text"
          value={editState.aliases}
          onChange={(e) => setEditState({ ...editState, aliases: e.target.value })}
          placeholder="Aliases"
          className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-white outline-none focus:border-teal-500"
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) =>
          cat.kind === "numeric" ? (
            <YearInput
              key={cat.key}
              label={cat.label}
              value={editState.year}
              onChange={(v) => setEditState({ ...editState, year: v })}
            />
          ) : (
            <MultiCategorySelect
              key={cat.key}
              label={cat.label}
              value={editState[cat.key as Exclude<CategoryKey, "year">]}
              options={categoryValues[cat.key as Exclude<CategoryKey, "year">]}
              onChange={(v) => setEditState({ ...editState, [cat.key]: v })}
            />
          )
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-teal-400 transition"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
