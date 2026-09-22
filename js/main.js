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
    // "" (no class) is the default yellow fill from .word; each click steps
    // to the next color and wraps back around to the default.
    var letterColors = ["", "color-blue", "color-lightblue", "color-navy"];

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
  });
})();
