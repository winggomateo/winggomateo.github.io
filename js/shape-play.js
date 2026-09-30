// Playing with the floating shapes (home page, desktop only)
//  - Click a shape: it spins and bounces.
//  - Grab a shape and throw it: it flies off, slows down, then drifts back
//    to where it was floating.
//  - Shuffle button (in the glass pill): all shapes glide to a new layout.

(() => {
    const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layer = document.querySelector(".shapes");
    if (!hasMouse || !layer) return;

    const shapes = [...layer.querySelectorAll("img")];
    const driftOf = (el) => el.getAnimations().find((a) => a.animationName && a.animationName.startsWith("drift-"));

    layer.classList.add("playable");

    // ---------- Click to spin, grab to throw ----------

    const FRICTION = 0.9; // how quickly a thrown shape slows down (lower = stops sooner)
    const RETURN_PAUSE = 250; // ms it rests before heading back
    const RETURN_MIN = 1200; // ms the trip back takes, at the least...
    const RETURN_MAX = 2800; // ...and at the most (farther throws take longer)

    shapes.forEach((el) => {
        el.draggable = false;
        let x = 0; // extra offset from where it would be floating
        let y = 0;
        let vx = 0;
        let vy = 0;
        let dragging = false;
        let moved = false;
        let startX, startY, baseX, baseY, lastX, lastY, lastT, loop;

        const apply = () => (el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`);

        const spin = () => {
            if (reduceMotion) return;
            el.animate(
                [
                    { rotate: "0deg", scale: "1" },
                    { rotate: "200deg", scale: "1.2", offset: 0.45 },
                    { rotate: "340deg", scale: "0.92", offset: 0.8 },
                    { rotate: "360deg", scale: "1" },
                ],
                { duration: 900, easing: "cubic-bezier(0.4, 0, 0.2, 1)", composite: "add" },
            );
        };

        // After a throw: coast and slow down, then glide back to the path with
        // a gentle start and finish, and resume floating
        const settle = () => {
            cancelAnimationFrame(loop);
            let last = performance.now();
            let returning = null; // { from: [x, y], start, duration } once gliding back

            const step = (now) => {
                const dt = Math.min((now - last) / 16.7, 3); // in 60fps frames
                last = now;

                if (!returning) {
                    // Coasting: keep moving and slow down
                    x += vx * dt;
                    y += vy * dt;
                    vx *= Math.pow(FRICTION, dt);
                    vy *= Math.pow(FRICTION, dt);
                    if (Math.hypot(vx, vy) < 0.2) {
                        const distance = Math.hypot(x, y);
                        returning = {
                            from: [x, y],
                            start: now + RETURN_PAUSE,
                            // farther away = takes a little longer
                            duration: Math.min(Math.max(RETURN_MIN + distance * 4, RETURN_MIN), RETURN_MAX),
                        };
                    }
                } else {
                    // Gliding back: ease in and out
                    const p = Math.min(Math.max((now - returning.start) / returning.duration, 0), 1);
                    const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
                    x = returning.from[0] * (1 - eased);
                    y = returning.from[1] * (1 - eased);
                    if (p >= 1) {
                        el.style.translate = "";
                        el.dataset.held = "";
                        const drift = driftOf(el);
                        if (drift && drift.playState === "paused") drift.play();
                        x = y = 0;
                        return;
                    }
                }
                apply();
                loop = requestAnimationFrame(step);
            };
            loop = requestAnimationFrame(step);
        };

        el.addEventListener("pointerdown", (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            cancelAnimationFrame(loop);
            dragging = true;
            moved = false;
            el.setPointerCapture(e.pointerId);
            el.dataset.held = "1";
            const drift = driftOf(el);
            if (drift) drift.pause(); // stop drifting while it's held
            startX = lastX = e.clientX;
            startY = lastY = e.clientY;
            baseX = x;
            baseY = y;
            lastT = performance.now();
            vx = vy = 0;
            el.classList.add("grabbed");
        });

        el.addEventListener("pointermove", (e) => {
            if (!dragging) return;
            if (Math.hypot(e.clientX - startX, e.clientY - startY) > 5) moved = true;
            x = baseX + (e.clientX - startX);
            y = baseY + (e.clientY - startY);
            const now = performance.now();
            const frames = Math.max((now - lastT) / 16.7, 0.5);
            // remember the recent speed, smoothed, for the throw
            vx = vx * 0.5 + ((e.clientX - lastX) / frames) * 0.5;
            vy = vy * 0.5 + ((e.clientY - lastY) / frames) * 0.5;
            lastX = e.clientX;
            lastY = e.clientY;
            lastT = now;
            apply();
        });

        const release = () => {
            if (!dragging) return;
            dragging = false;
            el.classList.remove("grabbed");
            if (!moved) {
                vx = vy = 0;
                spin();
            }
            // Held still before letting go: no throw, just float back
            if (performance.now() - lastT > 100) vx = vy = 0;
            settle();
        };
        el.addEventListener("pointerup", release);
        el.addEventListener("pointercancel", release);
    });

    // ---------- Shuffle ----------

    const LAYOUTS = 8; // how many layouts the paths have (css/style.css, section 11)
    const LAYOUT_MS = 5000; // how long each layout lasts in the 40s loop
    const button = document.querySelector(".shuffle-btn");

    const shuffle = () => {
        const drifts = shapes.map(driftOf).filter(Boolean);
        if (!drifts.length) return;
        const loopMs = LAYOUTS * LAYOUT_MS;
        const current = Math.floor(((drifts[0].currentTime % loopMs) + loopMs) % loopMs / LAYOUT_MS);
        let next = current;
        while (next === current) next = Math.floor(Math.random() * LAYOUTS);
        // Land a little before the new layout is fully in place, so the shapes
        // are still fading in when they arrive and then carry on as usual
        const target = next * LAYOUT_MS + LAYOUT_MS / 2 - 800;

        shapes.forEach((el) => {
            const drift = driftOf(el);
            if (!drift || el.dataset.held === "1") return;
            const before = el.getBoundingClientRect();
            const opacityBefore = parseFloat(getComputedStyle(el).opacity);
            drift.currentTime = target;
            const after = el.getBoundingClientRect();
            const opacityAfter = parseFloat(getComputedStyle(el).opacity);
            if (reduceMotion) return;
            // Glide from the old spot to the new one, and blend the opacity
            // from the old value into the path's own fade (added on top of
            // the path's animation, so nothing jumps at the start or end)
            el.animate(
                [
                    {
                        translate: `${before.left - after.left}px ${before.top - after.top}px`,
                        opacity: opacityBefore - opacityAfter,
                    },
                    { translate: "0 0", opacity: 0 },
                ],
                { duration: 1100, easing: "cubic-bezier(0.4, 0, 0.2, 1)", composite: "add" },
            );
        });
    };

    if (button) button.addEventListener("click", shuffle);
})();
