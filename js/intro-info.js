// Info drawer (home page, desktop)
// The tagline under the name ("Based in New York City / Designer &
// Photographer / + Info") is a button, and the drawer is a folder whose tab
// sits right under it:
//   hover  -> the folder's tab pops up from the bottom with a wobble (a hint)
//   click  -> the folder slides open with a short introduction
//   close  -> the ×, the tab, Escape, or clicking the tagline again
// Styles are in css/style.css, section 6b. On phones and tablets the drawer
// is hidden and the same text is shown as a section below the intro.

(() => {
    const drawer = document.getElementById("intro-drawer");
    const tagline = document.querySelector(".tagline-btn");
    if (!drawer || !tagline) return;
    const clip = drawer.parentElement; // the invisible frame that tucks the folder away
    const intro = clip.parentElement; // the intro block, whose bottom edge is the black line
    const tab = drawer.querySelector(".drawer-tab");
    const close = drawer.querySelector(".drawer-close");
    const body = drawer.querySelector(".drawer-body");

    const isOpen = () => drawer.classList.contains("open");

    // Keep the folder on the bottom edge of the screen, or on the black line
    // under the intro once it's on screen (whichever is higher), and line the
    // tab up under the tagline
    const place = () => {
        const below = intro.getBoundingClientRect().bottom - window.innerHeight;
        clip.style.setProperty("--drawer-bottom", `${Math.max(0, below)}px`);
        const t = tagline.getBoundingClientRect();
        const c = clip.getBoundingClientRect();
        drawer.style.setProperty("--tab-left", `${t.left + t.width / 2 - c.left - tab.offsetWidth / 2}px`);
    };
    place();
    document.addEventListener("scroll", () => window.requestAnimationFrame(place), {
        capture: true,
        passive: true,
    });

    const openHeight = () => Math.min(body.scrollHeight + 4, window.innerHeight - 180);

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

    // Peek while the mouse is anywhere in the column from the tagline down
    // to the tab, so the folder stays up while the mouse travels between them
    const inHoverZone = (x, y) => {
        const t = tagline.getBoundingClientRect();
        const c = clip.getBoundingClientRect();
        const tabLeft = c.left + parseFloat(drawer.style.getPropertyValue("--tab-left") || 0);
        const left = Math.min(t.left, tabLeft) - 8;
        const right = Math.max(t.right, tabLeft + tab.offsetWidth) + 8;
        return x >= left && x <= right && y >= t.top - 4 && y <= c.bottom;
    };

    document.addEventListener(
        "mousemove",
        (e) => {
            if (isOpen()) return;
            const inside = inHoverZone(e.clientX, e.clientY);
            if (inside && !drawer.classList.contains("peek")) {
                place();
                drawer.classList.add("peek");
            } else if (!inside && drawer.classList.contains("peek")) {
                drawer.classList.remove("peek");
            }
        },
        { passive: true },
    );
    document.addEventListener("mouseleave", () => drawer.classList.remove("peek"));

    [tagline, tab].forEach((el) => el.addEventListener("click", () => setOpen(!isOpen())));
    close.addEventListener("click", () => setOpen(false));

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen()) setOpen(false);
    });

    window.addEventListener("resize", () => {
        place();
        if (isOpen()) drawer.style.height = `${openHeight()}px`;
    });
})();
