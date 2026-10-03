/* chelsea lee — portfolio interactions
   1. Click-to-flip tiles on the fun page: clicking a tile toggles a 3D
      rotate that reveals the back face. Keyboard-accessible (Enter/Space).
   2. Click-to-cycle greeting bubble (about page): clicking the speech
      bubble over the photo swaps its text through a short list of
      phrases, one per click; after the last phrase it returns to the
      original "hi, i'm chelsea!" greeting before cycling through again.
      The "(click me)" hint disappears after the first click.
   3. Night mode toggle: a small ring-shaped button, sticky to the bottom
      right of every page, flips a [data-theme="dark"] attribute on <html>
      (see style.css) and remembers the choice in localStorage. Applied
      as early as possible (script runs at the end of body, so
      document.documentElement already exists) to avoid a flash of the
      wrong theme on load.
   4. Theme-aware logo video (.theme-video, see #loading-screen and the
      home hero's .eyes-icon): the looping logo clip is baked against a
      flat background per theme (there's no real video transparency here,
      so a light-mode take and a dark-mode take are rendered separately,
      each matching that mode's --page-bg) and this swaps each
      .theme-video's <source> srcs to the right pair whenever the theme is
      set, including on first load, so the video's background always
      matches the page underneath it instead of showing a mismatched box.
   5. Subnav tabs (more page): clicking a .subnav-tab shows the
      .subnav-panel with the matching data-panel and hides the rest.
      Generic by data-tab/data-panel, so any page can reuse the same
      markup for its own set of tabs.
   6. Solution dark-mode toggle (pitchbook case study): a "view dark mode"
      switch scoped to the six final-screen images only, independent of
      the site-wide night mode toggle above. Flips .is-dark on the
      #solutionScreens grid, which crossfades each screen's light/dark
      image pair (see .solution-img-* in style.css).
   7. Image lightbox (design tab + fun page): clicking one of the plain
      image cards opens it bigger in an overlay, with a sheer light-blue
      layer over the whole page, including the sticky nav. Closes on
      Escape, on clicking the backdrop, or via the close button.
      Flip-tile posters are excluded on purpose — clicking those still
      flips the tile instead of opening the lightbox.
   8. Case study side TOC (project-N.html pages only): built entirely
      from whatever .case-heading/.case-subheading elements exist on the
      page, so it never needs hand-maintaining as case study content
      changes. Assigns each heading a stable id (skipping any it already
      has), lists them all in a fixed sidebar (see .case-toc in
      style.css, hidden below 1440px so it can never overlap the page's
      960px-max content column, and always vertically centered in the
      viewport rather than anchored near the top), and highlights
      whichever section is currently in view via IntersectionObserver as
      the user scrolls. A small ring-logo marker sits in the sidebar's
      left gutter and animates to whichever entry is current. Clicking a
      link uses the browser's native anchor scroll.
   9. Homepage loading screen (#loading-screen, index.html only): a plain
      overlay with a small looping logo video (see #4 above), captioned
      with two phrases that fade in and out in turn ("just getting set
      up...", "welcome!"). After the last phrase, the whole overlay fades
      out and removes itself from the DOM, revealing the hero page
      underneath. Only ever shows on the very first visit to the site this
      browser session, or on an actual page reload — an inline script
      right after #loading-screen in index.html checks the Navigation
      Timing API plus a sessionStorage flag and removes the element
      immediately, before this script even runs, on a plain in-site
      navigation back to the homepage (clicking the "projects" nav tab or
      the header logo from another page) once it's already been shown
      once this session.
  10. Draggable fragment cards (fun.html only, see js/fragments.js): each
      card in #fragmentsStage can be picked up and dropped anywhere,
      reusing the same --tx/--ty/--rot transform vars every .placeholder
      tile already understands (see style.css). A plain click (no real
      pointer movement) still opens the image lightbox above instead of
      counting as a drag.
  11. Hero title cursor trail (home page only): hovering the mouse over
      .site-title spawns small blue circles (.title-trail-dot) at the
      cursor's position, each fading out and removing itself a moment
      later (see .title-trail-dot in style.css). Spawning is throttled
      to roughly one circle every 35ms so a fast sweep of the mouse
      doesn't flood the DOM with elements.
*/

