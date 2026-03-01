/* ============================================================
   app.js — Laporan Harian Kerja
   ============================================================ */

// ── Constants ──────────────────────────────────────────────
const STORAGE_KEY_USER = 'lhk_user';
const STORAGE_KEY_DATA = 'lhk_data';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Nama bulan Indonesian
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Indonesian public holidays – expandable
const LIBUR_NASIONAL = [
  '2026-01-01', '2026-01-27', '2026-01-28',
  '2026-03-20', '2026-03-28', '2026-03-29', '2026-03-30', '2026-03-31',
  '2026-04-01', '2026-04-02', '2026-04-17',
  '2026-05-01', '2026-05-26', '2026-05-27',
  '2026-06-01', '2026-06-06',
  '2026-07-10',
  '2026-08-17',
  '2026-09-12',
  '2026-10-09',
  '2026-12-25', '2026-12-26',
];

// ── State ──────────────────────────────────────────────────
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-indexed
let userData = {};
let monthData = {}; // key: "YYYY-M", value: { days: { 1: {type, tasks:[], notes}, ... } }

let editingDay = null; // day number being edited

// ── Load / Save ─────────────────────────────────────────────
function loadAll() {
  userData = JSON.parse(localStorage.getItem(STORAGE_KEY_USER) || '{}');
  monthData = JSON.parse(localStorage.getItem(STORAGE_KEY_DATA) || '{}');
}

function saveAll() {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(monthData));
}

function getMonthKey() {
  return `${currentYear}-${currentMonth}`;
}

function getDayData(day) {
  const key = getMonthKey();
  if (!monthData[key]) monthData[key] = { days: {} };
  if (!monthData[key].days[day]) {
    // Auto-type based on weekday / holiday
    const date = new Date(currentYear, currentMonth, day);
    const isSunday = date.getDay() === 0;
    const iso = toISO(day);
    const isHoliday = LIBUR_NASIONAL.includes(iso);
    monthData[key].days[day] = {
      type: (isSunday || isHoliday) ? 'libur' : 'normal',
      tasks: [],
      notes: ''
    };
  }
  return monthData[key].days[day];
}

