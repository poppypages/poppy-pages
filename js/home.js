/* PoppyPages Marketing · homepage scenes
   1 sky shader · 2 bloom engine · 3 hero intro · 4 chaos-to-system scroll scene
   5 live demos · 6 process rail · 7 counters · 8 calculator · 9 section reveals */
(function () {
    'use strict';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasGsap = !!(window.gsap && window.ScrollTrigger);
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    if (hasGsap) gsap.registerPlugin(ScrollTrigger);
    var animate = hasGsap && !reduce;

    /* run a looping timeline only while its element is on screen */
    function whileVisible(el, tl) {
        if (!('IntersectionObserver' in window)) { tl.play(); return; }
        new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) tl.play(); else tl.pause(); });
        }, { threshold: 0.05 }).observe(el);
    }

    /* ================= 1. sky shader ================= */
    function initSky() {
        var canvas = $('#sky');
        if (!canvas || reduce) return;
        var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
        if (!gl) return;
        var vs = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
        var fs = [
            'precision mediump float;',
            'uniform vec2 u_res;uniform float u_time;uniform vec2 u_mouse;',
            'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
            'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
            'return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
            'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}',
            'void main(){',
            'vec2 uv=gl_FragCoord.xy/u_res;vec2 p=uv;p.x*=u_res.x/u_res.y;',
            'float t=u_time*.05;',
            'vec2 q=vec2(fbm(p*1.3+vec2(t,-t*.6)),fbm(p*1.3+vec2(-t*.8,t*.5)+4.2));',
            'float n=fbm(p*1.7+2.4*q+(u_mouse-.5)*.4);',
            'vec3 plum=vec3(.102,.039,.145);vec3 violet=vec3(.34,.15,.47);',
            'vec3 orange=vec3(1.,.416,.075);vec3 rose=vec3(1.,.365,.56);vec3 amber=vec3(1.,.70,.10);',
            'vec3 col=mix(plum,violet,smoothstep(.2,.8,n)*.95);',
            'float warm=smoothstep(.5,1.,n+(uv.x-.5)*.62+(.5-abs(uv.y-.5))*.22);',
            'col=mix(col,orange,pow(warm,1.3)*.5);',
            'col=mix(col,rose,smoothstep(.55,1.,q.x+uv.x*.35)*.26);',
            'col+=amber*pow(warm,3.)*.16;',
            'float v=smoothstep(0.,.34,uv.y)*smoothstep(1.,.72,uv.y);',
            'col=mix(plum,col,.12+.88*v);',
            'gl_FragColor=vec4(col,1.);}'
        ].join('\n');
        function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
        var v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
        if (!v || !f) return;
        var prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
        gl.useProgram(prog);
        var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        var uRes = gl.getUniformLocation(prog, 'u_res'), uTime = gl.getUniformLocation(prog, 'u_time'), uMouse = gl.getUniformLocation(prog, 'u_mouse');
        var mouse = [0.5, 0.5], target = [0.5, 0.5], visible = true, start = performance.now(), lastDraw = 0;
        function resize() {
            var scale = 0.45; // soft gradients do not need full resolution
            var w = Math.max(2, Math.round(canvas.clientWidth * scale)), h = Math.max(2, Math.round(canvas.clientHeight * scale));
            if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
        }
        window.addEventListener('resize', resize);
        window.addEventListener('pointermove', function (e) { target[0] = e.clientX / window.innerWidth; target[1] = 1 - e.clientY / window.innerHeight; }, { passive: true });
        if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(canvas);
        function frame(now) {
            requestAnimationFrame(frame);
            if (!visible || document.hidden || now - lastDraw < 30) return;
            lastDraw = now;
            mouse[0] += (target[0] - mouse[0]) * 0.04; mouse[1] += (target[1] - mouse[1]) * 0.04;
            gl.uniform2f(uRes, canvas.width, canvas.height);
            gl.uniform1f(uTime, (now - start) / 1000 + 20);
            gl.uniform2f(uMouse, mouse[0], mouse[1]);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        resize();
        requestAnimationFrame(function (now) { frame(now); canvas.classList.add('is-live'); });
    }

    /* ================= 2. bloom engine ================= */
    function initEngine() {
        var engine = $('#engine');
        if (!engine) return;
        var NS = 'http://www.w3.org/2000/svg';
        var C = 320;
        var nodes = $$('.node', engine);
        var wiresG = $('.wires', engine), pulsesG = $('.pulses', engine), stamensG = $('.stamens', engine);
        var wires = [];

        nodes.forEach(function (node, i) {
            var x = +node.dataset.x, y = +node.dataset.y;
            node.style.left = (x / 640 * 100) + '%';
            node.style.top = (y / 640 * 100) + '%';
            var dx = C - x, dy = C - y, len = Math.sqrt(dx * dx + dy * dy);
            var ex = C - dx / len * 44, ey = C - dy / len * 44;           // stop at the flower's core
            var mx = (x + ex) / 2, my = (y + ey) / 2;
            var bend = (i % 2 ? 1 : -1) * 38;
            var cx = mx + (-dy / len) * bend, cy = my + (dx / len) * bend;
            var path = document.createElementNS(NS, 'path');
            path.setAttribute('class', 'wire');
            path.setAttribute('d', 'M' + x + ' ' + y + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1));
            wiresG.appendChild(path);
            var dot = document.createElementNS(NS, 'circle');
            dot.setAttribute('class', 'pulse'); dot.setAttribute('r', '5');
            pulsesG.appendChild(dot);
            wires.push({ path: path, dot: dot, node: node, len: path.getTotalLength() });
        });

        for (var s = 0; s < 16; s++) {
            var a = (s / 16) * Math.PI * 2, r = s % 2 ? 27 : 20;
            var c = document.createElementNS(NS, 'circle');
            c.setAttribute('cx', (C + Math.cos(a) * r).toFixed(1)); c.setAttribute('cy', (C + Math.sin(a) * r).toFixed(1));
            c.setAttribute('r', s % 2 ? '2.6' : '2'); c.setAttribute('fill', s % 2 ? '#ffd76a' : '#ffb21a');
            stamensG.appendChild(c);
        }

        if (!animate) return;

        var petalsA = $$('.ring-a .petal', engine), petalsB = $$('.ring-b .petal', engine);
        var origin = { svgOrigin: C + ' ' + C };

        // bloom open
        var intro = gsap.timeline({ delay: 0.25 });
        intro.from($('.engine-glow', engine), { opacity: 0, scale: 0.4, duration: 1.6, ease: 'power2.out', svgOrigin: C + ' ' + C }, 0)
            .from(petalsA, { scale: 0, rotation: -70, opacity: 0, duration: 1.5, ease: 'back.out(1.5)', stagger: 0.09, svgOrigin: C + ' ' + C }, 0.05)
            .from(petalsB, { scale: 0, rotation: 60, opacity: 0, duration: 1.3, ease: 'back.out(1.6)', stagger: 0.07, svgOrigin: C + ' ' + C }, 0.4)
            .from([$('.core', engine), stamensG], { scale: 0, duration: 0.9, ease: 'back.out(2)', svgOrigin: C + ' ' + C }, 0.8)
            .from($$('.orbit', engine), { opacity: 0, scale: 0.6, duration: 1.4, ease: 'power3.out', stagger: 0.12, svgOrigin: C + ' ' + C }, 0.3)
            .from(nodes, { scale: 0.3, opacity: 0, duration: 0.8, ease: 'back.out(1.8)', stagger: 0.09 }, 0.9)
            .from($$('.wire', engine), { opacity: 0, duration: 0.8, stagger: 0.08 }, 1.1)
            .add(idle, 1.5);

        function idle() {
            gsap.to($('.ring-a', engine), Object.assign({ rotation: 360, duration: 150, repeat: -1, ease: 'none' }, origin));
            gsap.to($('.ring-b', engine), Object.assign({ rotation: -360, duration: 110, repeat: -1, ease: 'none' }, origin));
            gsap.to(stamensG, Object.assign({ rotation: 360, duration: 40, repeat: -1, ease: 'none' }, origin));
            gsap.to($('.o1', engine), { rotation: 360, duration: 90, repeat: -1, ease: 'none' });
            gsap.to($('.o2', engine), { rotation: -360, duration: 130, repeat: -1, ease: 'none' });
            gsap.to($('.o3', engine), { rotation: 360, duration: 180, repeat: -1, ease: 'none' });
            petalsA.concat(petalsB).forEach(function (p, i) {
                gsap.to(p, { scaleY: 1.06, scaleX: 0.97, duration: 2.6 + (i % 4) * 0.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.21, svgOrigin: C + ' ' + C });
            });
            nodes.forEach(function (n, i) {
                gsap.to(n, { y: (i % 2 ? -7 : 7), x: (i % 3 ? 4 : -4), duration: 3 + i * 0.37, repeat: -1, yoyo: true, ease: 'sine.inOut' });
            });
            loop.play();
        }

        // the system at work: a signal travels in, the flower flares, a result pops out
        var toasts = $$('.toast', engine), order = [0, 1, 2, 3, 4, 5], step = 0, toastIdx = 0;
        var toastFor = { 0: 0, 1: 1, 2: 3, 3: 2, 4: 2, 5: 4 };
        function fire() {
            var w = wires[order[step % order.length]]; var nodeIdx = order[step % order.length]; step++;
            var prog = { v: 0 };
            w.node.classList.add('is-hit');
            gsap.set(w.dot, { opacity: 1 });
            gsap.to(prog, {
                v: 1, duration: 1.05, ease: 'power1.in',
                onUpdate: function () { var pt = w.path.getPointAtLength(prog.v * w.len); w.dot.setAttribute('cx', pt.x); w.dot.setAttribute('cy', pt.y); },
                onComplete: function () {
                    gsap.set(w.dot, { opacity: 0 });
                    w.node.classList.remove('is-hit');
                    gsap.fromTo($('.bloom', engine), { scale: 1 }, { scale: 1.06, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.out', svgOrigin: C + ' ' + C });
                    gsap.fromTo($('.engine-glow', engine), { opacity: 1 }, { opacity: 0.72, duration: 0.9, ease: 'power2.out' });
                    showToast(toastFor[nodeIdx]);
                }
            });
        }
        function showToast(i) {
            var t = toasts[i]; if (!t) return;
            gsap.killTweensOf(toasts);
            gsap.set(toasts, { opacity: 0 });
            gsap.fromTo(t, { opacity: 0, y: 18, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(2)' });
            gsap.to(t, { opacity: 0, y: -10, duration: 0.4, delay: 1.7, ease: 'power2.in' });
            toastIdx++;
        }
        var loop = gsap.timeline({ repeat: -1, paused: true });
        loop.call(fire).to({}, { duration: 2.4 });
        new IntersectionObserver(function (en) { if (intro.progress() < 1) return; if (en[0].isIntersecting) loop.play(); else loop.pause(); }, { threshold: 0.2 }).observe(engine);

        // lean toward the pointer
        if (window.matchMedia('(hover: hover)').matches) {
            var art = $('.engine-art', engine);
            var rx = gsap.quickTo(art, 'rotationX', { duration: 0.9, ease: 'power3.out' });
            var ry = gsap.quickTo(art, 'rotationY', { duration: 0.9, ease: 'power3.out' });
            gsap.set(art, { transformPerspective: 900 });
            window.addEventListener('pointermove', function (e) {
                var r = engine.getBoundingClientRect();
                if (r.bottom < 0 || r.top > window.innerHeight) return;
                ry(((e.clientX - (r.left + r.width / 2)) / window.innerWidth) * 14);
                rx(-((e.clientY - (r.top + r.height / 2)) / window.innerHeight) * 14);
            }, { passive: true });
        }
    }

    /* ================= 3. hero intro + rotating words ================= */
    function initHero() {
        var words = $$('.rotator span');
        if (animate) {
            var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
            tl.from('.hero h1 .line > span', { yPercent: 115, duration: 1.15, stagger: 0.13 }, 0.1)
              .from('.hero [data-in]', { y: 26, opacity: 0, duration: 0.9, stagger: 0.09, ease: 'power3.out' }, 0.55);
        }
        document.documentElement.classList.remove('pp-loading');
        if (!words.length || reduce) return;
        var i = 0;
        setInterval(function () {
            var cur = words[i]; i = (i + 1) % words.length; var next = words[i];
            if (hasGsap) {
                gsap.to(cur, { yPercent: -110, opacity: 0, duration: 0.5, ease: 'power3.in', onComplete: function () { cur.classList.remove('is-on'); gsap.set(cur, { clearProps: 'all' }); } });
                next.classList.add('is-on');
                gsap.fromTo(next, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.18 });
            } else { cur.classList.remove('is-on'); next.classList.add('is-on'); }
        }, 2300);
    }

    /* ================= 4. chaos to system ================= */
    function initShift() {
        var pin = $('.shift-pin');
        if (!pin) return;
        var tasks = $$('.task', pin), titles = $$('.shift-titles h2', pin);
        var bar = $('.shift-meter .bar i', pin), state = $('.shift-state', pin);
        if (!animate) {
            // no motion: show the "after" state, which is the promise
            tasks.forEach(function (t) { $('.bad', t).style.opacity = 0; $('.good', t).style.opacity = 1; });
            titles[0].style.opacity = 0; titles[1].style.opacity = 1;
            if (bar) bar.style.transform = 'scaleX(1)'; if (state) state.textContent = 'Running';
            return;
        }
        var mm = gsap.matchMedia();
        var mess = [[-70, 34, -9], [58, -26, 7], [-34, 48, 5], [86, 22, -11], [44, -30, 10], [-88, -18, -6], [30, 40, 12], [-52, -34, -8]];

        function build(scale) {
            gsap.set(tasks, { x: function (i) { return mess[i][0] * scale; }, y: function (i) { return mess[i][1] * scale; }, rotation: function (i) { return mess[i][2] * (scale < 1 ? 0.6 : 1); } });
            var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
            tl.to(tasks, { x: 0, y: 0, rotation: 0, duration: 1, stagger: 0.05 }, 0)
              .to($$('.bad', pin), { opacity: 0, duration: 0.35, stagger: 0.05 }, 0.45)
              .to($$('.good', pin), { opacity: 1, duration: 0.35, stagger: 0.05 }, 0.5)
              .to(titles[0], { opacity: 0, y: -18, duration: 0.3 }, 0.4)
              .fromTo(titles[1], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.3 }, 0.62)
              .fromTo(bar, { scaleX: 0.04 }, { scaleX: 1, duration: 1.3, ease: 'none' }, 0)
              .to({}, { duration: 0.25 });
            return tl;
        }
        var tag = $('.shift-head .label', pin);
        function label(self) {
            if (state) state.textContent = self.progress > 0.72 ? 'Running' : self.progress > 0.2 ? 'Building' : 'Off';
            if (tag) tag.textContent = self.progress > 0.5 ? 'The fix' : 'The problem';
        }

        mm.add('(min-width: 901px) and (min-height: 640px)', function () {
            var tl = build(1);
            ScrollTrigger.create({ animation: tl, trigger: pin, start: 'top top', end: '+=140%', pin: true, scrub: 0.7, anticipatePin: 1, onUpdate: label });
        });
        mm.add('(max-width: 900px), (max-height: 639px)', function () {
            var tl = build(0.3);
            ScrollTrigger.create({ animation: tl, trigger: '.shift-stage', start: 'top 82%', end: 'top 18%', scrub: 0.7, onUpdate: label });
        });
    }

    /* ================= 5. live demos ================= */
    function ghost(el, text) {
        el.textContent = '';
        var g = document.createElement('span'); g.className = 'type-ghost'; g.setAttribute('aria-hidden', 'true'); g.textContent = text;
        var live = document.createElement('span'); live.className = 'type-live'; live.textContent = text;
        el.appendChild(g); el.appendChild(live);
        return live;
    }
    function typeInto(el, text, tl, at, perChar) {
        var o = { n: 0 };
        tl.call(function () { el.textContent = ''; el.classList.add('caret'); }, null, at);
        tl.to(o, { n: text.length, duration: text.length * (perChar || 0.028), ease: 'none', onUpdate: function () { el.textContent = text.slice(0, Math.round(o.n)); } }, at);
        tl.call(function () { el.classList.remove('caret'); });
        tl.set(o, { n: 0 });
    }

    function demoCalendar(win) {
        var grid = $('#cal-grid', win); if (!grid) return;
        var plan = { 1: ['#ffb21a', 'IG'], 3: ['#8fb4ff', 'FB'], 5: ['#ffb21a', 'IG'], 8: ['#6fe3b4', 'IN'], 10: ['#ffb21a', 'IG'], 12: ['#ff8fb1', 'G'], 15: ['#8fb4ff', 'FB'], 17: ['#ffb21a', 'IG'], 19: ['#6fe3b4', 'IN'], 22: ['#ffb21a', 'IG'], 24: ['#8fb4ff', 'FB'], 26: ['#ff8fb1', 'G'] };
        var html = '';
        for (var d = 1; d <= 28; d++) html += '<div class="cal-cell"><b>' + d + '</b>' + (plan[d] ? '<u style="--c:' + plan[d][0] + '">' + plan[d][1] + '</u>' : '') + '</div>';
        grid.innerHTML = html;
        var posts = $$('u', grid), badge = $('.badge', win);
        if (!animate) { posts.forEach(function (p) { p.style.opacity = 1; p.style.transform = 'none'; }); return; }
        gsap.set(posts, { opacity: 1, scale: 1 });
        var tl = gsap.timeline({ repeat: -1, paused: true, repeatDelay: 0.4 });
        tl.to({}, { duration: 1.6 })
          .to(posts, { opacity: 0, scale: 0.4, duration: 0.3, stagger: 0.02 })
          .to(badge, { opacity: 0, scale: 0.8, duration: 0.2 }, '<')
          .to(posts, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2.2)', stagger: 0.13 }, '+=0.3')
          .to(badge, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(3)' }, '+=0.15')
          .to({}, { duration: 2.2 });
        whileVisible(win, tl);
    }

    function demoReviews(win) {
        var typed = $('.typed', win), text = typed.dataset.type;
        var card = $('.rev-card', win), reply = $('.rev-reply', win), stamp = $('.rev-stamp', win), go = $('.pill-btn.go', win);
        typed = ghost(typed, text);
        if (!animate) { stamp.style.opacity = 1; return; }
        gsap.set(stamp, { opacity: 1 });
        var tl = gsap.timeline({ repeat: -1, paused: true });
        tl.to({}, { duration: 1.8 })
          .to([card, reply], { opacity: 0, y: 12, duration: 0.3 })
          .set(stamp, { opacity: 0 })
          .call(function () { typed.textContent = ''; })
          .fromTo(card, { opacity: 0, y: 26, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.6)' }, '+=0.3')
          .fromTo(reply, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '+=0.35');
        typeInto(typed, text, tl, '+=0.1', 0.02);
        tl.to(go, { scale: 0.9, duration: 0.12, yoyo: true, repeat: 1 }, '+=0.5')
          .fromTo(stamp, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out' })
          .to({}, { duration: 2.2 });
        whileVisible(win, tl);
    }

    function demoAsk(win) {
        var q = $('.ask-q .typed', win), qText = q.dataset.type;
        var dots = $('.dots-typing', win), ans = $('.ask-text', win), pick = $('.ask-pick', win), src = $$('.ask-src span', win);
        q = ghost(q, qText);
        // split the answer into words so it can stream in
        var parts = [];
        ans.childNodes.forEach(function (n) {
            if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(function (w) { if (w.trim()) { var s = document.createElement('span'); s.textContent = w; parts.push(s); } else if (w) parts.push(document.createTextNode(' ')); });
            else parts.push(n.cloneNode(true));
        });
        ans.textContent = ''; parts.forEach(function (p) { ans.appendChild(p); });
        var words = $$('span, mark', ans);
        dots.style.opacity = 0;
        if (!animate) { pick.style.opacity = 1; src.forEach(function (s) { s.style.opacity = 1; }); return; }
        gsap.set([pick].concat(src), { opacity: 1 });
        var tl = gsap.timeline({ repeat: -1, paused: true });
        tl.to({}, { duration: 2 })
          .to([ans, pick].concat(src), { opacity: 0, duration: 0.3 })
          .set(words, { opacity: 0 }).set(ans, { opacity: 1 });
        typeInto(q, qText, tl, '+=0.2', 0.035);
        tl.set(dots, { opacity: 1 }, '+=0.2')
          .to({}, { duration: 1.1 })
          .set(dots, { opacity: 0 })
          .to(words, { opacity: 1, duration: 0.2, stagger: 0.045 })
          .fromTo(pick, { opacity: 0, y: 16, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.8)' }, '+=0.1')
          .fromTo(src, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.1 }, '-=0.1')
          .to({}, { duration: 2.6 });
        whileVisible(win, tl);
    }

    function demoFlow(win) {
        var steps = $$('.step', win), dot = $('.flow-line i', win), line = $('.flow-line', win), log = $('#flow-log', win);
        var leadsEl = $('#fs-leads', win), timeEl = $('#fs-time', win);
        var names = ['Sarah M.', 'David K.', 'Priya S.', 'Marcus T.', 'Elena R.'];
        var leads = 128, run = 0;
        function stamp(sec) { var s = 14 * 60 + 2 + sec + run * 97; var h = 9 + Math.floor(s / 3600); var m = Math.floor(s / 60) % 60; var ss = s % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss; }
        function lines() {
            var n = names[run % names.length];
            return ['New lead: ' + n + ' <em>(website form)</em>', 'Replied by email and text', 'Added ' + n + ' to your lead sheet', 'Follow-up call booked <em>✓ done</em>'];
        }
        function paint(count) { var l = lines(), html = ''; for (var i = 0; i < count; i++) html += '<div style="opacity:1"><time>' + stamp(i * 3) + '</time><span>' + l[i] + '</span></div>'; log.innerHTML = html; }
        leadsEl.textContent = leads; timeEl.textContent = '2m';
        paint(4); steps.forEach(function (s) { s.classList.add('is-on'); });
        if (!animate) return;
        var tl = gsap.timeline({ repeat: -1, paused: true });
        tl.to({}, { duration: 1.6 })
          .call(function () { run++; log.innerHTML = ''; steps.forEach(function (s) { s.classList.remove('is-on'); }); })
          .set(dot, { opacity: 1, left: '0%' });
        [0, 1, 2, 3].forEach(function (i) {
            tl.to(dot, { left: (i / 3 * 100) + '%', duration: i === 0 ? 0.01 : 0.7, ease: 'power2.inOut' })
              .call(function () {
                  steps[i].classList.add('is-on');
                  var row = document.createElement('div');
                  row.innerHTML = '<time>' + stamp(i * 3) + '</time><span>' + lines()[i] + '</span>';
                  log.appendChild(row);
                  gsap.fromTo(row, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.35 });
              })
              .to({}, { duration: 0.55 });
        });
        tl.set(dot, { opacity: 0 })
          .call(function () { leads++; var o = { v: leads - 1 }; gsap.to(o, { v: leads, duration: 0.4, onUpdate: function () { leadsEl.textContent = Math.round(o.v); } }); gsap.fromTo(leadsEl, { color: '#6fe3b4' }, { color: '#faf4ff', duration: 1.2 }); })
          .to({}, { duration: 1.6 });
        whileVisible(win, tl);
        void line;
    }

    function initDemos() {
        var map = { calendar: demoCalendar, reviews: demoReviews, ask: demoAsk, flow: demoFlow };
        $$('.demo').forEach(function (win) { var fn = map[win.dataset.demo]; if (fn) fn(win); });
    }

    /* ================= 6. process rail ================= */
    function initProcess() {
        var steps = $$('.pstep'), rail = $('.steps-rail i');
        if (!steps.length) return;
        if (!animate) { steps.forEach(function (s) { s.classList.add('is-on'); }); if (rail) rail.style.transform = 'scaleY(1)'; return; }
        gsap.to(rail, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 62%', end: 'bottom 62%', scrub: 0.4 } });
        steps.forEach(function (s) {
            ScrollTrigger.create({ trigger: s, start: 'top 62%', onEnter: function () { s.classList.add('is-on'); }, onLeaveBack: function () { s.classList.remove('is-on'); } });
        });
    }

    /* ================= 7. counters ================= */
    function initCounters() {
        if (!animate) return;
        $$('[data-count]').forEach(function (el) {
            var end = +el.dataset.count, suffix = el.dataset.suffix || '';
            if (!end) return;
            var o = { v: 0 };
            ScrollTrigger.create({
                trigger: el, start: 'top 88%', once: true,
                onEnter: function () { gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v) + suffix; } }); }
            });
        });
    }

    /* ================= 8. calculator ================= */
    function initCalc() {
        var hours = $('#calc-hours'), rate = $('#calc-rate');
        if (!hours || !rate) return;
        var out = { total: $('#calc-total'), yh: $('#calc-year-hours'), weeks: $('#calc-weeks'), month: $('#calc-month'), ho: $('#calc-hours-out'), ro: $('#calc-rate-out') };
        var shown = { total: 31200 };
        var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
        function fill(el) { el.style.setProperty('--fill', ((el.value - el.min) / (el.max - el.min) * 100) + '%'); }
        function update() {
            var h = +hours.value, r = +rate.value, yh = h * 52, total = yh * r;
            out.ho.textContent = h + (h === 1 ? ' hr' : ' hrs'); out.ro.textContent = '$' + r;
            out.yh.textContent = yh.toLocaleString('en-US');
            out.weeks.textContent = (yh / 40).toFixed(1);
            out.month.textContent = money(total / 12);
            fill(hours); fill(rate);
            if (hasGsap && !reduce) gsap.to(shown, { total: total, duration: 0.5, ease: 'power2.out', overwrite: true, onUpdate: function () { out.total.textContent = money(shown.total); } });
            else out.total.textContent = money(total);
        }
        hours.addEventListener('input', update); rate.addEventListener('input', update);
        update();
    }

    /* ================= 9. section reveals ================= */
    function initReveals() {
        if (!animate) return;
        $$('.section-head').forEach(function (h) {
            gsap.from(h.children, { y: 34, opacity: 0, duration: 0.95, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: h, start: 'top 86%', once: true } });
        });
        $$('.sys').forEach(function (s) {
            var win = $('.win', s), copy = $('.sys-copy', s);
            gsap.from(copy.children, { y: 28, opacity: 0, duration: 0.85, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: s, start: 'top 80%', once: true } });
            gsap.from(win, { y: 70, opacity: 0, scale: 0.95, rotation: 1.5, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 80%', once: true } });
        });
        [['.process-sticky', null], ['.steps', '.pstep'], ['.stat-stack', '.stat'], ['.faq-list', 'details']].forEach(function (pair) {
            var el = $(pair[0]); if (!el) return;
            var items = pair[1] ? $$(pair[1], el) : [].slice.call(el.children);
            // cards have their own hover transition on transform; park it while the reveal runs
            gsap.set(items, { transition: 'none' });
            gsap.fromTo(items, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.09, clearProps: 'transform,opacity,transition', scrollTrigger: { trigger: el, start: 'top 84%', once: true } });
        });
        gsap.from('.bigquote > *', { y: 36, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.bigquote', start: 'top 82%', once: true } });
        gsap.from('.calc', { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.calc', start: 'top 86%', once: true } });
        gsap.to('.proof-bloom', { rotation: 120, ease: 'none', scrollTrigger: { trigger: '.proof', start: 'top bottom', end: 'bottom top', scrub: 1 } });
        gsap.fromTo('.paper', { scale: 0.94, borderRadius: 90 }, { scale: 1, borderRadius: 48, ease: 'none', scrollTrigger: { trigger: '.paper', start: 'top 96%', end: 'top 40%', scrub: 0.6 } });
        gsap.from('.paper-petals i', { scale: 0, rotation: '-=60', duration: 1.4, ease: 'back.out(1.4)', stagger: 0.12, scrollTrigger: { trigger: '.paper', start: 'top 70%', once: true } });
    }

    function boot() {
        initSky();
        initEngine();
        initHero();
        initShift();
        initDemos();
        initProcess();
        initCounters();
        initCalc();
        initReveals();
        if (hasGsap) {
            if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
            window.addEventListener('load', function () { ScrollTrigger.refresh(); });
        }
    }
    if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
