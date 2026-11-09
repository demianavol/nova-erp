import { useSiteLanguage } from "../lib/site-language";
import type { CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  type HistoryPhotograph,
  type HistoryPhotoVariant,
  type HistoryPhotoPlacement,
} from "../data/history-photographs";

export function HistoryPrintedPhoto({
  year,
  photograph,
  draft,
  variant = "main",
  placement,
  visible = true,
}: {
  year: string;
  photograph: HistoryPhotograph;
  draft: boolean;
  variant?: HistoryPhotoVariant;
  placement?: HistoryPhotoPlacement;
  visible?: boolean;
}) {
  const { t } = useSiteLanguage();
  const verified = photograph.verification === "verified" && !!photograph.asset;
  const example = photograph.verification === "example";
  const hasImage = !!photograph.asset && (verified || example);
  const src = `${import.meta.env.BASE_URL}${photograph.asset ?? ""}`;
  const visual = (
    <span className="history-print-window" key={year}>
      {hasImage ? (
        <img
          src={src}
          alt={photograph.alt}
          width="640"
          height="480"
          loading="lazy"
          decoding="async"
          style={{ objectPosition: photograph.position ?? "center" }}
        />
      ) : (
        <span className="history-photo-placeholder">
          <span>{t("Архивное фото")}</span>
          <strong>{year}</strong>
          <span>{t("Материалы ожидаются")}</span>
        </span>
      )}
    </span>
  );
  return (
    <Dialog.Root>
      <figure
        className={`history-print history-print--${variant}`}
        data-photo-variant={variant}
        data-photo-year={year}
        data-photo-status={hasImage ? photograph.verification : "pending"}
        data-visible={visible}
        aria-hidden={!visible || undefined}
        inert={!visible}
        style={
          placement
            ? ({
                "--print-x": placement.left,
                "--print-bottom": placement.bottom,
                "--print-angle": placement.angle,
                "--photo-aspect": placement.aspect ?? "4/3",
              } as CSSProperties)
            : undefined
        }
      >
        {hasImage ? (
          <Dialog.Trigger asChild>
            <button
              className="history-print-open"
              aria-label={
                example
                  ? t("Открыть пример фото для {0} года", year)
                  : t("Открыть фотографию {0} года", year)
              }
            >
              {visual}
            </button>
          </Dialog.Trigger>
        ) : (
          visual
        )}
        <figcaption className="history-print-caption">
          <span className="history-print-year">{year}</span>
          <span>
            {example
              ? t("Пример фото")
              : draft
                ? t("Черновик истории")
                : verified
                  ? t("Архив компании")
                  : t("Фото ожидается")}
          </span>
        </figcaption>
      </figure>
      {hasImage && (
        <Dialog.Portal>
          <Dialog.Overlay className="history-lightbox-overlay" />
          <Dialog.Content className="history-lightbox">
            <Dialog.Title>
              {year} · {example ? t("Пример фото") : "Young Unicorn"}
            </Dialog.Title>
            <img src={src} alt={photograph.alt} />
            <Dialog.Description>
              {photograph.caption}
              {photograph.source && ` · ${photograph.source}`}
            </Dialog.Description>
            <Dialog.Close
              className="history-lightbox-close"
              aria-label={t("Закрыть фотографию")}
            >
              <X size={20} aria-hidden="true" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
