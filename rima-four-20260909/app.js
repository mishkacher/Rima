const $ = (q, c = document) => c.querySelector(q),
  $$ = (q, c = document) => [...c.querySelectorAll(q)];
const body = document.body,
  menu = $("[data-menu]"),
  nav = $(".nav");
if (menu && nav) {
  menu.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menu.setAttribute("aria-expanded", String(open));
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      nav.classList.remove("is-open");
      menu.setAttribute("aria-expanded", "false");
    }
  });
  $$("a", nav).forEach((a) =>
    a.addEventListener("click", () => nav.classList.remove("is-open")),
  );
}
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduce) body.classList.add("motion-off");
const motion = $("[data-motion]");
if (motion) {
  motion.setAttribute(
    "aria-pressed",
    String(body.classList.contains("motion-off")),
  );
  motion.addEventListener("click", () => {
    body.classList.toggle("motion-off");
    motion.setAttribute(
      "aria-pressed",
      String(body.classList.contains("motion-off")),
    );
    motion.textContent = body.classList.contains("motion-off")
      ? "Включить движение"
      : "Выключить движение";
  });
}
if ("IntersectionObserver" in window && !reduce) {
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12 },
  );
  $$(".reveal").forEach((el) => io.observe(el));
} else {
  $$(".reveal").forEach((el) => el.classList.add("is-visible"));
}
const form = $("[data-brief]"),
  status = $(".form-status");
if (form && status) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(form),
      get = (n) => (d.get(n) || "").toString().trim();
    if (!get("name") || !get("contact") || !get("task")) {
      status.textContent = "Заполните имя, контакт и задачу.";
      return;
    }
    const txt = [
      "Бриф для студии «Спутник»",
      "",
      "Имя: " + get("name"),
      "Контакт: " + get("contact"),
      "Задача: " + get("task"),
      "Формат: " + (get("format") || "Не выбран"),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([txt], { type: "text/plain;charset=utf-8" }),
    );
    a.download = "sputnik-brief.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    status.textContent = "Бриф скачан. Его можно отправить студии.";
    form.reset();
  });
}
const planet = $("[data-planet]");
if (planet) {
  planet.addEventListener("pointermove", (e) => {
    if (body.classList.contains("motion-off")) return;
    const r = planet.getBoundingClientRect(),
      x = ((e.clientX - r.left) / r.width - 0.5) * 16,
      y = ((e.clientY - r.top) / r.height - 0.5) * 16;
    planet.style.setProperty("--px", x + "px");
    planet.style.setProperty("--py", y + "px");
  });
}
const kineticWord = $("[data-kinetic-word]");
if (kineticWord)
  addEventListener(
    "scroll",
    () => {
      if (!body.classList.contains("motion-off"))
        kineticWord.style.setProperty(
          "--scroll",
          Math.min(scrollY * 0.22, 180) + "px",
        );
    },
    { passive: true },
  );
const rail = $("[data-rail]");
$$("[data-rail-button]").forEach((btn) =>
  btn.addEventListener(
    "click",
    () =>
      rail &&
      rail.scrollBy({
        left:
          (btn.dataset.railButton === "next" ? 1 : -1) *
          Math.min(innerWidth * 0.78, 640),
        behavior: "smooth",
      }),
  ),
);
const filters = $$("[data-filter]"),
  catalogItems = $$("[data-kind]");
filters.forEach((btn) =>
  btn.addEventListener("click", () => {
    filters.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    const f = btn.dataset.filter;
    catalogItems.forEach((item) => {
      item.hidden = f !== "all" && !item.dataset.kind.includes(f);
    });
  }),
);
const sideLinks = $$(".side-nav a");
if (sideLinks.length && "IntersectionObserver" in window) {
  const so = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting)
          sideLinks.forEach((a) =>
            a.classList.toggle("is-active", a.hash === "#" + e.target.id),
          );
      }),
    { rootMargin: "-38% 0px -54% 0px" },
  );
  $$("section[id]").forEach((s) => so.observe(s));
}
