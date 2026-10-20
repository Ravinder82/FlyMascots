/* ============================================================
   FlyMascots — landing page behaviour v2
   One entrance moment on load; after that the page is still and
   the mascot is the only thing moving. Capture hooks (CAPTURE
   API, ?capture=1, ?theme=, ?shot=) let the kit shoot this page
   deterministically. No Math.random() — repeatable pixels.
   ============================================================ */

(function () {
  "use strict";

  var q = new URLSearchParams(location.search);
  var CAPTURE = q.get("capture") === "1";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ---------------- theme ---------------- */

  var themeParam = q.get("theme");
  var saved = null;
  try { saved = localStorage.getItem("fm-theme"); } catch (e) { /* file:// */ }

  // Capture mode is deterministic: light unless a theme is asked for.
  if (CAPTURE) {
    setTheme(themeParam === "dark" ? "dark" : "light");
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      img.setAttribute("loading", "eager");
    });
  } else if (themeParam === "dark" || themeParam === "light") {
    setTheme(themeParam);
  } else if (saved === "dark" || saved === "light") {
    setTheme(saved);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    setTheme("dark");
  }

  function setTheme(name) {
    root.setAttribute("data-theme", name);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", name === "dark" ? "#141719" : "#F3F6F5");
    var btn = document.getElementById("themeToggle");
    if (btn) btn.setAttribute("aria-label", "Switch to " + (name === "dark" ? "light" : "dark") + " theme");
    var mark = document.querySelectorAll(".mark-icon");
    mark.forEach(function (img) {
      img.src = name === "dark" ? "assets/icon-dark.svg" : "assets/icon.svg";
    });
  }

  var toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(next);
      try { localStorage.setItem("fm-theme", next); } catch (e) {}
    });
  }

  if (CAPTURE) root.classList.add("is-capture");

  /* ---------------- nav ---------------- */

  var nav = document.getElementById("nav");
  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 16);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- the one entrance moment ---------------- */

  var anims = Array.prototype.slice.call(document.querySelectorAll(".hero-anim"));
  if (CAPTURE || reduce) {
    anims.forEach(function (el) { el.classList.add("in"); });
  } else {
    anims.forEach(function (el, i) {
      el.style.setProperty("--d", 80 + i * 110 + "ms");
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        anims.forEach(function (el) { el.classList.add("in"); });
      });
    });
  }

  /* ---------------- the stage (bare, transparent, alive) ---------------- */

  var stage = document.getElementById("stageFrame");
  var moodButtons = Array.prototype.slice.call(document.querySelectorAll(".mood-buttons [data-mood]"));
  var mascotCards = Array.prototype.slice.call(document.querySelectorAll(".mascot-card[data-mascot]"));
  var frozen = CAPTURE; // capture mode freezes the stage too, for exact pixels
  var currentMood = q.get("mood") || "idle";

  /* Every character the page knows about. The stage and the cast cards
     read from here, so a new mascot is one entry. */
  var MASCOTS = {
    axo: {
      label: "Axo",
      title: "The real FlyMascots viewer — Axo, live in 3D, responding to the mood buttons"
    },
    nicklas: {
      label: "Nicklas",
      title: "The real FlyMascots viewer — Nicklas, live in 3D, responding to the mood buttons"
    }
  };

  function readMascot() {
    var asked = (q.get("mascot") || "").toLowerCase();
    if (MASCOTS[asked]) return asked;
    // Capture runs are deterministic — never fall back to a stored choice.
    if (CAPTURE) return "axo";
    var saved = null;
    try { saved = localStorage.getItem("fm-mascot"); } catch (e) { /* file:// */ }
    return MASCOTS[saved] ? saved : "axo";
  }

  var currentMascot = readMascot();

  if (stage) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    stage.src =
      "assets/stage.html?ui=0&bg=transparent&mascot=" + encodeURIComponent(currentMascot) +
      "&mood=" + encodeURIComponent(currentMood) +
      "&dpr=" + dpr + (CAPTURE ? "&capture=1" : "");
    stage.setAttribute("title", MASCOTS[currentMascot].title);
  }

  function sendStage(msg) {
    if (stage && stage.contentWindow) {
      msg.type = "flymascots";
      stage.contentWindow.postMessage(msg, "*");
    }
  }

  function setMood(mood, silent) {
    if (frozen) sendStage({ freeze: true, mood: mood });
    else sendStage({ mood: mood });
    moodButtons.forEach(function (b) {
      var on = b.getAttribute("data-mood") === mood;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (!silent) currentMood = mood;
  }

  /* The five mood tiles of every character stay on the page — the cast
     cards pick who is live, the footage below shows them all. */
  var castGroups = Array.prototype.slice.call(document.querySelectorAll(".mood-cast[data-mascot]"));

  function syncMascotCards(key) {
    mascotCards.forEach(function (card) {
      var on = card.getAttribute("data-mascot") === key;
      card.classList.toggle("on", on);
      card.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function syncCastGroups(key) {
    castGroups.forEach(function (group) {
      group.classList.toggle("on", group.getAttribute("data-mascot") === key);
    });
  }

  function setMascot(id, silent) {
    var key = String(id || "").toLowerCase();
    if (!MASCOTS[key]) key = "axo";
    currentMascot = key;
    sendStage({ mascot: key });
    syncMascotCards(key);
    syncCastGroups(key);
    if (stage) stage.setAttribute("title", MASCOTS[key].title);
    if (!silent) {
      try { localStorage.setItem("fm-mascot", key); } catch (e) {}
    }
    return key;
  }

  moodButtons.forEach(function (btn) {
    btn.addEventListener("click", function () { setMood(btn.getAttribute("data-mood")); });
  });

  mascotCards.forEach(function (card) {
    card.addEventListener("click", function () { setMascot(card.getAttribute("data-mascot")); });
  });

  var boopBtn = document.getElementById("boopBtn");
  if (boopBtn) {
    boopBtn.addEventListener("click", function () { sendStage({ boop: true }); });
  }

  // The stage announces itself; re-drive the current mood once it is up.
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (d && d.type === "flymascots" && d.ready) setMood(currentMood, true);
  });

  // The opening character is in the URL already, so the stage starts on it —
  // and the cast cards have to agree with it from the first paint.
  syncMascotCards(currentMascot);
  syncCastGroups(currentMascot);

  /* ---------------- mood loops (real footage, plays in view) ---------------- */

  var loops = Array.prototype.slice.call(document.querySelectorAll(".mood-loop"));
  if (CAPTURE || reduce || !("IntersectionObserver" in window)) {
    loops.forEach(function (v) { v.removeAttribute("loop"); }); // posters carry the still
  } else {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          if (v.preload !== "auto") v.preload = "auto";
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.25 });
    loops.forEach(function (v) { vio.observe(v); });
  }

  /* ---------------- copy buttons ---------------- */

  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var label = btn.querySelector(".copy-label") || btn;
      var before = label.textContent;
      copyText(text).then(function () {
        label.textContent = "Copied";
        btn.classList.add("copied");
        setTimeout(function () {
          label.textContent = before;
          btn.classList.remove("copied");
        }, 1600);
      });
    });
  });

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }
  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  /* ---------------- film ---------------- */

  var reel = document.getElementById("reel");
  var playBtn = document.getElementById("playBtn");
  if (playBtn && reel) {
    playBtn.addEventListener("click", function () {
      reel.muted = false;
      reel.volume = 1;
      reel.play();
      playBtn.classList.add("hidden");
    });
    reel.addEventListener("pause", function () { playBtn.classList.remove("hidden"); });
    reel.addEventListener("click", function () {
      if (!reel.paused) reel.pause();
    });
  }

  /* ---------------- capture: shot presets ---------------- */

  var shot = q.get("shot");
  if (shot) {
    var map = {
      hero: "#top", stage: "#demo", how: "#how", film: "#film",
      install: "#install", moods: "#moods", platforms: ".platforms", faq: ".faq"
    };
    var sel = map[shot] || (shot.charAt(0) === "#" ? shot : null);
    if (sel) {
      requestAnimationFrame(function () {
        var el = document.querySelector(sel);
        if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
        window.scrollBy(0, -8);
      });
    }
  }

  /* ---------------- window.CAPTURE (deterministic hooks) ---------------- */

  window.CAPTURE = {
    ready: true,

    freeze: function (on) {
      frozen = on !== false;
      root.classList.toggle("is-capture", frozen);
      if (frozen) sendStage({ freeze: true, mood: currentMood });
    },

    pose: function (mood) { setMood(String(mood || "idle"), true); },
    mood: function (mood) { setMood(String(mood || "idle"), true); },
    mascot: function (id) { return setMascot(String(id || "axo"), true); },

    state: function (name) {
      String(name).split(/[,&]/).forEach(function (pair) {
        var kv = pair.split("=");
        var k = kv[0].trim(), v = (kv[1] || "").trim();
        if (k === "theme") setTheme(v);
        if (k === "mood") setMood(v, true);
        if (k === "mascot") setMascot(v, true);
        if (k === "shot") {
          var el = document.querySelector(v.charAt(0) === "#" ? v : "#" + v);
          if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
        }
        if (k === "reveals") anims.forEach(function (el) { el.classList.add("in"); });
      });
    },

    scroll: function (y) { window.scrollTo(0, Number(y) || 0); },

    seek: function (frame, fps) {
      var f = Number(frame) || 0;
      var rate = Number(fps) || 30;
      anims.forEach(function (el) { el.classList.add("in"); });
      if (stage && stage.contentWindow) {
        stage.contentWindow.postMessage({ type: "flymascots", seek: f / rate }, "*");
      }
      return f / rate;
    },

    time: function () { return performance.now() / 1000; }
  };

  window.__SITE_READY = true;
})();
