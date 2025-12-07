"use client";

type TimelineToggleButtonProps = {
  currentYear: number;
  expanded: boolean;
  onToggle: () => void;
};

export const TimelineToggleButton = ({
  currentYear,
  expanded,
  onToggle,
}: TimelineToggleButtonProps) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <button
      data-timeline-toggle-button
      onClick={onToggle}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 w-20 bg-white/50 backdrop-blur-[5px] rounded-l-lg flex flex-col items-center justify-center gap-1 py-2 hover:bg-white/70 transition-colors z-20"
      aria-label={expanded ? "Collapse timeline" : "Expand timeline"}
    >
      <span className="text-gray-700 text-[10px] leading-tight">
        Current Year
      </span>
      <span className="text-gray-700 font-mono text-xl font-bold leading-none">
        {Math.round(currentYear)}
      </span>
      <span className="text-gray-700 text-lg font-bold">
        {expanded ? "→" : "←"}
      </span>
    </button>
  );
};
