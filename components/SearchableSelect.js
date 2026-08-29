"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

/**
 * Dropdown dengan search — buat pilih dari list panjang (kayak daftar kota).
 * options: [{ id, label, sublabel? }]
 * value: id yang lagi dipilih
 * onChange: (option) => void
 */
export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  disabled = false,
  loading = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())).slice(0, 50)
    : options.slice(0, 50);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`input-field flex items-center justify-between text-left disabled:opacity-50 disabled:cursor-not-allowed ${
          !selected ? "text-ink-muted" : ""
        }`}
      >
        <span className="truncate">
          {loading ? "Memuat..." : selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className="text-ink-muted shrink-0 ml-2" />
      </button>

      {open && !disabled && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="relative border-b border-gray-100">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik buat cari..."
              className="w-full pl-9 pr-3 py-2.5 text-sm focus:outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-ink-muted px-4 py-3">Ga ketemu.</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition ${
                    opt.id === value ? "text-brand font-medium bg-brand-light" : "text-ink"
                  }`}
                >
                  {opt.label}
                  {opt.sublabel && (
                    <span className="text-ink-muted font-normal"> — {opt.sublabel}</span>
                  )}
                </button>
              ))
            )}
            {options.length > 50 && filtered.length === 50 && (
              <p className="text-xs text-ink-muted px-4 py-2 border-t border-gray-100">
                Ketik lebih spesifik buat hasil lain
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
