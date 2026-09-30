// Shape speed slider (home page, desktop only)
// Lets visitors slow the floating shapes down or speed them up, within a
// range where the motion still looks good. Middle of the slider = normal.
// It stays hidden until the mouse moves (see the three states below).
// The choice is remembered in this browser for next time.

(() => {
    const control = document.querySelector(".speed-control");
    const slider = control && control.querySelector("input");
    if (!slider) return;

    const MIN_SPEED = 0.5; // far left: half speed
    const MAX_SPEED = 2; // far right: twice as fast

    // Slider runs 0 to 100 with normal speed at 50; each half feels even
    const toSpeed = (value) => {
        const x = (value - 50) / 50; // -1 to 1
        return x < 0 ? Math.pow(MIN_SPEED, -x) : Math.pow(MAX_SPEED, x);
    };

    const apply = () => {
        const speed = toSpeed(Number(slider.value));
        window.shapeSpeed = speed; // used by js/shapes.js for the bobbing and swaying
        // the drifting paths are CSS animations: change their playback speed
        document.getAnimations().forEach((animation) => {
            if (animation.animationName && animation.animationName.startsWith("drift-")) {
                animation.playbackRate = speed;
            }
        });
        slider.setAttribute("aria-valuetext", `${speed.toFixed(1)} times normal speed`);
    };

    try {
        const saved = localStorage.getItem("shapeSpeed");
        if (saved !== null) slider.value = saved;
    } catch (e) {}

    slider.addEventListener("input", () => {
        apply();
        try {
            localStorage.setItem("shapeSpeed", slider.value);
        } catch (e) {}
    });

    // Three states:
    //   hidden: the mouse is resting (or off the page)
    //   dim:    the mouse is moving somewhere on the page
    //   active: the mouse is near the slider, or it was just used
    const HIDE_AFTER_MS = 1000; // mouse resting this long hides it
    const ACTIVE_FOR_MS = 2000; // stays fully visible this long after being used
    const NEAR_PX = 120; // "near" = the mouse is within this distance of it

    let hideTimer;
    let usedUntil = 0;
    let lastX = null;
    let lastY = null;

    const isNear = (x, y) => {
        const r = control.getBoundingClientRect();
        const dx = Math.max(r.left - x, 0, x - r.right);
        const dy = Math.max(r.top - y, 0, y - r.bottom);
        return Math.hypot(dx, dy) <= NEAR_PX;
    };

    const setState = (state) => {
        control.classList.toggle("dim", state === "dim");
        control.classList.toggle("active", state === "active");
    };

    const update = (x, y) => {
        const recentlyUsed = Date.now() < usedUntil;
        setState(isNear(x, y) || recentlyUsed ? "active" : "dim");
        clearTimeout(hideTimer);
        hideTimer = setTimeout(rest, HIDE_AFTER_MS);
    };

    // Called once the mouse has rested for a while
    const rest = () => {
        // Resting right next to it keeps it visible
        if (lastX !== null && isNear(lastX, lastY)) return;
        // Just used: check again once that time is up
        const usedLeft = usedUntil - Date.now();
        if (usedLeft > 0) {
            hideTimer = setTimeout(rest, usedLeft);
            return;
        }
        setState("hidden");
    };

    document.addEventListener(
        "mousemove",
        (e) => {
            // Browsers sometimes send "moves" when the page changes under a
            // still mouse; only count real movement
            if (e.clientX === lastX && e.clientY === lastY) return;
            lastX = e.clientX;
            lastY = e.clientY;
            update(lastX, lastY);
        },
        { passive: true },
    );

    const markUsed = () => {
        usedUntil = Date.now() + ACTIVE_FOR_MS;
        setState("active");
        clearTimeout(hideTimer);
        hideTimer = setTimeout(rest, ACTIVE_FOR_MS);
    };
    slider.addEventListener("input", markUsed);
    slider.addEventListener("pointerdown", markUsed);

    // Mouse left the window: hide
    document.documentElement.addEventListener("mouseleave", () => {
        clearTimeout(hideTimer);
        lastX = lastY = null;
        if (Date.now() >= usedUntil) setState("hidden");
    });

    apply();
})();
