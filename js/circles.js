// Home page circles
// Two effects on the floating circles:
// 1. They fade out as you scroll down, so they're part of the intro and don't
//    distract once you reach the project cards.
// 2. They lean toward the mouse (see "Mouse interaction" further down).

// Scroll fade

(() => {
    const circles = document.querySelector(".Circ");
    if (!circles) return;

    // How far you scroll (as a share of the screen height) before they're gone.
    // 0.75 = fully faded after scrolling 75% of one screen.
    const FADE_DISTANCE = 0.75;

    // The page can scroll on <body> or on the window depending on the browser,
    // so check both.
    const scrollAmount = () =>
        Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);

    let ticking = false;
    const update = () => {
        const progress = scrollAmount() / (window.innerHeight * FADE_DISTANCE);
        circles.style.opacity = Math.max(0, 1 - progress);
        ticking = false;
    };

    // Scroll events can fire many times per frame; only update once per frame
    document.addEventListener(
        "scroll",
        () => {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(update);
            }
        },
        { capture: true, passive: true },
    );

    update();
})();

// Mouse interaction
// Each circle leans gently toward the cursor while it keeps drifting.
// Circles move by different amounts, which gives a sense of depth.
// Skipped on phones/tablets (no cursor) and for visitors who have
// "reduce motion" turned on in their system settings.

(() => {
    const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!hasMouse || reduceMotion) return;

    // Most each circle can move, in pixels. Bigger number = follows the mouse more.
    // Use a negative number to make a circle move away from the mouse instead.
    const PULL = {
        circle2: 40,
        circle3: 70,
        circle4: 25,
        circle5: 55,
    };

    // How quickly circles catch up to the mouse (0.01 = very slow, 0.3 = snappy)
    const EASE = 0.06;

    const circles = Object.keys(PULL)
        .map((id) => ({ el: document.getElementById(id), pull: PULL[id], x: 0, y: 0 }))
        .filter((c) => c.el);
    if (!circles.length) return;

    // Mouse position from -1 to 1, with 0 at the center of the screen
    let mouseX = 0;
    let mouseY = 0;
    let running = false;

    const step = () => {
        let stillMoving = false;

        circles.forEach((c) => {
            const targetX = mouseX * c.pull;
            const targetY = mouseY * c.pull;
            c.x += (targetX - c.x) * EASE;
            c.y += (targetY - c.y) * EASE;
            c.el.style.transform = `translate(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px)`;

            if (Math.abs(targetX - c.x) > 0.1 || Math.abs(targetY - c.y) > 0.1) {
                stillMoving = true;
            }
        });

        // Stop animating once everything has settled, to save battery
        running = stillMoving;
        if (running) window.requestAnimationFrame(step);
    };

    window.addEventListener(
        "mousemove",
        (e) => {
            mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseY = (e.clientY / window.innerHeight) * 2 - 1;
            if (!running) {
                running = true;
                window.requestAnimationFrame(step);
            }
        },
        { passive: true },
    );

    // Drift back to the resting position when the mouse leaves the window
    document.addEventListener("mouseleave", () => {
        mouseX = 0;
        mouseY = 0;
        if (!running) {
            running = true;
            window.requestAnimationFrame(step);
        }
    });
})();
