/* ============================================================
   FlyMascots — landing page behaviour
   Motion: reveals + count-up. Capture: window.CAPTURE API so the
   marketing kit can shoot this page deterministically.
   No Math.random(), time-based easing only — repeatable pixels.
   ============================================================ */

(function () {
  "use strict";

  var q = new URLSearchParams(location.search);
  var CAPTURE = q.get("capture") === "1";

  /* ---------------- theme ---------------- */

  var root = document.documentElement;
  var themeParam = q.get("theme");
  var saved = null;
  try { saved = localStorage.getItem("fm-theme"); } catch (e) { /* file:// */ }

  // Capture mode is deterministic: light unless a theme is asked for.
  if (CAPTURE) {
    setTheme(themeParam === "dark" ? "dark" : "light");
    // Nothing may load lazily while shooting — every pixel is wanted.
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
    if (meta) meta.setAttribute("content", name === "dark" ? "#0E1917" : "#F6F1E7");
    var btn = document.getElementById("themeToggle");
    if (btn) {
      btn.setAttribute("aria-label", name === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
  }

  var toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(next);
      try { localStorage.setItem("fm-theme", next); } catch (e) {}
      // the pipeline picture follows the OS; nudge its source for theme shots
      syncPipeline(next);
    });
  }

  function syncPipeline(name) {
    var img = document.querySelector(".pipe-frame img");
    var src = document.querySelector(".pipe-frame source");
    if (!img) return;
    img.src = name === "dark" ? "assets/pipeline-dark.png" : "assets/pipeline-light.png";
    if (src) src.removeAttribute("srcset"); // explicit src wins for capture
  }
  // The pipeline picture follows the page theme, not the OS preference.
  syncPipeline(root.getAttribute("data-theme"));

  /* ---------------- capture mode ---------------- */

  if (CAPTURE) root.classList.add("is-capture");

  /* ---------------- nav state ---------------- */

  var nav = document.getElementById("nav");
  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- reveals ---------------- */

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function revealAll() {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  if (CAPTURE || reduce || !("IntersectionObserver" in window)) {
    revealAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    // stagger siblings inside the same section (max 80ms steps)
    document.querySelectorAll("section").forEach(function (sec) {
      var items = sec.querySelectorAll(".reveal");
      items.forEach(function (el, i) {
        el.style.setProperty("--d", Math.min(i, 6) * 70 + "ms");
      });
    });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  }

  /* ---------------- count-up (proof strip) ---------------- */

  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));

  function runCounters(animated) {
    counters.forEach(function (el) {
      var target = Number(el.getAttribute("data-count")) || 0;
      if (!animated) { el.textContent = String(target); return; }
      var start = performance.now();
      var dur = 900;
      (function tick(now) {
        var t = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        el.textContent = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
      })(start);
    });
  }

  if (CAPTURE || reduce || !("IntersectionObserver" in window)) {
    runCounters(false);
  } else {
    var strip = document.querySelector(".strip");
    if (strip) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounters(true);
          cio.disconnect();
        });
      }, { threshold: 0.35 });
      cio.observe(strip);
    }
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

  /* ---------------- stage control (mood buttons) ---------------- */

  var stage = document.getElementById("stageFrame");
  var moodButtons = Array.prototype.slice.call(document.querySelectorAll("[data-mood]"));
  var frozen = CAPTURE; // capture mode freezes the stage too, for exact pixels

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
  var currentMood = (q.get("mood") || "idle");

  // The iframe gets its source here (not in the HTML) so capture mode can
  // ask the stage for its frozen, deterministic build.
  if (stage) {
    stage.src =
      "assets/stage.html?mood=" + encodeURIComponent(currentMood) +
      (CAPTURE ? "&capture=1" : "");
  }

  moodButtons.forEach(function (btn) {
    btn.addEventListener("click", function () { setMood(btn.getAttribute("data-mood")); });
  });

  // The stage announces itself; drive any queued mood once it is up.
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (d && d.type === "flymascots" && d.ready) setMood(currentMood, true);
  });

  /* ---------------- film ---------------- */

  var reel = document.getElementById("reel");
  var playBtn = document.getElementById("playBtn");
  if (playBtn && reel) {
    playBtn.addEventListener("click", function () {
      reel.muted = true;
      reel.play();
      playBtn.classList.add("hidden");
    });
    reel.addEventListener("pause", function () { playBtn.classList.remove("hidden"); });
    reel.addEventListener("click", function () {
      if (!reel.paused) { reel.pause(); }
    });
  }

  /* ---------------- capture: shot presets ---------------- */

  var shot = q.get("shot");
  if (shot) {
    var map = {
      hero: "#top", stage: "#demo", how: "#how", film: "#film",
      proof: "#proof", install: "#install", moods: ".moods",
      platforms: ".platforms", pipeline: ".pipeline", faq: ".faq"
    };
    var sel = map[shot] || (shot.charAt(0) === "#" ? shot : null);
    if (sel) {
      requestAnimationFrame(function () {
        var el = document.querySelector(sel);
        if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
        window.scrollBy(0, -8); // clear the sticky nav
      });
    }
  }

  var moodParam = q.get("mood");
  if (moodParam) setMood(moodParam, true);

  /* ---------------- window.CAPTURE (deterministic hooks) ---------------- */

  window.CAPTURE = {
    ready: true,

    // Pause every CSS transition/reveal AND the stage — two stills then
    // match byte for byte.
    freeze: function (on) {
      frozen = on !== false;
      root.classList.toggle("is-capture", frozen);
      if (frozen) sendStage({ freeze: true, mood: currentMood });
    },

    // Drive the mascot (site mood buttons + the stage inside the iframe).
    pose: function (mood) { setMood(String(mood || "idle"), true); },
    mood: function (mood) { setMood(String(mood || "idle"), true); },

    // ?state= presets used by capture scripts.
    //   theme=dark | mood=think | shot=film
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
        if (k === "reveals") revealAll();
        if (k === "counters") runCounters(false);
      });
    },

    scroll: function (y) { window.scrollTo(0, Number(y) || 0); },

    // Drive page time (reveals/counters resolve immediately; the mascot
    // inside the stage has its own seek — it is a separate frame).
    seek: function (frame, fps) {
      var f = Number(frame) || 0;
      var rate = Number(fps) || 30;
      revealAll();
      runCounters(false);
      if (stage && stage.contentWindow) {
        stage.contentWindow.postMessage({ type: "flymascots", seek: f / rate }, "*");
      }
      return f / rate;
    },

    time: function () { return performance.now() / 1000; }
  };

  // Everything is in place — capture scripts may shoot now.
  window.__SITE_READY = true;
})();
