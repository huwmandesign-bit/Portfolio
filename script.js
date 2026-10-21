// Fade elements up as they scroll into view.
// Whatever is on screen when the page loads cascades in, top to bottom.
(function () {
  const items = document.querySelectorAll(".reveal");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CASCADE_STEP = 0.15; // seconds between items on load

  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  let firstBatch = true;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      visible.forEach((entry, i) => {
        const el = entry.target;
        if (firstBatch) {
          // Load cascade: order by position, keeping any small side-by-side offset
          const own = parseFloat(getComputedStyle(el).getPropertyValue("--delay")) || 0;
          el.style.setProperty("--delay", (0.1 + i * CASCADE_STEP + own) + "s");
        }
        el.classList.add("is-visible");
        observer.unobserve(el); // animate once only
      });

      firstBatch = false;
    },
    { threshold: 0 }
  );

  items.forEach((el) => observer.observe(el));
})();

// Respect reduced motion for autoplaying videos: show the still frame instead.
(function () {
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll("video[autoplay]").forEach((v) => {
    v.removeAttribute("autoplay");
    v.pause();
    v.controls = true;
  });
})();
