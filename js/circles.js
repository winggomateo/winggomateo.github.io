// Home page circles
// Two effects on the floating circles:
// 1. They fade out as you scroll down, so they're part of the intro and don't
//    distract once you reach the project cards.
// 2. They slowly drift around the mouse when it comes near (see "Mouse interaction").

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
// The circles keep drifting on their own. When one floats near the cursor,
// it slowly drifts aside and curves around it, then slowly settles back onto
// its path once the mouse moves on. Everything moves at a lazy pace on
// purpose, so the circles never dart or snap. Circles far from the mouse
// don't react at all.
// Skipped on phones/tablets (no cursor) and for visitors who have
// "reduce motion" turned on in their system settings.

(() => {
    const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!hasMouse || reduceMotion) return;

    const RADIUS = 150; // how close the mouse gets (in pixels) before a circle reacts
    const PUSH = 60; // how far a circle can drift aside, in pixels
    const SWIRL = 0.5; // how much it curves around the mouse instead of straight away (0 = straight)
    const FLOAT_AWAY = 0.012; // how fast it drifts aside (lower = lazier)
    const FLOAT_BACK = 0.006; // how fast it settles back onto its path (lower = lazier)

    const layer = document.querySelector(".Circ");
    const circles = ["circle2", "circle3", "circle4", "circle5"]
        .map((id) => document.getElementById(id))
        .filter(Boolean)
        .map((el) => ({ el, x: 0, y: 0 }));
    if (!layer || !circles.length) return;

    let mouseX = -9999;
    let mouseY = -9999;

    window.addEventListener(
        "mousemove",
        (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        },
        { passive: true },
    );

    // Mouse left the window: let everything settle back
    document.addEventListener("mouseleave", () => {
        mouseX = -9999;
        mouseY = -9999;
    });

    const step = () => {
        // Skip the work while the circles are faded out
        if (parseFloat(layer.style.opacity || 1) > 0) {
            circles.forEach((c) => {
                // Where the circle would be without the nudge
                const box = c.el.getBoundingClientRect();
                const cx = box.left + box.width / 2 - c.x;
                const cy = box.top + box.height / 2 - c.y;

                // Direction away from the mouse, gentler the farther away it is
                const dx = cx - mouseX;
                const dy = cy - mouseY;
                const distance = Math.hypot(dx, dy) || 1;
                const reach = RADIUS + box.width / 2;
                let targetX = 0;
                let targetY = 0;
                if (distance < reach) {
                    const strength = (1 - distance / reach) ** 2 * PUSH;
                    const awayX = dx / distance;
                    const awayY = dy / distance;
                    // Mix "straight away" with "sideways" so it curves around the mouse
                    targetX = (awayX - awayY * SWIRL) * strength;
                    targetY = (awayY + awayX * SWIRL) * strength;
                }

                // Ease slowly toward the target: no bounce, no snapping
                const moving = Math.hypot(targetX, targetY) > Math.hypot(c.x, c.y);
                const speed = moving ? FLOAT_AWAY : FLOAT_BACK;
                c.x += (targetX - c.x) * speed;
                c.y += (targetY - c.y) * speed;
                c.el.style.transform = `translate(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px)`;
            });
        }
        window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
})();
