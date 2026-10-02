// Info drawer (home page, desktop)
// The tagline under the name ("Based in New York City / Designer &
// Photographer / + Info") is a button, and the drawer is a folder tucked
// away below the intro:
//   hover  -> the folder pops up from the bottom with a wobble (a hint)
//   click  -> the folder slides open with a short introduction
//   close  -> the ×, Escape, or clicking the tagline again
// Styles are in css/style.css, section 6b. On phones and tablets the drawer
// is hidden and the same text is shown as a section below the intro.

(() => {
    const drawer = document.getElementById("intro-drawer");
    const tagline = document.querySelector(".tagline-btn");
    if (!drawer || !tagline) return;
    const clip = drawer.parentElement; // the invisible frame that tucks the folder away
    const intro = clip.parentElement; // the intro block, whose bottom edge is the black line
    const outline = drawer.querySelector(".drawer-outline");
    const path = outline.querySelector("path");
    const close = drawer.querySelector(".drawer-close");
    const body = drawer.querySelector(".drawer-body");

    const isOpen = () => drawer.classList.contains("open");
    const isPeeking = () => drawer.classList.contains("peek");

    // Keep the folder on the bottom edge of the screen, or on the black line
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

    // Draw the folder outline to match the drawer's current size: up the
    // left side, along the top, up the slant into the tab, across the tab,
    // and down the right side (no bottom line; the folder sits on the page's
    // black line). Matches the clip-path in the stylesheet.
    const px = (name) => parseFloat(getComputedStyle(drawer).getPropertyValue(name));
    const drawOutline = () => {
        const w = drawer.offsetWidth;
        const h = drawer.offsetHeight;
        const tabH = px("--tab-h");
        const tabW = px("--tab-w");
        const slope = px("--tab-slope");
        const s = 1; // half the line width, so the line sits just inside the fill
        outline.setAttribute("viewBox", `0 0 ${w} ${h}`);
        path.setAttribute(
            "d",
            `M ${s} ${h} L ${s} ${tabH + s} L ${w - tabW - slope + s * 0.4} ${tabH + s} ` +
                `L ${w - tabW + s * 0.4} ${s} L ${w - s} ${s} L ${w - s} ${h}`,
        );
    };
    new ResizeObserver(drawOutline).observe(drawer);

    const openHeight = () => Math.min(body.scrollHeight + px("--tab-h") + 4, window.innerHeight - 180);

    const setOpen = (open) => {
        place();
        drawer.classList.remove("peek");
        drawer.classList.toggle("open", open);
        drawer.style.height = open ? `${openHeight()}px` : "";
        tagline.setAttribute("aria-expanded", String(open));
        // Move keyboard focus into the drawer when it opens, and back when it closes
        if (open) setTimeout(() => close.focus({ preventScroll: true }), 60);
        else tagline.focus({ preventScroll: true });
    };

    // Peek while the mouse is on the tagline, on the column below it down
    // to the folder, or on the peeking folder itself, so it doesn't drop
    // while the mouse travels between them
    const inHoverZone = (x, y) => {
        const t = tagline.getBoundingClientRect();
        const c = clip.getBoundingClientRect();
        const inColumn = x >= t.left - 8 && x <= t.right + 8 && y >= t.top - 4 && y <= c.bottom;
        const d = drawer.getBoundingClientRect();
        const onFolder = isPeeking() && x >= d.left && x <= d.right && y >= d.top && y <= d.bottom;
        return inColumn || onFolder;
    };

    document.addEventListener(
        "mousemove",
        (e) => {
            if (isOpen()) return;
            const inside = inHoverZone(e.clientX, e.clientY);
            if (inside && !isPeeking()) {
                place();
                drawer.classList.add("peek");
            } else if (!inside && isPeeking()) {
                drawer.classList.remove("peek");
            }
        },
        { passive: true },
    );
    document.addEventListener("mouseleave", () => drawer.classList.remove("peek"));

    tagline.addEventListener("click", () => setOpen(!isOpen()));
    // Clicking the peeking folder opens it too
    drawer.addEventListener("click", (e) => {
        if (isPeeking() && !e.target.closest("a, button")) setOpen(true);
    });
    close.addEventListener("click", () => setOpen(false));

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen()) setOpen(false);
    });

    window.addEventListener("resize", () => {
        place();
        if (isOpen()) drawer.style.height = `${openHeight()}px`;
    });
})();
