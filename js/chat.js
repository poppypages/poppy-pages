/* PoppyPages Marketing · free audit chat
   Same fields and the same Google Sheet endpoint as the previous chat page.
   Every answer is saved as it comes in, then the visitor lands on /thank-u. */
(function () {
    'use strict';

    var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwYXJZzSzcgFy-GAxiCqYzfvll0znjVX3QzoaFgnmXgxPomCClbxHj0La-YdNPseAIJJw/exec';
    var NEXT_PAGE = '/thank-u';

    var state = { name: '', businessName: '', niche: '', goal: '', problem: '', postFrequency: '', revenueRaw: '', revenueParsed: 0, budgetRaw: '', budgetParsed: 0, phone: '', email: '' };

    var win = document.getElementById('chat-window');
    var form = document.getElementById('chat-form');
    var input = document.getElementById('chat-text');
    var bar = document.getElementById('chat-bar');
    var pct = document.getElementById('chat-pct');
    var stepLabel = document.getElementById('chat-step');
    if (!win || !form || !input) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    // the email comes from the form on the previous page
    try {
        var fromUrl = new URLSearchParams(window.location.search).get('email');
        if (fromUrl && EMAIL.test(fromUrl.trim())) state.email = fromUrl.trim();
        if (!state.email) {
            var saved = JSON.parse(localStorage.getItem('poppypages_lead') || '{}');
            if (saved.email && EMAIL.test(saved.email)) state.email = saved.email;
        }
    } catch (e) { /* no stored lead */ }

    function sync() {
        var params = new URLSearchParams();
        Object.keys(state).forEach(function (k) { params.append(k, state[k]); });
        params.append('timestamp', new Date().toISOString());
        params.append('source', 'chat-flow');
        return fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: params }).catch(function () { /* keep the chat moving */ });
    }

    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); };
    function toBottom() { win.scrollTop = win.scrollHeight; }

    function bubble(who, text) {
        var row = document.createElement('div');
        row.className = 'msg ' + who;
        if (who === 'bot') {
            var ava = document.createElement('img');
            ava.className = 'ava'; ava.src = '/assets/poppy-mark.webp'; ava.alt = ''; ava.width = 32; ava.height = 32;
            row.appendChild(ava);
        }
        var b = document.createElement('div');
        b.className = 'bubble';
        b.textContent = text;
        row.appendChild(b);
        win.appendChild(row);
        toBottom();
        return b;
    }
    function bot(text) {
        var b = bubble('bot', '');
        b.classList.add('is-typing');
        b.innerHTML = '<span class="dots-typing"><i></i><i></i><i></i></span>';
        return wait(Math.min(1100, 380 + text.length * 9)).then(function () {
            b.classList.remove('is-typing');
            b.textContent = text;
            toBottom();
        });
    }
    function setProgress(done, total) {
        var p = Math.round(done / total * 100);
        if (bar) bar.style.width = Math.max(6, p) + '%';
        if (pct) pct.textContent = p + '%';
        if (stepLabel) stepLabel.textContent = done >= total ? 'All done' : 'Question ' + (done + 1) + ' of ' + total;
    }

    // ask with buttons; resolves with the picked option
    function choose(options) {
        return new Promise(function (resolve) {
            form.hidden = true;
            var group = document.createElement('div');
            group.className = 'quick'; group.setAttribute('role', 'group'); group.setAttribute('aria-label', 'Pick an answer');
            options.forEach(function (opt) {
                var label = typeof opt === 'string' ? opt : opt.label;
                var btn = document.createElement('button');
                btn.type = 'button'; btn.textContent = label;
                btn.addEventListener('click', function () { group.remove(); bubble('user', label); resolve(opt); });
                group.appendChild(btn);
            });
            win.appendChild(group);
            toBottom();
            var first = group.querySelector('button');
            if (first && !('ontouchstart' in window)) first.focus({ preventScroll: true });
        });
    }
    // ask with the text box; resolves with the typed answer ('' when skipped)
    function typeAnswer(opts) {
        return new Promise(function (resolve) {
            form.hidden = false;
            input.value = '';
            input.type = opts.type || 'text';
            input.placeholder = opts.placeholder || 'Type your answer';
            input.setAttribute('autocomplete', opts.autocomplete || 'off');
            input.setAttribute('inputmode', opts.inputmode || 'text');
            input.removeAttribute('aria-invalid');
            if (!('ontouchstart' in window)) input.focus({ preventScroll: true });
            requestAnimationFrame(toBottom);
            var skip = null;
            if (opts.optional) {
                skip = document.createElement('div');
                skip.className = 'quick';
                var sb = document.createElement('button');
                sb.type = 'button'; sb.textContent = 'Skip';
                sb.addEventListener('click', function () { cleanup(); bubble('user', 'Skip'); resolve(''); });
                skip.appendChild(sb); win.appendChild(skip); toBottom();
            }
            function cleanup() { form.removeEventListener('submit', onSubmit); form.hidden = true; if (skip) skip.remove(); }
            function onSubmit(e) {
                e.preventDefault();
                var v = input.value.trim();
                if (!v || (opts.test && !opts.test(v))) {
                    input.setAttribute('aria-invalid', 'true');
                    input.focus();
                    if (form.animate && !reduce) form.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 });
                    return;
                }
                cleanup(); bubble('user', v); resolve(v);
            }
            form.addEventListener('submit', onSubmit);
        });
    }

    var questions = [
        { ask: function () { return 'Great. What is your first name?'; },
          get: function () { return typeAnswer({ placeholder: 'Your first name', autocomplete: 'given-name' }); },
          save: function (v) { state.name = v; } },
        { ask: function () { return 'Nice to meet you, ' + first() + '. What is the name of your business?'; },
          get: function () { return typeAnswer({ placeholder: 'Business name', autocomplete: 'organization' }); },
          save: function (v) { state.businessName = v; } },
        { ask: function () { return 'Got it. What kind of business is it?'; },
          get: function () { return typeAnswer({ placeholder: 'Dental office, HVAC, coaching...' }); },
          save: function (v) { state.niche = v; } },
        { ask: function () { return 'What is your #1 marketing goal right now?'; },
          get: function () { return choose(['More leads', 'Better brand awareness', 'Look more professional', 'Not sure yet']); },
          save: function (v) { state.goal = v; } },
        { ask: function () { return 'Makes sense. What gets in the way the most?'; },
          get: function () { return choose(['No time', "Don't know what to post", 'Inconsistent', 'Not getting results']); },
          save: function (v) { state.problem = v; } },
        { ask: function () { return 'How often do you post on social media now?'; },
          get: function () { return choose(['Every day', 'A few times a week', 'Rarely', 'Never']); },
          save: function (v) { state.postFrequency = v; } },
        { ask: function () { return 'About how much does the business bring in each month? A rough range is fine.'; },
          get: function () { return choose([{ label: 'Under $10k', n: 5000 }, { label: '$10k to $50k', n: 30000 }, { label: '$50k to $100k', n: 75000 }, { label: 'Over $100k', n: 150000 }, { label: 'Rather not say', n: 0 }]); },
          save: function (v) { state.revenueRaw = v.label; state.revenueParsed = v.n; } },
        { ask: function () { return 'What could you put toward marketing each month?'; },
          get: function () { return choose([{ label: 'Under $500', n: 250 }, { label: '$500 to $1,500', n: 1000 }, { label: '$1,500 to $3,000', n: 2250 }, { label: '$3,000 or more', n: 3000 }, { label: 'Not sure yet', n: 0 }]); },
          save: function (v) { state.budgetRaw = v.label; state.budgetParsed = v.n; } },
        { ask: function () { return 'Last one. What is the best phone number in case we have a quick question? You can skip this.'; },
          get: function () { return typeAnswer({ type: 'tel', placeholder: 'Phone number', autocomplete: 'tel', inputmode: 'tel', optional: true, test: function (v) { return v.replace(/\D/g, '').length >= 7; } }); },
          save: function (v) { state.phone = v; } }
    ];
    function first() { return (state.name.split(' ')[0] || 'friend').slice(0, 40); }

    function run() {
        var total = questions.length;
        var i = 0;
        setProgress(0, total);
        if (stepLabel) stepLabel.textContent = 'Free audit';
        var p = bot('Hi! Thanks for asking for your free audit.');
        if (!state.email) {
            p = p.then(function () { return bot('First, what is the best email to send it to?'); })
                 .then(function () { return typeAnswer({ type: 'email', placeholder: 'you@business.com', autocomplete: 'email', inputmode: 'email', test: function (v) { return EMAIL.test(v); } }); })
                 .then(function (v) { state.email = v; try { localStorage.setItem('poppypages_lead', JSON.stringify({ email: v })); } catch (e) { /* private mode */ } });
        }
        p = p.then(function () { return bot('I have ' + total + ' quick questions so it fits your business. It takes about 60 seconds. Ready?'); })
             .then(function () { sync(); return choose(["Let's go"]); });
        function next() {
            if (i >= total) return finish();
            var q = questions[i];
            setProgress(i, total);
            return bot(q.ask()).then(q.get).then(function (v) { q.save(v); sync(); i++; return next(); });
        }
        function finish() {
            setProgress(total, total);
            var skipNote = document.querySelector('.chat-skip');
            if (skipNote) skipNote.hidden = true;
            return bot('That is everything, ' + first() + '. Thank you!')
                .then(function () { return bot('We are putting your audit together now. One more step is coming up.'); })
                .then(function () { return Promise.race([sync(), wait(1500)]); })
                .then(function () { return wait(900); })
                .then(function () { try { localStorage.removeItem('poppypages_lead'); } catch (e) { /* ignore */ } window.location.href = NEXT_PAGE; });
        }
        p.then(next);
    }

    run();
})();