(function () {
  "use strict";

  var THEME_KEY = "chelsea-lee-theme";

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    updateThemeVideos(theme);
  }

  // .theme-video elements (the loading screen + the home hero's eyes-icon)
  // carry the light/dark source pairs as data attributes rather than real
  // <source src>, so the very first paint already picks the right one —
  // nothing to swap away from after the fact. See main.js doc comment #4.
  function updateThemeVideos(theme) {
    var isDark = theme === "dark";
    var videos = document.querySelectorAll(".theme-video");
    videos.forEach(function (video) {
      var webm = video.getAttribute(isDark ? "data-webm-dark" : "data-webm-light");
      var mp4 = video.getAttribute(isDark ? "data-mp4-dark" : "data-mp4-light");
      var sources = video.querySelectorAll("source");
      var webmSource = sources[0];
      var mp4Source = sources[1];
      if (webmSource && webm && webmSource.getAttribute("src") !== webm) {
        webmSource.setAttribute("src", webm);
      }
      if (mp4Source && mp4 && mp4Source.getAttribute("src") !== mp4) {
        mp4Source.setAttribute("src", mp4);
      }
      video.load();
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        // autoplay can be rejected (rare, given muted+playsinline) — if so,
        // just leave the video on its first frame instead of throwing
        playPromise.catch(function () {});
      }
    });
  }

  var storedTheme = null;
  try {
    storedTheme = window.localStorage.getItem(THEME_KEY);
  } catch (err) {
    storedTheme = null;
  }
  applyTheme(storedTheme);

  function toggleFlip(tile) {
    tile.classList.toggle("is-flipped");
    var flipped = tile.classList.contains("is-flipped");
    tile.setAttribute("aria-pressed", flipped ? "true" : "false");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      var loadingCaption = loadingScreen.querySelector(".loading-caption");
      var loadingPhrases = [
        "just getting set up...",
        "welcome!"
      ];
      var PHRASE_HOLD_MS = 1300;
      var FADE_MS = 400;

      var advanceLoadingScreen = function (index) {
        loadingCaption.textContent = loadingPhrases[index];
        requestAnimationFrame(function () {
          loadingCaption.classList.add("is-visible");
        });

        var isLastPhrase = index === loadingPhrases.length - 1;

        setTimeout(function () {
          if (isLastPhrase) {
            // leave "welcome!" showing and fade the whole screen away,
            // rather than blanking the caption first
            loadingScreen.classList.add("is-hidden");
            setTimeout(function () {
              loadingScreen.remove();
            }, 650);
          } else {
            loadingCaption.classList.remove("is-visible");
            setTimeout(function () {
              advanceLoadingScreen(index + 1);
            }, FADE_MS);
          }
        }, PHRASE_HOLD_MS);
      };

      advanceLoadingScreen(0);
    }

    var flipTiles = document.querySelectorAll(".flip-tile");
    flipTiles.forEach(function (tile) {
      tile.setAttribute("role", "button");
      tile.setAttribute("tabindex", "0");
      tile.setAttribute("aria-pressed", "false");

      tile.addEventListener("click", function () {
        toggleFlip(tile);
      });

      tile.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          toggleFlip(tile);
        }
      });
    });

    var introBubble = document.querySelector(".bubble-intro");
    if (introBubble) {
      var introText = introBubble.querySelector(".bubble-intro-text");
      var introHint = introBubble.querySelector(".bubble-intro-hint");
      var defaultGreeting = introText.textContent;
      var phrases = [
        "nice to meet you!",
        "let's create together.",
        "time to explore!",
        "cheese recs?",
        ":)"
      ];
      // -1 (and every wrap back to it) shows the original greeting; each
      // click steps through 0..phrases.length-1 and then back to -1.
      var phraseIndex = -1;
      var stateCount = phrases.length + 1;

      var cyclePhrase = function () {
        phraseIndex = (phraseIndex + 1) % stateCount;
        introText.textContent = phraseIndex === phrases.length
          ? defaultGreeting
          : phrases[phraseIndex];
        if (introHint) {
          introHint.style.display = "none";
        }
      };

      introBubble.addEventListener("click", cyclePhrase);
      introBubble.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          cyclePhrase();
        }
      });
    }

    var subnavTabs = document.querySelectorAll(".subnav-tab");
    if (subnavTabs.length) {
      var subnavPanels = document.querySelectorAll(".subnav-panel");

      var activateSubnavTab = function (tab) {
        var target = tab.getAttribute("data-tab");

        subnavTabs.forEach(function (t) {
          var isActive = t === tab;
          t.classList.toggle("is-active", isActive);
          t.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        subnavPanels.forEach(function (panel) {
          panel.hidden = panel.getAttribute("data-panel") !== target;
        });
      };

      subnavTabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          activateSubnavTab(tab);
        });
      });
    }

    var solutionDarkToggle = document.getElementById("solutionDarkToggle");
    var solutionScreens = document.getElementById("solutionScreens");
    if (solutionDarkToggle && solutionScreens) {
      solutionDarkToggle.addEventListener("click", function () {
        var isDark = solutionScreens.classList.toggle("is-dark");
        solutionDarkToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
      });
    }

    var backToTopButtons = document.querySelectorAll(".back-to-top");
    backToTopButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    // Image lightbox: only the plain image cards on the Design tab and
    // the Fun page (never a flip-tile's front/back faces, which keep
    // their own click-to-flip behavior).
    var lightboxImages = document.querySelectorAll(
      ".grid-design > img.placeholder, .bw-spread-group img.placeholder, .fragments-stage img.placeholder"
    );

    if (lightboxImages.length) {
      var lightboxOverlay = document.createElement("div");
      lightboxOverlay.className = "lightbox-overlay";
      lightboxOverlay.setAttribute("role", "dialog");
      lightboxOverlay.setAttribute("aria-modal", "true");
      lightboxOverlay.setAttribute("aria-label", "Enlarged image");

      var lightboxImg = document.createElement("img");
      lightboxOverlay.appendChild(lightboxImg);

      var lightboxClose = document.createElement("button");
      lightboxClose.type = "button";
      lightboxClose.className = "lightbox-close";
      lightboxClose.setAttribute("aria-label", "Close enlarged image");
      lightboxClose.innerHTML = "&times;";
      lightboxOverlay.appendChild(lightboxClose);

      document.body.appendChild(lightboxOverlay);

      var closeLightbox = function () {
        lightboxOverlay.classList.remove("is-open");
        lightboxImg.src = "";
      };

      var openLightbox = function (img) {
        lightboxImg.src = img.getAttribute("src");
        lightboxImg.alt = img.getAttribute("alt") || "";

        // Cap the enlarged image at its own native resolution (adjusted
        // for the screen's device pixel ratio) on top of the usual
        // 90vw/1100px/88vh caps below. Without this, a modest-resolution
        // source file gets stretched past the point where it's sharp on
        // a retina/HiDPI screen — that stretching, not the CSS or the
        // lightbox logic, is what reads as "blurry". A source image with
        // enough native resolution is unaffected and still fills out to
        // the normal caps.
        var dpr = window.devicePixelRatio || 1;
        if (img.naturalWidth && img.naturalHeight) {
          var capW = img.naturalWidth / dpr;
          var capH = img.naturalHeight / dpr;
          lightboxImg.style.maxWidth = "min(90vw, 1100px, " + capW + "px)";
          lightboxImg.style.maxHeight = "min(88vh, " + capH + "px)";
        } else {
          lightboxImg.style.maxWidth = "";
          lightboxImg.style.maxHeight = "";
        }

        lightboxOverlay.classList.add("is-open");
      };

      lightboxImages.forEach(function (img) {
        img.addEventListener("click", function () {
          openLightbox(img);
        });
      });

      lightboxClose.addEventListener("click", closeLightbox);

      // Close on backdrop click, but not when the click is on the image
      // or close button themselves.
      lightboxOverlay.addEventListener("click", function (e) {
        if (e.target === lightboxOverlay) {
          closeLightbox();
        }
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && lightboxOverlay.classList.contains("is-open")) {
          closeLightbox();
        }
      });
    }

    var caseMain = document.querySelector(".case-main");
    var caseHeadings = caseMain
      ? caseMain.querySelectorAll(".case-heading, .case-subheading")
      : [];

    if (caseHeadings.length) {
      var usedIds = {};
      document.querySelectorAll("[id]").forEach(function (el) {
        usedIds[el.id] = true;
      });

      var slugify = function (text) {
        var base = "cs-" + text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        if (base === "cs-") {
          base = "cs-section";
        }
        var slug = base;
        var i = 2;
        while (usedIds[slug]) {
          slug = base + "-" + i;
          i++;
        }
        usedIds[slug] = true;
        return slug;
      };

      var tocList = document.createElement("ul");

      caseHeadings.forEach(function (heading) {
        if (!heading.id) {
          heading.id = slugify(heading.textContent || "");
        } else {
          usedIds[heading.id] = true;
        }

        var li = document.createElement("li");
        if (heading.classList.contains("case-subheading")) {
          li.className = "case-toc-sub";
        }

        var link = document.createElement("a");
        link.href = "#" + heading.id;
        link.textContent = heading.textContent;
        li.appendChild(link);
        tocList.appendChild(li);
      });

      var caseToc = document.createElement("nav");
      caseToc.className = "case-toc";
      caseToc.setAttribute("aria-label", "Case study sections");
      caseToc.appendChild(tocList);

      // small ring-logo marker that jumps to sit beside whichever entry
      // is current; lives in the padding-left gutter set aside for it
      // in .case-toc's CSS.
      var tocMarker = document.createElement("img");
      tocMarker.className = "case-toc-marker";
      tocMarker.src = "../assets/cursor-ring.png";
      tocMarker.alt = "";
      tocMarker.setAttribute("aria-hidden", "true");
      caseToc.appendChild(tocMarker);

      document.body.appendChild(caseToc);

      var tocLinks = caseToc.querySelectorAll("a");
      var linkByHeadingId = {};
      tocLinks.forEach(function (link) {
        linkByHeadingId[link.getAttribute("href").slice(1)] = link;
      });

      var positionTocMarker = function (link) {
        if (!link) {
          return;
        }
        var li = link.parentElement;
        var top = li.offsetTop + li.offsetHeight / 2 - tocMarker.offsetHeight / 2;
        tocMarker.style.top = top + "px";
      };

      var activeLink = null;

      var setActiveHeading = function (id) {
        var target = linkByHeadingId[id];
        if (!target) {
          return;
        }
        activeLink = target;
        tocLinks.forEach(function (link) {
          link.classList.toggle("is-active", link === target);
        });
        positionTocMarker(target);
      };

      // the list's layout can shift after fonts load or on resize;
      // re-align the marker to whatever is current without changing
      // which entry is active.
      window.addEventListener("resize", function () {
        positionTocMarker(activeLink);
      });

      // the first heading is active by default (e.g. on load, before the
      // user has scrolled far enough for the observer below to fire)
      setActiveHeading(caseHeadings[0].id);

      if ("IntersectionObserver" in window) {
        var headingObserver = new IntersectionObserver(
          function (entries) {
            var visible = entries.filter(function (entry) {
              return entry.isIntersecting;
            });
            if (visible.length) {
              visible.sort(function (a, b) {
                return a.boundingClientRect.top - b.boundingClientRect.top;
              });
              setActiveHeading(visible[0].target.id);
            }
          },
          // a heading counts as "current" once it's scrolled past the
          // sticky nav, and stays current until it's most of the way up
          // the viewport, so the topmost visible section wins ties
          { rootMargin: "-100px 0px -70% 0px", threshold: 0 }
        );

        caseHeadings.forEach(function (heading) {
          headingObserver.observe(heading);
        });
      }
    }

    // hero title cursor trail (see main.js doc comment #11): small blue
    // circles that spawn at the cursor while it hovers .site-title, then
    // fade out and remove themselves.
    var siteTitle = document.querySelector(".site-title");
    if (siteTitle) {
      var SPAWN_INTERVAL_MS = 35;
      var FADE_MS = 900;
      var lastSpawn = 0;

      siteTitle.addEventListener("mousemove", function (e) {
        var now = Date.now();
        if (now - lastSpawn < SPAWN_INTERVAL_MS) {
          return;
        }
        lastSpawn = now;

        var rect = siteTitle.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        var dot = document.createElement("span");
        dot.className = "title-trail-dot";
        dot.setAttribute("aria-hidden", "true");
        var drift = 10 + Math.random() * 10;
        dot.style.transform = "translate(" + x + "px, " + y + "px)";
        siteTitle.appendChild(dot);

        // one frame to let the dot paint at full opacity before switching
        // to the faded, drifted state, so the transition actually runs
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            dot.classList.add("is-fading");
            dot.style.transform =
              "translate(" + x + "px, " + (y - drift) + "px)";
          });
        });

        setTimeout(function () {
          if (dot.parentNode) {
            dot.parentNode.removeChild(dot);
          }
        }, FADE_MS);
      });
    }

    var themeToggle = document.createElement("button");
    themeToggle.type = "button";
    themeToggle.className = "theme-toggle";
    themeToggle.setAttribute("aria-label", "Toggle night mode");

    themeToggle.addEventListener("click", function () {
      var isDark = document.documentElement.getAttribute("data-theme") === "dark";
      var next = isDark ? "light" : "dark";
      applyTheme(next);
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch (err) {
        /* localStorage unavailable (e.g. private browsing) — the toggle
           still works for the rest of this page view */
      }
    });

    document.body.appendChild(themeToggle);
  });
})();
