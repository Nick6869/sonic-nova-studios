(() => {
  "use strict";

  const root = document.documentElement;
  const coarseQuery = window.matchMedia?.("(pointer: coarse)");
  const compactQuery = window.matchMedia?.("(max-width: 760px), (max-height: 760px)");
  const accessibilityStyles = document.createElement("style");
  accessibilityStyles.textContent = "@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; } }";
  document.head.appendChild(accessibilityStyles);

  function isMobileLike() {
    return Boolean(
      coarseQuery?.matches ||
      compactQuery?.matches ||
      navigator.maxTouchPoints > 0
    );
  }

  function setViewportVars() {
    const viewport = window.visualViewport;
    const height = Math.max(1, Math.round(viewport?.height || window.innerHeight || root.clientHeight));
    const width = Math.max(1, Math.round(viewport?.width || window.innerWidth || root.clientWidth));
    root.style.setProperty("--app-height", `${height}px`);
    root.style.setProperty("--app-width", `${width}px`);
    root.dataset.viewportOrientation = width > height ? "landscape" : "portrait";
    root.classList.toggle("is-mobile-runtime", isMobileLike());
  }

  let resizeFrame = 0;
  function scheduleViewportUpdate() {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(setViewportVars);
  }

  function preventGameTouchScroll(event) {
    if (!isMobileLike()) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("canvas, .mobile-controls, .touch-controls, .aim-pad, .dpad")) {
      event.preventDefault();
    }
  }

  function hardenImages() {
    document.querySelectorAll("img").forEach((image) => {
      image.decoding = "async";
      image.draggable = false;
    });
  }

  setViewportVars();
  hardenImages();

  window.addEventListener("resize", scheduleViewportUpdate, { passive: true });
  window.addEventListener("orientationchange", scheduleViewportUpdate, { passive: true });
  window.visualViewport?.addEventListener("resize", scheduleViewportUpdate, { passive: true });
  window.visualViewport?.addEventListener("scroll", scheduleViewportUpdate, { passive: true });
  document.addEventListener("touchmove", preventGameTouchScroll, { passive: false });
  document.addEventListener("gesturestart", (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest("canvas, .mobile-controls, .touch-controls, .aim-pad, .dpad")) {
      event.preventDefault();
    }
  });
  document.addEventListener("dragstart", (event) => {
    if (event.target instanceof HTMLImageElement || event.target instanceof HTMLCanvasElement) {
      event.preventDefault();
    }
  });
})();
