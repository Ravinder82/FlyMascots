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
    syncPipeline(name);
  }

  var toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(next);
      try { localStorage.setItem("fm-theme", next); } catch (e) {}
    });
  }

  function syncPipeline(name) {
    var img = document.querySelector(".pipe-frame img");
    var src = document.querySelector(".pipe-frame source");
    if (!img) return;
    img.src = name === "dark" ? "assets/pipeline-dark.png" : "assets/pipeline-light.png";
    if (src) src.removeAttribute("srcset"); // explicit src wins for capture
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
  var moodButtons = Array.prototype.slice.call(document.querySelectorAll("[data-mood]"));
  var frozen = CAPTURE; // capture mode freezes the stage too, for exact pixels
  var currentMood = q.get("mood") || "idle";

  if (stage) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    stage.src =
      "assets/stage.html?ui=0&bg=transparent&mood=" + encodeURIComponent(currentMood) +
      "&dpr=" + dpr + (CAPTURE ? "&capture=1" : "");
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

  moodButtons.forEach(function (btn) {
    btn.addEventListener("click", function () { setMood(btn.getAttribute("data-mood")); });
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
      proof: "#proof", install: "#install", moods: "#moods",
      platforms: ".platforms", pipeline: ".pipeline", faq: ".faq"
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

    state: function (name) {
      String(name).split(/[,&]/).forEach(function (pair) {
        var kv = pair.split("=");
        var k = kv[0].trim(), v = (kv[1] || "").trim();
        if (k === "theme") setTheme(v);
        if (k === "mood") setMood(v, true);
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
