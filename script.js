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

  // Headline reveal: split big headings into words, each sliding up from
  // behind a mask. Words on the same line move together, line by line.
  const LINE_STEP = 0.09; // seconds between lines
  const splitHeading = (h) => {
    const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach((t) => {
      const frag = document.createDocumentFragment();
      t.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(" "));
          return;
        }
        const mask = document.createElement("span");
        mask.className = "word";
        const inner = document.createElement("span");
        inner.className = "word__inner";
        inner.textContent = part;
        mask.appendChild(inner);
        frag.appendChild(mask);
      });
      t.parentNode.replaceChild(frag, t);
    });
    h.classList.add("split");
  };
  document.querySelectorAll(".h1, .h2").forEach((h) => {
    if (h.closest(".reveal")) splitHeading(h);
  });

  // Just before a block is revealed, stagger its headline words by line
  const prepareLines = (el, baseDelay) => {
    const heads = el.classList.contains("split") ? [el] : el.querySelectorAll(".split");
    heads.forEach((h) => {
      let line = -1;
      let lastTop = null;
      h.querySelectorAll(".word").forEach((w) => {
        const top = w.offsetTop;
        if (lastTop === null || Math.abs(top - lastTop) > 4) {
          line += 1;
          lastTop = top;
        }
        w.firstChild.style.setProperty("--wdelay", (baseDelay + line * LINE_STEP) + "s");
      });
    });
  };

  let firstBatch = true;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      // Items sharing a row (e.g. a pair of project cards) step in together
      let row = -1;
      let rowTop = null;
      visible.forEach((entry) => {
        const el = entry.target;
        const top = Math.round(entry.boundingClientRect.top);
        if (rowTop === null || Math.abs(top - rowTop) > 4) {
          row += 1;
          rowTop = top;
        }
        if (firstBatch) {
          // Load cascade: one step per row, keeping any element's own small offset
          const own = parseFloat(getComputedStyle(el).getPropertyValue("--delay")) || 0;
          el.style.setProperty("--delay", (0.1 + row * CASCADE_STEP + own) + "s");
        }
        prepareLines(el, parseFloat(getComputedStyle(el).getPropertyValue("--delay")) || 0);
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
