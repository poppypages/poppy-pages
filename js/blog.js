/* PoppyPages Marketing · blog list (reads the same /api/posts feed as before) */
(function () {
    'use strict';
    var box = document.getElementById('posts');
    if (!box) return;

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text) n.textContent = text;
        return n;
    }
    function niceDate(raw) {
        if (!raw) return '';
        var d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw + 'T12:00:00' : raw);
        if (isNaN(d)) return String(raw);
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    function message(title, body) {
        box.textContent = '';
        var card = el('div', 'post-empty');
        card.appendChild(el('h2', '', title));
        card.appendChild(el('p', '', body));
        box.appendChild(card);
        box.setAttribute('aria-busy', 'false');
    }
    function card(post, lead) {
        var a = el('a', 'post-card' + (lead ? ' is-lead' : ''));
        a.href = '/post?slug=' + encodeURIComponent(post.slug);
        var thumb = el('div', 'thumb');
        if (post.thumbnail) {
            var img = document.createElement('img');
            var src = String(post.thumbnail);
            img.src = /^(https?:)?\/\//.test(src) || src.charAt(0) === '/' ? src : '/' + src;
            img.alt = '';
            img.loading = lead ? 'eager' : 'lazy';
            img.onerror = function () { img.remove(); thumb.classList.add('is-empty'); };
            thumb.appendChild(img);
        } else thumb.classList.add('is-empty');
        var body = el('div', 'body');
        var date = niceDate(post.date);
        if (date) { var t = el('time', '', date); t.dateTime = post.date; body.appendChild(t); }
        body.appendChild(el('h2', '', post.title || 'Untitled'));
        var blurb = post.description || post.llm_summary;
        if (blurb) body.appendChild(el('p', '', blurb));
        var more = el('span', 'text-link', 'Read the post');
        body.appendChild(more);
        a.appendChild(thumb); a.appendChild(body);
        return a;
    }

    fetch('/api/posts', { headers: { accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('bad status'); return r.json(); })
        .then(function (posts) {
            if (!Array.isArray(posts) || !posts.length) { message('New posts are on the way.', 'Check back soon, or start with a free audit below.'); return; }
            posts = posts.filter(function (p) { return p && p.slug; }).sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
            box.textContent = '';
            posts.forEach(function (p, i) { box.appendChild(card(p, i === 0)); });
            box.setAttribute('aria-busy', 'false');
            if (window.gsap && window.PP && !window.PP.reduceMotion) {
                gsap.from(box.children, { y: 36, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, clearProps: 'transform,opacity' });
                if (window.ScrollTrigger) ScrollTrigger.refresh();
            }
        })
        .catch(function () { message('We could not load the posts right now.', 'Please refresh the page in a moment. You can also email support@poppypages.com with any question.'); });
})();
