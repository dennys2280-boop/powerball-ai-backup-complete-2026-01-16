// src/components/Table2.jsx
import React, { useMemo, useRef, useState } from "react";

/**
 * Tabla 2 — Diseñador de combinaciones (Editable)
 * - Edición por celda
 * - Pegar múltiples filas (TSV/CSV)
 * - Validación de rangos
 * - Delete: celda -> borra número; fila -> borra fila; multi -> borra varias
 * - Clear table con confirmación
 * - Guardar sets en localStorage (Fase inicial)
 */

const COLS = [
    { key: "b1", label: "B1", min: 1, max: 69, maxLen: 2 },
    { key: "b2", label: "B2", min: 1, max: 69, maxLen: 2 },
    { key: "b3", label: "B3", min: 1, max: 69, maxLen: 2 },
    { key: "b4", label: "B4", min: 1, max: 69, maxLen: 2 },
    { key: "b5", label: "B5", min: 1, max: 69, maxLen: 2 },
    { key: "pb", label: "PB", min: 1, max: 26, maxLen: 2 },
];

const LS_KEY = "pb_sets_v1";

function newRow() {
    return {
        id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        b1: "",
        b2: "",
        b3: "",
        b4: "",
        b5: "",
        pb: "",
    };
}

function sanitizeNumber(value, min, max) {
    if (value === "" || value === null || value === undefined) return "";
    const n = Number(value);
    if (!Number.isFinite(n)) return "";
    const i = Math.trunc(n);
    if (i < min || i > max) return "";
    return String(i);
}

