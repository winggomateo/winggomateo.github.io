// Film grain effect
// Draws 10 frames of random black pixels onto the <canvas id="noise"> element
// and cycles through them 25 times a second. The canvas sits on top of the
// page at 3% opacity (see .noise in css/style.css), which gives the grain.

(() => {
    const canvas = document.getElementById("noise");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const FRAME_COUNT = 10;
    const FPS = 25;

    let frames = [];
    let frame = 0;
    let loopTimeout;

    // One frame of noise: each pixel has a 50% chance of being black
    const createFrame = (width, height) => {
        const imageData = ctx.createImageData(width, height);
        const pixels = new Uint32Array(imageData.data.buffer);

        for (let i = 0; i < pixels.length; i++) {
            if (Math.random() < 0.5) {
                pixels[i] = 0xff000000;
            }
        }

        return imageData;
    };

    // Show the next frame, then schedule the one after
    const loop = () => {
        frame = (frame + 1) % FRAME_COUNT;
        ctx.putImageData(frames[frame], 0, 0);

        loopTimeout = window.setTimeout(() => {
            window.requestAnimationFrame(loop);
        }, 1000 / FPS);
    };

    // Size the canvas to the window and build the frames
    const setup = () => {
        window.clearTimeout(loopTimeout);

        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        frames = [];
        for (let i = 0; i < FRAME_COUNT; i++) {
            frames.push(createFrame(width, height));
        }

        loop();
    };

    // Rebuild the grain when the window is resized (waits until resizing stops)
    let resizeTimeout;
    window.addEventListener("resize", () => {
        window.clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(setup, 200);
    });

    setup();
})();
