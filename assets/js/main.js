(() => {
  "use strict";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.getElementById("site-header");
  const menuToggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("primary-navigation");
  const navLinks = [...document.querySelectorAll(".site-nav__link")];
  const revealItems = [...document.querySelectorAll(".reveal")];

  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 28);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const setMenuOpen = (open) => {
    if (!menuToggle || !nav) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.querySelector(".sr-only").textContent = open ? "关闭导航菜单" : "打开导航菜单";
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  };
  menuToggle?.addEventListener("click", () => setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true"));
  navLinks.forEach((link) => link.addEventListener("click", () => setMenuOpen(false)));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") setMenuOpen(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 760) setMenuOpen(false); });

  const sectionMap = new Map(navLinks.map((link) => {
    const section = document.querySelector(link.getAttribute("href"));
    return section ? [section, link] : null;
  }).filter(Boolean));
  if ("IntersectionObserver" in window && sectionMap.size) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.remove("is-active"));
        sectionMap.get(entry.target)?.classList.add("is-active");
      });
    }, { rootMargin: "-32% 0px -56% 0px", threshold: 0 });
    sectionMap.forEach((_, section) => observer.observe(section));
  }

  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealItems.forEach((item) => observer.observe(item));
  }

  const canvas = document.getElementById("starfield");
  const context = canvas?.getContext("2d");
  if (canvas && context) {
    let width = 0, height = 0, dpr = 1, stars = [], frameId = 0, pointerX = 0, pointerY = 0;
    const makeStars = () => {
      const count = Math.min(260, Math.max(80, Math.round((width * height) / 7500)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        radius: Math.random() * 1.15 + 0.25, alpha: Math.random() * 0.62 + 0.16,
        depth: Math.random() * 0.9 + 0.1, phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.0005 + 0.00015
      }));
    };
    const drawStars = (time) => {
      context.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        const pulse = Math.sin(time * star.speed + star.phase);
        const ox = pointerX * 7 * star.depth, oy = pointerY * 7 * star.depth;
        context.beginPath();
        context.arc(star.x + ox, star.y + oy, star.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(225, 244, 242, ${Math.max(0.08, star.alpha + pulse * 0.13)})`;
        context.fill();
        if (star.radius > 1.02) {
          context.beginPath();
          context.arc(star.x + ox, star.y + oy, star.radius * 3.4, 0, Math.PI * 2);
          context.fillStyle = `rgba(159, 229, 233, ${0.025 + pulse * 0.015})`;
          context.fill();
        }
      });
      if (!reducedMotion) frameId = window.requestAnimationFrame(drawStars);
    };
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars();
      if (reducedMotion) drawStars(0);
    };
    const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resizeCanvas) : null;
    resizeObserver?.observe(canvas);
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", (event) => {
      pointerX = event.clientX / window.innerWidth - 0.5;
      pointerY = event.clientY / window.innerHeight - 0.5;
    }, { passive: true });
    resizeCanvas();
    if (!reducedMotion) frameId = window.requestAnimationFrame(drawStars);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) window.cancelAnimationFrame(frameId);
      else if (!reducedMotion) frameId = window.requestAnimationFrame(drawStars);
    });
  }

  const hero = document.querySelector(".hero");
  const solarSystem = document.getElementById("solar-system");
  if (hero && solarSystem && !reducedMotion) {
    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      solarSystem.style.setProperty("--mx", ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3));
      solarSystem.style.setProperty("--my", ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3));
    });
    hero.addEventListener("pointerleave", () => {
      solarSystem.style.setProperty("--mx", 0);
      solarSystem.style.setProperty("--my", 0);
    });
  }

  const signalButton = document.querySelector("[data-signal-button]");
  const signalOutput = document.getElementById("signal-output");
  let decodeTimer = 0;
  const decodeSignal = () => {
    if (!signalButton || !signalOutput) return;
    window.clearTimeout(decodeTimer);
    const label = signalButton.querySelector("span");
    signalButton.disabled = true; label.textContent = "解码中";
    signalOutput.classList.add("is-decoding");
    if (reducedMotion) {
      signalOutput.textContent = "不要回答！不要回答！不要回答！";
      signalOutput.classList.remove("is-decoding");
      label.textContent = "重新解码"; signalButton.disabled = false; return;
    }
    const sequence = [["正在载入红岸接收记录...",280],["频段锁定：1.42 GHz / 信号重复周期 13 秒",700],["检测到三组重复脉冲，正在交叉校验...",550],["不要回答！不要回答！不要回答！",700]];
    let index = 0;
    const run = () => {
      if (index >= sequence.length) {
        signalOutput.classList.remove("is-decoding"); label.textContent = "重新解码"; signalButton.disabled = false; return;
      }
      const [message, delay] = sequence[index++];
      signalOutput.textContent = message;
      decodeTimer = window.setTimeout(run, delay);
    };
    run();
  };
  signalButton?.addEventListener("click", decodeSignal);

  const tabs = [...document.querySelectorAll("[role='tab'][data-era]")];
  const panels = [...document.querySelectorAll("[role='tabpanel']")];
  const activateTab = (tab, moveFocus = false) => {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      const selected = panel.id === tab.getAttribute("aria-controls");
      panel.hidden = !selected; panel.classList.toggle("is-active", selected);
    });
    if (moveFocus) tab.focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (event) => {
      let next = index;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === index) return;
      event.preventDefault(); activateTab(tabs[next], true);
    });
  });

  const forest = document.querySelector("[data-forest-sim]");
  const forestStatus = document.getElementById("forest-status");
  const forestOutput = document.getElementById("forest-output");
  const exposureValue = document.getElementById("exposure-value");
  const broadcastButton = document.getElementById("broadcast-button");
  const resetForestButton = document.getElementById("reset-forest");
  let broadcastTimer = 0, strikeTimer = 0, simulationRunning = false;
  const resetForest = () => {
    window.clearTimeout(broadcastTimer); window.clearTimeout(strikeTimer);
    simulationRunning = false;
    forest?.classList.remove("is-broadcasting", "is-struck");
    forestStatus?.classList.remove("is-warning", "is-danger");
    if (forestStatus) forestStatus.textContent = "坐标静默";
    if (forestOutput) forestOutput.textContent = "所有文明保持静默。森林暂时安全。";
    if (exposureValue) exposureValue.textContent = "00%";
    if (broadcastButton) { broadcastButton.disabled = false; broadcastButton.querySelector("span").textContent = "向宇宙广播坐标"; }
  };
  const broadcastCoordinates = () => {
    if (!forest || simulationRunning) return;
    simulationRunning = true; forest.classList.add("is-broadcasting");
    forestStatus?.classList.add("is-warning");
    if (forestStatus) forestStatus.textContent = "坐标扩散中";
    if (forestOutput) forestOutput.textContent = "引力波正在穿过星际空间。所有监听者都已收到这组坐标。";
    if (exposureValue) exposureValue.textContent = "45%";
    if (broadcastButton) { broadcastButton.disabled = true; broadcastButton.querySelector("span").textContent = "广播进行中"; }
    broadcastTimer = window.setTimeout(() => {
      forest.classList.remove("is-broadcasting"); forest.classList.add("is-struck");
      forestStatus?.classList.remove("is-warning"); forestStatus?.classList.add("is-danger");
      if (forestStatus) forestStatus.textContent = "坐标已暴露";
      if (forestOutput) forestOutput.textContent = "未知猎手发动了光粒打击。毁灭你，与你有何相干？";
      if (exposureValue) exposureValue.textContent = "100%";
      if (broadcastButton) broadcastButton.querySelector("span").textContent = "打击已抵达";
      strikeTimer = window.setTimeout(() => { simulationRunning = false; }, 1000);
    }, 1200);
  };
  broadcastButton?.addEventListener("click", broadcastCoordinates);
  resetForestButton?.addEventListener("click", resetForest);
  window.addEventListener("pageshow", updateHeader);
})();
