(function () {
  'use strict';
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  var MAX = 6;
  var tl = document.getElementById('tl');
  var DAYS = [];

  var CAM = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17 10.5V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5l5 4v-11z"/></svg>';
  var TAGCLS = { 'Picnic': 'picnic', '리허설': 'rehearsal' };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(sec) { var m = Math.floor(sec / 60), s = sec % 60; return m + ':' + (s < 10 ? '0' : '') + s; }

  function render(days) {
    var lastKey = null;
    days.forEach(function (day, di) {
      var p = day.date.split('-').map(Number), y = p[0], m = p[1], d = p[2];
      var dow = DOW[new Date(y, m - 1, d).getDay()];
      if (y + '-' + m !== lastKey) {
        var mo = document.createElement('div');
        mo.className = 'month';
        mo.innerHTML = '<span>' + y + '년 ' + m + '월</span>';
        tl.appendChild(mo);
        lastKey = y + '-' + m;
      }
      var photos = day.photos, shown = photos.slice(0, MAX), rest = photos.length - MAX;
      var it = document.createElement('article');
      it.className = 'item';
      var counts = [];
      if (photos.length) counts.push('사진 ' + photos.length);
      if (day.videos.length) counts.push('영상 ' + day.videos.length);
      var html = '<div class="node"></div><div class="dateline"><h3 class="d">' + m + '월 ' + d + '일<small>' + dow +
        '</small></h3><span class="tag ' + (TAGCLS[day.title] || '') + '">' + esc(day.title) + '</span><span class="cnt">' +
        counts.join(' · ') + '</span></div><div class="card">';
      if (photos.length) {
        html += '<div class="grid' + (shown.length === 2 ? ' two' : '') + '">' + shown.map(function (ph, i) {
          var more = (i === MAX - 1 && rest > 0) ? ' class="more" data-more="+' + (rest + 1) + '"' : '';
          return '<a href="' + ph.src + '" data-d="' + di + '" data-i="' + i + '"' + more + '><img loading="lazy" decoding="async" width="' +
            ph.w + '" height="' + ph.h + '" src="' + ph.thumb + '" alt="' + m + '월 ' + d + '일 ' + esc(day.title) + ' 사진 ' + (i + 1) + '"></a>';
        }).join('') + '</div>';
      }
      if (day.videos.length) {
        html += '<div class="vlabel">' + CAM + ' 영상 ' + day.videos.length + '개</div><div class="car">' +
          '<button class="arrow l" aria-label="이전 영상">‹</button><button class="arrow r" aria-label="다음 영상">›</button>' +
          '<div class="track">' + day.videos.map(function (v, i) {
            return '<button class="slide" data-d="' + di + '" data-v="' + i + '" aria-label="영상 ' + (i + 1) + ' 재생"><img loading="lazy" src="' +
              v.poster + '" alt=""><span class="play"></span><span class="cap"><span>영상 ' + (i + 1) + '</span><span>' + fmt(v.duration) + '</span></span></button>';
          }).join('') + '</div><div class="dots">' + day.videos.map(function (_, i) { return '<i class="' + (i ? '' : 'on') + '"></i>'; }).join('') + '</div></div>';
      }
      it.innerHTML = html + '</div>';
      tl.appendChild(it);
    });
    setup();
  }

  function setup() {
    var items = [].slice.call(document.querySelectorAll('.item'));
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('in'); }); }, { threshold: 0.08 });
      items.forEach(function (i) { io.observe(i); });
    } else items.forEach(function (i) { i.classList.add('in'); });

    var fill = document.getElementById('fill'), ticking = false;
    function onScroll() {
      ticking = false;
      var r = tl.getBoundingClientRect(), mark = innerHeight * 0.5;
      fill.style.setProperty('--p', Math.min(100, Math.max(0, (mark - r.top) / r.height * 100)) + '%');
      var a = null;
      items.forEach(function (i) { if (i.getBoundingClientRect().top < mark) a = i; });
      items.forEach(function (i) { i.classList.toggle('active', i === a); });
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();

    document.querySelectorAll('.car').forEach(function (c) {
      var tr = c.querySelector('.track'), dots = [].slice.call(c.querySelectorAll('.dots i'));
      var step = function () { return tr.firstElementChild.getBoundingClientRect().width + 14; };
      c.querySelector('.l').onclick = function () { tr.scrollBy({ left: -step(), behavior: 'smooth' }); };
      c.querySelector('.r').onclick = function () { tr.scrollBy({ left: step(), behavior: 'smooth' }); };
      tr.addEventListener('scroll', function () {
        var i = Math.round(tr.scrollLeft / step());
        dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
      }, { passive: true });
    });
  }

  /* ---- lightbox ---- */
  var lb = document.getElementById('lb'), lbimg = document.getElementById('lbimg'), lbc = document.getElementById('lbc');
  var cd = 0, ci = 0, lastFocus = null;
  function showPhoto() {
    var ph = DAYS[cd].photos;
    ci = (ci + ph.length) % ph.length;
    lbimg.src = ph[ci].src;
    lbimg.alt = DAYS[cd].date + ' 사진 ' + (ci + 1);
    lbc.textContent = (ci + 1) + ' / ' + ph.length;
    var nx = new Image(); nx.src = ph[(ci + 1) % ph.length].src;
  }
  function openLb(d, i) { cd = d; ci = i; lastFocus = document.activeElement; lb.hidden = false; document.body.style.overflow = 'hidden'; showPhoto(); lb.querySelector('.x').focus(); }
  function closeLb() { lb.hidden = true; lbimg.removeAttribute('src'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  lb.querySelector('.x').onclick = closeLb;
  lb.querySelector('.p').onclick = function () { ci--; showPhoto(); };
  lb.querySelector('.n').onclick = function () { ci++; showPhoto(); };
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  var tx = null;
  lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 50) { ci += dx < 0 ? 1 : -1; showPhoto(); }
  }, { passive: true });

  /* ---- video modal ---- */
  var vm = document.getElementById('vm'), vmv = document.getElementById('vmv');
  function openVideo(d, i) {
    lastFocus = document.activeElement;
    vmv.src = DAYS[d].videos[i].src;
    vmv.poster = DAYS[d].videos[i].poster;
    vm.hidden = false; document.body.style.overflow = 'hidden';
    vmv.play().catch(function () {});
  }
  function closeVideo() { vmv.pause(); vmv.removeAttribute('src'); vmv.load(); vm.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  vm.querySelector('.x').onclick = closeVideo;
  vm.addEventListener('click', function (e) { if (e.target === vm) closeVideo(); });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('.grid a');
    if (a) { e.preventDefault(); openLb(+a.dataset.d, +a.dataset.i); return; }
    var s = e.target.closest('.slide');
    if (s) openVideo(+s.dataset.d, +s.dataset.v);
  });
  addEventListener('keydown', function (e) {
    if (!lb.hidden) {
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') { ci--; showPhoto(); }
      else if (e.key === 'ArrowRight') { ci++; showPhoto(); }
    } else if (!vm.hidden && e.key === 'Escape') closeVideo();
  });

  fetch('media.json').then(function (r) { return r.json(); }).then(function (days) { DAYS = days; render(days); })
    .catch(function () { tl.insertAdjacentHTML('beforeend', '<p style="padding:20px">타임라인을 불러오지 못했어요. 새로고침 해 주세요.</p>'); });
})();
