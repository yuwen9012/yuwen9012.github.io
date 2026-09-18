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
          fontSize: "15px",
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

  /* ---- Screenshot lightbox -------------------------------------------- */
  /* Screenshots are 1600px wide but display at about a third of that in the
     three-up grid, so the detail is only reachable by enlarging them.
     Progressive enhancement: the markup is a plain <img>, and this turns it
     into a button. Without JS, or without <dialog>, the image still shows. */
  (function initLightbox() {
    var shots = document.querySelectorAll(".shot:not(.shot--empty)");
    if (!shots.length) return;
    if (!window.HTMLDialogElement || !HTMLDialogElement.prototype.showModal) return;

    var zh = (document.documentElement.lang || "").toLowerCase().indexOf("zh") === 0;
    var T = zh
      ? { zoom: "放大檢視", close: "關閉", sep: "：" }
      : { zoom: "View larger", close: "Close", sep: ": " };

    var ICON_CLOSE =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

    var dialog, dImg, dCap, opener;

    function ensureDialog() {
      if (dialog) return dialog;
      dialog = document.createElement("dialog");
      dialog.className = "lightbox";
      dialog.setAttribute("aria-label", T.zoom);
      dialog.innerHTML =
        '<button type="button" class="lightbox__close" aria-label="' + T.close + '">' +
        ICON_CLOSE + "</button>" +
        '<figure class="lightbox__figure">' +
        '<img class="lightbox__img" alt="">' +
        '<figcaption class="lightbox__caption"></figcaption>' +
        "</figure>";
      document.body.appendChild(dialog);

      dImg = dialog.querySelector(".lightbox__img");
      dCap = dialog.querySelector(".lightbox__caption");

      dialog.querySelector(".lightbox__close")
        .addEventListener("click", function () { dialog.close(); });

      /* The dialog's own box is just the panel, so a click whose target is the
         dialog itself landed on the backdrop. */
      dialog.addEventListener("click", function (ev) {
        if (ev.target === dialog) dialog.close();
      });

      /* showModal already restores focus, but only when the opener is still in
         the document; setting it back explicitly costs nothing. */
      dialog.addEventListener("close", function () {
        dImg.removeAttribute("src");
        if (opener) { opener.focus(); opener = null; }
      });

      return dialog;
    }

    Array.prototype.forEach.call(shots, function (shot) {
      var img = shot.querySelector("img");
      if (!img) return;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "shot__trigger";
      btn.setAttribute("aria-label", T.zoom + (img.alt ? T.sep + img.alt : ""));
      img.parentNode.insertBefore(btn, img);
      btn.appendChild(img);

      btn.addEventListener("click", function () {
        var d = ensureDialog();
        opener = btn;
        dImg.src = img.currentSrc || img.src;
        dImg.alt = img.alt || "";
        var cap = shot.parentNode.querySelector(".shot-caption");
        dCap.textContent = cap ? cap.textContent.trim() : (img.alt || "");
        dCap.hidden = !dCap.textContent;
        d.showModal();
      });
    });
  })();

  /* ---- Charts ---------------------------------------------------------- */
  /* Inline SVG rather than a charting library: no dependency, no licence
     question, it prints, and the series colours are CSS custom properties so
     a theme change needs no re-render. The numbers also live in the page as a
     table, which stays readable with no script at all — the chart is the
     enhancement, the table is the data. */
  (function initCharts() {
    var charts = document.querySelectorAll(".chart[data-chart]");
    if (!charts.length) return;

    var NS = "http://www.w3.org/2000/svg";
    function el(name, attrs) {
      var n = document.createElementNS(NS, name);
      for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
      return n;
    }
    function fmt(v) { return Number(v).toLocaleString(); }

    /* Round the axis top to something a reader can divide in their head. */
    function niceMax(v) {
      if (v <= 0) return 1;
      var mag = Math.pow(10, Math.floor(Math.log10(v)));
      var n = v / mag;
      var step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
      return step * mag;
    }

    function tipFor(host) {
      var t = host.querySelector(".chart__tip");
      if (!t) {
        t = document.createElement("div");
        t.className = "chart__tip";
        host.appendChild(t);
      }
      return t;
    }

    function renderLine(host, spec, W) {
      var padL = 58, padR = 18, padT = 18, padB = 36;
      var H = Math.max(210, Math.min(300, Math.round(W * 0.42)));
      var plotW = W - padL - padR, plotH = H - padT - padB;
      var all = spec.series.reduce(function (a, s) { return a.concat(s.data); }, []);
      var max = niceMax(Math.max.apply(null, all) * 1.06);
      var n = spec.x.length;
      var xAt = function (i) { return padL + (n === 1 ? plotW / 2 : plotW * i / (n - 1)); };
      var yAt = function (v) { return padT + plotH - plotH * (v / max); };

      var svg = el("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H,
                            role: "img", "aria-label": spec.alt || "" });

      var g = el("g", { "class": "chart__grid" });
      for (var t = 0; t <= 4; t++) {
        var v = max * t / 4, y = yAt(v);
        g.appendChild(el("line", { x1: padL, y1: y, x2: W - padR, y2: y }));
        var lab = el("text", { "class": "chart__tick", x: padL - 10, y: y + 4, "text-anchor": "end" });
        lab.textContent = fmt(Math.round(v));
        g.appendChild(lab);
      }
      svg.appendChild(g);

      var ax = el("g", { "class": "chart__axis" });
      ax.appendChild(el("line", { x1: padL, y1: padT + plotH, x2: W - padR, y2: padT + plotH }));
      svg.appendChild(ax);

      spec.x.forEach(function (lx, i) {
        var tx = el("text", { "class": "chart__tick", x: xAt(i), y: H - 12, "text-anchor": "middle" });
        tx.textContent = lx;
        svg.appendChild(tx);
      });

      spec.series.forEach(function (s, si) {
        var pts = s.data.map(function (v, i) { return xAt(i) + "," + yAt(v); }).join(" ");
        svg.appendChild(el("polyline", { "class": "chart__line chart__s" + (si + 1), points: pts }));
        s.data.forEach(function (v, i) {
          svg.appendChild(el("circle", { "class": "chart__dot chart__f" + (si + 1), cx: xAt(i), cy: yAt(v) }));
        });
        /* One direct label per series, on its last point — never a number on
           every point. */
        var li = s.data.length - 1;
        var dl = el("text", { "class": "chart__value", x: xAt(li) - 8,
                              y: yAt(s.data[li]) - 12, "text-anchor": "end" });
        dl.textContent = fmt(s.data[li]);
        svg.appendChild(dl);
      });

      var cross = el("line", { "class": "chart__crosshair", y1: padT, y2: padT + plotH, opacity: 0 });
      svg.appendChild(cross);
      var hit = el("rect", { "class": "chart__hit", x: padL, y: padT, width: plotW, height: plotH });
      svg.appendChild(hit);

      var tip = tipFor(host);
      function show(ev) {
        var r = svg.getBoundingClientRect();
        var px = (ev.clientX - r.left) * (W / r.width);
        var step = plotW / Math.max(1, n - 1);
        var i = Math.max(0, Math.min(n - 1, Math.round((px - padL) / step)));
        cross.setAttribute("x1", xAt(i));
        cross.setAttribute("x2", xAt(i));
        cross.setAttribute("opacity", 1);
        tip.innerHTML = "<b>" + spec.x[i] + "</b><br>" + spec.series.map(function (s) {
          return "<span>" + s.name + "</span> " + fmt(s.data[i]) + (spec.unit || "");
        }).join("<br>");
        tip.dataset.show = "true";
        var left = xAt(i) * (r.width / W) + 12;
        tip.style.left = Math.min(Math.max(8, left), r.width - tip.offsetWidth - 8) + "px";
        tip.style.top = "8px";
      }
      function hide() { cross.setAttribute("opacity", 0); tip.dataset.show = "false"; }
      hit.addEventListener("pointermove", show);
      hit.addEventListener("pointerdown", show);
      hit.addEventListener("pointerleave", hide);
      return svg;
    }

    /* Two measures whose magnitudes differ by several times cannot share one
       y scale — the smaller one flattens against the axis — and a second y
       axis is never the answer. Small multiples: one panel per series, each
       with its own scale, sharing the x axis. Each panel is titled, so the
       series needs no legend. */
    function renderMulti(host, spec, W) {
      var padL = 58, padR = 18, padT = 26, padB = 34, gap = 22;
      var k = spec.series.length;
      var panelH = Math.max(96, Math.min(132, Math.round(W * 0.16)));
      var H = padT * k + panelH * k + gap * (k - 1) + padB;
      var plotW = W - padL - padR;
      var n = spec.x.length;
      var xAt = function (i) { return padL + (n === 1 ? plotW / 2 : plotW * i / (n - 1)); };

      var svg = el("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H,
                            role: "img", "aria-label": spec.alt || "" });
      var tip = tipFor(host);
      var tops = [], scales = [];

      spec.series.forEach(function (s, si) {
        var top = si * (padT + panelH + gap) + padT;
        var max = niceMax(Math.max.apply(null, s.data) * 1.08);
        var yAt = function (v) { return top + panelH - panelH * (v / max); };
        tops.push(top); scales.push(yAt);

        var title = el("text", { "class": "chart__vlabel", x: padL, y: top - 10 });
        title.textContent = s.name + (spec.unit ? "（" + spec.unit.trim() + "）" : "");
        svg.appendChild(title);

        var g = el("g", { "class": "chart__grid" });
        [0, max / 2, max].forEach(function (v) {
          var y = yAt(v);
          g.appendChild(el("line", { x1: padL, y1: y, x2: W - padR, y2: y }));
          var lab = el("text", { "class": "chart__tick", x: padL - 10, y: y + 4, "text-anchor": "end" });
          lab.textContent = fmt(Math.round(v));
          g.appendChild(lab);
        });
        svg.appendChild(g);

        var pts = s.data.map(function (v, i) { return xAt(i) + "," + yAt(v); }).join(" ");
        svg.appendChild(el("polyline", { "class": "chart__line chart__s" + (si + 1), points: pts }));
        s.data.forEach(function (v, i) {
          svg.appendChild(el("circle", { "class": "chart__dot chart__f" + (si + 1), cx: xAt(i), cy: yAt(v) }));
        });
        var li = s.data.length - 1;
        var dl = el("text", { "class": "chart__value", x: xAt(li) - 8, y: yAt(s.data[li]) - 12,
                              "text-anchor": "end" });
        dl.textContent = fmt(s.data[li]);
        svg.appendChild(dl);
      });

      spec.x.forEach(function (lx, i) {
        var tx = el("text", { "class": "chart__tick", x: xAt(i), y: H - 12, "text-anchor": "middle" });
        tx.textContent = lx;
        svg.appendChild(tx);
      });

      /* One crosshair spanning every panel, so the reader compares the same
         x position across measures. */
      var cross = el("line", { "class": "chart__crosshair", y1: tops[0],
                               y2: tops[k - 1] + panelH, opacity: 0 });
      svg.appendChild(cross);
      var hit = el("rect", { "class": "chart__hit", x: padL, y: tops[0],
                             width: plotW, height: tops[k - 1] + panelH - tops[0] });
      svg.appendChild(hit);

      function show(ev) {
        var r = svg.getBoundingClientRect();
        var px = (ev.clientX - r.left) * (W / r.width);
        var step = plotW / Math.max(1, n - 1);
        var i = Math.max(0, Math.min(n - 1, Math.round((px - padL) / step)));
        cross.setAttribute("x1", xAt(i));
        cross.setAttribute("x2", xAt(i));
        cross.setAttribute("opacity", 1);
        tip.innerHTML = "<b>" + spec.x[i] + "</b><br>" + spec.series.map(function (s) {
          return "<span>" + s.name + "</span> " + fmt(s.data[i]) + (spec.unit || "");
        }).join("<br>");
        tip.dataset.show = "true";
        var left = xAt(i) * (r.width / W) + 12;
        tip.style.left = Math.min(Math.max(8, left), r.width - tip.offsetWidth - 8) + "px";
        tip.style.top = "0px";
      }
      function hide() { cross.setAttribute("opacity", 0); tip.dataset.show = "false"; }
      hit.addEventListener("pointermove", show);
      hit.addEventListener("pointerdown", show);
      hit.addEventListener("pointerleave", hide);
      return svg;
    }

    function renderBar(host, spec, W) {
      var padL = W < 420 ? 76 : 104, padR = 56, padT = 8, padB = 8;
      var rowH = 34, barH = 20;
      var H = padT + padB + rowH * spec.categories.length;
      var plotW = W - padL - padR;
      var max = niceMax(Math.max.apply(null, spec.data));
      var svg = el("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H,
                            role: "img", "aria-label": spec.alt || "" });
      var tip = tipFor(host);

      spec.categories.forEach(function (c, i) {
        var y = padT + rowH * i + (rowH - barH) / 2;
        var w = Math.max(2, plotW * spec.data[i] / max);

        var lab = el("text", { "class": "chart__vlabel", x: padL - 12,
                               y: y + barH / 2 + 4, "text-anchor": "end" });
        lab.textContent = c;
        svg.appendChild(lab);

        svg.appendChild(el("rect", { "class": "chart__bar chart__f1", x: padL, y: y,
                                     width: w, height: barH }));

        var val = el("text", { "class": "chart__value", x: padL + w + 8, y: y + barH / 2 + 4 });
        val.textContent = fmt(spec.data[i]) + (spec.unit || "");
        svg.appendChild(val);

        var hit = el("rect", { "class": "chart__hit", x: 0, y: padT + rowH * i, width: W, height: rowH });
        hit.addEventListener("pointerenter", function () {
          tip.innerHTML = "<b>" + c + "</b><br><span>" + (spec.name || "") + "</span> " +
                          fmt(spec.data[i]) + (spec.unit || "");
          tip.dataset.show = "true";
          tip.style.top = (padT + rowH * i) + "px";
          tip.style.left = (padL + 12) + "px";
        });
        hit.addEventListener("pointerleave", function () { tip.dataset.show = "false"; });
        svg.appendChild(hit);
      });

      var axis = el("line", { "class": "chart__axis", x1: padL, y1: padT, x2: padL, y2: H - padB });
      axis.setAttribute("stroke", "var(--chart-axis)");
      svg.appendChild(axis);
      return svg;
    }

    function draw(host) {
      var raw = host.querySelector("script[type='application/json']");
      if (!raw) return;
      var spec;
      try { spec = JSON.parse(raw.textContent); } catch (e) { return; }
      var W = Math.max(280, Math.round(host.clientWidth));
      var old = host.querySelector("svg");
      if (old) old.remove();
      var svg = spec.type === "bar" ? renderBar(host, spec, W)
              : spec.type === "multi" ? renderMulti(host, spec, W)
              : renderLine(host, spec, W);
      host.insertBefore(svg, host.firstChild);
    }

    Array.prototype.forEach.call(charts, function (host) {
      draw(host);
      if ("ResizeObserver" in window) {
        var w = host.clientWidth, t;
        new ResizeObserver(function () {
          /* The SVG is drawn 1:1 in pixels so axis labels keep their real
             size, which makes a resize a redraw rather than a scale. */
          if (Math.abs(host.clientWidth - w) < 8) return;
          w = host.clientWidth;
          clearTimeout(t);
          t = setTimeout(function () { draw(host); }, 120);
        }).observe(host);
      }
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
