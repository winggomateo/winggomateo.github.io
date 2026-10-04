// Background gradient sync
// The background gradient loops every 15 seconds (see "gradient" in
// css/style.css). Normally it would restart from the beginning on every new
// page. This works out where in the loop it "should" be right now, based on
// the clock, and starts the animation from there. Every page does the same,
// so the gradient carries on smoothly from page to page.
// This file is loaded in the <head> so it runs before the page is drawn.

(() => {
    const LOOP_SECONDS = 15; // keep in sync with the animation length in css/style.css
    const secondsIntoLoop = (Date.now() / 1000) % LOOP_SECONDS;
    document.documentElement.style.setProperty("--gradient-delay", `-${secondsIntoLoop.toFixed(3)}s`);

    // Put one gradient animation at the right point in the loop for right now
    const sync = (animation) => {
        animation.effect.updateTiming({ delay: 0 });
        animation.currentTime = Date.now() % (LOOP_SECONDS * 1000);
    };

    // Boxes filled with the page gradient (the homepage info drawer, the
    // project index panel) start their gradient only when they appear, which
    // would leave them out of step with the page behind them. So whenever a
    // gradient animation starts, line it up with the clock too.
    document.addEventListener(
        "animationstart",
        (event) => {
            if (event.animationName !== "gradient") return;
            event.target
                .getAnimations()
                .filter((animation) => animation.animationName === "gradient")
                .forEach(sync);
        },
        true,
    );

    // If this page was loaded ahead of time in the background (see
    // "speculationrules" in the <head>), re-sync the moment it's shown
    document.addEventListener("prerenderingchange", () => {
        document
            .getAnimations()
            .filter((animation) => animation.animationName === "gradient")
            .forEach(sync);
    });
})();
