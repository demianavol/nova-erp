import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui";
import { HelpfulRating } from "../components/helpful-rating";
import { guideTopics } from "../data/employee-guide";
import {
  lessonIds,
  progressKey,
  readLearningProgress,
} from "../data/learning-progress";
import { GuideArticleContent } from "./employees";

const base = "/erp/learning";
const lessons = lessonIds.map((id) =>
  guideTopics.find((topic) => topic.id === id)!,
);

export function ErpLearning() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [completed, setCompleted] = useState(readLearningProgress);
  const content = useRef<HTMLElement>(null);
  const lessonIndex = lessons.findIndex((topic) => topic.id === lessonId);
  const lesson = lessons[lessonIndex];
  useEffect(() => {
    content.current?.focus({ preventScroll: true });
  }, [lessonId]);

  if (lessonId && !lesson) return <Navigate to={base} replace />;
  if (lesson) {
    const next = lessons[lessonIndex + 1];
    const isDone = completed.includes(lesson.id);
    const continueLearning = () => {
      const updated = [
        ...new Set([...readLearningProgress(), ...completed, lesson.id]),
      ];
      try {
        localStorage.setItem(progressKey, JSON.stringify(updated));
      } catch {
        // Progress still works during the current visit.
      }
      setCompleted(updated);
      navigate(next ? `${base}/lesson/${next.id}` : base);
    };
    return (
      <div className="landing employee-guide employee-guide-erp">
        <div className="eg-content">
          <article
            className="eg-article erp-lesson"
            ref={content}
            tabIndex={-1}
            aria-labelledby="eg-article-title"
          >
            <div className="erp-lesson-meta">
              <Link to={base}>Учебный маршрут</Link>
              <span>
                Урок {lessonIndex + 1} из {lessons.length}
                {isDone && " · Пройден"}
              </span>
            </div>
            <GuideArticleContent topic={lesson} />
            <div className="erp-onboarding-actions">
              <Button onClick={continueLearning}>
                {next
                  ? isDone
                    ? "Следующий урок"
                    : "Отметить и продолжить"
                  : isDone
                    ? "К учебному маршруту"
                    : "Отметить урок пройденным"}
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </div>
            <HelpfulRating key={lesson.id} lessonId={lesson.id} />
          </article>
        </div>
      </div>
    );
  }

  return (
    <section
      className="erp-learning-page"
      ref={content}
      tabIndex={-1}
      aria-labelledby="erp-learning-title"
    >
      <h1 className="erp-page-title" id="erp-learning-title">
        Вводное обучение
      </h1>
      <p className="erp-learning-intro">
        Познакомьтесь с компанией, командой и рабочими процессами в пяти уроках.
      </p>
      <div className="erp-learning-progress">
        <span>
          Пройдено {completed.length} из {lessons.length}
        </span>
        <progress
          aria-label="Прогресс обучения"
          max={lessons.length}
          value={completed.length}
        />
      </div>
      <ol className="erp-learning-list">
        {lessons.map(({ id, title, summary }, index) => (
          <li key={id}>
            <Link className="card erp-learning-row" to={`${base}/lesson/${id}`}>
              <span className="erp-learning-number" aria-hidden="true">
                {index + 1}
              </span>
              <span>
                <strong>{title}</strong>
                <small>{summary}</small>
              </span>
              {completed.includes(id) ? (
                <Check size={17} role="img" aria-label="Пройден" />
              ) : (
                <ArrowRight size={17} aria-hidden="true" />
              )}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
