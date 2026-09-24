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
