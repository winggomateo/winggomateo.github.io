// Shape speed slider (home page, desktop only)
// Lets visitors slow the floating shapes down or speed them up, within a
// range where the motion still looks good. Middle of the slider = normal.
// The slider appears when the mouse moves and fades away when it rests.
// The choice is remembered in this browser for next time.

(() => {
    const control = document.querySelector(".speed-control");
    const slider = control && control.querySelector("input");
    if (!slider) return;

    const MIN_SPEED = 0.5; // far left: half speed
    const MAX_SPEED = 2; // far right: twice as fast
    const HIDE_AFTER = 2000; // milliseconds of no mouse movement before it fades away

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

    // Show on mouse movement, hide again once the mouse rests
    let hideTimer;
    document.addEventListener(
        "mousemove",
        () => {
            control.classList.add("visible");
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => control.classList.remove("visible"), HIDE_AFTER);
        },
        { passive: true },
    );

    apply();
})();
