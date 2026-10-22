"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

/**
 * Dropdown filter custom (pengganti <select> bawaan browser yang ga bisa
 * dibatasi tingginya & susah didesain).
 *
 * options: [{ value, label }] — option dengan value "" dianggap "tanpa filter"
 *          (labelnya jadi nama filter di tombol, mis. "Kota", dan tampil sebagai
 *          "Semua Kota" di dalam daftar).
 * searchable: kasih kolom cari. Default otomatis aktif kalau opsi > 8.
 */
export default function FilterDropdown({ label, value, onChange, options, searchable }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hi, setHi] = useState(0);
  const [alignRight, setAlignRight] = useState(false);

  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const listRef = useRef(null);

  const showSearch = searchable ?? options.length > 8;
  const placeholder = options.find((o) => o.value === "")?.label || label;
  const selected = options.find((o) => String(o.value) === String(value));
  const active = value !== "" && value != null;
  const display = active ? selected?.label ?? String(value) : placeholder;

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => o.value !== "" && o.label.toLowerCase().includes(term));
  }, [options, query]);

  function openPanel() {
    const idx = options.findIndex((o) => String(o.value) === String(value));
    setHi(Math.max(0, idx));
    setOpen(true);
  }

  function closePanel() {
    setOpen(false);
    setQuery("");
  }

  function choose(option) {
    onChange(option.value);
    closePanel();
  }

  // Tutup kalau klik/tap di luar dropdown
  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) closePanel();
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [open]);

  // Kalau panel bakal keluar dari sisi kanan layar (kolom paling kanan), rata kanan.
  useLayoutEffect(() => {
    if (!open || !panelRef.current || !rootRef.current) return;
    const left = rootRef.current.getBoundingClientRect().left;
    const width = panelRef.current.offsetWidth;
    setAlignRight(left + width > window.innerWidth - 12);
  }, [open]);

  // Opsi yang lagi di-highlight (keyboard/hover) selalu kelihatan di dalam list
  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.querySelector(`[data-idx="${hi}"]`)?.scrollIntoView({ block: "nearest" });
  }, [hi, open]);

  // Hasil pencarian berubah -> highlight balik ke atas
  useEffect(() => {
    setHi(0);
  }, [query]);

  function onKeyDown(e) {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closePanel();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[hi]) choose(filtered[hi]);
    }
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => (open ? closePanel() : openPanel())}
        className={`input-field flex items-center justify-between gap-2 text-left cursor-pointer ${
          active ? "!border-brand !bg-brand-light/40 text-brand font-medium" : ""
        } ${open ? "!border-brand ring-2 ring-brand/30" : ""}`}
      >
        <span className="truncate">{display}</span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-ink-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          className={`absolute z-30 mt-1.5 w-full min-w-[220px] max-w-[320px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5 ${
            alignRight ? "right-0" : "left-0"
          }`}
        >
          {showSearch && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Cari ${placeholder.toLowerCase()}...`}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-sm placeholder:text-gray-400 focus:outline-none focus:border-brand focus:bg-white transition"
                />
              </div>
            </div>
          )}

          <div ref={listRef} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-ink-muted">Tidak ada hasil</div>
            ) : (
              filtered.map((o, i) => {
                const isSelected = String(o.value) === String(value);
                return (
                  <button
                    key={`${o.value}-${i}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-idx={i}
                    onMouseEnter={() => setHi(i)}
                    onClick={() => choose(o)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                      i === hi ? "bg-gray-50" : ""
                    } ${isSelected ? "text-brand font-medium" : "text-ink"}`}
                  >
                    <span className="truncate">{o.value === "" ? `Semua ${o.label}` : o.label}</span>
                    {isSelected && <Check size={14} className="shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
