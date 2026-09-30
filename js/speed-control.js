// Shape speed slider (home page)
// Lets visitors slow the floating shapes down, stop them, or speed them up.
// Middle of the slider = normal speed, far left = stopped, far right = 3x.
// The choice is remembered in this browser for next time.

(() => {
    const slider = document.querySelector(".speed-control input");
    if (!slider) return;

    const MAX_SPEED = 3; // speed at the far right of the slider

    // Slider runs 0 to 100 with normal speed at 50; the curve makes the
    // slow half and fast half each feel even
    const toSpeed = (value) => {
        const x = value / 50;
        return x <= 1 ? x : Math.pow(x, Math.log2(MAX_SPEED));
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
        slider.setAttribute("aria-valuetext", speed === 0 ? "stopped" : `${speed.toFixed(1)} times normal speed`);
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

    apply();
})();
