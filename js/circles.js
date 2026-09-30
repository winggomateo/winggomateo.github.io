// Home page circles
// Two parts:
// 1. Scroll fade: they fade out as you scroll down, so they're part of the
//    intro and don't distract once you reach the project cards.
// 2. Floating motion: breathing, and drifting around the mouse
//    (see "Floating motion" further down, where the settings are).

// Scroll fade

(() => {
    const circles = document.querySelector(".Circ");
    if (!circles) return;

    // How far you scroll (as a share of the screen height) before they're gone.
    // 0.75 = fully faded after scrolling 75% of one screen.
    const FADE_DISTANCE = 0.75;

    // The page can scroll on <body> or on the window depending on the browser,
    // so check both.
    const scrollAmount = () => Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);

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

// Floating motion
// The circles follow their paths from the stylesheet (section 11). On top of that:
//  - each one gently grows and shrinks ("breathing"), on its own rhythm
//  - when the mouse comes near, a circle slowly drifts aside and curves around
//    it, shrinking a little, then settles back onto its path once the mouse
//    moves on. Circles far from the mouse don't react.
// Phones and tablets get the breathing (there's no mouse).
// Visitors with "reduce motion" turned on get neither.

(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // --- Settings you can tweak ---

    const BREATHE_AMOUNT = 0.06; // how much they grow and shrink (0.06 = 6%)

    const RADIUS = 150; // how close the mouse gets (in pixels) before a circle reacts
    const PUSH = 60; // how far a circle can drift away from the mouse, in pixels
    const SHRINK = 0.15; // how much a circle shrinks when the mouse is right next to it (0.15 = 15%)
    const SWIRL = 0.5; // how much it curves around the mouse instead of moving straight away
    const FLOAT_AWAY = 0.012; // how fast it reacts to the mouse (lower = lazier)
    const FLOAT_BACK = 0.006; // how fast it settles back (lower = lazier)

    // --- End of settings ---

    const layer = document.querySelector(".Circ");
    if (!layer) return;

    // Seconds per breath, and where in the breath each circle starts,
    // so they never pulse in sync
    const breathing = {
        circle2: { seconds: 7.3, start: 0 },
        circle3: { seconds: 9.1, start: 2.1 },
        circle4: { seconds: 8.2, start: 4.0 },
        circle5: { seconds: 6.4, start: 1.3 },
    };

    const circles = Object.keys(breathing)
        .map((id) => ({ el: document.getElementById(id), breath: breathing[id], x: 0, y: 0, shrink: 0 }))
        .filter((c) => c.el);
    if (!circles.length) return;

    let mouseX = -9999;
    let mouseY = -9999;
    if (hasMouse) {
        window.addEventListener(
            "mousemove",
            (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            },
            { passive: true },
        );
        document.addEventListener("mouseleave", () => {
            mouseX = -9999;
            mouseY = -9999;
        });
    }

    const start = performance.now();

    const step = (now) => {
        // Skip the work while the circles are faded out
        if (parseFloat(layer.style.opacity || 1) > 0) {
            const t = (now - start) / 1000;

            circles.forEach((c) => {
                let targetX = 0;
                let targetY = 0;
                let targetShrink = 0;

                if (hasMouse) {
                    // Where the circle is on its path, without our nudge
                    const box = c.el.getBoundingClientRect();
                    const cx = box.left + box.width / 2 - c.x;
                    const cy = box.top + box.height / 2 - c.y;
                    const size = c.el.offsetWidth;

                    // Drift away from the mouse, gentler the farther away it is
                    const dx = cx - mouseX;
                    const dy = cy - mouseY;
                    const distance = Math.hypot(dx, dy) || 1;
                    const reach = RADIUS + size / 2;
                    if (distance < reach) {
                        const closeness = (1 - distance / reach) ** 2; // 0 far away, 1 right on top
                        const awayX = dx / distance;
                        const awayY = dy / distance;
                        // Mix "straight away" with "sideways" so it curves around the mouse
                        targetX = (awayX - awayY * SWIRL) * closeness * PUSH;
                        targetY = (awayY + awayX * SWIRL) * closeness * PUSH;
                        targetShrink = closeness * SHRINK;
                    }
                }

                // Ease slowly toward the target: no bounce, no snapping
                const reacting = Math.hypot(targetX, targetY) > Math.hypot(c.x, c.y);
                const ease = reacting ? FLOAT_AWAY : FLOAT_BACK;
                c.x += (targetX - c.x) * ease;
                c.y += (targetY - c.y) * ease;
                c.shrink += (targetShrink - c.shrink) * ease;

                // Breathing: a slow grow and shrink
                const breath = 1 + BREATHE_AMOUNT * Math.sin((t * 2 * Math.PI) / c.breath.seconds + c.breath.start);
                const scale = breath * (1 - c.shrink);

                c.el.style.transform = `translate(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
            });
        }
        window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
})();
