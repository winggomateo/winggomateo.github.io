// Film grain effect
// Makes one small square of random black pixels (a "tile") and repeats it
// across the <canvas id="noise"> element, which sits on top of the page at
// 3% opacity (see .noise in css/style.css). The stylesheet then jumps the
// tiled layer to a new spot 25 times a second, so the grain flickers.
//
// The jumping is done with a transform, which the graphics chip handles on
// its own, so the grain costs almost nothing while the page scrolls. (It
// used to redraw the whole screen 25 times a second in JavaScript, and
// rebuild everything whenever a phone's address bar slid in or out, which
// made scrolling on phones stutter.)

(() => {
    const layer = document.getElementById("noise");
    if (!layer) return;

    const TILE = 256; // size of the repeating square, in pixels

    const tile = document.createElement("canvas");
    tile.width = TILE;
    tile.height = TILE;
    const ctx = tile.getContext("2d");
    const imageData = ctx.createImageData(TILE, TILE);
    const pixels = new Uint32Array(imageData.data.buffer);

    // Each pixel has a 50% chance of being black
    for (let i = 0; i < pixels.length; i++) {
        if (Math.random() < 0.5) pixels[i] = 0xff000000;
    }
    ctx.putImageData(imageData, 0, 0);

    tile.toBlob((blob) => {
        layer.style.backgroundImage = `url(${URL.createObjectURL(blob)})`;
        layer.classList.add("ready");
    });
})();
