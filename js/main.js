/* chelsea lee — portfolio interactions
   1. Click-to-flip tiles on the fun page: clicking a tile toggles a 3D
      rotate that reveals the back face. Keyboard-accessible (Enter/Space).
   2. Click-to-cycle greeting bubble (about page): clicking the speech
      bubble over the photo swaps its text through a short list of
      phrases, one per click; after the last phrase it returns to the
      original "hi, i'm chelsea!" greeting before cycling through again.
      The "(click me)" hint disappears after the first click.
   3. Subnav tabs (more page): clicking a .subnav-tab shows the
      .subnav-panel with the matching data-panel and hides the rest.
      Generic by data-tab/data-panel, so any page can reuse the same
      markup for its own set of tabs.
   4. Image lightbox (design tab + fun page): clicking one of the plain
      image cards opens it bigger in an overlay, with a sheer light-blue
      layer over the whole page, including the sticky nav. Closes on
      Escape, on clicking the backdrop, or via the close button.
      Flip-tile posters are excluded on purpose — clicking those still
      flips the tile instead of opening the lightbox.
   5. Case study side TOC (project-N.html pages only): built entirely
      from whatever .case-heading/.case-subheading elements exist on the
      page, so it never needs hand-maintaining as case study content
      changes. Assigns each heading a stable id (skipping any it already
      has), lists them all in a fixed sidebar (see .case-toc in
      style.css, hidden below 1600px so it can never overlap the case
      page's wide-gutter content column, and always vertically centered
      in the viewport rather than anchored near the top), and highlights
      whichever section is currently in view via IntersectionObserver as
      the user scrolls. A small ring-logo marker sits in the sidebar's
      left gutter and animates to whichever entry is current. Clicking a
      link uses the browser's native anchor scroll.
   6. Homepage loading screen (#loading-screen, index.html only): a plain
      overlay with a small looping logo video, captioned with two phrases
      that fade in and out in turn ("just getting set up...", "welcome!").
      After the last phrase, the whole overlay fades out and removes
      itself from the DOM, revealing the hero page underneath. Only ever
      shows on the very first visit to the site this browser session, or
      on an actual page reload — an inline script right after
      #loading-screen in index.html checks the Navigation Timing API plus
      a sessionStorage flag and removes the element immediately, before
      this script even runs, on a plain in-site navigation back to the
      homepage (clicking the "projects" nav tab or the header logo from
      another page) once it's already been shown once this session.
   7. Draggable fragment cards (fun.html only, see js/fragments.js): each
      card in #fragmentsStage can be picked up and dropped anywhere,
      reusing the same --tx/--ty/--rot transform vars every .placeholder
      tile already understands (see style.css). A plain click (no real
      pointer movement) still opens the image lightbox above instead of
      counting as a drag.
   8. Hero title cursor trail (home page only): hovering the mouse over
      .site-title spawns small blue circles (.title-trail-dot) at the
      cursor's position, each fading out and removing itself a moment
      later (see .title-trail-dot in style.css). Spawning is throttled
      to roughly one circle every 35ms so a fast sweep of the mouse
      doesn't flood the DOM with elements.
   9. Case-study dark-mode preview toggles (project-1.html only, so far):
      a handful of screenshots in the Solution and Iteration sections
      ship both a light and a dark export (see the .solution-img-dark
      sibling <img> stacked on a .solution-img-light one). A small
      [data-dark-toggle] switch flips its own linked container's
      .is-dark class, which crossfades that container's light/dark
      image pairs via CSS — this only swaps which screenshot is shown,
      it never touches the site's own (light-only) theme.
   10. "Recently..." auto-scrolling photo strip (about page only): the
       .recently-item cards are wrapped in a .recently-track strip, then
       the whole set is cloned once and appended, so the track holds two
       identical back-to-back copies. style.css loops a translateX(0) ->
       translateX(-50%) animation on that track forever; since the two
       halves are identical, the loop point is invisible. No scrollbar,
       no manual drag — the photos just drift across on their own.
*/

