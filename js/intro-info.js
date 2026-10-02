// Info drawer (home page, desktop)
// The tagline under the name ("Based in New York City / Designer &
// Photographer / + Info") is a button, and the drawer is tucked
// away below the intro:
//   hover  -> the drawer peeks up from the bottom with a wobble (a hint)
//             while the mouse is on the tagline
//   click  -> the drawer slides open with a short introduction
//   close  -> the ×, Escape, or clicking the tagline again
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
    document.addEventListener("scroll", () => window.requestAnimationFrame(place), {
        capture: true,
        passive: true,
    });

    // Open almost to the top of the screen, leaving a small gap (TOP_GAP) so
    // the page still shows above it. On a short window the text scrolls
    // inside the drawer.
    const TOP_GAP = 32;
    const openHeight = () => Math.max(clip.getBoundingClientRect().bottom - TOP_GAP, 160);

    const setOpen = (open) => {
        place();
        drawer.classList.remove("peek");
        drawer.classList.toggle("open", open);
        document.body.classList.toggle("intro-open", open);
        drawer.style.height = open ? `${openHeight()}px` : "";
        tagline.setAttribute("aria-expanded", String(open));
        // Move keyboard focus into the drawer when it opens, and back when it closes
        if (open) setTimeout(() => close.focus({ preventScroll: true }), 60);
        else tagline.focus({ preventScroll: true });
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
        if (isOpen()) drawer.style.height = `${openHeight()}px`;
    });
})();
