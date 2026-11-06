// Envelope-only motion. The background is the local React Bits Silk component.
export function mountPartnershipEnvelope(
  section: HTMLElement,
  envelope: HTMLElement,
) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  let visible = false,
    disposed = false;
  let frame = 0,
    previous = 0,
    clock = 0;
  let x = 0,
    y = 0,
    targetX = 0,
    targetY = 0;

  const resetEnvelope = () => {
    for (const key of ["--pe-x", "--pe-y", "--pe-rx", "--pe-ry"])
      envelope.style.removeProperty(key);
  };
  const active = () =>
    visible && !document.hidden && !reduced.matches && !disposed;
  const tick = (now: number) => {
    frame = 0;
    if (!active()) return;
    frame = requestAnimationFrame(tick);
    // This quiet background needs only 30 draws per second, including on Retina.
    if (previous && now - previous < 1000 / 30) return;
    const dt = previous ? Math.min((now - previous) / 1000, 0.1) : 1 / 30;
    previous = now;
    clock += dt;
    const ease = 1 - Math.exp(-dt / 0.32);
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    envelope.style.setProperty("--pe-x", `${(x * 5).toFixed(3)}px`);
    envelope.style.setProperty(
      "--pe-y",
      `${(y * 3 + Math.sin(clock * 0.65) * 3).toFixed(3)}px`,
    );
    envelope.style.setProperty("--pe-rx", `${(-y * 3).toFixed(3)}deg`);
    envelope.style.setProperty("--pe-ry", `${(x * 4).toFixed(3)}deg`);
  };
  const activity = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    if (active()) frame = requestAnimationFrame(tick);
    if (!active()) {
      targetX = targetY = x = y = 0;
      resetEnvelope();
    }
    section.dataset.motion = frame ? "running" : "still";
  };
  const move = (event: PointerEvent) => {
    if (!fine.matches || event.pointerType !== "mouse" || !active()) return;
    const bounds = section.getBoundingClientRect();
    targetX = Math.max(
      -0.5,
      Math.min(
        0.5,
        (event.clientX - bounds.left) / Math.max(1, bounds.width) - 0.5,
      ),
    );
    targetY = Math.max(
      -0.5,
      Math.min(
        0.5,
        (event.clientY - bounds.top) / Math.max(1, bounds.height) - 0.5,
      ),
    );
  };
  const leave = () => {
    targetX = targetY = 0;
  };
  const pointerPreference = () => {
    leave();
  };
  const view = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    activity();
  });
  view.observe(section);
  section.addEventListener("pointermove", move, { passive: true });
  section.addEventListener("pointerleave", leave);
  document.addEventListener("visibilitychange", activity);
  reduced.addEventListener("change", activity);
  fine.addEventListener("change", pointerPreference);
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    view.disconnect();
    section.removeEventListener("pointermove", move);
    section.removeEventListener("pointerleave", leave);
    document.removeEventListener("visibilitychange", activity);
    reduced.removeEventListener("change", activity);
    fine.removeEventListener("change", pointerPreference);
    resetEnvelope();
    delete section.dataset.motion;
  };
}
