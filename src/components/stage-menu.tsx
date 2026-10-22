import { Check, ChevronDown } from "lucide-react";
import { stages, stageNames, type Stage } from "../data/schema";
import { Menu } from "./ui";

export function StageMenu({
  value,
  onChange,
  label,
  compact = false,
}: {
  value: Stage;
  onChange: (stage: Stage) => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <Menu
      trigger={
        <button
          type="button"
          className={`stage-menu-trigger${compact ? " stage-menu-compact" : ""}`}
          aria-label={label}
        >
          <span>{stageNames[value]}</span>
          <ChevronDown size={13} />
        </button>
      }
      items={stages.map((stage) => ({
        label: stageNames[stage],
        icon:
          stage === value ? (
            <Check size={14} />
          ) : (
            <span className="stage-menu-spacer" />
          ),
        onClick: () => {
          if (stage !== value) onChange(stage);
        },
      }))}
    />
  );
}
