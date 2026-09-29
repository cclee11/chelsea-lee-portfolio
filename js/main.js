/* chelsea lee — portfolio interactions
   1. Click-to-flip tiles on the fun page: clicking a tile toggles a 3D
      rotate that reveals the back face. Keyboard-accessible (Enter/Space).
   2. Click-to-cycle greeting bubble (about page): clicking the speech
      bubble over the photo swaps its text through a short list of
      phrases, one per click; after the last phrase it returns to the
      original "hi, i'm chelsea!" greeting before cycling through again.
      The "(click me)" hint disappears after the first click.
   3. Click-to-color title letters (home page): each letter in "chelsea
      lee" is independently clickable, cycling its own fill color through
      a small palette (see the .letter.color-* rules in style.css).
      Keyboard-accessible (Enter/Space) like the other interactions here.
   4. Night mode toggle: a small ring-shaped button, sticky to the bottom
      right of every page, flips a [data-theme="dark"] attribute on <html>
      (see style.css) and remembers the choice in localStorage. Applied
      as early as possible (script runs at the end of body, so
      document.documentElement already exists) to avoid a flash of the
      wrong theme on load.
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
      white overlay with a small looping logo video, captioned with two
      phrases that fade in and out in turn ("just getting set up...",
      "welcome!"). After the last phrase, the whole overlay fades out and
      removes itself from the DOM, revealing the hero page underneath.
      Only ever runs on an actual page reload (an inline script right
      after #loading-screen in index.html checks the Navigation Timing
      API and removes the element immediately, before this script even
      runs, on a plain in-site navigation — clicking the "projects" nav
      tab or the header logo back to the homepage — so it doesn't replay
      every time someone lands back on index.html).
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

    var titleLetters = document.querySelectorAll(".site-title .letter");
    // "" (no class) is the default navy fill from .word; each click steps
    // to the next color and wraps back around to the default navy.
    var letterColors = ["", "color-lightblue", "color-yellow"];

    var cycleLetterColor = function (letter) {
      var current = parseInt(letter.getAttribute("data-color-index") || "0", 10);
      var next = (current + 1) % letterColors.length;
      letterColors.forEach(function (cls) {
        if (cls) {
          letter.classList.remove(cls);
        }
      });
      if (letterColors[next]) {
        letter.classList.add(letterColors[next]);
      }
      letter.setAttribute("data-color-index", String(next));
    };

    titleLetters.forEach(function (letter) {
      letter.setAttribute("role", "button");
      letter.setAttribute("tabindex", "0");
      letter.setAttribute("aria-label", "Change the color of this letter");

      letter.addEventListener("click", function () {
        cycleLetterColor(letter);
      });

      letter.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          cycleLetterColor(letter);
        }
      });
    });

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
      ".grid-design > img.placeholder, .bw-spread-group img.placeholder, .photo-collage img.placeholder"
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
      tocMarker.src = "../assets/logo-ring-left.png";
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
