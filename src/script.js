/* PoppyPages Marketing · shared site script (every page loads this) */
(function () {
    'use strict';

    // Lead capture endpoint (unchanged from the previous site).
    var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzg5p1Yh7RhuhY8VEJyzgbBEQW73F5C8csxZqqIJ_DqWexlH44jkpjc-Vk_gTvYwPPY9g/exec';

    var HEADER_HTML = "__HEADER__";
    var FOOTER_HTML = "__FOOTER__";
    var SPRITE_HTML = "__SPRITE__";

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