function toISO(day) {
  const m = String(currentMonth + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${currentYear}-${m}-${d}`;
}

// ── UI Helpers ──────────────────────────────────────────────
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = isError ? '#ef4444' : '#22c55e';
  t.style.boxShadow = isError ? '0 4px 20px rgba(239,68,68,.4)' : '0 4px 20px rgba(34,197,94,.4)';
  t.classList.remove('hidden');
  t.classList.add('show');
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.classList.add('hidden'), 300);
  }, 2500);
}

// ── Render User Info ─────────────────────────────────────────
function renderUserInfo() {
  document.getElementById('dispNama').textContent = userData.nama || '—';
  document.getElementById('dispJabatan').textContent = userData.jabatan || '—';
  document.getElementById('dispDivisi').textContent = userData.divisi || '—';
  document.getElementById('dispNomor').textContent = userData.nomor || '—';
}

function toggleUserForm(show) {
  document.getElementById('userInfoDisplay').classList.toggle('hidden', show);
  document.getElementById('userInfoForm').classList.toggle('hidden', !show);
  if (show) {
    document.getElementById('inputNama').value = userData.nama || '';
    document.getElementById('inputJabatan').value = userData.jabatan || '';
    document.getElementById('inputDivisi').value = userData.divisi || '';
    document.getElementById('inputNomor').value = userData.nomor || '';
  }
}

// ── Month Navigation ─────────────────────────────────────────
function updateMonthLabel() {
  document.getElementById('monthLabel').textContent = `${BULAN[currentMonth]} ${currentYear}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// ── Render Days ──────────────────────────────────────────────
function renderDays() {
  const list = document.getElementById('daysList');
  list.innerHTML = '';
  const total = getDaysInMonth(currentYear, currentMonth);
  const today = new Date();

  let statKerja = 0, statLembur = 0, statLibur = 0, statIsi = 0;

  for (let day = 1; day <= total; day++) {
    const data = getDayData(day);
    const date = new Date(currentYear, currentMonth, day);
    const hariNama = HARI[date.getDay()];
    const tglStr = `${String(day).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;

    // Stats
    if (data.type === 'normal') statKerja++;
    if (data.type === 'lembur') statLembur++;
    if (data.type === 'libur') statLibur++;
    if (data.tasks.length > 0) statIsi++;

    // Is today?
    const isToday = (
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonth &&
      today.getDate() === day
    );

    const row = document.createElement('div');
    row.className = `day-row type-${data.type}${isToday ? ' today' : ''}`;
    row.dataset.day = day;

    // Tasks snippet (first 2)
    let tasksHTML = `<span class="empty-task">Belum diisi</span>`;
    if (data.tasks.length > 0) {
      tasksHTML = data.tasks.slice(0, 2).map(t =>
        `<span class="task-pill">${escHtml(t)}</span><br/>`
      ).join('');
      if (data.tasks.length > 2) {
        tasksHTML += `<span style="font-size:11px;color:var(--text-faint)">+${data.tasks.length - 2} lainnya</span>`;
      }
    }

    row.innerHTML = `
      <div class="day-col day-col-no">${day}</div>
      <div class="day-col day-col-hari">${hariNama}</div>
      <div class="day-col day-col-tgl">${tglStr}</div>
      <div class="day-col day-col-keterangan">${tasksHTML}</div>
      <div class="day-col day-col-action">
        <button class="btn-day-edit" data-day="${day}" title="Edit hari ini">✏️</button>
      </div>
    `;

    row.addEventListener('click', () => openModal(day));
    list.appendChild(row);
  }

  document.getElementById('statKerja').textContent = statKerja;
  document.getElementById('statLembur').textContent = statLembur;
  document.getElementById('statLibur').textContent = statLibur;
  document.getElementById('statIsi').textContent = statIsi;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Modal ────────────────────────────────────────────────────
function openModal(day) {
  editingDay = day;
  const data = getDayData(day);
  const date = new Date(currentYear, currentMonth, day);
  const hariNama = HARI[date.getDay()];
  const tglStr = `${String(day).padStart(2, '0')} ${BULAN[currentMonth]} ${currentYear}`;

  document.getElementById('modalTitle').textContent = `Hari ke-${day} — ${hariNama}`;
  document.getElementById('modalSubtitle').textContent = tglStr;

  // Type selector
  setActiveType(data.type);

  // Tasks
  renderTaskInputs(data.tasks);

  // Notes
  document.getElementById('inputNotes').value = data.notes || '';

  // Show
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.body.style.overflow = '';
  editingDay = null;
}

function setActiveType(type) {
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
}

function getActiveType() {
  const active = document.querySelector('.type-btn.active');
  return active ? active.dataset.type : 'normal';
}

// ── Task Inputs ──────────────────────────────────────────────
function renderTaskInputs(tasks) {
  const list = document.getElementById('tasksList');
  list.innerHTML = '';
  const arr = tasks.length > 0 ? tasks : [''];
  arr.forEach((t, i) => addTaskInput(t));
}

function addTaskInput(value = '') {
  const list = document.getElementById('tasksList');
  const row = document.createElement('div');
  row.className = 'task-input-row';
  row.innerHTML = `
    <input type="text" placeholder="Contoh: Cetak PCB RoIP" value="${escHtml(value)}" />
    <button class="btn-remove-task" title="Hapus">−</button>
  `;
  row.querySelector('.btn-remove-task').addEventListener('click', () => {
    if (document.querySelectorAll('.task-input-row').length > 1) {
      row.remove();
    } else {
      row.querySelector('input').value = '';
    }
  });
  list.appendChild(row);
  // Focus last input
  setTimeout(() => {
    const inp = row.querySelector('input');
    if (value === '') inp.focus();
  }, 100);
}

function getTaskValues() {
  return Array.from(document.querySelectorAll('.task-input-row input'))
    .map(i => i.value.trim())
    .filter(v => v.length > 0);
}

// ── Save Day ─────────────────────────────────────────────────
function saveDay() {
  if (editingDay === null) return;
  const key = getMonthKey();
  if (!monthData[key]) monthData[key] = { days: {} };

  monthData[key].days[editingDay] = {
    type: getActiveType(),
    tasks: getTaskValues(),
    notes: document.getElementById('inputNotes').value.trim()
  };

  saveAll();
  renderDays();
  closeModal();
  showToast('✅ Laporan berhasil disimpan!');
}

function clearDay() {
  if (editingDay === null) return;
  const key = getMonthKey();
  if (monthData[key] && monthData[key].days[editingDay]) {
    delete monthData[key].days[editingDay];
    saveAll();
  }
  renderDays();
  closeModal();
  showToast('🗑️ Data hari dikosongkan');
}

// ── Mark All Sundays + Holidays as Libur ────────────────────
function markAllHoliday() {
  const total = getDaysInMonth(currentYear, currentMonth);
  const key = getMonthKey();
  if (!monthData[key]) monthData[key] = { days: {} };

  for (let day = 1; day <= total; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const isSunday = date.getDay() === 0;
    const isHoliday = LIBUR_NASIONAL.includes(toISO(day));
    if (isSunday || isHoliday) {
      if (!monthData[key].days[day]) {
        monthData[key].days[day] = { type: 'libur', tasks: [], notes: '' };
      } else {
        monthData[key].days[day].type = 'libur';
      }
    }
  }
  saveAll();
  renderDays();
  showToast('🔴 Semua Minggu & hari libur ditandai!');
}

// ── Excel Export — ExcelJS (matches photo format exactly) ──────
async function exportExcel() {
  if (typeof ExcelJS === 'undefined') {
    showToast('❌ Library ExcelJS belum siap, coba refresh halaman', true);
    return;
  }

  const namaStr = userData.nama || 'Karyawan';
  const jabatanStr = userData.jabatan || '';
  const divisiStr = userData.divisi || '';
  const bulanStr = `${BULAN[currentMonth]} ${currentYear}`;

  const wb = new ExcelJS.Workbook();
  wb.creator = namaStr;
  wb.created = new Date();

  const ws = wb.addWorksheet(`${BULAN[currentMonth]} ${currentYear}`);

  // ── Column widths (A=NO, B=HARI, C=TANGGAL, D=PEKERJAAN, E=KET) ──
  ws.columns = [
    { key: 'no', width: 7 },
    { key: 'hari', width: 11 },
    { key: 'tgl', width: 15 },
    { key: 'ket', width: 55 },
    { key: 'nyetir', width: 28 },
  ];

  // ── Helper: apply border to all 5 cells of a row ──
  function applyBorder(row, style = 'thin') {
    ['A', 'B', 'C', 'D', 'E'].forEach(col => {
      const cell = row.getCell(col);
      cell.border = {
        top: { style },
        left: { style },
        bottom: { style },
        right: { style },
      };
    });
  }

  // ── Helper: fill color entire row ──
  function fillRow(row, argbColor) {
    ['A', 'B', 'C', 'D', 'E'].forEach(col => {
      row.getCell(col).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: argbColor },
      };
    });
  }

  // ══════════════════════════════════════════
  // ROWS 1-3 : LEGEND
  // ══════════════════════════════════════════
  const legendData = [
    { argb: 'FF00B050', label: 'Jam kerja normal' },   // green
    { argb: 'FFFFFF00', label: 'Lembur' },   // yellow
    { argb: 'FFFF0000', label: 'Hari Minggu/Libur' },   // red
  ];

  legendData.forEach(({ argb, label }, i) => {
    const r = ws.getRow(i + 1);
    r.height = 16;

    // Column B = colored swatch
    const swatchCell = r.getCell('B');
    swatchCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
    swatchCell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    };

    // Column C = label text
    r.getCell('C').value = label;
    r.getCell('C').font = { size: 10, name: 'Calibri' };
    r.getCell('C').alignment = { horizontal: 'center', vertical: 'middle' };

    r.commit();
  });

  // ══════════════════════════════════════════
  // ROW 4 : empty spacer
  // ══════════════════════════════════════════
  ws.getRow(4).height = 8;
  ws.getRow(4).commit();

  // ══════════════════════════════════════════
  // ROWS 5-6 : TABLE HEADER (vertically merged)
  // ══════════════════════════════════════════
  const headers = [
    { col: 'A', label: 'NO.' },
    { col: 'B', label: 'HARI' },
    { col: 'C', label: 'TANGGAL' },
    { col: 'D', label: 'KETERANGAN PEKERJAAN' },
    { col: 'E', label: 'Keterangan/ Nyetir' },
  ];

  // Merge rows 5-6 for each column
  ['A', 'B', 'C', 'D', 'E'].forEach(col => {
    ws.mergeCells(`${col}5:${col}6`);
  });

  const hdrStyle = {
    font: { bold: true, size: 11, name: 'Calibri', color: { argb: 'FF000000' } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } },
    border: {
      top: { style: 'medium' },
      left: { style: 'medium' },
      bottom: { style: 'medium' },
      right: { style: 'medium' },
    },
  };

  const hdrRow = ws.getRow(5);
  hdrRow.height = 22;

  headers.forEach(({ col, label }) => {
    const cell = hdrRow.getCell(col);
    cell.value = label;
    cell.style = { ...hdrStyle };
  });

  hdrRow.commit();

  ws.getRow(6).height = 14;
  ws.getRow(6).commit();

  // ══════════════════════════════════════════
  // DATA ROWS : starting from row 7
  // ══════════════════════════════════════════
  const total = getDaysInMonth(currentYear, currentMonth);

  for (let day = 1; day <= total; day++) {
    const data = getDayData(day);
    const date = new Date(currentYear, currentMonth, day);
    const hari = HARI[date.getDay()];
    const tgl = `${String(day).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;

    // Background color per row type — ALL text is BLACK
    const BLACK = 'FF000000';
    let bgArgb = 'FFFFFFFF'; // white (normal)

    if (data.type === 'libur') {
      bgArgb = 'FFFF0000'; // bright red background, black text
    } else if (data.type === 'lembur') {
      bgArgb = 'FFFFFF00'; // yellow background, black text
    }

    const dataRow = ws.getRow(6 + day); // row 7 = day 1, row 8 = day 2 …
    const taskCount = data.tasks.length;
    dataRow.height = Math.max(28, taskCount * 17);

    // ── Column A: NO. ──
    const cellA = dataRow.getCell('A');
    cellA.value = day;
    cellA.font = { bold: true, size: 10, name: 'Calibri', color: { argb: BLACK } };
    cellA.alignment = { horizontal: 'center', vertical: 'middle' };
    cellA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
    cellA.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    // ── Column B: HARI ──
    const cellB = dataRow.getCell('B');
    cellB.value = hari;
    cellB.font = { bold: true, size: 10, name: 'Calibri', color: { argb: BLACK } };
    cellB.alignment = { horizontal: 'center', vertical: 'middle' };
    cellB.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
    cellB.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    // ── Column C: TANGGAL ──
    const cellC = dataRow.getCell('C');
    cellC.value = tgl;
    cellC.font = { size: 10, name: 'Calibri', color: { argb: BLACK } };
    cellC.alignment = { horizontal: 'center', vertical: 'middle' };
    cellC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
    cellC.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    // ── Column D: KETERANGAN PEKERJAAN — all text BLACK ──
    const cellD = dataRow.getCell('D');

    if (data.tasks.length > 0) {
      // Rich text: each task on its own line, prefixed with #, all black
      cellD.value = {
        richText: data.tasks.flatMap((task, idx) => [
          {
            font: { color: { argb: BLACK }, size: 10, name: 'Calibri' },
            text: '#'
          },
          {
            font: { color: { argb: BLACK }, size: 10, name: 'Calibri' },
            text: task + (idx < data.tasks.length - 1 ? '\n' : '')
          },
        ]),
      };
    } else {
      cellD.value = '';
    }

    cellD.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    cellD.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
    cellD.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    // ── Column E: Keterangan/Nyetir ──
    const cellE = dataRow.getCell('E');
    cellE.value = data.notes || '';
    cellE.font = { size: 10, name: 'Calibri', color: { argb: BLACK } }; // always black
    cellE.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    cellE.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
    cellE.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    dataRow.commit();
  }

  // ── Generate & download ──
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // Filename: LAPORAN KERJA {NAMA LENGKAP} {UNIT DIVISI}.xlsx
  const divisiSuffix = divisiStr ? ` ${divisiStr}` : '';
  const fileName = `LAPORAN KERJA ${namaStr}${divisiSuffix}.xlsx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`📊 "${fileName}" berhasil diunduh!`);
}

// ── Init ─────────────────────────────────────────────────────
function init() {
  loadAll();
  updateMonthLabel();
  renderUserInfo();

  // Auto-show form if no user data
  if (!userData.nama) toggleUserForm(true);

  renderDays();

  // ── Event Listeners ──
  document.getElementById('btnPrevMonth').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    updateMonthLabel();
    renderDays();
  });

  document.getElementById('btnNextMonth').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    updateMonthLabel();
    renderDays();
  });

  document.getElementById('btnEditUser').addEventListener('click', () => {
    toggleUserForm(true);
  });

  document.getElementById('btnSaveUser').addEventListener('click', () => {
    userData.nama = document.getElementById('inputNama').value.trim();
    userData.jabatan = document.getElementById('inputJabatan').value.trim();
    userData.divisi = document.getElementById('inputDivisi').value.trim();
    userData.nomor = document.getElementById('inputNomor').value.trim();
    saveAll();
    renderUserInfo();
    toggleUserForm(false);
    showToast('✅ Data karyawan disimpan!');
  });

  document.getElementById('btnMarkAllHoliday').addEventListener('click', markAllHoliday);

  // Modal
  document.getElementById('btnCloseModal').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('btnAddTask').addEventListener('click', () => addTaskInput(''));
  document.getElementById('btnSaveDay').addEventListener('click', saveDay);
  document.getElementById('btnClearDay').addEventListener('click', clearDay);

  document.getElementById('btnExport').addEventListener('click', exportExcel);
}

document.addEventListener('DOMContentLoaded', init);
