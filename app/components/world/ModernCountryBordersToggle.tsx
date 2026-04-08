"use client";

const MODERN_COUNTRY_BORDERS_TOGGLE_LABEL = "modern country borders";

type ModernCountryBordersToggleProps = {
  checked: boolean;
  onToggle: () => void;
};

export function ModernCountryBordersToggle({
  checked,
  onToggle,
}: ModernCountryBordersToggleProps) {
  return (
    <label className="group absolute top-4 left-4 z-20 flex items-center gap-2 rounded-md border border-transparent bg-transparent px-3 py-2 text-xs tracking-wide text-white/45 backdrop-blur-none transition-[color,border-color,background-color,backdrop-filter] hover:border-white/20 hover:bg-black/25 hover:text-white/70 hover:backdrop-blur-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-3.5 w-3.5 border border-slate-300/20 bg-slate-400/15 accent-slate-300/90 checked:bg-slate-400/55"
      />
      <span>{MODERN_COUNTRY_BORDERS_TOGGLE_LABEL}</span>
    </label>
  );
}
