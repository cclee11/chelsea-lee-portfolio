/* chelsea lee — portfolio: fun page drag interaction
   Lets each card in #fragmentsStage be picked up and dropped anywhere,
   stacking on top of whatever it's dropped on. Reuses the --tx/--ty/--rot
   custom properties .placeholder already defines in style.css (the same
   ones its hover-lift uses), so dragging never has to fight the
   stylesheet over the transform property itself — this script only ever
   sets --tx/--ty inline, which simply wins over any stylesheet rule for
   the same property.

   A plain click (pointer barely moves between down and up) is left
   alone, so the image lightbox wired up in main.js still opens as usual
   — only an actual drag is intercepted, via a short-lived flag that
   swallows the synthetic click a real drag would otherwise leave behind.
*/

(function () {
  "use strict";

  var stage = document.getElementById("fragmentsStage");
  if (!stage) {
    return;
  }

  var cards = stage.querySelectorAll(".fragment-card");
  var topZ = 10;
  var MOVE_THRESHOLD = 6;

  function numericVar(el, prop) {
    var value = parseFloat(getComputedStyle(el).getPropertyValue(prop));
    return isNaN(value) ? 0 : value;
  }

  cards.forEach(function (card) {
    var pointerId = null;
    var startX = 0;
    var startY = 0;
    var baseTx = 0;
    var baseTy = 0;
    var dragged = false;

    card.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }
      pointerId = event.pointerId;
      card.setPointerCapture(pointerId);
      startX = event.clientX;
      startY = event.clientY;
      baseTx = numericVar(card, "--tx");
      baseTy = numericVar(card, "--ty");
      dragged = false;
      topZ += 1;
      card.style.zIndex = topZ;
    });

    card.addEventListener("pointermove", function (event) {
      if (event.pointerId !== pointerId) {
        return;
      }
      var dx = event.clientX - startX;
      var dy = event.clientY - startY;
      if (!dragged && Math.abs(dx) < MOVE_THRESHOLD && Math.abs(dy) < MOVE_THRESHOLD) {
        return;
      }
      if (!dragged) {
        dragged = true;
        card.classList.add("is-dragging");
      }
      card.style.setProperty("--tx", baseTx + dx + "px");
      card.style.setProperty("--ty", baseTy + dy + "px");
    });

    function release(event) {
      if (event.pointerId !== pointerId) {
        return;
      }
      pointerId = null;
      card.classList.remove("is-dragging");
      if (dragged) {
        // swallow the synthetic click this drag would otherwise leave
        // behind, so it doesn't also pop open the lightbox
        card.dataset.justDragged = "true";
      }
    }

    card.addEventListener("pointerup", release);
    card.addEventListener("pointercancel", release);

    // keyboard users can't drag, but Enter/Space should still open the
    // lightbox the same way a plain click does
    card.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });
  });

  // capture phase, on the stage rather than each card, so this runs
  // before main.js's own (bubble-phase) click listener ever sees the
  // event — the only way to actually stop a post-drag click from
  // reaching it.
  stage.addEventListener(
    "click",
    function (event) {
      var card = event.target.closest(".fragment-card");
      if (card && card.dataset.justDragged === "true") {
        delete card.dataset.justDragged;
        event.stopPropagation();
        event.preventDefault();
      }
    },
    true
  );
})();
