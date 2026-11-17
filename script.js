/* PoppyPages Marketing · shared site script (every page loads this) */
(function () {
    'use strict';

    // Lead capture endpoint (unchanged from the previous site).
    var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzg5p1Yh7RhuhY8VEJyzgbBEQW73F5C8csxZqqIJ_DqWexlH44jkpjc-Vk_gTvYwPPY9g/exec';

    var HEADER_HTML = "    <header class=\"site-header\">\n        <div class=\"wrap nav\">\n            <a class=\"brand\" href=\"/\" aria-label=\"PoppyPages Marketing home\">\n                <img src=\"/assets/poppy-mark.webp\" width=\"38\" height=\"38\" alt=\"\">\n                <span class=\"brand-word\">PoppyPages<small>Marketing</small></span>\n            </a>\n            <nav class=\"nav-menu\" id=\"nav-menu\" aria-label=\"Main\">\n                <a href=\"/services\">Systems</a>\n                <a href=\"/#results\">Results</a>\n                <a href=\"/#pricing\">Pricing</a>\n                <a href=\"/about\">About</a>\n                <a href=\"/blog\">Blog</a>\n                <a class=\"btn btn-ghost only-mobile\" href=\"/contact\">Book a strategy call</a>\n            </nav>\n            <div class=\"nav-cta\">\n                <a class=\"btn btn-ghost btn-s\" href=\"/contact\">Book a call</a>\n                <a class=\"btn btn-primary btn-s\" href=\"/#audit\">Free audit</a>\n                <button class=\"nav-toggle\" aria-controls=\"nav-menu\" aria-expanded=\"false\" aria-label=\"Open menu\"><span></span><span></span></button>\n            </div>\n        </div>\n    </header>\n";
    var FOOTER_HTML = "    <footer class=\"site-footer\">\n        <div class=\"wrap\">\n            <div class=\"foot-grid\">\n                <div class=\"foot-brand\">\n                    <a class=\"brand\" href=\"/\" aria-label=\"PoppyPages Marketing home\">\n                        <img src=\"/assets/poppy-mark.webp\" width=\"38\" height=\"38\" alt=\"\">\n                        <span class=\"brand-word\">PoppyPages<small>Marketing</small></span>\n                    </a>\n                    <p>Marketing systems, AI search and automations for small businesses. Based in the Triangle, North Carolina, serving Raleigh, Durham, Cary, Morrisville and beyond.</p>\n                    <a class=\"text-link\" href=\"mailto:support@poppypages.com\">support@poppypages.com</a>\n                </div>\n                <div class=\"foot-col\">\n                    <h4>Systems</h4>\n                    <a href=\"/services\">All services</a>\n                    <a href=\"/services/social-media-management\">Social media</a>\n                    <a href=\"/services/seo-and-content-strategy\">SEO and content</a>\n                    <a href=\"/services/web-design\">Web design</a>\n                    <a href=\"/services/pediatric-marketing\">Pediatric marketing</a>\n                </div>\n                <div class=\"foot-col\">\n                    <h4>Company</h4>\n                    <a href=\"/about\">About</a>\n                    <a href=\"/case-studies\">Case studies</a>\n                    <a href=\"/blog\">Blog</a>\n                    <a href=\"/faq\">FAQ</a>\n                    <a href=\"/contact\">Contact</a>\n                </div>\n                <div class=\"foot-col\">\n                    <h4>Areas we serve</h4>\n                    <a href=\"/locations/raleigh\">Raleigh</a>\n                    <a href=\"/locations/durham\">Durham</a>\n                    <a href=\"/locations/cary\">Cary</a>\n                    <a href=\"/locations/morrisville\">Morrisville</a>\n                </div>\n            </div>\n            <div class=\"foot-base\">\n                <span>© 2026 PoppyPages Marketing. All rights reserved.</span>\n                <span>PoppyPages Marketing is an independent agency and is not affiliated with Poppy AI.</span>\n            </div>\n            <div class=\"foot-word\" aria-hidden=\"true\">PoppyPages</div>\n        </div>\n    </footer>\n";
    var SPRITE_HTML = "    <!-- icon sprite -->\n    <svg width=\"0\" height=\"0\" style=\"position:absolute\" aria-hidden=\"true\">\n        <defs>\n            <symbol id=\"i-arrow\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12h14M13 6l6 6-6 6\"/></symbol>\n            <symbol id=\"i-check\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12.5l4.5 4.5L19 7.5\"/></symbol>\n            <symbol id=\"i-star\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9z\"/></symbol>\n            <symbol id=\"i-post\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3.5\" y=\"3.5\" width=\"17\" height=\"17\" rx=\"4\"/><circle cx=\"9\" cy=\"9.5\" r=\"1.6\"/><path d=\"M4 17l4.5-4.5 3.5 3.5 3-3 5 5\"/></symbol>\n            <symbol id=\"i-chat\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20.5 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.6A8 8 0 1 1 20.5 11.5z\"/></symbol>\n            <symbol id=\"i-spark\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z\"/><path d=\"M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z\"/></symbol>\n            <symbol id=\"i-bolt\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M13 2.5L4.5 13.5H11l-1 8 8.5-11H12z\"/></symbol>\n            <symbol id=\"i-mail\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"3\"/><path d=\"M4 7.5l8 6 8-6\"/></symbol>\n            <symbol id=\"i-chart\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 20V10M10 20V4M16 20v-7M21 20H3\"/></symbol>\n            <symbol id=\"i-form\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"4\" y=\"3.5\" width=\"16\" height=\"17\" rx=\"3\"/><path d=\"M8 8.5h8M8 12.5h8M8 16.5h4\"/></symbol>\n            <symbol id=\"i-sheet\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3.5\" y=\"3.5\" width=\"17\" height=\"17\" rx=\"3\"/><path d=\"M3.5 9.5h17M3.5 15h17M10 3.5v17\"/></symbol>\n            <symbol id=\"i-cal\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3.5\" y=\"5\" width=\"17\" height=\"15.5\" rx=\"3\"/><path d=\"M3.5 10h17M8 3v4M16 3v4\"/></symbol>\n            <symbol id=\"i-shop\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 9.5l1.5-5h13l1.5 5M4 9.5v10h16v-10M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M10 19.5v-5h4v5\"/></symbol>\n            <symbol id=\"i-heart\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z\"/><path d=\"M8.5 12.5h2l1-2 1.5 4 1-2h1.5\"/></symbol>\n            <symbol id=\"i-user\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4.5 20.5a7.5 7.5 0 0 1 15 0\"/></symbol>\n        </defs>\n    </svg>\n";

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.PP = { reduceMotion: reduceMotion };

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    function submitToGoogle(data) {
        var params = new URLSearchParams();
        Object.keys(data).forEach(function (k) { params.append(k, data[k]); });
        params.append('timestamp', new Date().toISOString());
        return fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: params });
    }
    window.PP.submitToGoogle = submitToGoogle;

    /* ---- older pages: swap in the new header and footer ---- */
    function upgradeLegacyChrome() {
        var oldHeader = document.querySelector('header.glass-header');
        if (!oldHeader) return;
        document.body.classList.add('legacy-page');
        if (!document.getElementById('i-arrow')) document.body.insertAdjacentHTML('afterbegin', SPRITE_HTML);
        var minimal = !!oldHeader.querySelector('.centered-nav');
        oldHeader.outerHTML = HEADER_HTML;
        if (minimal) {
            var h = document.querySelector('.site-header');
            h.querySelector('.nav-menu').remove();
            h.querySelector('.nav-cta').remove();
        }
        var oldFooter = document.querySelector('body > footer:not(.site-footer)');
        if (oldFooter) oldFooter.outerHTML = FOOTER_HTML;
        document.querySelectorAll('.mobile-overlay').forEach(function (n) { n.remove(); });
        var main = document.querySelector('main');
        if (main && parseInt(getComputedStyle(main).paddingTop, 10) < 120) main.style.paddingTop = '140px';
    }

    /* ---- header: blur when scrolled, tuck away on scroll down ---- */
    function initHeader() {
        var header = document.querySelector('.site-header');
        if (!header) return;
        var last = window.scrollY;
        var bar = document.querySelector('.progress');
        var ticking = false;
        function update() {
            var y = window.scrollY;
            header.classList.toggle('is-stuck', y > 24);
            var menuOpen = document.body.classList.contains('menu-open');
            if (!menuOpen) header.classList.toggle('is-hidden', y > 520 && y > last + 4);
            if (y < last - 4) header.classList.remove('is-hidden');
            last = y;
            if (bar) {
                var max = document.documentElement.scrollHeight - window.innerHeight;
                bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
            }
            ticking = false;
        }
        window.addEventListener('scroll', function () {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });
        update();

        // current page marker
        var path = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
        header.querySelectorAll('.nav-menu a').forEach(function (a) {
            var href = a.getAttribute('href');
            if (href.indexOf('#') === -1 && href !== '/' && path.indexOf(href) === 0) a.setAttribute('aria-current', 'page');
        });

        // "Free audit" jumps to the form on this page when there is one
        if (document.getElementById('audit')) {
            document.querySelectorAll('a[href="/#audit"]').forEach(function (a) { a.setAttribute('href', '#audit'); });
        }

        // mobile menu
        var toggle = header.querySelector('.nav-toggle');
        var menu = header.querySelector('.nav-menu');
        if (!toggle || !menu) return;
        function setOpen(open) {
            menu.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            document.body.classList.toggle('menu-open', open);
        }
        toggle.addEventListener('click', function () { setOpen(!menu.classList.contains('is-open')); });
        menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    }

    /* ---- lead form: email first, then the short audit chat ---- */
    function initLeadForms() {
        document.querySelectorAll('.js-lead-form, #lead-form-step-1').forEach(function (form) {
            if (form.dataset.bound) return;
            form.dataset.bound = '1';
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var input = form.querySelector('input[type="email"]');
                var email = (input.value || '').trim();
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
                    input.focus();
                    input.setAttribute('aria-invalid', 'true');
                    var row = form.querySelector('.field-row');
                    if (row && row.animate && !reduceMotion) row.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(0)' }], { duration: 280 });
                    return;
                }
                var hp = form.querySelector('[name="hp_field"]');
                var btn = form.querySelector('button[type="submit"]');
                if (btn) { btn.disabled = true; btn.firstChild.textContent = 'One moment... '; }
                var data = { email: email };
                try { localStorage.setItem('poppypages_lead', JSON.stringify(data)); } catch (err) { /* private mode */ }
                var go = function () { window.location.href = '/chat?email=' + encodeURIComponent(email); };
                if (hp && hp.value) { go(); return; } // bots fill the hidden field; skip the save
                var done = false;
                var finish = function () { if (!done) { done = true; go(); } };
                submitToGoogle({ email: email, action: 'submitLead', partial: true, source: 'site-2026' }).then(finish, finish);
                setTimeout(finish, 1800);
            });
        });
    }

    /* ---- older multi-step audit form (kept working if a page still uses it) ---- */
    function initLegacyStepForm() {
        var form = document.getElementById('lead-form-step-2');
        if (!form) return;
        var steps = form.querySelectorAll('.form-step');
        var nextBtn = document.getElementById('next-btn');
        var prevBtn = document.getElementById('prev-btn');
        var submitBtn = document.getElementById('submit-btn');
        var bar = document.getElementById('progress-bar');
        if (!steps.length || !nextBtn || !prevBtn || !submitBtn) return;
        var current = 0;
        var map = [15, 35, 55, 70, 82, 92, 100];
        var stored = function () { try { return JSON.parse(localStorage.getItem('poppypages_lead') || '{}'); } catch (e) { return {}; } };
        var values = function () { var o = {}; new FormData(form).forEach(function (v, k) { o[k] = v; }); return o; };
        function show() {
            steps.forEach(function (s, i) { s.classList.toggle('active', i === current); });
            if (bar) bar.style.width = (map[current] || 100) + '%';
            prevBtn.style.display = current === 0 ? 'none' : 'block';
            var last = current === steps.length - 1;
            nextBtn.style.display = last ? 'none' : 'block';
            submitBtn.style.display = last ? 'block' : 'none';
            var first = steps[current].querySelector('input, select');
            if (first) first.focus();
        }
        function next() {
            var ok = true;
            steps[current].querySelectorAll('input, select').forEach(function (el) { if (el.required && !el.value) { el.reportValidity(); ok = false; } });
            if (!ok) return;
            submitToGoogle(Object.assign({}, stored(), values(), { action: 'submitLead', partial: true, currentStep: current + 1 })).catch(function () { /* a failed save must not block the next step */ });
            if (current < steps.length - 1) { current++; show(); }
        }
        nextBtn.addEventListener('click', next);
        prevBtn.addEventListener('click', function () { if (current > 0) { current--; show(); } });
        form.addEventListener('keypress', function (e) {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (current < steps.length - 1) next(); else form.requestSubmit();
        });
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            submitBtn.disabled = true;
            var go = function () { try { localStorage.removeItem('poppypages_lead'); } catch (err) { /* ignore */ } window.location.href = '/thank-u'; };
            submitToGoogle(Object.assign({}, stored(), values(), { action: 'submitLead', partial: false })).then(go, go);
        });
        show();
    }

    /* ---- pointer glow on cards and demo windows ---- */
    function initSpotlight() {
        if (!window.matchMedia('(hover: hover)').matches) return;
        document.addEventListener('pointermove', function (e) {
            var el = e.target.closest ? e.target.closest('.card, .win') : null;
            if (!el) return;
            var r = el.getBoundingClientRect();
            el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        }, { passive: true });
    }

    /* ---- gentle reveal for inner pages (content is visible without it) ---- */
    function initReveals() {
        if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;
        gsap.registerPlugin(ScrollTrigger);
        gsap.utils.toArray('[data-reveal]').forEach(function (el) {
            var kids = el.hasAttribute('data-reveal-kids') ? [].slice.call(el.children) : [el];
            // cards have their own hover transition on transform; park it while the reveal runs
            gsap.set(kids, { transition: 'none' });
            gsap.fromTo(kids, { y: 36, opacity: 0 }, {
                y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.09, clearProps: 'transform,opacity,transition',
                scrollTrigger: { trigger: el, start: 'top 88%', once: true }
            });
        });
        var heroBits = document.querySelectorAll('.page-hero .wrap > *');
        if (heroBits.length) gsap.from(heroBits, { y: 30, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.05 });
        if (!document.body.classList.contains('home')) {
            gsap.utils.toArray('.section-head').forEach(function (h) {
                gsap.from(h.children, { y: 34, opacity: 0, duration: 0.95, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: h, start: 'top 86%', once: true } });
            });
        }
        // the closing poppy opens as the card scrolls in
        if (document.querySelector('.cta-card')) {
            gsap.from('.cta-petals i', { scale: 0.2, opacity: 0, rotation: '-=50', transformOrigin: '50% 100%', ease: 'none', stagger: 0.08, scrollTrigger: { trigger: '.cta-card', start: 'top 92%', end: 'top 30%', scrub: 0.8 } });
            gsap.from('.cta-card > *:not(.cta-petals)', { y: 34, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09, scrollTrigger: { trigger: '.cta-card', start: 'top 78%', once: true } });
        }
        if (document.querySelector('.foot-word')) {
            gsap.from('.foot-word', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.foot-word', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 } });
        }
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
        window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    }

    /* ---- smooth open/close for FAQ items ---- */
    function initFaq() {
        if (reduceMotion) return;
        document.querySelectorAll('.faq-list details').forEach(function (d) {
            var summary = d.querySelector('summary');
            var answer = d.querySelector('.answer');
            if (!summary || !answer || !answer.animate) return;
            summary.addEventListener('click', function (e) {
                e.preventDefault();
                if (d.open) {
                    var h = answer.offsetHeight;
                    var a = answer.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 260, easing: 'ease' });
                    answer.style.overflow = 'hidden';
                    a.onfinish = function () { d.open = false; answer.style.overflow = ''; };
                } else {
                    d.open = true;
                    var full = answer.offsetHeight;
                    answer.style.overflow = 'hidden';
                    var b = answer.animate([{ height: '0px', opacity: 0 }, { height: full + 'px', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
                    b.onfinish = function () { answer.style.overflow = ''; };
                }
            });
        });
    }

    ready(function () {
        upgradeLegacyChrome();
        initHeader();
        initLeadForms();
        initLegacyStepForm();
        initSpotlight();
        initFaq();
        initReveals();
    });
})();
