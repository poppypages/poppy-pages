/* PoppyPages Marketing · blog list
   The post cards are written into the page when the site is built (tools/build.mjs),
   so the list works without JavaScript. This only adds the entrance animation. */
(function () {
    'use strict';
    var box = document.getElementById('posts');
    if (!box || !box.children.length) return;
    if (window.gsap && window.PP && !window.PP.reduceMotion) {
        gsap.from(box.children, { y: 36, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, clearProps: 'transform,opacity' });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
    }
})();
