(() => {
  document.querySelector(".pricing-art")?.remove();
  document.querySelector(".manifesto")?.remove();

  if (!document.querySelector('link[href*="orbit-motion.css"]')) {
    const motionStylesheet = document.createElement("link");
    motionStylesheet.rel = "stylesheet";
    motionStylesheet.href = "./orbit-motion.css?v=20260910-3";
    document.head.append(motionStylesheet);
  }

  const root = document.documentElement;
  root.classList.add("js");

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = [...document.querySelectorAll(".reveal")];
  if (reduced || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("in-view"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const header = document.querySelector("[data-header]");
  const menu = document.querySelector("[data-menu]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  let previousScroll = window.scrollY;

  const closeMenu = () => {
    if (!menu || !menuToggle) return;
    menu.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Открыть меню");
    document.body.classList.remove("menu-open");
  };

  menuToggle?.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menu.classList.toggle("is-open", !isOpen);
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Открыть меню" : "Закрыть меню",
    );
    document.body.classList.toggle("menu-open", !isOpen);
  });

  menu
    ?.querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener(
    "scroll",
    () => {
      const current = window.scrollY;
      header?.classList.toggle(
        "is-hidden",
        current > previousScroll &&
          current > 180 &&
          !menu?.classList.contains("is-open"),
      );
      previousScroll = current;
    },
    { passive: true },
  );

  const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  const navTargets = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) =>
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === `#${entry.target.id}`,
            ),
          );
        });
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    navTargets.forEach((target) => navObserver.observe(target));
  }

  const orbit = document.querySelector("[data-orbit]");
  if (orbit && !reduced && window.matchMedia("(pointer:fine)").matches) {
    orbit.addEventListener("pointermove", (event) => {
      const rect = orbit.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 18;
      orbit.style.setProperty("--mx", `${x}px`);
      orbit.style.setProperty("--my", `${y}px`);
    });
    orbit.addEventListener("pointerleave", () => {
      orbit.style.setProperty("--mx", "0px");
      orbit.style.setProperty("--my", "0px");
    });
  }

  const taiga = document.querySelector("[data-taiga]");
  if (taiga) {
    taiga.tabIndex = 0;
    taiga.setAttribute("role", "button");
    taiga.setAttribute(
      "aria-label",
      "Показать размытый кадр проекта Тайга и Озеро",
    );
    const toggleTaiga = () => {
      const isBlur = taiga.classList.toggle("is-blur");
      taiga.setAttribute(
        "aria-label",
        isBlur
          ? "Показать резкий кадр проекта Тайга и Озеро"
          : "Показать размытый кадр проекта Тайга и Озеро",
      );
    };
    taiga.addEventListener("click", toggleTaiga);
    taiga.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleTaiga();
      }
    });
  }

  const plans = document.querySelector("[data-plans]");
  plans?.querySelectorAll(".plan button").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.closest(".plan");
      const willOpen = !selected.classList.contains("is-open");
      plans.querySelectorAll(".plan").forEach((plan) => {
        const open = plan === selected && willOpen;
        plan.classList.toggle("is-open", open);
        const planButton = plan.querySelector("button");
        planButton.setAttribute("aria-expanded", String(open));
        planButton.querySelector("i").textContent = open ? "−" : "＋";
      });
    });
  });

  const form = document.querySelector("[data-form]");
  const formStatus = document.querySelector("[data-form-status]");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      formStatus.textContent = "Заполните поля и подтвердите согласие.";
      form.querySelector(":invalid")?.focus();
      return;
    }
    const data = new FormData(form);
    const brief = [
      `Имя: ${data.get("name")}`,
      `Контакт: ${data.get("contact")}`,
      `Задача: ${data.get("brief")}`,
    ].join("\n");
    navigator.clipboard?.writeText(brief).catch(() => {});
    formStatus.textContent =
      "Бриф скопирован. Отправьте его студии через официальный сайт.";
    const submit = form.querySelector('button[type="submit"]');
    submit.innerHTML = "Перейти на сайт <span>↗</span>";
    submit.type = "button";
    submit.addEventListener("click", () =>
      window.open("https://xn--h1aehhjhg.agency/", "_blank", "noopener"),
    );
  });

  document.querySelectorAll("[data-year]").forEach((item) => {
    item.textContent = new Date().getFullYear();
  });
})();
