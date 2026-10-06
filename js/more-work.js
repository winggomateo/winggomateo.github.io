// More work list (Design page)
// Hovering a row shows a small preview image of the project beside the
// mouse. Desktop with a mouse only; on phones the list is just links.
// The image for each row comes from its data-preview attribute.

(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const list = document.querySelector(".more-work-list");
    if (!list) return;

    const preview = document.createElement("img");
    preview.className = "more-work-preview";
    preview.alt = "";
    preview.setAttribute("aria-hidden", "true");
    document.body.append(preview);

    // Load the preview images ahead of time, so they appear right away
    list.querySelectorAll("a[data-preview]").forEach((a) => {
        new Image().src = a.dataset.preview;
    });

    // Above and to the right of the mouse, kept inside the window
    const place = (e) => {
        const w = preview.offsetWidth;
        const h = preview.offsetHeight;
        const x = Math.min(e.clientX + 28, window.innerWidth - w - 16);
        const y = Math.max(e.clientY - h - 16, 16);
        preview.style.transform = `translate(${x}px, ${y}px)`;
    };

    list.querySelectorAll("a[data-preview]").forEach((a) => {
        a.addEventListener("mouseenter", (e) => {
            preview.src = a.dataset.preview;
            place(e);
            preview.classList.add("show");
        });
        a.addEventListener("mousemove", place);
        a.addEventListener("mouseleave", () => preview.classList.remove("show"));
    });
})();
