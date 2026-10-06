// Click to enlarge (project pages)
// Clicking an image in a project opens it large over a dark backdrop (the
// page dims like a theater), growing out of the spot where it sits.
// Its caption shows underneath. Left and right arrow keys (or swiping on a
// phone) step through the project's other images. Click anywhere, press
// Escape or use the × to close; it shrinks back into place.
// Works on every image in .case-hero and .case-figure, so new projects get
// it automatically. The "next project" cards at the bottom are left alone.

(() => {
    const images = [...document.querySelectorAll("main .case-hero img, main .case-figure img")];
    if (!images.length) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- Build the overlay once ---
    const box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Enlarged image");
    box.innerHTML = `
        <figure class="lightbox-figure">
            <img class="lightbox-img" alt="" />
            <figcaption class="lightbox-caption"></figcaption>
        </figure>
        <button type="button" class="lightbox-close" aria-label="Close">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2 L14 14 M14 2 L2 14" /></svg>
        </button>
        <button type="button" class="lightbox-prev" aria-label="Previous image">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 2 L4 8 L10 14" /></svg>
        </button>
        <button type="button" class="lightbox-next" aria-label="Next image">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2 L12 8 L6 14" /></svg>
        </button>
        <p class="lightbox-count" aria-live="polite"></p>`;
    document.body.append(box);
    const big = box.querySelector(".lightbox-img");
    const caption = box.querySelector(".lightbox-caption");
    const count = box.querySelector(".lightbox-count");
    const closeBtn = box.querySelector(".lightbox-close");
    if (images.length < 2) box.classList.add("single");

    let current = -1;
    let opener = null;
    let byKeyboard = false; // opened with the keyboard (then focus goes back to the image on close)

    // Images look clickable, and keyboard users can open them with Enter
    images.forEach((img, i) => {
        img.classList.add("zoomable");
        img.tabIndex = 0;
        img.setAttribute("role", "button");
        img.setAttribute("aria-label", `Enlarge image${img.alt ? ": " + img.alt : ""}`);
        img.addEventListener("click", () => {
            byKeyboard = false;
            open(i);
        });
        img.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                byKeyboard = true;
                open(i);
            }
        });
    });

    const captionOf = (img) => {
        const fig = img.closest("figure");
        const cap = fig && fig.querySelector("figcaption");
        return cap ? cap.textContent.trim() : "";
    };

    const show = (i) => {
        current = (i + images.length) % images.length;
        const img = images[current];
        big.src = img.currentSrc || img.src;
        big.alt = img.alt || "";
        const text = captionOf(img);
        caption.textContent = text;
        caption.hidden = !text;
        count.textContent = `${current + 1} / ${images.length}`;
    };

    // Grow out of (or shrink back into) the image's spot on the page
    // (It holds its last frame until we're done with it, so the big image
    // never flashes back to full size at the end.)
    let flight = null;
    const fly = (img, opening) => {
        if (flight) flight.cancel();
        flight = null;
        if (reduceMotion) return Promise.resolve();
        const from = img.getBoundingClientRect();
        const to = big.getBoundingClientRect();
        if (!from.width || !to.width) return Promise.resolve();
        const dx = from.left + from.width / 2 - (to.left + to.width / 2);
        const dy = from.top + from.height / 2 - (to.top + to.height / 2);
        const s = from.width / to.width;
        const small = { transform: `translate(${dx}px, ${dy}px) scale(${s})` };
        const full = { transform: "none" };
        flight = big.animate(opening ? [small, full] : [full, small], {
            duration: opening ? 380 : 340,
            easing: opening ? "cubic-bezier(0.22, 1, 0.36, 1)" : "cubic-bezier(0.4, 0, 0.2, 1)",
            fill: "both",
        });
        return flight.finished.catch(() => {});
    };

    const open = async (i) => {
        opener = images[i];
        show(i);
        big.style.visibility = "hidden"; // until it's ready to grow from the image's spot
        document.documentElement.classList.add("lightbox-open");
        box.classList.add("open");
        if (!big.complete) await new Promise((r) => big.addEventListener("load", r, { once: true }));
        images[i].style.visibility = "hidden"; // so it doesn't show twice while flying
        const growing = fly(images[i], true);
        big.style.visibility = "";
        await growing;
        images[i].style.visibility = "";
        if (byKeyboard) closeBtn.focus({ preventScroll: true });
    };

    const close = async () => {
        if (!box.classList.contains("open")) return;
        const img = images[current];
        box.classList.add("closing");
        img.style.visibility = "hidden";
        await fly(img, false);
        // Swap back in the same frame: the page image reappears exactly where
        // the shrunken one ends, and the overlay disappears at once
        img.style.visibility = "";
        box.classList.add("instant");
        box.classList.remove("open", "closing");
        if (flight) flight.cancel();
        flight = null;
        document.documentElement.classList.remove("lightbox-open");
        requestAnimationFrame(() => box.classList.remove("instant"));
        // Keyboard users get their place back; mouse users don't need the
        // focus outline showing up on the image
        if (byKeyboard && opener) opener.focus({ preventScroll: true });
        else if (document.activeElement && box.contains(document.activeElement)) document.activeElement.blur();
    };

    // Click anywhere closes, except on the arrow buttons
    box.addEventListener("click", (e) => {
        if (e.target.closest(".lightbox-prev")) show(current - 1);
        else if (e.target.closest(".lightbox-next")) show(current + 1);
        else close();
    });

    document.addEventListener("keydown", (e) => {
        if (!box.classList.contains("open")) return;
        if (e.key === "Escape") close();
        else if (e.key === "ArrowRight") show(current + 1);
        else if (e.key === "ArrowLeft") show(current - 1);
        else if (e.key === "Tab") {
            // keep keyboard focus inside the overlay
            const buttons = [...box.querySelectorAll("button")].filter((b) => b.offsetParent);
            const at = buttons.indexOf(document.activeElement);
            e.preventDefault();
            buttons[(at + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
        }
    });

    // Swipe left or right on a phone
    let startX = null;
    box.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
    box.addEventListener("touchend", (e) => {
        if (startX === null) return;
        const dx = e.changedTouches[0].clientX - startX;
        startX = null;
        if (Math.abs(dx) > 50) {
            show(current + (dx < 0 ? 1 : -1));
            box.dataset.swiped = "1";
            setTimeout(() => delete box.dataset.swiped, 400);
        }
    });
    // A swipe also ends in a "click"; don't let it close the overlay
    box.addEventListener(
        "click",
        (e) => {
            if (box.dataset.swiped) e.stopImmediatePropagation();
        },
        true,
    );
})();
