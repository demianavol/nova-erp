import { Check, LoaderCircle, Save } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "./index";
import { useERP } from "../../data/store";
import "./nova-controls.css";

type SaveStatus = "idle" | "saving" | "saved";

export function useSaveAction() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const busy = useRef(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function run(
    action: () => boolean | void | Promise<boolean | void>,
    onDone?: () => void,
  ) {
    if (busy.current) return;
    busy.current = true;
    setStatus("saving");
    try {
      const saved = await action();
      if (saved === false) {
        busy.current = false;
        setStatus("idle");
        return;
      }
      if (saved === undefined && useERP.getState().storageError) {
        busy.current = false;
        setStatus("idle");
        onDone?.();
        return;
      }
      setStatus("saved");
      timer.current = window.setTimeout(() => {
        busy.current = false;
        setStatus("idle");
        onDone?.();
      }, 600);
    } catch (error) {
      busy.current = false;
      setStatus("idle");
      throw error;
    }
  }

  return { status, run };
}

export function SaveButton({
  status,
  children,
}: {
  status: SaveStatus;
  children: ReactNode;
}) {
  return (
    <Button
      type="submit"
      className="nova-save-button"
      data-status={status}
      disabled={status !== "idle"}
    >
      {status === "saving" ? (
        <LoaderCircle
          className="nova-save-spinner"
          size={16}
          aria-hidden="true"
        />
      ) : status === "saved" ? (
        <Check size={16} aria-hidden="true" />
      ) : (
        <Save size={16} aria-hidden="true" />
      )}
      <span aria-live="polite">
        {status === "saving"
          ? "Сохраняем…"
          : status === "saved"
            ? "Сохранено"
            : children}
      </span>
      {status === "saved" && (
        <span className="nova-save-burst" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <i key={index} style={{ rotate: `${index * 45}deg` }} />
          ))}
        </span>
      )}
    </Button>
  );
}

const holdDuration = 720;

export function HoldButton({
  children,
  onConfirm,
  danger = false,
}: {
  children: string;
  onConfirm: () => void;
  danger?: boolean;
}) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number>(undefined);

  function cancel() {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    setHolding(false);
  }

  function begin() {
    if (timer.current !== undefined) return;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      cancel();
      onConfirm();
    }, holdDuration);
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <Button
      type="button"
      variant={danger ? "danger" : "outline"}
      className="nova-hold"
      data-holding={holding}
      aria-label={`Удерживайте: ${children}`}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        begin();
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onLostPointerCapture={cancel}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          cancel();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          cancel();
        } else if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          if (!event.repeat) begin();
        }
      }}
      onKeyUp={(event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        cancel();
      }}
      onBlur={cancel}
      onContextMenu={(event) => {
        if (holding) event.preventDefault();
      }}
    >
      <span>{holding ? "Удерживайте…" : children}</span>
    </Button>
  );
}
