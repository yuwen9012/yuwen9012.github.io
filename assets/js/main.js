/* Portfolio behaviour: theme toggle, scroll reveal, header state,
   and Mermaid diagrams rendered to match the current theme.
   No build step; Mermaid is fetched from a CDN only on pages that use it. */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---- Mermaid diagrams ---------------------------------------------- */
  /* Declared first so the theme toggle can re-render after a theme change. */
  var renderDiagrams = function () {};

  (function initDiagrams() {
    var nodes = document.querySelectorAll("pre.mermaid");
    if (!nodes.length) return;

    /* Mermaid replaces the element's content, so keep the source to re-render. */
    var sources = Array.prototype.map.call(nodes, function (el) {
      return el.textContent;
    });

    function config() {
      var cs = getComputedStyle(root);
      var v = function (name) { return cs.getPropertyValue(name).trim(); };
      return {
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        fontFamily: v("--font-sans"),
        themeVariables: {
          fontSize: "14px",
          background: v("--surface-sunk"),
          primaryColor: v("--surface"),
          primaryTextColor: v("--ink"),
          primaryBorderColor: v("--border-strong"),
          secondaryColor: v("--accent-wash"),
          tertiaryColor: v("--surface-sunk"),
          lineColor: v("--muted-soft"),
          textColor: v("--ink"),
          mainBkg: v("--surface"),
          nodeBorder: v("--border-strong"),
          clusterBkg: v("--surface-sunk"),
          clusterBorder: v("--border"),
          edgeLabelBackground: v("--surface-sunk")
        }
      };
    }

    /* Hover or tap a node to light it and everything directly connected.
       This is emphasis only: nothing is hidden and no information depends on
       it, so the diagram is complete without ever touching it. */
    function wire(container) {
      var svg = container.querySelector("svg");
      if (!svg) return;

      var byId = {};
      svg.querySelectorAll("g.node").forEach(function (g) {
        /* Mermaid ids look like "<prefix>-flowchart-<nodeId>-<n>". */
        var m = /-flowchart-(.+)-\d+$/.exec(g.id || "");
        if (!m) return;
        byId[m[1]] = g;
        g.classList.add("is-interactive");
      });

      var edges = [];
      svg.querySelectorAll("path.flowchart-link").forEach(function (p) {
        /* data-id is the unprefixed "L_<source>_<target>_<n>"; the id
           attribute carries a per-render prefix. Node ids must not contain
           underscores or the split below is ambiguous. */
        var raw = p.getAttribute("data-id") || p.id || "";
        var m = /L_(.+)_(.+)_\d+$/.exec(raw);
        if (m) edges.push({ el: p, from: m[1], to: m[2] });
      });

      if (!edges.length) return;

      var pinned = null;

      function clear() {
        container.classList.remove("is-focused");
        svg.querySelectorAll(".is-lit").forEach(function (el) {
          el.classList.remove("is-lit");
        });
      }

      function light(id) {
        clear();
        container.classList.add("is-focused");
        var lit = {};
        lit[id] = true;
        edges.forEach(function (e) {
          if (e.from === id) lit[e.to] = true;
          if (e.to === id) lit[e.from] = true;
          if (e.from === id || e.to === id) e.el.classList.add("is-lit");
        });
        Object.keys(lit).forEach(function (n) {
          if (byId[n]) byId[n].classList.add("is-lit");
        });
      }

      Object.keys(byId).forEach(function (id) {
        var g = byId[id];
        g.addEventListener("mouseenter", function () { if (!pinned) light(id); });
        g.addEventListener("mouseleave", function () { if (!pinned) clear(); });
        g.addEventListener("click", function (ev) {
          ev.stopPropagation();
          /* Tapping pins the highlight, which is the only way this works on
             touch, where there is no hover. */
          if (pinned === id) { pinned = null; clear(); }
          else { pinned = id; light(id); }
        });
      });

      svg.addEventListener("click", function () { pinned = null; clear(); });
      document.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape" && pinned) { pinned = null; clear(); }
      });

      var hint = container.parentNode.querySelector(".diagram__hint");
      if (hint) hint.hidden = false;
    }

    import("https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs")
      .then(function (mod) {
        var mermaid = mod.default;

        renderDiagrams = function () {
          Array.prototype.forEach.call(nodes, function (el, i) {
            el.removeAttribute("data-processed");
            el.textContent = sources[i];
          });
          mermaid.initialize(config());
          mermaid
            .run({ nodes: nodes })
            .then(function () {
              document.querySelectorAll(".diagram").forEach(wire);
            })
            .catch(function () {
              /* Invalid diagram source — the text stays visible, which is the
                 most useful failure mode while the content is still a draft. */
            });
        };

        renderDiagrams();
      })
      .catch(function () {
        /* CDN unavailable: the diagram source remains readable as a code block. */
      });
  })();

  /* ---- Theme toggle -------------------------------------------------- */
  var toggle = document.querySelector(".theme-toggle");

  function currentTheme() {
    return root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  if (toggle) {
    toggle.setAttribute("aria-pressed", String(currentTheme() === "dark"));
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      toggle.setAttribute("aria-pressed", String(next === "dark"));
      try {
        localStorage.setItem("theme", next);
      } catch (e) {
        /* private mode or blocked storage — the theme still applies to this page */
      }
      renderDiagrams();
    });
  }

  /* Follow the system when the visitor has never chosen explicitly. */
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    if (!root.getAttribute("data-theme")) renderDiagrams();
  });

  /* ---- Header border on scroll --------------------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.setAttribute("data-scrolled", String(window.scrollY > 8));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Scroll reveal -------------------------------------------------- */
  var targets = document.querySelectorAll(".reveal");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = Number(el.dataset.revealDelay || 0);
        setTimeout(function () {
          el.classList.add("is-visible");
        }, delay);
        observer.unobserve(el);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
  );

  Array.prototype.forEach.call(targets, function (el) {
    observer.observe(el);
  });
})();
