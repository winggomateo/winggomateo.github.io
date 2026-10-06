// More work list (Home and Design pages)
// Hovering a row shows a small preview image of the project beside the
// mouse. Desktop with a mouse only; on phones the list is just links.
//  - The preview trails the mouse with a soft ease, so it floats along
//    (FOLLOW sets how closely it keeps up).
//  - Moving from one row to another crossfades between the two images.
// The image for each row comes from its data-preview attribute.

(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const list = document.querySelector(".more-work-list");
    if (!list) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const FOLLOW = 0.16; // share of the distance it catches up each frame (1 = sticks to the mouse)

    // A frame holding two images, so one can fade in over the other
    const preview = document.createElement("div");
    preview.className = "more-work-preview";
    preview.setAttribute("aria-hidden", "true");
    const layers = [document.createElement("img"), document.createElement("img")];
    layers.forEach((img) => {
        img.alt = "";
        preview.append(img);
    });
    document.body.append(preview);
    let front = 0; // which layer is showing

    // Load the preview images ahead of time, so they appear right away
    const links = [...list.querySelectorAll("a[data-preview]")];
    links.forEach((a) => {
        new Image().src = a.dataset.preview;
    });

    // Where the preview wants to be (above and to the right of the mouse,
    // kept inside the window) and where it is now
    let target = { x: 0, y: 0 };
    let pos = null;
    let frame = null;

    const aim = (e) => {
        const w = preview.offsetWidth;
        const h = preview.offsetHeight;
        target = {
            x: Math.min(e.clientX + 28, window.innerWidth - w - 16),
            y: Math.max(e.clientY - h - 16, 16),
        };
        if (!pos || reduceMotion) pos = { ...target };
        if (!frame) frame = requestAnimationFrame(glide);
    };

    const glide = () => {
        pos.x += (target.x - pos.x) * FOLLOW;
        pos.y += (target.y - pos.y) * FOLLOW;
        preview.style.transform = `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px)`;
        const settled = Math.abs(target.x - pos.x) < 0.3 && Math.abs(target.y - pos.y) < 0.3;
        frame = settled ? null : requestAnimationFrame(glide);
    };

    // Show a project's image, fading it in over the one before
    const swap = (src) => {
        if (layers[front].getAttribute("src") === src && layers[front].classList.contains("on")) return;
        const next = 1 - front;
        layers[next].src = src;
        layers[next].classList.add("on");
        layers[front].classList.remove("on");
        front = next;
    };

    let hideTimer;
    links.forEach((a) => {
        a.addEventListener("mouseenter", (e) => {
            clearTimeout(hideTimer);
            // Coming in fresh (not from another row): start right at the mouse
            if (!preview.classList.contains("show")) pos = null;
            aim(e);
            swap(a.dataset.preview);
            preview.classList.add("show");
        });
        a.addEventListener("mousemove", aim);
        a.addEventListener("mouseleave", () => {
            // A short pause, so moving to the next row doesn't flicker it away
            hideTimer = setTimeout(() => {
                preview.classList.remove("show");
                layers.forEach((img) => img.classList.remove("on"));
            }, 60);
        });
    });
})();
