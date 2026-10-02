// Info drawer (home page, desktop)
// The tagline under the name ("Based in New York City / Designer &
// Photographer / + Info") is a button:
//   hover  -> the drawer peeks up from the bottom of the screen (a hint)
//   click  -> the drawer slides open with a short introduction
//   close  -> the ×, Escape, or clicking the tagline again
// Styles are in css/style.css, section 6b. On phones and tablets the drawer
// is hidden and the same text is shown as a section below the intro.

(() => {
    const drawer = document.getElementById("intro-drawer");
    const tagline = document.querySelector(".tagline-btn");
    if (!drawer || !tagline) return;
    const close = drawer.querySelector(".drawer-close");
    const body = drawer.querySelector(".drawer-body");

    const isOpen = () => drawer.classList.contains("open");

    const setOpen = (open) => {
        drawer.classList.remove("peek");
        drawer.classList.toggle("open", open);
        // Open just tall enough for the text, but leave the top of the screen clear
        drawer.style.height = open ? `${Math.min(body.scrollHeight + 4, window.innerHeight - 140)}px` : "";
        tagline.setAttribute("aria-expanded", String(open));
        // Move keyboard focus into the drawer when it opens, and back when it closes
        if (open) setTimeout(() => close.focus({ preventScroll: true }), 60);
        else tagline.focus({ preventScroll: true });
    };

    tagline.addEventListener("mouseenter", () => {
        if (!isOpen()) drawer.classList.add("peek");
    });
    tagline.addEventListener("mouseleave", () => drawer.classList.remove("peek"));
    tagline.addEventListener("click", () => setOpen(!isOpen()));
    close.addEventListener("click", () => setOpen(false));

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen()) setOpen(false);
    });

    // Keep the open height right if the window is resized
    window.addEventListener("resize", () => {
        if (isOpen()) drawer.style.height = `${Math.min(body.scrollHeight + 4, window.innerHeight - 140)}px`;
    });
})();
