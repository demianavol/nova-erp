import {
  invitationPaperMotion,
  invitationPocketClip,
} from "./partnership-invitation-geometry";

export type InvitationState = "closed" | "opening" | "open" | "closing";
export type InvitationCommand = "open" | "close";

export function invitationTransition(
  state: InvitationState,
  command: InvitationCommand,
): InvitationState {
  if (state === "closed" && command === "open") return "opening";
  if (state === "open" && command === "close") return "closing";
  return state;
}

type InvitationElements = {
  stage: HTMLElement;
  layers: HTMLElement[];
  flap: HTMLElement;
  hinge: HTMLElement;
  letter: HTMLElement;
  sleeve: HTMLElement;
  copy: HTMLElement;
  trigger: HTMLButtonElement;
  heading: HTMLElement;
};

/** One cancellable, coordinated timeline. Resizing completes the current intent. */
export function mountPartnershipInvitation(
  elements: InvitationElements,
  reduced: MediaQueryList,
  onState: (state: InvitationState) => void,
) {
  const { stage, layers, flap, hinge, letter, sleeve, copy, trigger, heading } =
    elements;
  let state: InvitationState = "closed";
  let animations: Animation[] = [];
  let generation = 0;
  let disposed = false;
  let width = 0;
  let letterHeight = 0;
  const metrics = () => {
    width = stage.clientWidth;
    letterHeight = letter.offsetHeight;
    const envelopeHeight = (width * 372) / 640;
    // The last strip of paper stays inside the pocket in the reading position.
    const offset = Math.max(0, letterHeight - envelopeHeight * 0.16);
    return {
      envelopeHeight,
      offset,
      closedHeight: envelopeHeight + 36,
      openHeight: offset + envelopeHeight + 36,
    };
  };
  const notify = (value: InvitationState) => {
    state = value;
    stage.dataset.state = value;
    onState(value);
  };
  const cancel = () => {
    generation++;
    animations.forEach((animation) => animation.cancel());
    animations = [];
  };
  const settle = (open: boolean, focus = true) => {
    const m = metrics();
    stage.style.height = `${open ? m.openHeight : m.closedHeight}px`;
    layers.forEach((layer) => {
      layer.style.transform = `translateY(${open ? m.offset : 0}px)`;
    });
    hinge.style.transform = `rotateX(${open ? 180 : 0}deg)`;
    flap.style.zIndex = open ? "0" : "4";
    const pose = invitationPaperMotion(m.envelopeHeight);
    letter.style.transform = open ? pose.reading : pose.tucked;
    sleeve.style.clipPath = invitationPocketClip(width, open ? m.offset : 0);
    letter.style.visibility = open ? "visible" : "hidden";
    copy.style.opacity = open ? "1" : "0";
    letter.inert = !open;
    letter.setAttribute("aria-hidden", String(!open));
    trigger.style.opacity = open ? "0" : "1";
    trigger.style.visibility = open ? "hidden" : "visible";
    trigger.disabled = open;
    trigger.setAttribute("aria-expanded", String(open));
    notify(open ? "open" : "closed");
    cancel();
    if (focus) (open ? heading : trigger).focus({ preventScroll: open });
  };
  const command = (intent: InvitationCommand) => {
    const next = invitationTransition(state, intent);
    if (next === state || disposed) return;
    const opening = next === "opening";
    const m = metrics();
    notify(next);
    letter.inert = true;
    letter.setAttribute("aria-hidden", "true");
    trigger.disabled = true;
    trigger.setAttribute("aria-expanded", String(opening));
    if (typeof stage.animate !== "function") {
      settle(opening);
      return;
    }
    const duration = reduced.matches ? 160 : opening ? 1600 : 1250;
    const animate = (
      element: HTMLElement,
      frames: Keyframe[],
      easing = "linear",
    ) => {
      const physicalFrames = frames.map((frame) => ({
        ...frame,
        easing: "ease-in-out",
      }));
      const animation = element.animate(
        opening
          ? physicalFrames
          : [...physicalFrames].reverse().map((frame) => ({
              ...frame,
              offset: frame.offset == null ? undefined : 1 - frame.offset,
            })),
        { duration, fill: "both", easing },
      );
      animations.push(animation);
    };
    if (reduced.matches) {
      // Lay out the target first; reduced motion only fades, with no spatial travel.
      settle(opening, false);
      notify(next);
      letter.inert = true;
      trigger.disabled = true;
      const animation = (opening ? letter : trigger).animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration, fill: "both" },
      );
      animations.push(animation);
    } else {
      letter.style.visibility = "visible";
      trigger.style.visibility = "visible";
      animate(
        stage,
        [{ height: `${m.closedHeight}px` }, { height: `${m.openHeight}px` }],
        "cubic-bezier(.4,0,.2,1)",
      );
      layers.forEach((layer) =>
        animate(layer, [
          { transform: "translateY(0) scale(1)", offset: 0 },
          { transform: "translateY(2px) scale(.995)", offset: 0.08 },
          { transform: "translateY(0) scale(1)", offset: 0.18 },
          { transform: "translateY(0) scale(1)", offset: 0.3 },
          { transform: `translateY(${m.offset}px) scale(1)`, offset: 0.9 },
          { transform: `translateY(${m.offset}px) scale(1)`, offset: 1 },
        ]),
      );
      animate(hinge, [
        { transform: "rotateX(0deg)", offset: 0 },
        { transform: "rotateX(0deg)", offset: 0.12 },
        { transform: "rotateX(180deg)", offset: 0.42 },
        { transform: "rotateX(180deg)", offset: 1 },
      ]);
      animate(flap, [
        { zIndex: 4, offset: 0 },
        { zIndex: 4, offset: 0.27 },
        { zIndex: 0, offset: 0.28 },
        { zIndex: 0, offset: 1 },
      ]);
      // The opening hides the paper's inserted corners, independently of glass opacity.
      animate(sleeve, [
        { clipPath: invitationPocketClip(width, 0), offset: 0 },
        { clipPath: invitationPocketClip(width, 0), offset: 0.3 },
        { clipPath: invitationPocketClip(width, m.offset), offset: 0.9 },
        { clipPath: invitationPocketClip(width, m.offset), offset: 1 },
      ]);
      const pose = invitationPaperMotion(m.envelopeHeight);
      animate(letter, [
        { transform: pose.tucked, opacity: 0, offset: 0 },
        { transform: pose.tucked, opacity: 0, offset: 0.22 },
        { transform: pose.tucked, opacity: 1, offset: 0.3 },
        { transform: pose.approaching, opacity: 1, offset: 0.62 },
        { transform: pose.reading, opacity: 1, offset: 0.82 },
        { transform: pose.reading, opacity: 1, offset: 1 },
      ]);
      animate(copy, [
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: 0.84 },
        { opacity: 1, offset: 1 },
      ]);
      animate(trigger, [
        { opacity: 1, offset: 0 },
        { opacity: 0, offset: 0.15 },
        { opacity: 0, offset: 1 },
      ]);
    }
    const token = ++generation;
    void Promise.all(animations.map((animation) => animation.finished))
      .then(() => {
        if (!disposed && generation === token) settle(opening);
      })
      .catch(() => {
        /* Interrupted by resize, preference change or unmount. */
      });
  };
  const refresh = () => {
    if (disposed) return;
    if (stage.clientWidth === width && letter.offsetHeight === letterHeight)
      return;
    settle(
      state === "open" || state === "opening",
      state === "opening" || state === "closing",
    );
  };
  const preference = () =>
    settle(
      state === "open" || state === "opening",
      state === "opening" || state === "closing",
    );
  const observer = new ResizeObserver(refresh);
  observer.observe(stage);
  observer.observe(letter);
  reduced.addEventListener("change", preference);
  settle(false, false);
  return {
    command,
    dispose: () => {
      disposed = true;
      cancel();
      observer.disconnect();
      reduced.removeEventListener("change", preference);
    },
  };
}
