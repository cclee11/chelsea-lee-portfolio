/* chelsea lee — portfolio interactions
   1. Click-to-flip tiles on the fun page: clicking a tile toggles a 3D
      rotate that reveals the back face. Keyboard-accessible (Enter/Space).
   2. Click-to-cycle greeting bubble (about page): clicking the speech
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
