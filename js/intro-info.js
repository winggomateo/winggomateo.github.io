// Info drawer (home page, desktop)
// The tagline under the name ("Based in New York City / Designer &
// Photographer / + Info") is a button, and the drawer is tucked
// away below the intro:
//   hover  -> the drawer peeks up from the bottom with a wobble (a hint)
//             while the mouse is on the tagline
//   click  -> the drawer slides open with a short introduction
//   close  -> the ×, Escape, clicking the tagline again, or scrolling down
// Styles are in css/style.css, section 6b. On phones and tablets the drawer
// is hidden and the same text is shown as a section below the intro.

(() => {
    const drawer = document.getElementById("intro-drawer");
    const tagline = document.querySelector(".tagline-btn");
    if (!drawer || !tagline) return;
    const clip = drawer.parentElement; // the invisible frame that tucks the drawer away
    const intro = clip.parentElement; // the intro block, whose bottom edge is the black line
    const close = drawer.querySelector(".drawer-close");
    const body = drawer.querySelector(".drawer-body");

    const isOpen = () => drawer.classList.contains("open");

    // Keep the drawer on the bottom edge of the screen, or on the black line
    // under the intro once it's on screen (whichever is higher)
    const place = () => {
        const below = intro.getBoundingClientRect().bottom - window.innerHeight;
        clip.style.setProperty("--drawer-bottom", `${Math.max(0, below)}px`);
    };
    place();

    // Open almost to the top of the screen, leaving a small gap (TOP_GAP) so
    // the page still shows above it. On a short window the text scrolls
    // inside the drawer.
    const TOP_GAP = 32;
    const openHeight = () => Math.max(clip.getBoundingClientRect().bottom - TOP_GAP, 160);

    // Scrolling down while it's open closes it bit by bit: its top stays put
    // while its bottom rides up with the black line, so it folds down into
    // the line, and the text fades a little. As soon as it would start
    // cutting off the text, it closes the rest of the way on its own.
    // Scrolling back up before then opens it again, up to its full height
    // (even if it was opened partway down the page).
    const closeAt = () => body.offsetHeight + 4;
    const tallest = () => window.innerHeight - TOP_GAP; // its height at the top of the page
    let fullHeight = 0; // tallest it has been since it opened
    let tracking = false;
    let autoScrolling = false; // while the page scrolls itself to make room

    // The element that actually scrolls the page
    const scroller = (() => {
        for (let el = intro.parentElement; el; el = el.parentElement) {
            const overflow = getComputedStyle(el).overflowY;
            if (/(auto|scroll)/.test(overflow) && el.scrollHeight > el.clientHeight) return el;
        }
        return document.scrollingElement;
    })();

    const followScroll = () => {
        if (!isOpen() || !tracking) return;
        const height = Math.min(tallest(), Math.max(clip.getBoundingClientRect().bottom - TOP_GAP, 160));
        // the page has scrolled far enough to show it all: back to normal
        if (autoScrolling && height >= tallest() - 4) autoScrolling = false;
        if (height < closeAt() && !autoScrolling) {
            setOpen(false, { fromScroll: true });
            return;
        }
        fullHeight = Math.max(fullHeight, height);
        const shrunk = Math.max(0, fullHeight - height);
        drawer.classList.toggle("scroll-closing", height !== fullHeight);
        drawer.style.height = `${height}px`;
        // fades to 50% by the time it closes
        const room = Math.max(1, fullHeight - closeAt());
        body.style.opacity = shrunk > 0 ? String(1 - 0.5 * Math.min(1, shrunk / room)) : "";
    };

    // Follow the page on every scroll, plus one last check once scrolling
    // settles (smooth scrolling can finish after its last scroll event)
    const update = () => {
        place();
        followScroll();
    };
    let settle;
    document.addEventListener(
        "scroll",
        () => {
            window.requestAnimationFrame(update);
            clearTimeout(settle);
            settle = setTimeout(update, 120);
        },
        { capture: true, passive: true },
    );

    const CLOSE_MS = 600;
    let tuckTimer;

    const setOpen = (open, { fromScroll = false } = {}) => {
        place();
        drawer.classList.remove("peek", "scroll-closing");
        drawer.classList.toggle("open", open);
        // The tagline and shapes stay tucked behind until the drawer has
        // finished closing (CLOSE_MS matches the closing animation in the CSS)
        clearTimeout(tuckTimer);
        if (open) document.body.classList.add("intro-open");
        else tuckTimer = setTimeout(() => document.body.classList.remove("intro-open"), CLOSE_MS);
        fullHeight = open ? openHeight() : 0;
        tracking = open;
        body.style.opacity = "";
        drawer.style.height = open ? `${fullHeight}px` : "";
        tagline.setAttribute("aria-expanded", String(open));
        // Move keyboard focus into the drawer when it opens, and back when it closes
        // (not when it closed itself from scrolling: the person is reading on)
        if (open) setTimeout(() => close.focus({ preventScroll: true }), 60);
        else if (!fromScroll) tagline.focus({ preventScroll: true });
        if (open) makeRoom();
    };

    // Opened too far down the page to fit the text? Scroll back up until the
    // drawer can open to its full height (same as opening it from the top of
    // the page); the drawer grows along with the scroll.
    const makeRoom = () => {
        if (clip.getBoundingClientRect().bottom - TOP_GAP >= closeAt() + 120) return;
        const need = window.innerHeight - clip.getBoundingClientRect().bottom;
        if (need <= 0) return;
        autoScrolling = true;
        // Glide up over half a second (or jump, for reduced motion). Done by
        // hand rather than with smooth scrolling so it can't get cut short.
        const from = scroller.scrollTop;
        const to = Math.max(0, from - need);
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            scroller.scrollTop = to;
            return;
        }
        const start = performance.now();
        const step = (now) => {
            const t = Math.min(1, (now - start) / 500);
            const eased = 1 - Math.pow(1 - t, 3);
            scroller.scrollTop = from + (to - from) * eased;
            if (t < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
        // fallback in case the scroll gets interrupted
        setTimeout(() => {
            autoScrolling = false;
        }, 2000);
    };

    // Peek only while the mouse is on the tagline button
    tagline.addEventListener("mouseenter", () => {
        if (isOpen()) return;
        place();
        drawer.classList.add("peek");
    });
    tagline.addEventListener("mouseleave", () => drawer.classList.remove("peek"));

    tagline.addEventListener("click", () => setOpen(!isOpen()));
    close.addEventListener("click", () => setOpen(false));

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen()) setOpen(false);
    });

    window.addEventListener("resize", () => {
        place();
        if (isOpen()) {
            fullHeight = openHeight();
            drawer.style.height = `${fullHeight}px`;
        }
    });
})();
