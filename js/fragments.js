/* chelsea lee — portfolio: fun page drag + click interaction
   Lets each card in #fragmentsStage be picked up and dropped anywhere,
   stacking on top of whatever it's dropped on. Reuses the --tx/--ty/--rot
   custom properties .placeholder already defines in style.css (the same
   ones its hover-lift uses), so dragging never has to fight the
   stylesheet over the transform property itself — this script only ever
   sets --tx/--ty inline, which simply wins over any stylesheet rule for
   the same property.

   A plain click (pointer barely moves between down and up) no longer
   opens an image lightbox — instead it pops up a small phrase bubble
   that cycles through PHRASES below (see showClickBubble), floating up
   and fading out over 1.5s. Only an actual drag is intercepted/ignored
   for this purpose, via a short-lived flag that swallows the synthetic
   click a real drag would otherwise leave behind.

   Also drives the "click me!" cursor-replacement bubble (see
   .fragment-hint in style.css): a single shared pill, shown and moved
   to the pointer position while hovering any card, and hidden the
   instant a real drag starts so it never fights the card being dragged.
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

  // one shared bubble, reused across every card instead of one per
  // card — it only ever follows whichever card the pointer is over
  var hint = document.createElement("span");
  hint.className = "fragment-hint";
  hint.textContent = "click me!";
  hint.setAttribute("aria-hidden", "true");
  document.body.appendChild(hint);

  // the phrases a card's own click bubble cycles through, one step per
  // click, shared across every card (a single running index) and
  // wrapping back to the start once it reaches the end
  var PHRASES = [
    "always a painter at heart",
    "creative juice are flowing...",
    "it all starts on paper!",
    "currently: playing around",
    "^_^"
  ];
  var phraseIndex = 0;

  // one shared click-bubble element, repositioned and restarted on
  // every card click rather than spawning a new element per click
  var clickBubble = document.createElement("span");
  clickBubble.className = "fragment-click-bubble";
  clickBubble.setAttribute("aria-live", "polite");
  document.body.appendChild(clickBubble);

  function showClickBubble(event, card) {
    clickBubble.textContent = PHRASES[phraseIndex];
    phraseIndex = (phraseIndex + 1) % PHRASES.length;
    // a keyboard-triggered click (Enter/Space, see the keydown handler
    // below) dispatches a synthetic click with clientX/clientY both 0 —
    // fall back to the card's own center so the bubble doesn't jump to
    // the corner of the page for keyboard users
    var x = event.clientX;
    var y = event.clientY;
    if (!x && !y && card) {
      var rect = card.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
    clickBubble.style.left = x + "px";
    clickBubble.style.top = y + "px";
    // restart the CSS animation even if it's already mid-run from a
    // previous click: drop the class, force a reflow, then re-add it —
    // simply re-adding the same class name is a no-op as far as the
    // animation is concerned.
    clickBubble.classList.remove("is-animating");
    void clickBubble.offsetWidth;
    clickBubble.classList.add("is-animating");
  }

  // small offset so the bubble sits just past the pointer instead of
  // directly under it, the same way a native cursor doesn't cover what
  // it's pointing at
  var HINT_OFFSET_X = 18;
  var HINT_OFFSET_Y = 22;

  function moveHint(event) {
    hint.style.transform =
      "translate(" + (event.clientX + HINT_OFFSET_X) + "px, " + (event.clientY + HINT_OFFSET_Y) + "px)";
  }

  function showHint(card, event) {
    card.classList.add("hint-active");
    moveHint(event);
    hint.classList.add("is-visible");
  }

  function hideHint(card) {
    card.classList.remove("hint-active");
    hint.classList.remove("is-visible");
  }

  cards.forEach(function (card) {
    var pointerId = null;
    var startX = 0;
    var startY = 0;
    var baseTx = 0;
    var baseTy = 0;
    var dragged = false;

    card.addEventListener("pointerenter", function (event) {
      if (pointerId === null) {
        showHint(card, event);
      }
    });

    card.addEventListener("pointerleave", function () {
      if (pointerId === null) {
        hideHint(card);
      }
    });

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
      // a real drag is about to take over this card's cursor duties —
      // the hint has done its job
      hideHint(card);
    });

    card.addEventListener("pointermove", function (event) {
      if (event.pointerId !== pointerId) {
        if (pointerId === null && card.classList.contains("hint-active")) {
          moveHint(event);
        }
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
      // the pointer is typically still sitting on top of the card right
      // after a drop (it moved with the pointer), so bring the hint
      // back instead of waiting for a pointerenter that won't fire
      if (card.matches(":hover")) {
        showHint(card, event);
      }
    }

    card.addEventListener("pointerup", release);
    card.addEventListener("pointercancel", release);

    // keyboard users can't drag, but Enter/Space should still pop the
    // click bubble the same way a plain click does
    card.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });
  });

  // One listener for every card, on the stage rather than each card
  // individually. A real drag leaves a synthetic click behind once the
  // pointer is released — that gets swallowed here (via justDragged)
  // instead of popping the phrase bubble; every other click is a
  // genuine plain click/tap/keyboard-activation, so that's what shows
  // the next phrase.
  stage.addEventListener("click", function (event) {
    var card = event.target.closest(".fragment-card");
    if (!card) {
      return;
    }
    if (card.dataset.justDragged === "true") {
      delete card.dataset.justDragged;
      return;
    }
    showClickBubble(event, card);
  });
})();
