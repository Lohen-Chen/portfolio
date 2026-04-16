document.querySelectorAll('.media-hover').forEach(el => {
    const video = el.querySelector('video');
    el.addEventListener('mouseenter', () => {
        video.style.opacity = 1;
        video.play();
    });
    el.addEventListener('mouseleave', () => {
        video.style.opacity = 0;
        video.pause();
        video.currentTime = 0; 
    });
});