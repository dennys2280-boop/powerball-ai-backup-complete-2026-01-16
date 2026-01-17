// src/components/TopControlsPanel.jsx
import React, { useMemo, useRef } from "react";

/**
 * TopControlsPanel — contract-safe
 * - UI only. No API logic here.
 * - Single source of truth lives in Table1.jsx
 */

function NumInput({
  label,
  value,
  onChange,
  placeholder = "",
  disabled = false,
  variant = "white", // "white" | "pb"
  onKeyDown, // ✅ optional (for Enter shortcuts)
  inputRef, // ✅ optional (to manage focus)
}) {
  const isActive = !disabled && String(value ?? "").trim() !== "";

  const base =
    "w-12 text-center border rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-50";

  const inactive = "bg-white text-black";
  const activeWhite = "bg-gray-900 text-white border-gray-900";
  const activePb = "bg-red-600 text-white border-red-700";

  const active = variant === "pb" ? activePb : activeWhite;

  const stopEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent?.stopImmediatePropagation?.();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[11px] text-gray-500">{label}</div>
      <input
        ref={inputRef}
        className={`${base} ${isActive ? active : inactive}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // ✅ CAPTURE phase to beat any parent/global Enter handler
        onKeyDownCapture={(e) => {
          stopEnter(e);
          onKeyDown?.(e);
        }}
        // ✅ ALSO block Enter on keyup (common place for global shortcuts)
        onKeyUpCapture={(e) => {
          stopEnter(e);
        }}
        inputMode="numeric"
        pattern="\d*"
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
  disabled = false,
  active = false, // ✅ added optional UI-only flag
  onKeyDown, // ✅ optional (for Enter shortcuts)
  selectRef, // ✅ optional (to manage focus)
}) {
  const base =
    "border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-50";

  const inactive = "bg-white text-black";
  const activeCls = "bg-gray-900 text-white border-gray-900";

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[11px] text-gray-500">{label}</div>
      <select
        ref={selectRef}
        className={`${base} ${active && !disabled ? activeCls : inactive}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        onKeyDown={onKeyDown}
      >
        {children}
      </select>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  disabled = false,
  active = false, // ✅ added optional UI-only flag
}) {
  const base =
    "border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-50";

  const inactive = "bg-white text-black";
  const activeCls = "bg-gray-900 text-white border-gray-900";

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[11px] text-gray-500">{label}</div>
      <input
        className={`${base} ${active && !disabled ? activeCls : inactive}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
      />
    </div>
  );
}

export default function TopControlsPanel(props) {
  const {
    // query core
    scope,
    setScope,
    operator,
    setOperator,

    // sort/limit options
    sort,
    setSort,
    direction,
    setDirection,
    complete,
    setComplete,
    limit,
    setLimit,

    // combo A (View Results)
    white1,
    setWhite1,
    white2,
    setWhite2,
    white3,
    setWhite3,
    white4,
    setWhite4,
    white5,
    setWhite5,
    powerball,
    setPowerball,

    // date filters
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,

    // month/day mode
    showMonthDay,
    matchMonthDay,
    setMatchMonthDay,
    monthDayMonth,
    setMonthDayMonth,
    monthDayDay,
    setMonthDayDay,

    // weekday preset
    weekdayOnly,
    setWeekdayOnly,

    // actions
    onSearch,
    onClear,
    onPreset,
    onExportCSV,
    onExportExcel,
    onCalcFrequency,

    // state
    loading,

    // combo B (Check your Numbers)
    compareEnabled,
    setCompareEnabled,
    bWhite1,
    setBWhite1,
    bWhite2,
    setBWhite2,
    bWhite3,
    setBWhite3,
    bWhite4,
    setBWhite4,
    bWhite5,
    setBWhite5,
    bPowerball,
    setBPowerball,
  } = props;

  const monthOptions = useMemo(() => {
    const out = [];
    for (let i = 1; i <= 12; i++) out.push(String(i).padStart(2, "0"));
    return out;
  }, []);

  const dayOptions = useMemo(() => {
    const out = [];
    for (let i = 1; i <= 31; i++) out.push(String(i).padStart(2, "0"));
    return out;
  }, []);

  const disabled = !!loading;

  const sortLabel = (k) => {
    if (k === "draw_date") return "draw_date";
    if (k === "created_at") return "created_at";
    if (k === "white1") return "b1";
    if (k === "white2") return "b2";
    if (k === "white3") return "b3";
    if (k === "white4") return "b4";
    if (k === "white5") return "b5";
    if (k === "powerball") return "pb";
    return k;
  };

  // ✅ Button styles (inactive/active) — UI only, no logic changes
  const btnBase =
    "px-3 py-2 border rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors";
  const btnInactive = "bg-white hover:bg-gray-50 text-black";
  const btnActive = "bg-gray-900 text-white border-gray-900 hover:bg-gray-900";

  const btnCls = (isActive) => `${btnBase} ${isActive ? btnActive : btnInactive}`;

  // ✅ Define "active" states using ONLY existing state/values (no new app logic)
  const dateFiltersActive =
    !disabled &&
    (String(dateFrom ?? "").trim() !== "" || String(dateTo ?? "").trim() !== "");
  const monthDayActive = !disabled && !!showMonthDay && !!matchMonthDay;

  // ✅ Weekday active states (Powerball draw days: mon / wed / sat)
  const weekdayActive = !disabled && String(weekdayOnly ?? "").trim() !== "";
  const monActive = !disabled && weekdayOnly === "mon";
  const wedActive = !disabled && weekdayOnly === "wed";
  const satActive = !disabled && weekdayOnly === "sat";

  // For header action buttons: only reliable existing state is loading
  const searchActive = !!loading;

  // ✅ Shared focus/caret helper (used by Combo A and Combo B)
  const focusAndArmCursor = (ref) => {
    const el = ref?.current;
    if (!el) return;

    const arm = () => {
      try {
        el.focus?.({ preventScroll: true });
        el.focus?.();
        el.click?.();

        const v = String(el.value ?? "");
        if (typeof el.select === "function") el.select();
        if (typeof el.setSelectionRange === "function") {
          el.setSelectionRange(v.length, v.length);
        }
      } catch {
        // no-op
      }
    };

    arm();
    requestAnimationFrame(() => arm());
    setTimeout(() => arm(), 0);
    setTimeout(() => arm(), 15);
  };

  // ✅ View Results (Combo A): Enter Handling (B1 -> ... -> PB -> Search)
  const white1Ref = useRef(null);
  const white2Ref = useRef(null);
  const white3Ref = useRef(null);
  const white4Ref = useRef(null);
  const white5Ref = useRef(null);
  const powerballRef = useRef(null);

  const handleAKeyDownTo = (nextRef) => (e) => {
    if (e.key === "Enter") {
      setTimeout(() => {
        focusAndArmCursor(nextRef);
      }, 0);
    }
  };

  const handleAPowerballKeyDown = (e) => {
    if (e.key === "Enter") {
      setTimeout(() => {
        if (!disabled) onSearch?.();
      }, 0);
    }
  };

  // ✅ Check Your Numbers (Combo B): Enter handling (B1 -> ... -> PB -> Search)
  const bWhite1Ref = useRef(null);
  const bWhite2Ref = useRef(null);
  const bWhite3Ref = useRef(null);
  const bWhite4Ref = useRef(null);
  const bWhite5Ref = useRef(null);
  const bPowerballRef = useRef(null);

  const handleBKeyDownTo = (nextRef) => (e) => {
    if (e.key === "Enter") {
      setTimeout(() => {
        focusAndArmCursor(nextRef);
      }, 0);
    }
  };

  const handleBPowerballKeyDown = (e) => {
    if (e.key === "Enter") {
      setTimeout(() => {
        if (!disabled) onSearch?.();
      }, 0);
    }
  };

  // ✅ Match Month/Day: Enter handling (independent UI-only behavior)
  const monthSelectRef = useRef(null);
  const daySelectRef = useRef(null);

  const handleMonthDayMonthKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      setTimeout(() => {
        daySelectRef.current?.focus();
      }, 0);
    }
  };

  const handleMonthDayDayKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      setTimeout(() => {
        if (!disabled) onSearch?.();
      }, 0);
    }
  };

  return (
    <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-b from-white to-gray-50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-base font-semibold tracking-tight">Top Controls</div>
            <div className="text-xs text-gray-500 mt-1">Inputs + Search.</div>
          </div>

          {/* Actions (SINGLE Search button) */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnCls(searchActive)}
              onClick={onSearch}
              disabled={disabled}
              title="Ctrl+Shift+S"
            >
              <span className="underline">S</span>earch
            </button>

            <button
              type="button"
              className={btnCls(false)}
              onClick={onClear}
              disabled={disabled}
              title="Ctrl+Shift+C"
            >
              <span className="underline">C</span>lear
            </button>

            <button
              type="button"
              className={btnCls(false)}
              onClick={onExportCSV}
              disabled={disabled}
              title="Ctrl+Shift+V"
            >
              Export CS<span className="underline">V</span>
            </button>

            <button
              type="button"
              className={btnCls(false)}
              onClick={onExportExcel}
              disabled={disabled}
              title="Ctrl+Shift+E"
            >
              Export <span className="underline">E</span>xcel
            </button>

            <button
              type="button"
              className={btnCls(false)}
              onClick={onCalcFrequency}
              disabled={true}
              title="Placeholder (not implemented in this phase)"
            >
              Frequency (Soon)
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Row 1: scope/operator/sort */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <Select label="Scope" value={scope} onChange={setScope} disabled={disabled}>
            <option value="History">History</option>
            <option value="Future">Future</option>
          </Select>

          <Select label="Operator" value={operator} onChange={setOperator} disabled={disabled}>
            <option value="And">And</option>
            <option value="Or">Or</option>
            <option value="AtLeast">AtLeast</option>
          </Select>

          <Select label="Sort" value={sort} onChange={setSort} disabled={disabled}>
            <option value="Draw_Date">{sortLabel("Draw_Date")}</option>
            <option value="white1">{sortLabel("white1")}</option>
            <option value="white2">{sortLabel("white2")}</option>
            <option value="white3">{sortLabel("white3")}</option>
            <option value="white4">{sortLabel("white4")}</option>
            <option value="white5">{sortLabel("white5")}</option>
            <option value="powerball">{sortLabel("powerball")}</option>
            <option value="created_at">{sortLabel("created_at")}</option>
          </Select>

          <Select label="Direction" value={direction} onChange={setDirection} disabled={disabled}>
            <option value="Asc">Asc</option>
            <option value="Desc">Desc</option>
          </Select>

          <Select
            label="Complete"
            value={complete ? "1" : "0"}
            onChange={(v) => setComplete(v === "1")}
            disabled={disabled}
          >
            <option value="1">Complete</option>
            <option value="0">partial</option>
          </Select>

          <TextInput
            label="Limit"
            value={String(limit ?? "")}
            onChange={(v) => setLimit(v)}
            type="number"
            disabled={disabled}
            placeholder="200"
          />
        </div>

        {/* Row 2: View Results + Check Your Numbers Side By Side */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* View Results (Combo A) */}
          <div className="border rounded-2xl p-3">
            <div>
              <div className="text-[14px] font-semibold">View Results</div>
              <div className="text-[8px] text-gray-500">Whites (1–69) + PB (1–26)</div>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 items-end">
              <NumInput
                label="B1"
                value={white1}
                onChange={setWhite1}
                disabled={disabled}
                inputRef={white1Ref}
                onKeyDown={handleAKeyDownTo(white2Ref)}
              />
              <NumInput
                label="B2"
                value={white2}
                onChange={setWhite2}
                disabled={disabled}
                inputRef={white2Ref}
                onKeyDown={handleAKeyDownTo(white3Ref)}
              />
              <NumInput
                label="B3"
                value={white3}
                onChange={setWhite3}
                disabled={disabled}
                inputRef={white3Ref}
                onKeyDown={handleAKeyDownTo(white4Ref)}
              />
              <NumInput
                label="B4"
                value={white4}
                onChange={setWhite4}
                disabled={disabled}
                inputRef={white4Ref}
                onKeyDown={handleAKeyDownTo(white5Ref)}
              />
              <NumInput
                label="B5"
                value={white5}
                onChange={setWhite5}
                disabled={disabled}
                inputRef={white5Ref}
                onKeyDown={handleAKeyDownTo(powerballRef)}
              />
              <NumInput
                label="PB"
                value={powerball}
                onChange={setPowerball}
                disabled={disabled}
                variant="pb"
                inputRef={powerballRef}
                onKeyDown={handleAPowerballKeyDown}
              />
            </div>

            <div className="mt-3 text-[8px] text-gray-500">
              This Controls The Dataset Filter You Selected (History/Future).
            </div>
          </div>

          {/* Check your Numbers (Combo B) */}
          <div className="border rounded-2xl p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold">Check Your Numbers</div>
                <div className="text-[8px] text-gray-500">
                  Compare Played Numbers Vs History Results Or Vs Future/Quick Picks.
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!compareEnabled}
                  onChange={(e) => setCompareEnabled(e.target.checked)}
                  disabled={disabled}
                />
                Enable
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 items-end">
              <NumInput
                label="B1"
                value={bWhite1}
                onChange={setBWhite1}
                disabled={disabled || !compareEnabled}
                inputRef={bWhite1Ref}
                onKeyDown={handleBKeyDownTo(bWhite2Ref)}
              />
              <NumInput
                label="B2"
                value={bWhite2}
                onChange={setBWhite2}
                disabled={disabled || !compareEnabled}
                inputRef={bWhite2Ref}
                onKeyDown={handleBKeyDownTo(bWhite3Ref)}
              />
              <NumInput
                label="B3"
                value={bWhite3}
                onChange={setBWhite3}
                disabled={disabled || !compareEnabled}
                inputRef={bWhite3Ref}
                onKeyDown={handleBKeyDownTo(bWhite4Ref)}
              />
              <NumInput
                label="B4"
                value={bWhite4}
                onChange={setBWhite4}
                disabled={disabled || !compareEnabled}
                inputRef={bWhite4Ref}
                onKeyDown={handleBKeyDownTo(bWhite5Ref)}
              />
              <NumInput
                label="B5"
                value={bWhite5}
                onChange={setBWhite5}
                disabled={disabled || !compareEnabled}
                inputRef={bWhite5Ref}
                onKeyDown={handleBKeyDownTo(bPowerballRef)}
              />
              <NumInput
                label="PB"
                value={bPowerball}
                onChange={setBPowerball}
                disabled={disabled || !compareEnabled}
                variant="pb"
                inputRef={bPowerballRef}
                onKeyDown={handleBPowerballKeyDown}
              />
            </div>

            <div className="mt-3 text-[8px] text-gray-500">
              When Enabled, Filter Results Highlights History (Red Ring) and Future (lue Ring).
            </div>
          </div>
        </div>

        {/* Row 3: Dates + Month/Day + Weekday + Presets */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="border rounded-2xl p-3 space-y-3">
            <div>
              <div className="text-sm font-semibold">Date Filters</div>
              <div className="text-[8px] text-gray-500">Applies Only When Scope Is History.</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <TextInput
                label="From"
                type="date"
                value={dateFrom}
                onChange={setDateFrom}
                disabled={disabled}
                active={dateFiltersActive}
              />
              <TextInput
                label="To"
                type="date"
                value={dateTo}
                onChange={setDateTo}
                disabled={disabled}
                active={dateFiltersActive}
              />
            </div>

            {/* ✅ Removed Xmas week / Halloween buttons from UI (functions/props remain intact) */}
          </div>

          <div className="border rounded-2xl p-3 space-y-3">
            <div>
              <div className="text-sm font-semibold">Match Month/Day</div>
              <div className="text-[8px] text-gray-500">Cross-Years Mode.</div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!matchMonthDay}
                onChange={(e) => setMatchMonthDay(e.target.checked)}
                disabled={disabled || !showMonthDay}
              />
              Enable
              {!showMonthDay ? <span className="text-xs text-gray-400">(history only)</span> : null}
            </label>

            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Month"
                value={String(monthDayMonth ?? "01").padStart(2, "0")}
                onChange={setMonthDayMonth}
                disabled={disabled || !showMonthDay || !matchMonthDay}
                active={monthDayActive}
                onKeyDown={handleMonthDayMonthKeyDown}
                selectRef={monthSelectRef}
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>

              <Select
                label="Day"
                value={String(monthDayDay ?? "01").padStart(2, "0")}
                onChange={setMonthDayDay}
                disabled={disabled || !showMonthDay || !matchMonthDay}
                active={monthDayActive}
                onKeyDown={handleMonthDayDayKeyDown}
                selectRef={daySelectRef}
              >
                {dayOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="border rounded-2xl p-3 space-y-3">
            <div>
              <div className="text-sm font-semibold">Weekday</div>
              <div className="text-[8px] text-gray-500">Shortcuts.</div>
            </div>

            <Select
              label="Only"
              value={weekdayOnly}
              onChange={setWeekdayOnly}
              disabled={disabled}
              active={weekdayActive}
            >
              <option value="">(Any)</option>
              <option value="mon">Mon</option>
              <option value="wed">Wed</option>
              <option value="sat">Sat</option>
            </Select>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={btnCls(monActive)}
                onClick={() => setWeekdayOnly("mon")}
                disabled={disabled}
              >
                Mon Only
              </button>

              <button
                type="button"
                className={btnCls(wedActive)}
                onClick={() => setWeekdayOnly("wed")}
                disabled={disabled}
              >
                Wed Only
              </button>

              <button
                type="button"
                className={btnCls(satActive)}
                onClick={() => setWeekdayOnly("sat")}
                disabled={disabled}
              >
                Sat Only
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
