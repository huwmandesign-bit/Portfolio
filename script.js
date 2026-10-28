// Fade elements up as they scroll into view.
// Whatever is on screen when the page loads cascades in, top to bottom.
(function () {
  const items = document.querySelectorAll(".reveal");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CASCADE_STEP = 0.25; // seconds between items on load

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

// Mobile burger menu
(function () {
  const header = document.querySelector(".nav");
  const toggle = header && header.querySelector(".nav__toggle");
  if (!toggle) return;

  const setOpen = (open) => {
    header.classList.toggle("nav--open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  toggle.addEventListener("click", () => setOpen(!header.classList.contains("nav--open")));

  // Close after choosing a link, on Escape, or when tapping outside the menu
  header.querySelectorAll(".nav__links a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("nav--open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (!header.contains(e.target)) setOpen(false);
  });

  // Reset when resizing up to tablet/desktop
  window.matchMedia("(min-width: 810px)").addEventListener("change", (e) => {
    if (e.matches) setOpen(false);
  });
})();

// Smart sticky nav: hide on scroll down, show on scroll up
(function () {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    const open = nav.classList.contains("nav--open");
    nav.classList.toggle("nav--scrolled", y > 4);

    if (open || y < nav.offsetHeight) {
      nav.classList.remove("nav--hidden");
    } else if (y > lastY + 4) {
      nav.classList.add("nav--hidden");      // scrolling down
    } else if (y < lastY - 4) {
      nav.classList.remove("nav--hidden");   // scrolling up
    }
    lastY = y;
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  // Keyboard users: always show the nav when focus moves into it
  nav.addEventListener("focusin", () => nav.classList.remove("nav--hidden"));
})();
