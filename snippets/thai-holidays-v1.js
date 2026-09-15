(function () {
  'use strict';
  // Verified year overrides take precedence over calculated recurring holidays.
  // Sources and the scope of special holidays: docs/thai-holidays-2569.md.
  var year = 2026, key = 'rb_show_thai_holidays_v1', enabled = true;
  var rows = [
    ['01-01', 'วันขึ้นปีใหม่', 'spark'],
    ['01-02', 'วันหยุดราชการพิเศษ', 'spark'],
    ['03-03', 'วันมาฆบูชา', 'lotus'],
    ['04-06', 'วันจักรี', 'temple'],
    ['04-13', 'วันสงกรานต์', 'water'],
    ['04-14', 'วันสงกรานต์', 'water'],
    ['04-15', 'วันสงกรานต์', 'water'],
    ['05-04', 'วันฉัตรมงคล', 'temple'],
    ['05-13', 'วันพืชมงคล', 'rice'],
    ['05-31', 'วันวิสาขบูชา', 'lotus'],
    ['06-01', 'ชดเชยวันวิสาขบูชา', 'lotus'],
    ['06-03', 'วันเฉลิมพระชนมพรรษา\nพระราชินี', 'temple'],
    ['07-28', 'วันเฉลิมพระชนมพรรษา\nรัชกาลที่ 10', 'temple'],
    ['07-29', 'วันอาสาฬหบูชา', 'lotus'],
    ['07-30', 'วันเข้าพรรษา', 'lotus'],
    ['08-12', 'วันแม่แห่งชาติ', 'flower'],
    ['10-13', 'วันนวมินทรมหาราช', 'temple'],
    ['10-16', 'วันหยุดราชการพิเศษ\nเฉพาะกรุงเทพฯ', 'temple', 'bangkok'],
    ['10-23', 'วันปิยมหาราช', 'temple'],
    ['12-05', 'วันพ่อแห่งชาติ / วันชาติ', 'flower'],
    ['12-07', 'ชดเชยวันพ่อแห่งชาติ\nและวันชาติ', 'flower'],
    ['12-10', 'วันรัฐธรรมนูญ', 'book'],
    ['12-31', 'วันสิ้นปี', 'spark']
  ];
  var icons = {
    temple: '<path d="M32 3v9m-5 4 5-7 5 7M23 23l9-11 9 11M19 31l13-15 13 15M14 37l18-17 18 17-6-1v19H20V36l-6 1ZM27 55V39l5-5 5 5v16M6 57h52M8 53V41l6-8 6 8m24 0 6-8 6 8v12M10 47h5m34 0h5M13 33v-8m37 8v-8M23 42v9m18-9v9"/>',
    water: '<ellipse cx="28" cy="36" rx="21" ry="5"/><path d="M7 36c2 14 9 20 21 20s19-6 21-20M13 45l4 5m4-5 4 7m5-7 3 7m5-7 4 5M20 59h16M24 28l14-13m-4 14 13-6M20 24l-1-8m22-6 3-5m7 14 7-1"/><path d="M50 47c-7-6-10 1-5 4-7 3-1 10 4 5 3 7 10 1 6-3 8-2 3-10-2-7 1-7-7-7-6-1"/>',
    lotus: '<path d="M32 9c-13 12-13 24 0 37 13-13 13-25 0-37ZM32 46C12 47 7 34 8 22c12 1 20 7 24 24ZM32 46c20 1 25-12 24-24-12 1-20 7-24 24ZM14 54h36M20 58h24"/>',
    rice: '<path d="M30 58V18M30 26c-12 0-14-7-14-12 10 0 14 6 14 12ZM30 39c-13 0-16-7-16-12 11 0 16 6 16 12ZM30 26c12 0 14-7 14-12-10 0-14 6-14 12ZM30 39c13 0 16-7 16-12-11 0-16 6-16 12ZM30 51c12 0 15-7 15-12-11 0-15 6-15 12M30 51c-12 0-15-7-15-12 11 0 15 6 15 12M30 7v7"/>',
    flower: '<path d="M32 25c-17-20-25 1-12 9-17 7-2 24 10 13 6 18 24 3 15-8 20-4 9-24-5-18 3-18-18-18-16-1"/><circle cx="32" cy="34" r="6"/><path d="M32 47v12"/>',
    book: '<path d="M32 19c-8-6-16-7-25-5v34c10-2 17 0 25 5 8-5 15-7 25-5V14c-9-2-17-1-25 5v34M14 23l11 3m-11 6 11 3m14-9 11-3m-11 12 11-3"/>',
    spark: '<path d="m32 7 4 14 14 4-14 4-4 14-4-14-14-4 14-4 4-14Zm-18 34 2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7Zm36-8 2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7Z"/>'
  };
  try { enabled = localStorage.getItem(key) !== '0'; } catch (_) {}
  function holiday(y, m, d) {
    if (Number(y) !== year) {
      if(!window.rbThaiHolidayCalendar)return null;
      var target=String(y)+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      var matches=window.rbThaiHolidayCalendar.forYear(y).filter(function(r){return r.date===target});
      return matches.length?Object.assign({},matches[0],{name:matches.map(function(r){return r.name}).join('\n/ ')}):null;
    }
    var date = String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    var row = rows.find(function (r) { return r[0] === date; });
    return row ? { name: row[1], icon: row[2], scope: row[3] || 'national' } : null;
  }
  function shell(body) {
    if (document.getElementById('lv-holiday-controls')) return;
    var controls = document.createElement('div');
    controls.id = 'lv-holiday-controls';
    controls.innerHTML = '<label><input type="checkbox" id="lv-holiday-toggle"> แสดงวันหยุดราชการ</label><details class="lvw-holiday-info"><summary aria-label="ปีและข้อมูลวันหยุด" title="เลือกปีและดูข้อมูลวันหยุด">ⓘ</summary><div class="lvw-holiday-info-panel"><label class="lv-holiday-year-label">ปี พ.ศ. <input type="number" id="lv-holiday-year" min="2143" max="10541" step="1" aria-label="ปีปฏิทิน พ.ศ."></label><span id="lv-holiday-note"></span></div></details>';
    var cal = body.closest('.lv-cal') || body;
    var toolbar=document.getElementById('lvw-calendar-toolbar');if(toolbar)toolbar.appendChild(controls);else cal.parentNode.insertBefore(controls, cal);
    var toggle = controls.querySelector('input');
    toggle.checked = enabled;
    controls.querySelector('#lv-holiday-year').addEventListener('change',function(e){
      var value=Number(e.target.value),ce=value-543;
      if(!Number.isInteger(ce)||ce<1600||ce>9998){e.target.value=window.LV_CUR.y+543;return}
      window.LV_CUR.y=ce;
      if(typeof window.lvRender==='function')window.lvRender();else render();
    });
    toggle.addEventListener('change', function () {
      enabled = toggle.checked;
      try { localStorage.setItem(key, enabled ? '1' : '0'); } catch (_) {}
      render();
    });
  }
  function render() {
    var body = document.getElementById('lv-cal-body'), cur = window.LV_CUR;
    if (!body || !cur) return;
    shell(body);
    var note = document.getElementById('lv-holiday-note');
    document.getElementById('lv-holiday-year').value=Number(cur.y)+543;
    note.textContent = Number(cur.y) === year ? 'อ้างอิงปฏิทินไทย 2569 · วันหยุดทีมตามตารางเดิม' : 'ปฏิทินไทย '+(Number(cur.y)+543)+' · คำนวณวันหยุดประจำปีและชดเชย · วันพืชมงคล / วันหยุดพิเศษรอข้อมูลประกาศ';
    body.querySelectorAll('.lv-holiday-mark').forEach(function (el) { el.remove(); });
    body.querySelectorAll('.lv-has-holiday').forEach(function (el) { el.classList.remove('lv-has-holiday'); });
    if (!enabled) return;
    body.querySelectorAll('.lv-day:not(.lv-day-other)').forEach(function (cell, i) {
      var item = holiday(cur.y, cur.m, i + 1);
      if (!item) return;
      cell.classList.add('lv-has-holiday');
      var mark = document.createElement('div');
      mark.className = 'lv-holiday-mark';
      mark.dataset.holidayDate = cur.y + '-' + String(cur.m).padStart(2, '0') + '-' + String(i + 1).padStart(2, '0');
      mark.title = item.name.replace(/\n/g, ' ') + (item.calculated?' · วันที่คำนวณตามปฏิทิน กรุณาอิงประกาศของปีนั้น':item.scope === 'bangkok' ? ' · เฉพาะหน่วยงานราชการในกรุงเทพมหานคร' : ' · วันหยุดตามปฏิทินราชการ');
      mark.innerHTML = '<svg aria-hidden="true" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">' + icons[item.icon] + '</svg><span></span>';
      mark.querySelector('span').textContent = item.name;
      cell.appendChild(mark);
    });
  }
  window.rbThaiHolidays = Object.freeze({ render: render, get: holiday, year: year });
  window.addEventListener('storage', function (e) {
    if (e.key === key || e.key === null) {
      try { enabled = localStorage.getItem(key) !== '0'; } catch (_) {}
      var toggle = document.getElementById('lv-holiday-toggle');
      if (toggle) toggle.checked = enabled;
      render();
    }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
