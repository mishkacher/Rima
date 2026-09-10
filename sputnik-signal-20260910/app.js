document.documentElement.classList.add("js");

(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const header = document.querySelector("[data-header]");
  const progress = document.querySelector(".scroll-progress span");
  let previousY = window.scrollY;
  let scrollTick = false;

  const updateScrollUI = () => {
    const y = window.scrollY;
    const maxScroll = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1,
    );
    progress.style.transform = `scaleX(${clamp(y / maxScroll, 0, 1)})`;

    if (!body.classList.contains("menu-open")) {
      if (y > previousY + 8 && y > 180) header.classList.add("is-hidden");
      if (y < previousY - 8 || y < 80) header.classList.remove("is-hidden");
    }

    const orbitSystem = document.querySelector("[data-orbit-system]");
    if (orbitSystem)
      orbitSystem.style.setProperty("--orbit-rotation", `${y * 0.035}deg`);

    previousY = y;
    scrollTick = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTick) {
        requestAnimationFrame(updateScrollUI);
        scrollTick = true;
      }
    },
    { passive: true },
  );
  updateScrollUI();

  const menuButton = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");

  const setMenu = (open) => {
    menuButton.setAttribute("aria-expanded", String(open));
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileMenu.classList.toggle("is-open", open);
    body.classList.toggle("menu-open", open);
    header.classList.remove("is-hidden");
  };

  menuButton?.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  const revealNodes = [...document.querySelectorAll(".reveal")];
  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7%" },
    );
    revealNodes.forEach((node, index) => {
      node.style.transitionDelay = `${Math.min((index % 4) * 60, 180)}ms`;
      revealObserver.observe(node);
    });
  }

  const sections = [...document.querySelectorAll("[data-section]")];
  const navLinks = [...document.querySelectorAll("[data-nav]")];
  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    const activeObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((link) => {
          const active = link.dataset.nav === visible.target.dataset.section;
          link.classList.toggle("is-active", active);
          if (active) link.setAttribute("aria-current", "page");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-25% 0px -60%", threshold: [0.05, 0.25, 0.5] },
    );
    sections.forEach((section) => activeObserver.observe(section));
  }

  const metric = document.querySelector("[data-count]");
  if (metric && "IntersectionObserver" in window) {
    const metricObserver = new IntersectionObserver(
      ([entry], observer) => {
        if (!entry.isIntersecting) return;
        if (reduceMotion.matches) {
          metric.textContent = metric.dataset.count;
        } else {
          const target = Number(metric.dataset.count);
          const start = performance.now();
          const duration = 1300;
          const animateCount = (now) => {
            const t = clamp((now - start) / duration, 0, 1);
            const eased = 1 - Math.pow(1 - t, 4);
            metric.textContent = String(Math.round(target * eased)).padStart(
              3,
              "0",
            );
            if (t < 1) requestAnimationFrame(animateCount);
          };
          requestAnimationFrame(animateCount);
        }
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    metricObserver.observe(metric);
  }

  const processSteps = [...document.querySelectorAll("[data-step]")];
  const routeDial = document.querySelector("[data-route-dial]");
  const dialNumber = routeDial?.querySelector("b");
  if (processSteps.length && routeDial && "IntersectionObserver" in window) {
    const stepObserver = new IntersectionObserver(
      (entries) => {
        const current = entries.find((entry) => entry.isIntersecting);
        if (!current) return;
        const step = current.target.dataset.step;
        routeDial.dataset.active = step;
        dialNumber.textContent = step;
      },
      { rootMargin: "-40% 0px -40%", threshold: 0 },
    );
    processSteps.forEach((step) => stepObserver.observe(step));
  }

  const scramble = (node) => {
    if (reduceMotion.matches) return;
    const target = node.dataset.scramble || node.textContent;
    const glyphs = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ0123456789";
    let frame = 0;
    const total = target.length * 7;
    const run = () => {
      node.textContent = target
        .split("")
        .map((letter, index) =>
          frame / 7 > index
            ? letter
            : glyphs[Math.floor(Math.random() * glyphs.length)],
        )
        .join("");
      frame += 1;
      if (frame <= total) requestAnimationFrame(run);
      else node.textContent = target;
    };
    run();
  };
  document.querySelectorAll("[data-scramble]").forEach((node, index) => {
    window.setTimeout(() => scramble(node), 240 + index * 180);
  });

  if (finePointer.matches && !reduceMotion.matches) {
    document.querySelectorAll(".magnetic").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.16;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.2;
        element.style.transform = `translate(${x}px, ${y}px)`;
      });
      element.addEventListener("pointerleave", () => {
        element.style.transform = "translate(0, 0)";
      });
    });

    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${py * -4}deg) rotateY(${px * 5}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "perspective(900px) rotateX(0) rotateY(0)";
      });
    });

    const hero = document.querySelector(".hero");
    const titleA = document.querySelector(".title-row-a");
    const titleB = document.querySelector(".title-row-b");
    hero?.addEventListener("pointermove", (event) => {
      const px = event.clientX / window.innerWidth - 0.5;
      const py = event.clientY / window.innerHeight - 0.5;
      titleA.style.transform = `translate(${px * -16}px, ${py * -8}px)`;
      titleB.style.transform = `translate(${px * 20}px, ${py * 9}px)`;
    });
    hero?.addEventListener("pointerleave", () => {
      titleA.style.transform = "translate(0, 0)";
      titleB.style.transform = "translate(0, 0)";
    });
  }

  class GravityField {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.context = canvas.getContext("2d", { alpha: true });
      this.options = {
        count: options.count || 54,
        linkDistance: options.linkDistance || 135,
        color: options.color || "241,239,229",
        accent: options.accent || "200,255,25",
        orbit: options.orbit !== false,
      };
      this.points = [];
      this.width = 0;
      this.height = 0;
      this.dpr = 1;
      this.pointer = { x: 0, y: 0, active: false };
      this.resize = this.resize.bind(this);
      this.draw = this.draw.bind(this);
      this.handlePointer = this.handlePointer.bind(this);
      this.seed = 4927;
      this.resizeObserver = new ResizeObserver(this.resize);
      this.resizeObserver.observe(canvas.parentElement);
      canvas.parentElement.addEventListener("pointermove", this.handlePointer, {
        passive: true,
      });
      canvas.parentElement.addEventListener(
        "pointerleave",
        () => (this.pointer.active = false),
      );
      this.resize();
      if (!reduceMotion.matches) this.frame = requestAnimationFrame(this.draw);
      else this.draw(performance.now());
    }

    random() {
      this.seed = (this.seed * 16807) % 2147483647;
      return (this.seed - 1) / 2147483646;
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.width = Math.max(1, rect.width);
      this.height = Math.max(1, rect.height);
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.seed = 4927;
      this.points = Array.from({ length: this.options.count }, () => ({
        x: this.random() * this.width,
        y: this.random() * this.height,
        size: 0.6 + this.random() * 1.8,
        phase: this.random() * Math.PI * 2,
        drift: 0.08 + this.random() * 0.24,
      }));
    }

    handlePointer(event) {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = event.clientX - rect.left;
      this.pointer.y = event.clientY - rect.top;
      this.pointer.active = true;
    }

    draw(timestamp = 0) {
      const ctx = this.context;
      const t = timestamp * 0.001;
      ctx.clearRect(0, 0, this.width, this.height);

      if (this.options.orbit) {
        const cx = this.width * 0.77;
        const cy = this.height * 0.43;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.03);
        [0.9, 0.68, 0.48].forEach((scale, index) => {
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            this.width * 0.25 * scale,
            this.width * 0.08 * scale,
            index * 0.72,
            0,
            Math.PI * 2,
          );
          ctx.strokeStyle = `rgba(${this.options.accent},${0.08 + index * 0.025})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        });
        ctx.restore();
      }

      const displayPoints = this.points.map((point) => {
        let x = point.x + Math.cos(t * point.drift + point.phase) * 9;
        let y = point.y + Math.sin(t * point.drift * 0.8 + point.phase) * 7;
        if (this.pointer.active) {
          const dx = this.pointer.x - x;
          const dy = this.pointer.y - y;
          const distance = Math.hypot(dx, dy);
          if (distance < 190 && distance > 0) {
            const force = (1 - distance / 190) * 18;
            x += (dx / distance) * force;
            y += (dy / distance) * force;
          }
        }
        return { ...point, x, y };
      });

      displayPoints.forEach((point, index) => {
        for (let j = index + 1; j < displayPoints.length; j += 1) {
          const other = displayPoints[j];
          const distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance > this.options.linkDistance) continue;
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(${this.options.color},${(1 - distance / this.options.linkDistance) * 0.11})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.options.color},${0.25 + point.size * 0.16})`;
        ctx.fill();
      });

      if (!reduceMotion.matches) this.frame = requestAnimationFrame(this.draw);
    }
  }

  const gravityCanvas = document.querySelector("#gravity-field");
  const contactCanvas = document.querySelector("#contact-field");
  if (gravityCanvas) new GravityField(gravityCanvas);
  if (contactCanvas) {
    new GravityField(contactCanvas, {
      count: 36,
      linkDistance: 165,
      color: "241,239,229",
      accent: "200,255,25",
      orbit: false,
    });
  }

  const form = document.querySelector("[data-contact-form]");
  if (form) {
    const copyButton = form.querySelector(".copy-brief");
    const status = form.querySelector(".form-status");
    let preparedBrief = "";

    const validate = () => {
      let valid = true;
      form.querySelectorAll("[required]").forEach((field) => {
        const fieldValid =
          field.type === "checkbox"
            ? field.checked
            : field.value.trim().length > 0;
        field.classList.toggle("is-invalid", !fieldValid);
        valid = valid && fieldValid;
      });
      return valid;
    };

    const copyText = async (text) => {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const temporary = document.createElement("textarea");
        temporary.value = text;
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";
        document.body.appendChild(temporary);
        temporary.select();
        document.execCommand("copy");
        temporary.remove();
      }
    };

    form.addEventListener("input", (event) =>
      event.target.classList.remove("is-invalid"),
    );
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validate()) {
        status.textContent =
          "Заполните отмеченные поля — сигнал пока неполный.";
        return;
      }
      const data = new FormData(form);
      preparedBrief = `СПУТНИК — НОВЫЙ СИГНАЛ\n\nИмя: ${data.get("name")}\nКонтакт: ${data.get("contact")}\n\nЗадача:\n${data.get("brief")}`;
      try {
        await copyText(preparedBrief);
        status.textContent =
          "Сигнал собран и скопирован. Отправьте его команде удобным способом.";
      } catch {
        status.textContent = "Сигнал собран. Нажмите «Скопировать бриф».";
      }
      copyButton.hidden = false;
    });

    copyButton.addEventListener("click", async () => {
      if (!preparedBrief) return;
      try {
        await copyText(preparedBrief);
        status.textContent = "Бриф скопирован.";
      } catch {
        status.textContent =
          "Не удалось скопировать автоматически — выделите текст вручную.";
      }
    });
  }

  reduceMotion.addEventListener?.("change", () => window.location.reload());
})();