(function () {
  "use strict";

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

      // Groups the flat heading list into <li class="case-toc-group"> per
      // .case-heading, each holding its own link plus a nested
      // <ul class="case-toc-subgroup"> of any .case-subheadings that follow
      // it (and precede the next .case-heading). Only the group containing
      // the currently-active heading gets expanded — see setActiveHeading/
      // setExpandedGroup below — so the sidebar only ever shows one
      // section's sub-pages at a time, per the current heading as the user
      // scrolls.
      var tocList = document.createElement("ul");
      var currentGroupLi = null;
      var currentSubList = null;
      // every heading AND subheading id maps to the top-level group <li>
      // it belongs to, so setActiveHeading can look up which group to
      // expand regardless of whether the active entry is itself a heading
      // or one of its subheadings.
      var groupByHeadingId = {};

      caseHeadings.forEach(function (heading) {
        if (!heading.id) {
          heading.id = slugify(heading.textContent || "");
        } else {
          usedIds[heading.id] = true;
        }

        var isSub = heading.classList.contains("case-subheading");

        if (!isSub || !currentGroupLi) {
          // every .case-heading starts a new top-level group; a stray
          // subheading with no heading before it (shouldn't happen, but
          // falls back safely) also starts its own group.
          currentGroupLi = document.createElement("li");
          currentGroupLi.className = "case-toc-group";

          var groupLink = document.createElement("a");
          groupLink.href = "#" + heading.id;
          groupLink.textContent = heading.textContent;
          currentGroupLi.appendChild(groupLink);

          currentSubList = document.createElement("ul");
          currentSubList.className = "case-toc-subgroup";
          currentGroupLi.appendChild(currentSubList);

          tocList.appendChild(currentGroupLi);
        } else {
          var subLi = document.createElement("li");
          var subLink = document.createElement("a");
          subLink.href = "#" + heading.id;
          subLink.textContent = heading.textContent;
          subLi.appendChild(subLink);
          currentSubList.appendChild(subLi);
        }

        groupByHeadingId[heading.id] = currentGroupLi;
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
        // Centers on the LINK's own box, not its parent <li>'s: a group
        // <li> also contains that group's (possibly expanded)
        // .case-toc-subgroup, so centering on the <li> pulled the marker
        // down toward the middle of "heading + its visible subheadings"
        // instead of resting beside the actual active entry — the main
        // cause of the marker visibly drifting off whenever the active
        // section had subheadings showing underneath it.
        var top = link.offsetTop + link.offsetHeight / 2 - tocMarker.offsetHeight / 2;
        tocMarker.style.top = top + "px";
      };

      var activeLink = null;
      var expandedGroup = null;

      // collapses whichever group was previously expanded and expands the
      // one that now contains the active heading, so only one section's
      // sub-pages are ever showing at once.
      var setExpandedGroup = function (group) {
        if (group === expandedGroup) {
          return;
        }
        if (expandedGroup) {
          expandedGroup.classList.remove("is-expanded");
        }
        expandedGroup = group;
        if (expandedGroup) {
          expandedGroup.classList.add("is-expanded");
        }
      };

      var setActiveHeading = function (id) {
        var target = linkByHeadingId[id];
        if (!target) {
          return;
        }
        activeLink = target;
        tocLinks.forEach(function (link) {
          link.classList.toggle("is-active", link === target);
        });
        setExpandedGroup(groupByHeadingId[id] || null);
        positionTocMarker(target);
      };

      // The marker's correct position depends on every other group's
      // current (un)collapsed height, which keeps changing continuously
      // for the full 300ms of the expand/collapse transition (and can
      // also shift whenever web fonts finish loading and reflow the list,
      // independent of any scroll or click). A single guessed timeout
      // after the transition "should" be done is fragile — it can still
      // sample mid-animation, which is exactly how the marker ends up
      // visibly misaligned from its link. A ResizeObserver on the list
      // instead re-measures on every actual layout change, so the marker
      // tracks the animation continuously and always lands correctly.
      if (window.ResizeObserver) {
        var tocResizeObserver = new ResizeObserver(function () {
          positionTocMarker(activeLink);
        });
        tocResizeObserver.observe(tocList);
      } else {
        // fallback for browsers without ResizeObserver: re-measure a
        // few times across the transition window.
        var scheduleRecheck = function () {
          [50, 150, 320].forEach(function (delay) {
            window.setTimeout(function () {
              positionTocMarker(activeLink);
            }, delay);
          });
        };
        var _setActiveHeadingOrig = setActiveHeading;
        setActiveHeading = function (id) {
          _setActiveHeadingOrig(id);
          scheduleRecheck();
        };
      }

      // the list's layout can shift on resize too; re-align the marker to
      // whatever is current without changing which entry is active.
      window.addEventListener("resize", function () {
        positionTocMarker(activeLink);
      });

      // web fonts finishing their (async) load can change line-height/
      // metrics and silently shift every link's position after the
      // initial layout — re-align once they're ready.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          positionTocMarker(activeLink);
        });
      }

      // the first heading is active by default (e.g. on load, before the
      // user has scrolled far enough to pass any heading)
      setActiveHeading(caseHeadings[0].id);

      // Scrollspy: on every scroll, the "current" heading is simply the
      // LAST one whose top edge has scrolled above the trigger line (just
      // under the sticky nav). This is a plain comparison across every
      // heading, so — unlike an IntersectionObserver with a narrow
      // rootMargin band — there's no gap between two widely-spaced
      // headings where nothing qualifies and the old active state gets
      // stuck: exactly one heading always satisfies "the last one I've
      // scrolled past" (or, before the first one, none do, so the first
      // heading stays the default from setActiveHeading above).
      var TRIGGER_LINE = 120;
      var tickingScroll = false;

      var updateActiveFromScroll = function () {
        tickingScroll = false;
        var current = null;
        for (var i = 0; i < caseHeadings.length; i++) {
          var top = caseHeadings[i].getBoundingClientRect().top;
          if (top <= TRIGGER_LINE) {
            current = caseHeadings[i];
          } else {
            break;
          }
        }
        if (current) {
          setActiveHeading(current.id);
        }
      };

      window.addEventListener(
        "scroll",
        function () {
          if (!tickingScroll) {
            tickingScroll = true;
            window.requestAnimationFrame(updateActiveFromScroll);
          }
        },
        { passive: true }
      );

      // headings can shift after web fonts finish loading (changing their
      // vertical position without any scroll happening), so re-run once
      // more shortly after load to correct for that
      window.setTimeout(updateActiveFromScroll, 500);
    }

    // hero title cursor trail (see main.js doc comment #8): small blue
    // circles that spawn at the cursor while it hovers .site-title, then
    // fade out and remove themselves.
    var siteTitle = document.querySelector(".site-title");
    if (siteTitle) {
      var SPAWN_INTERVAL_MS = 35;
      var FADE_MS = 1800;
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

    // case-study dark-mode preview toggles (see main.js doc comment #9):
    // each button flips only the .is-dark class on its own linked
    // container, so a page with more than one toggle (e.g. one for the
    // Solution grid, one for the Iteration mid-fi rows) keeps them
    // fully independent.
    document.querySelectorAll("[data-dark-toggle]").forEach(function (btn) {
      var target = document.getElementById(btn.getAttribute("data-dark-toggle"));
      if (!target) {
        return;
      }
      btn.addEventListener("click", function () {
        var isDark = target.classList.toggle("is-dark");
        btn.setAttribute("aria-pressed", isDark ? "true" : "false");
      });
    });

    // "recently..." photo strip (about page, see main.js doc comment #10):
    // wraps the existing .recently-item cards in a .recently-track strip,
    // then clones that whole set once and appends the clone so the track
    // is exactly twice the width of one full set of photos. style.css
    // animates .recently-track with a continuous translateX(0) ->
    // translateX(-50%) loop; because the second half is an identical copy
    // of the first, the reset from -50% back to 0 is invisible and the
    // strip appears to scroll forever with no visible seam, scrollbar, or
    // user interaction required.
    var recentlyScroll = document.querySelector(".recently-scroll");
    if (recentlyScroll) {
      var recentlyItems = Array.prototype.slice.call(
        recentlyScroll.querySelectorAll(".recently-item")
      );
      if (recentlyItems.length) {
        var recentlyTrack = document.createElement("div");
        recentlyTrack.className = "recently-track";
        recentlyItems.forEach(function (item) {
          recentlyTrack.appendChild(item);
        });
        recentlyItems.forEach(function (item) {
          var clone = item.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          recentlyTrack.appendChild(clone);
        });
        recentlyScroll.appendChild(recentlyTrack);
      }
    }
  });
})();
