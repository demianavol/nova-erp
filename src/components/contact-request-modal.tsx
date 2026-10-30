import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Check, X } from "lucide-react";
import {
  contactMethods,
  contactRequestSchema,
  type ContactRequest,
} from "../data/contact-request";

export function ContactRequestModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<ContactRequest["method"]>("phone");
  const [contact, setContact] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<ContactRequest | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const done = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const currentMethod = contactMethods.find((item) => item.id === method)!;
  const reset = () => {
    setMethod("phone");
    setContact("");
    setName("");
    setError("");
    setSubmitted(null);
  };
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <div className="landing lp-contact-theme">
          <Dialog.Overlay className="lp-contact-overlay" />
          <Dialog.Content
            className="lp-contact-dialog"
            onOpenAutoFocus={(event) => {
              opener.current =
                document.activeElement instanceof HTMLElement
                  ? document.activeElement
                  : null;
              reset();
              event.preventDefault();
              requestAnimationFrame(() => input.current?.focus());
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              opener.current?.focus();
            }}
          >
            <Dialog.Close asChild>
              <button
                type="button"
                className="lp-contact-close"
                aria-label="Закрыть форму контакта"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
            {submitted ? (
              <>
                <div className="lp-contact-success-mark">
                  <Check size={26} />
                </div>
                <Dialog.Title>Заявка готова</Dialog.Title>
                <Dialog.Description>
                  Это тест — заявка не отправлена команде
                </Dialog.Description>
                <div className="lp-contact-summary">
                  <span>
                    {
                      contactMethods.find(
                        (item) => item.id === submitted.method,
                      )!.label
                    }
                  </span>
                  <strong>{submitted.contact}</strong>
                </div>
                <button
                  ref={done}
                  type="button"
                  className="lp-contact-submit"
                  onClick={onClose}
                >
                  Готово
                </button>
              </>
            ) : (
              <>
                <span className="lp-contact-mode">Тестовая форма</span>
                <Dialog.Title>Оставьте контакт</Dialog.Title>
                <Dialog.Description>
                  Заявки пока не отправляются команде
                </Dialog.Description>
                <form
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    const result = contactRequestSchema.safeParse({
                      name,
                      method,
                      contact,
                    });
                    if (!result.success) {
                      setError(result.error.issues[0].message);
                      input.current?.focus();
                      return;
                    }
                    setSubmitted(result.data);
                    setError("");
                    requestAnimationFrame(() => done.current?.focus());
                  }}
                >
                  <label className="lp-contact-field">
                    Способ связи
                    <select
                      value={method}
                      onChange={(event) => {
                        setMethod(
                          event.target.value as ContactRequest["method"],
                        );
                        setContact("");
                        setError("");
                      }}
                    >
                      {contactMethods.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="lp-contact-field">
                    {currentMethod.label}
                    <input
                      ref={input}
                      value={contact}
                      onChange={(event) => {
                        setContact(event.target.value);
                        setError("");
                      }}
                      type={
                        method === "email"
                          ? "email"
                          : method === "phone"
                            ? "tel"
                            : "text"
                      }
                      autoComplete={
                        method === "email"
                          ? "email"
                          : method === "phone"
                            ? "tel"
                            : "off"
                      }
                      maxLength={160}
                      placeholder={currentMethod.placeholder}
                      required
                      aria-invalid={!!error}
                      aria-describedby={
                        error ? "contact-form-error" : undefined
                      }
                    />
                  </label>
                  {error && (
                    <p
                      id="contact-form-error"
                      role="alert"
                      className="lp-contact-error"
                    >
                      {error}
                    </p>
                  )}
                  <label className="lp-contact-field">
                    Имя или компания <span>необязательно</span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={80}
                      autoComplete="organization"
                      placeholder="Как к вам обращаться"
                    />
                  </label>
                  <button type="submit" className="lp-contact-submit">
                    Проверить заявку <ArrowRight size={17} />
                  </button>
                  <p className="lp-contact-note">
                    Данные не сохраняются и никуда не передаются
                  </p>
                </form>
              </>
            )}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
