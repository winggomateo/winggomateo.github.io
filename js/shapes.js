// Home page shapes
// Two parts:
// 1. Scroll fade: they fade out as you scroll down, so they're part of the
//    intro and don't distract once you reach the project cards.
// 2. Floating motion: breathing, and drifting around the mouse
//    (see "Floating motion" further down, where the settings are).

// Scroll fade

(() => {
    const shapes = document.querySelector(".shapes");
    if (!shapes) return;

    // How far you scroll (as a share of the screen height) before they're gone.
    // 0.75 = fully faded after scrolling 75% of one screen.
    const FADE_DISTANCE = 0.75;

    // The page can scroll on <body> or on the window depending on the browser,
    // so check both.
    const scrollAmount = () => Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);

    let ticking = false;
    const update = () => {
        const progress = scrollAmount() / (window.innerHeight * FADE_DISTANCE);
        shapes.style.opacity = Math.max(0, 1 - progress);
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
// The shapes follow their paths from the stylesheet (section 11). On top of that:
//  - each one bobs gently and sways (tilts back and forth) as it travels,
//    like something floating on water
//  - each one gently grows and shrinks ("breathing")
//  - when the mouse comes near, a shape slowly drifts aside and curves around
//    it, shrinking and turning a little, then settles back onto its path once the mouse
//    moves on. Shapes far from the mouse don't react.
// Every shape has its own rhythm for all of this, so they never move in sync.
// Phones and tablets get everything except the mouse part.
// Visitors with "reduce motion" turned on get neither.

(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // --- Settings you can tweak ---

    const BOB = 12; // how far they bob around their path, in pixels
    const SWAY = 12; // how far they tilt back and forth, in degrees
    const BREATHE_AMOUNT = 0.06; // how much they grow and shrink (0.06 = 6%)

    const RADIUS = 150; // how close the mouse gets (in pixels) before a shape reacts
    const PUSH = 60; // how far a shape can drift away from the mouse, in pixels
    const SHRINK = 0.15; // how much a shape shrinks when the mouse is right next to it (0.15 = 15%)
    const TURN = 25; // how far a shape turns as the mouse brushes past it, in degrees
    const SWIRL = 0.5; // how much it curves around the mouse instead of moving straight away
    const FLOAT_AWAY = 0.012; // how fast it reacts to the mouse (lower = lazier)
    const FLOAT_BACK = 0.006; // how fast it settles back (lower = lazier)
    const SMOOTHNESS = 0.025; // how gently movements start and stop (lower = softer, 0.1 = crisp)

    // --- End of settings ---

    const layer = document.querySelector(".shapes");
    if (!layer) return;

    // Each shape's rhythm, in seconds per cycle (bigger = slower).
    // Two numbers mean two waves mixed together, which feels less mechanical.
    // start: where in its rhythm each shape begins.
    const rhythms = {
        "shape-burst": { bobX: [5.1, 8.3], bobY: [6.7, 3.9], sway: [9.4, 5.6], breathe: 7.3, start: 0 },
        "shape-flower": { bobX: [6.2, 4.4], bobY: [5.3, 8.9], sway: [11.2, 6.8], breathe: 9.1, start: 2.1 },
        "shape-star": { bobX: [4.7, 7.6], bobY: [7.1, 4.2], sway: [8.6, 12.3], breathe: 8.2, start: 4.0 },
        "shape-sparkle": { bobX: [7.3, 5.2], bobY: [4.6, 6.4], sway: [10.1, 7.2], breathe: 6.4, start: 1.3 },
    };

    const shapes = Object.keys(rhythms)
        .map((id) => ({
            el: document.getElementById(id),
            rhythm: rhythms[id],
            x: 0,
            y: 0,
            shrink: 0,
            turn: 0,
            goal: { x: 0, y: 0, shrink: 0, turn: 0 },
            offX: 0,
            offY: 0,
        }))
        .filter((c) => c.el);
    if (!shapes.length) return;

    // A smooth back-and-forth from -1 to 1. With two lengths, mixes two waves.
    const wave = (t, seconds, start) => {
        const [a, b] = Array.isArray(seconds) ? seconds : [seconds, seconds];
        return 0.65 * Math.sin((t * 2 * Math.PI) / a + start) + 0.35 * Math.sin((t * 2 * Math.PI) / b + start * 1.7);
    };

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
    let lastFrame = null;

    // Turn a "per frame at 60fps" easing amount into one that fits this frame's length
    const perFrame = (amount, dt) => 1 - Math.pow(1 - amount, dt * 60);

    const step = (now) => {
        // Skip the work while the shapes are faded out
        if (parseFloat(layer.style.opacity || 1) > 0) {
            const t = (now - start) / 1000;
            // Time since the last frame, so the motion is the same speed on
            // 60Hz and 120Hz screens
            const dt = Math.min((now - (lastFrame ?? now)) / 1000, 0.1);
            lastFrame = now;

            shapes.forEach((c) => {
                let targetX = 0;
                let targetY = 0;
                let targetShrink = 0;
                let targetTurn = 0;

                if (hasMouse) {
                    // Where the shape is on its path, without our extra movement
                    const box = c.el.getBoundingClientRect();
                    const cx = box.left + box.width / 2 - c.offX;
                    const cy = box.top + box.height / 2 - c.offY;
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
                        // Turn away from the side the mouse is on, as if brushed past
                        targetTurn = closeness * TURN * awayX;
                    }
                }

                // Ease toward the target in two smooth stages, so the movement
                // starts gently, glides, and settles gently (ease in and out),
                // with no bounce or snapping.
                const reacting = Math.hypot(targetX, targetY) > Math.hypot(c.goal.x, c.goal.y);
                const ease = perFrame(reacting ? FLOAT_AWAY : FLOAT_BACK, dt);
                const glide = perFrame(SMOOTHNESS, dt);
                const target = { x: targetX, y: targetY, shrink: targetShrink, turn: targetTurn };
                for (const key in target) {
                    c.goal[key] += (target[key] - c.goal[key]) * ease; // stage 1: where it's heading
                    c[key] += (c.goal[key] - c[key]) * glide; // stage 2: smooth the start and stop
                }

                const r = c.rhythm;

                // Bobbing and swaying
                const bobX = BOB * wave(t, r.bobX, r.start);
                const bobY = BOB * wave(t, r.bobY, r.start + 1);
                const tilt = SWAY * wave(t, r.sway, r.start + 2) + c.turn;

                // Breathing: a slow grow and shrink
                const breath = 1 + BREATHE_AMOUNT * wave(t, r.breathe, r.start);
                const scale = breath * (1 - c.shrink);

                c.offX = c.x + bobX;
                c.offY = c.y + bobY;
                c.el.style.transform =
                    `translate(${c.offX.toFixed(1)}px, ${c.offY.toFixed(1)}px) ` +
                    `rotate(${tilt.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
            });
        }
        window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
})();
