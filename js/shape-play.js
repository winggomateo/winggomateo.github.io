// Playing with the floating shapes (home page, desktop only)
//  - Click a shape: it spins and bounces.
//  - Grab a shape and throw it: once let go it's drawn back to its path
//    like on a soft spring, in step with the other shapes.
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

    const PULL = 0.005; // how strongly its path pulls it back, once fully on (higher = quicker)
    const RAMP_MS = 900; // the pull starts weak and builds up over this long, so throws can fly far
    const FRICTION = 0.97; // how quickly a thrown shape slows down on its own (lower = stops sooner)
    const DAMPING = 0.88; // 1 = no wobble past its path; lower lets it overshoot a little
    const THROW = 1; // how much of the mouse's speed a throw keeps
    const NUDGE = 0.002; // a slow drift back the moment you let go, so it never hangs still

    shapes.forEach((el) => {
        el.draggable = false;
        let x = 0; // extra offset from where it would be floating
        let y = 0;
        let vx = 0;
        let vy = 0;
        let dragging = false;
        let moved = false;
        let startX, startY, baseX, baseY, lastX, lastY, lastT, loop;

        // The drag offset is added on top of the shape's drifting path. The
        // path itself moves the shape with "translate" (css/style.css), and an
        // animation would override a plain style, so the offset is its own
        // small animation, added to the path's ("composite: add").
        let offset = null;
        const apply = () => {
            const frame = { translate: `${x.toFixed(1)}px ${y.toFixed(1)}px` };
            if (offset) offset.effect.setKeyframes([frame, frame]);
            else offset = el.animate([frame, frame], { duration: 1, fill: "forwards", composite: "add" });
        };
        const clearOffset = () => {
            if (offset) offset.cancel();
            offset = null;
        };

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

        // While held, the shape's path was paused. On release, jump its path
        // back in step with the other shapes (so their fade cycles stay in
        // sync), without the shape itself jumping: its position and opacity
        // blend smoothly from where it is into the path's.
        const resync = () => {
            const drift = driftOf(el);
            const ref = shapes
                .filter((other) => other !== el && other.dataset.held !== "1")
                .map(driftOf)
                .find(Boolean);
            if (!drift) return;
            const before = el.getBoundingClientRect();
            const opacityBefore = parseFloat(getComputedStyle(el).opacity);
            if (ref) {
                drift.currentTime = ref.currentTime;
                drift.playbackRate = ref.playbackRate;
            }
            drift.play();
            const after = el.getBoundingClientRect();
            x += before.left - after.left;
            y += before.top - after.top;
            apply();
            const opacityAfter = parseFloat(getComputedStyle(el).opacity);
            el.animate([{ opacity: opacityBefore - opacityAfter }, { opacity: 0 }], {
                duration: 1800,
                easing: "cubic-bezier(0.4, 0, 0.2, 1)",
                composite: "add",
            });
        };

        // After letting go: a thrown shape flies on and slows down, while a soft
        // spring that starts weak and builds up draws it back onto its path
        const settle = () => {
            cancelAnimationFrame(loop);
            resync();
            vx *= THROW;
            vy *= THROW;
            // A gentle push back toward the path right away, so it never
            // hangs still after you let go (it speeds up from there)
            vx -= x * NUDGE;
            vy -= y * NUDGE;
            const start = performance.now();
            let last = start;

            const step = (now) => {
                const dt = Math.min((now - last) / 16.7, 3); // in 60fps frames
                last = now;
                // The pull builds up gently after letting go
                const ramp = Math.min((now - start) / RAMP_MS, 1);
                const k = PULL * (0.1 + 0.9 * ramp * ramp);
                const c = 2 * Math.sqrt(k) * DAMPING;
                // a few small steps per frame keeps the spring steady
                for (let i = 0; i < 4; i++) {
                    const h = dt / 4;
                    const drag = Math.pow(FRICTION, h);
                    vx = vx * drag + (-k * x - c * vx) * h;
                    vy = vy * drag + (-k * y - c * vy) * h;
                    x += vx * h;
                    y += vy * h;
                }
                if (Math.hypot(x, y) < 0.4 && Math.hypot(vx, vy) < 0.05) {
                    clearOffset();
                    el.dataset.held = "";
                    x = y = vx = vy = 0;
                    return;
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