function parsePasted(text) {
    // accepts TSV or CSV or space-separated; returns rows of length up to 6
    const lines = String(text || "")
        .replace(/\r/g, "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    const out = [];
    for (const line of lines) {
        const parts = line.includes("\t")
            ? line.split("\t")
            : line.includes(",")
                ? line.split(",")
                : line.split(/\s+/);

        const row = parts.slice(0, 6).map((x) => x.trim());
        out.push(row);
    }
    return out;
}

function saveSetToLocalStorage({ name, createdAt, rows, filterContext }) {
    const payload = {
        id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        name,
        createdAt,
        rows,
        filterContext,
    };

    const current = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    current.unshift(payload);
    localStorage.setItem(LS_KEY, JSON.stringify(current));
    return payload;
}

export default function Table2({ defaultSetName, filterContext }) {
    const [rows, setRows] = useState(() => [newRow(), newRow(), newRow(), newRow(), newRow()]);
    const [setName, setSetName] = useState(defaultSetName || "");
    const [lastSaved, setLastSaved] = useState(null);

    // selection state
    const [activeCell, setActiveCell] = useState({ rowId: null, colKey: null });
    const [selectedRowIds, setSelectedRowIds] = useState(new Set());

    const tableRef = useRef(null);

    // keep name never empty (rule clave)
    useMemo(() => {
        setSetName((prev) =>
            String(prev || "").trim()
                ? prev
                : defaultSetName || "Nuevas combinaciones diseñadas sin filtros"
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultSetName]);

    const onCellChange = (rowId, colKey, raw) => {
        const col = COLS.find((c) => c.key === colKey);

        // ✅ only digits, maxLen=2
        const cleaned = String(raw ?? "")
            .replace(/\D/g, "")
            .slice(0, col.maxLen);

        const v = sanitizeNumber(cleaned, col.min, col.max);

        setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [colKey]: v } : r)));
    };

    const onAddRow = () => setRows((prev) => [...prev, newRow()]);

    const onClearTable = () => {
        const ok = window.confirm("¿Seguro que quieres borrar toda la Tabla 2?");
        if (!ok) return;
        setRows([newRow(), newRow(), newRow(), newRow(), newRow()]);
        setSelectedRowIds(new Set());
        setActiveCell({ rowId: null, colKey: null });
    };

    const onSaveSet = () => {
        const name =
            String(setName || "").trim() ||
            String(defaultSetName || "").trim() ||
            "Nuevas combinaciones diseñadas sin filtros";

        // keep only rows with at least one value
        const cleanRows = rows
            .map((r) => ({
                b1: r.b1,
                b2: r.b2,
                b3: r.b3,
                b4: r.b4,
                b5: r.b5,
                pb: r.pb,
            }))
            .filter((r) => Object.values(r).some((v) => String(v || "").trim() !== ""));

        const createdAt = new Date().toISOString();
        const saved = saveSetToLocalStorage({ name, createdAt, rows: cleanRows, filterContext });
        setLastSaved(saved);
        alert("Set guardado en localStorage ✅");
    };

    const toggleRow = (rowId, multi) => {
        setSelectedRowIds((prev) => {
            const next = new Set(prev);
            if (!multi) next.clear();
            if (next.has(rowId)) next.delete(rowId);
            else next.add(rowId);
            return next;
        });
    };

    const handleKeyDown = (e) => {
        if (e.key !== "Delete" && e.key !== "Backspace") return;

        // If multiple rows selected => delete rows
        if (selectedRowIds.size > 0) {
            setRows((prev) => prev.filter((r) => !selectedRowIds.has(r.id)));
            setSelectedRowIds(new Set());
            setActiveCell({ rowId: null, colKey: null });
            return;
        }

        // Else delete active cell only
        if (activeCell.rowId && activeCell.colKey) {
            setRows((prev) =>
                prev.map((r) => (r.id === activeCell.rowId ? { ...r, [activeCell.colKey]: "" } : r))
            );
        }
    };

    const onPaste = (e) => {
        // Paste only when table focused
        const text = e.clipboardData?.getData("text/plain");
        if (!text) return;

        const parsed = parsePasted(text);
        if (!parsed.length) return;

        e.preventDefault();

        setRows((prev) => {
            const next = [...prev];

            // start at active row index if exists, else append
            const startIdx = activeCell.rowId ? next.findIndex((r) => r.id === activeCell.rowId) : -1;
            const insertAt = startIdx >= 0 ? startIdx : next.length;

            // ensure enough rows
            while (next.length < insertAt + parsed.length) next.push(newRow());

            // fill rows
            for (let i = 0; i < parsed.length; i++) {
                const vals = parsed[i];
                const row = next[insertAt + i];
                const patched = { ...row };

                for (let c = 0; c < COLS.length; c++) {
                    const col = COLS[c];
                    const raw = vals[c] ?? "";
                    const cleaned = String(raw).replace(/\D/g, "").slice(0, col.maxLen);
                    patched[col.key] = sanitizeNumber(cleaned, col.min, col.max);
                }

                next[insertAt + i] = patched;
            }

            return next;
        });
    };

    return (
        <div className="h-full bg-white border rounded-lg overflow-hidden flex flex-col">
            <div className="p-3 border-b flex items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold">Tabla 2 — Diseñador de combinaciones (Editable)</div>
                    <div className="text-xs opacity-70">
                        Escribe o pega múltiples filas. Delete/Backspace borra celda o filas.
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="px-3 py-1 border rounded text-sm font-semibold hover:bg-gray-50"
                        onClick={onAddRow}
                    >
                        + Row
                    </button>

                    <button
                        type="button"
                        className="px-3 py-1 border rounded text-sm font-semibold hover:bg-gray-50"
                        onClick={onSaveSet}
                    >
                        Save Set
                    </button>

                    <button
                        type="button"
                        className="px-3 py-1 border rounded text-sm font-semibold hover:bg-gray-50"
                        onClick={onClearTable}
                    >
                        Clear Table 2
                    </button>
                </div>
            </div>

            <div className="p-3 border-b space-y-2">
                <div className="text-xs opacity-70">Nombre del set (auto, editable, nunca vacío)</div>
                <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={setName}
                    onChange={(e) => setSetName(e.target.value)}
                    onBlur={() => {
                        const v = String(setName || "").trim();
                        if (!v) setSetName(defaultSetName || "Nuevas combinaciones diseñadas sin filtros");
                    }}
                />
                <div className="text-xs opacity-60">
                    Default: <span className="font-semibold">{defaultSetName}</span>
                </div>

                {lastSaved ? (
                    <div className="text-xs opacity-60">
                        Last saved: <span className="font-semibold">{lastSaved.name}</span> · {lastSaved.createdAt}
                    </div>
                ) : null}
            </div>

            <div
                className="flex-1 overflow-auto"
                tabIndex={0}
                ref={tableRef}
                onKeyDown={handleKeyDown}
                onPaste={onPaste}
            >
                <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                        <tr className="border-b">
                            <th className="text-left p-2 w-12">#</th>
                            {COLS.map((c) => (
                                <th key={c.key} className="text-left p-2">
                                    {c.label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((r, idx) => {
                            const rowSelected = selectedRowIds.has(r.id);
                            return (
                                <tr
                                    key={r.id}
                                    className={`border-b ${rowSelected ? "bg-blue-50" : ""}`}
                                    onClick={(e) => {
                                        // click on row number selects row; click cells sets active cell
                                        const isRowNumber = e.target?.dataset?.rowselect === "1";
                                        if (isRowNumber) toggleRow(r.id, e.metaKey || e.ctrlKey || e.shiftKey);
                                    }}
                                >
                                    <td
                                        className="p-2 text-xs font-semibold select-none cursor-pointer"
                                        data-rowselect="1"
                                        title="Click para seleccionar fila. Ctrl/Cmd para multi-selección."
                                    >
                                        {idx + 1}
                                    </td>

                                    {COLS.map((c) => {
                                        const isActive = activeCell.rowId === r.id && activeCell.colKey === c.key;
                                        return (
                                            <td key={c.key} className="p-2">
                                                <input
                                                    className={`w-12 border rounded px-2 py-1 text-sm text-center ${isActive ? "ring-2 ring-black" : ""
                                                        }`}
                                                    value={r[c.key]}
                                                    inputMode="numeric"
                                                    maxLength={c.maxLen}
                                                    pattern="\d*"
                                                    onFocus={() => {
                                                        setActiveCell({ rowId: r.id, colKey: c.key });
                                                        setSelectedRowIds(new Set()); // focusing a cell clears row selection
                                                    }}
                                                    onChange={(e) => onCellChange(r.id, c.key, e.target.value)}
                                                    placeholder={`${c.min}-${c.max}`}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="p-3 text-xs opacity-60">
                    Pegar: TSV/CSV o espacios. Ejemplo: <span className="font-semibold">1 2 3 4 5 6</span> (6 columnas).
                    <br />
                    Delete/Backspace:
                    <span className="font-semibold"> celda</span> borra número ·
                    <span className="font-semibold"> filas seleccionadas</span> borra combinaciones.
                </div>
            </div>
        </div>
    );
}
