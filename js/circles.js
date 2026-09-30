// Home page circles
// Two parts:
// 1. Scroll fade: they fade out as you scroll down, so they're part of the
//    intro and don't distract once you reach the project cards.
// 2. Floating motion: wandering, breathing, and drifting around the mouse
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
// Each circle:
//  - wanders slowly around the screen on its own meandering path
//    (two slow waves mixed together, so the path never looks like a loop),
//    and gives the other circles a little room so they don't clump
//  - gently grows and shrinks ("breathing"), each on its own rhythm
//  - drifts lazily around the mouse when it comes near, shrinking a little
//    as it does, then settles back once the mouse moves on
// Phones and tablets get the wandering and breathing (there's no mouse).
// Visitors with "reduce motion" turned on see the circles sitting still.

(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // --- Settings you can tweak ---

    const WANDER_SPEED = 1; // overall speed of the wandering (2 = twice as fast, 0.5 = half)
    const BREATHE_AMOUNT = 0.06; // how much they grow and shrink (0.06 = 6%)

    const GAP = 60; // how much room circles try to keep between each other, in pixels

    const RADIUS = 150; // how close the mouse gets (in pixels) before a circle reacts
    const PUSH = 60; // how far a circle can drift away from the mouse or another circle, in pixels
    const SHRINK = 0.15; // how much a circle shrinks when the mouse is right next to it (0.15 = 15%)
    const SWIRL = 0.5; // how much it curves around the mouse instead of moving straight away
    const FLOAT_AWAY = 0.012; // how fast it reacts to the mouse (lower = lazier)
    const FLOAT_BACK = 0.006; // how fast it settles back (lower = lazier)

    // --- End of settings ---

    const layer = document.querySelector(".Circ");
    if (!layer) return;

    // Each circle gets its own path so they never move in sync.
    // x and y: how many seconds each of its two waves takes to swing back and forth
    //   (bigger = slower). Mixing a faster and a slower wave makes the path meander.
    // start: where along each wave it begins (these put the circles near the
    //   corners where they used to sit). breathe: seconds per breath.
    const paths = {
        circle2: { x: [49, 130], y: [64, 97], start: [-0.93, 4.07, 0.3, 2.84], breathe: 7.3 },
        circle3: { x: [70, 103], y: [53, 158], start: [0.78, 2.37, -1.12, 4.26], breathe: 9.1 },
        circle4: { x: [58, 176], y: [79, 111], start: [-1.02, 4.16, -1.12, 4.26], breathe: 8.2 },
        circle5: { x: [86, 115], y: [46, 143], start: [0.3, 2.84, 0.52, 2.62], breathe: 6.4 },
    };

    const circles = Object.keys(paths)
        .map((id) => ({ el: document.getElementById(id), path: paths[id], x: 0, y: 0, shrink: 0 }))
        .filter((c) => c.el);
    if (!circles.length) return;

    // Hand positioning over to the script
    circles.forEach((c) => {
        c.el.style.left = "0";
        c.el.style.top = "0";
    });

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

    // Spread a -1..1 wave value toward the edges, so circles spend more time
    // around the sides of the screen and less time bunched in the middle
    const spread = (v) => Math.sign(v) * Math.abs(v) ** 0.6;

    // How strongly something at a given distance pushes a circle away (0 to 1)
    const nearness = (distance, reach) => (distance < reach ? (1 - distance / reach) ** 2 : 0);

    const step = (now) => {
        // Skip the work while the circles are faded out
        if (parseFloat(layer.style.opacity || 1) > 0) {
            const t = ((now - start) / 1000) * WANDER_SPEED;
            const width = layer.clientWidth;
            const height = layer.clientHeight;
            const wave = (seconds, offset) => Math.sin((t * 2 * Math.PI) / seconds + offset);

            // 1. Wandering: where each circle would be on its own path
            circles.forEach((c) => {
                const { x, y, start: phase } = c.path;
                c.size = c.el.offsetWidth;
                const waveX = spread(0.6 * wave(x[0], phase[0]) + 0.4 * wave(x[1], phase[1]));
                const waveY = spread(0.6 * wave(y[0], phase[2]) + 0.4 * wave(y[1], phase[3]));
                // Center point, keeping the whole circle on screen
                c.baseX = (width - c.size) * (0.5 + 0.5 * waveX) + c.size / 2;
                c.baseY = (height - c.size) * (0.5 + 0.5 * waveY) + c.size / 2;
            });

            circles.forEach((c) => {
                let targetX = 0;
                let targetY = 0;
                let targetShrink = 0;

                // Give each other a little room, so they don't clump together
                circles.forEach((other) => {
                    if (other === c) return;
                    const dx = c.baseX - (other.baseX + other.x);
                    const dy = c.baseY - (other.baseY + other.y);
                    const distance = Math.hypot(dx, dy) || 1;
                    const push = nearness(distance, (c.size + other.size) / 2 + GAP) * PUSH;
                    targetX += (dx / distance) * push;
                    targetY += (dy / distance) * push;
                });

                // 3. Mouse: drift around it and shrink a little
                if (hasMouse) {
                    const dx = c.baseX - mouseX;
                    const dy = c.baseY - mouseY;
                    const distance = Math.hypot(dx, dy) || 1;
                    const closeness = nearness(distance, RADIUS + c.size / 2);
                    const awayX = dx / distance;
                    const awayY = dy / distance;
                    targetX += (awayX - awayY * SWIRL) * closeness * PUSH;
                    targetY += (awayY + awayX * SWIRL) * closeness * PUSH;
                    targetShrink = closeness * SHRINK;
                }

                // Ease slowly toward the target: no bounce, no snapping
                const reacting = Math.hypot(targetX, targetY) > Math.hypot(c.x, c.y);
                const ease = reacting ? FLOAT_AWAY : FLOAT_BACK;
                c.x += (targetX - c.x) * ease;
                c.y += (targetY - c.y) * ease;
                c.shrink += (targetShrink - c.shrink) * ease;

                // 2. Breathing: a slow grow and shrink, one full breath every few seconds
                const breath = 1 + BREATHE_AMOUNT * wave(c.path.breathe * WANDER_SPEED, c.path.start[0]);
                const scale = breath * (1 - c.shrink);

                const left = c.baseX + c.x - c.size / 2;
                const top = c.baseY + c.y - c.size / 2;
                c.el.style.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px) scale(${scale.toFixed(3)})`;
            });
        }
        window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
})();
