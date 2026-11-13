import { Check, MessageCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button, Textarea } from "./ui";
import "./ui/nova-controls.css";

const levels = [
  "Совсем нет",
  "Скорее нет",
  "Отчасти",
  "Полезно",
  "Очень полезно",
];
const improvements = [
  "Сложно понять",
  "Не хватает примера",
  "Информация устарела",
];
const strengths = ["Понятные шаги", "Хорошие примеры", "Быстро нашёл ответ"];

export function HelpfulRating({ lessonId }: { lessonId: string }) {
  const key = `nova-learning-feedback:${lessonId}`;
  const [rating, setRating] = useState<number | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(() => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  });
  const [error, setError] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating === null) return;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ rating: rating + 1, reasons, note: note.trim() }),
      );
      setSaved(true);
    } catch {
      setError(true);
    }
  }

  return (
    <section className="nova-rating" aria-label="Оценка урока">
      {saved ? (
        <p role="status">
          <Check size={17} aria-hidden="true" /> Спасибо. Отзыв сохранён в этом
          браузере.
        </p>
      ) : (
        <form onSubmit={submit}>
          <fieldset>
            <legend>
              <MessageCircle size={17} aria-hidden="true" /> Был ли полезен этот
              урок?
            </legend>
            <div className="nova-rating-levels">
              {levels.map((label, index) => (
                <label key={label} title={label}>
                  <input
                    type="radio"
                    name={key}
                    aria-label={label}
                    checked={rating === index}
                    onChange={() => {
                      setRating(index);
                      setReasons([]);
                      setError(false);
                    }}
                  />
                  <svg viewBox="0 0 40 40" aria-hidden="true">
                    <circle cx="20" cy="20" r="16" />
                    <path d="M15 15v2m10-2v2" />
                    <path d={`M13 25 Q20 ${15 + index * 5} 27 25`} />
                  </svg>
                </label>
              ))}
            </div>
          </fieldset>
          {rating !== null && (
            <div className="nova-rating-detail">
              <p>{levels[rating]}</p>
              <div
                className="nova-rating-reasons"
                role="group"
                aria-label="Причины оценки"
              >
                {(rating < 3 ? improvements : strengths).map((reason) => (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    key={reason}
                    aria-pressed={reasons.includes(reason)}
                    onClick={() =>
                      setReasons((selected) =>
                        selected.includes(reason)
                          ? selected.filter((item) => item !== reason)
                          : [...selected, reason],
                      )
                    }
                  >
                    {reason}
                  </Button>
                ))}
              </div>
              <Textarea
                aria-label="Комментарий к оценке"
                placeholder="Комментарий (необязательно)"
                rows={2}
                value={note}
                maxLength={1000}
                onChange={(event) => setNote(event.target.value)}
              />
              {error && (
                <p role="alert" className="field-error">
                  Не удалось сохранить отзыв в браузере.
                </p>
              )}
              <Button type="submit" size="sm">
                Сохранить отзыв
              </Button>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
