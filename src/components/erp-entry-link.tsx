import type { MouseEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../erp-entry-transition.css";

const destination = "/erp/employees";

export function ErpEntryLink({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const navigate = useNavigate();

  const enterErp = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !document.startViewTransition ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const landing = event.currentTarget.closest(".landing-home");
    const root = document.documentElement;
    if (!landing || root.hasAttribute("data-site-theme-reveal")) return;

    event.preventDefault();
    if (root.hasAttribute("data-erp-entry-transition")) return;

    root.dataset.erpEntryTransition = "";
    const transition = document.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          const finish = () => {
            observer.disconnect();
            window.clearTimeout(deadline);
            resolve();
          };
          const observer = new MutationObserver(() => {
            const main = document.getElementById("main-content");
            if (!main || landing.contains(main)) return;
            window.scrollTo({ top: 0, behavior: "instant" });
            main.focus({ preventScroll: true });
            finish();
          });
          // Wait for the final screen through auth redirects and lazy route loading.
          const deadline = window.setTimeout(finish, 1200);
          observer.observe(root, { childList: true, subtree: true });
          navigate(destination);
        }),
    );

    const cleanup = () => delete root.dataset.erpEntryTransition;
    void transition.ready.catch(() => {});
    void transition.finished.then(cleanup, cleanup);
  };

  return (
    <Link to={destination} className={className} onClick={enterErp}>
      {children}
    </Link>
  );
}
