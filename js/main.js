/* chelsea lee — portfolio interactions
   1. Click-to-flip tiles on the fun page: clicking a tile toggles a 3D
      rotate that reveals the back face. Keyboard-accessible (Enter/Space).
   2. Scroll fly-out title (index/projects page): as the hero card scrolls
      out of view, each letter in "chelsea lee" flies toward its own
      preset direction (--fx/--fy/--frot, set inline per letter in the
      HTML) and fades out, driven by a single --progress custom property.
   3. Click-to-cycle greeting bubble (about page): clicking the speech
      bubble over the photo swaps its text through a short list of
      phrases, one per click; after the last phrase it returns to the
      original "hi, i'm chelsea!" greeting before cycling through again.
      The "(click me)" hint disappears after the first click.
*/

(function () {
  "use strict";

  function toggleFlip(tile) {
    tile.classList.toggle("is-flipped");
    var flipped = tile.classList.contains("is-flipped");
    tile.setAttribute("aria-pressed", flipped ? "true" : "false");
  }

  document.addEventListener("DOMContentLoaded", function () {
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

    var hero = document.querySelector("[data-flyout-hero]");
    var title = document.querySelector(".site-title");
    if (hero && title) {
      var ticking = false;

      var updateProgress = function () {
        var rect = hero.getBoundingClientRect();
        // 0 while the hero's top hasn't reached the viewport top yet;
        // rises to 1 once it has scrolled fully past its own height.
        var scrolledPast = Math.min(Math.max(-rect.top, 0), rect.height || 1);
        var progress = rect.height ? scrolledPast / rect.height : 0;
        progress = Math.min(1, Math.max(0, progress));
        title.style.setProperty("--progress", progress.toFixed(3));
        ticking = false;
      };

      var requestTick = function () {
        if (!ticking) {
          window.requestAnimationFrame(updateProgress);
          ticking = true;
        }
      };

      window.addEventListener("scroll", requestTick, { passive: true });
      window.addEventListener("resize", requestTick);
      updateProgress();
    }

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
  });
})();
