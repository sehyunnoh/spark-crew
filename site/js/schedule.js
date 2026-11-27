(function () {
  'use strict';
  var pick = document.querySelector('.sched .pick');
  if (!pick) return;
  var cur = '73678';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function get() { try { return localStorage.getItem('sc-team') || ''; } catch (e) { return ''; } }
  function put(v) { try { localStorage.setItem('sc-team', v); } catch (e) {} }

  fetch('schedule.json').then(function (r) { return r.json(); }).then(function (S) {
    document.getElementById('agenda').innerHTML = S.agenda.map(function (a) {
      return '<div class="ar"><b>' + esc(a.time) + '</b><span>' + esc(a.title) + (a.place ? '<small>' + esc(a.place) + '</small>' : '') + '</span></div>';
    }).join('');

    function table(id, head, rows) {
      var t = '<thead><tr><th>시간</th>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>';
      rows.forEach(function (r) {
        t += '<tr><th>' + esc(r.time) + '</th>' + head.map(function (_, i) {
          var v = r.teams[i] || '';
          return '<td data-t="' + esc(v) + '">' + esc(v) + '</td>';
        }).join('') + '</tr>';
      });
      document.getElementById(id).innerHTML = t + '</tbody>';
    }
    table('judging', S.judging.rooms, S.judging.rows);
    table('robot', S.robot.tables, S.robot.rows);

    function apply() {
      var t = cur, box = document.getElementById('mine');
      Array.prototype.forEach.call(document.querySelectorAll('.sched td'), function (td) {
        td.classList.toggle('hit', !!t && td.getAttribute('data-t') === t);
      });
      if (!t) { box.hidden = true; return; }
      var items = [];
      S.judging.rows.forEach(function (r) { var i = r.teams.indexOf(t); if (i > -1) items.push(['심사', r.time, S.judging.rooms[i]]); });
      S.robot.rows.forEach(function (r) { var i = r.teams.indexOf(t); if (i > -1) items.push(['로봇 게임', r.time, S.robot.tables[i]]); });
      box.innerHTML = '<h3 class="sh">팀 ' + esc(t) + ' 일정</h3>' + items.map(function (x) {
        return '<div class="ar"><b>' + esc(x[1]) + '</b><span>' + esc(x[0]) + '<small>' + esc(x[2]) + '</small></span></div>';
      }).join('');
      box.hidden = false;
    }
    var saved = get();
    if (saved === 'all') cur = '';
    function sync() { Array.prototype.forEach.call(pick.querySelectorAll('button'), function (b) { b.classList.toggle('on', b.getAttribute('data-v') === cur); }); }
    pick.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      cur = b.getAttribute('data-v'); put(cur ? '73678' : 'all'); sync(); apply();
    });
    sync(); apply();
  }).catch(function () {
    document.getElementById('agenda').textContent = '일정을 불러오지 못했어요.';
  });
})();
