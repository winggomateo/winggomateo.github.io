// Home page slideshow
// Cycles through images inside the Design and Photography tiles.
// To add or remove images, edit the two lists below.

(() => {
    const designImages = [
        "slide/design1.jpg",
        "slide/design2.jpg",
        "slide/design3.jpg",
        "slide/design4.jpg",
        "slide/design5.jpg",
        "slide/design6.jpg",
    ];

    const photoImages = [
        "slide/photo1.jpg",
        "slide/photo2.jpg",
        "slide/photo3.jpg",
        "slide/photo4.jpg",
        "slide/photo5.jpg",
        "slide/photo6.jpg",
        "slide/photo7.jpg",
    ];

    const SPEED = 800; // milliseconds each image stays on screen

    const designTile = document.getElementById("design");
    const photoTile = document.getElementById("photography");
    if (!designTile || !photoTile) return;

    // Load every image once up front so the slideshow doesn't flicker
    [...designImages, ...photoImages].forEach((src) => {
        new Image().src = src;
    });

    let step = 0;
    setInterval(() => {
        step++;
        designTile.src = designImages[step % designImages.length];
        photoTile.src = photoImages[step % photoImages.length];
    }, SPEED);
})();
