// ==================== DEFAULT MASTER DATA PT KENCANA AGRI (WANGGARASI) ====================
const DEFAULT_MASTER = {
  afdelings: {
    "Plasma BSP - AFD 1": [
      { kode: "A-01", luas: 25.0 },
      { kode: "A-02", luas: 28.5 },
      { kode: "A-03", luas: 30.0 }
    ],
    "Plasma BSP - AFD 2": [
      { kode: "B-01", luas: 27.0 },
      { kode: "B-02", luas: 29.5 },
      { kode: "B-03", luas: 26.8 }
    ],
    "Plasma BSP - AFD 4": [
      { kode: "D01/2023", luas: 24.5 },
      { kode: "D02/2023", luas: 26.0 },
      { kode: "D03/2022", luas: 28.0 },
      { kode: "D04/2022", luas: 25.4 }
    ],
    "Plasma MSM - AFD 1": [
      { kode: "M-01", luas: 25.0 },
      { kode: "M-02", luas: 27.5 },
      { kode: "M-03", luas: 29.0 }
    ],
    "Plasma MSM - AFD 2": [
      { kode: "N-01", luas: 24.0 },
      { kode: "N-02", luas: 26.5 }
    ]
  },
  units: ["Ha", "Pokok", "Meter", "Kg", "Liter", "Janjang", "HK", "Titik"],
  jobs: [
    { nama: "Chemis Piringan & Pasar Pikul", unit: "Ha" },
    { nama: "Tebas / Babat Gawangan", unit: "Ha" },
    { nama: "Pruning / Tunas Pokok", unit: "Pokok" },
    { nama: "Pemupukan Manual (Manuring)", unit: "Kg" },
    { nama: "Kastrasi & Sanitasi", unit: "Pokok" },
    { nama: "Perawatan Parit / Drainase", unit: "Meter" },
    { nama: "Sensus Hama & Penyakit (UPDKS)", unit: "Ha" },
    { nama: "Aplikasi Jangkos / Mulsa", unit: "Pokok" }
  ]
};

// ==================== STATE MANAGEMENT ====================
let masterData = JSON.parse(localStorage.getItem("kencana_master_v2")) || structuredClone(DEFAULT_MASTER);
let records = JSON.parse(localStorage.getItem("kencana_records_v2")) || [];
let sheetConfig = JSON.parse(localStorage.getItem("kencana_gsheet_cfg")) || { url: "", autoSync: false };

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("inpTanggal").value = today;

  document.getElementById("gsheetWebhookUrl").value = sheetConfig.url || "";
  document.getElementById("autoSyncCheck").checked = !!sheetConfig.autoSync;

  refreshAllDropdowns();
  renderMasterUI();
  renderRecentFeed();
  renderSheetTable();
  updateDashboardKPI();
});

function saveAllStorage() {
  localStorage.setItem("kencana_master_v2", JSON.stringify(masterData));
  localStorage.setItem("kencana_records_v2", JSON.stringify(records));
}

function showToast(msg, icon = "✅") {
  const toast = document.getElementById("toast");
  document.getElementById("toastMsg").textContent = msg;
  document.getElementById("toastIcon").textContent = icon;
  toast.classList.remove("translate-y-20", "opacity-0");
  setTimeout(() => {
    toast.classList.add("translate-y-20", "opacity-0");
  }, 3200);
}

// ==================== TAB NAVIGATION ====================
function switchTab(tabName) {
  ["input", "sheet", "master"].forEach(t => {
    document.getElementById(`tab-${t}`).classList.add("hidden");
    document.getElementById(`tabBtn-${t}`).classList.remove("tab-active");
  });
  document.getElementById(`tab-${tabName}`).classList.remove("hidden");
  document.getElementById(`tabBtn-${tabName}`).classList.add("tab-active");

  if (tabName === "sheet") renderSheetTable();
  if (tabName === "master") renderMasterUI();
}

// ==================== DROPDOWN & DYNAMIC LINKING ====================
function refreshAllDropdowns() {
  const afdSelects = [
    document.getElementById("inpAfdeling"),
    document.getElementById("fltAfdeling"),
    document.getElementById("mstSelectAfd")
  ];
  const afdNames = Object.keys(masterData.afdelings);

  afdSelects.forEach((sel, idx) => {
    const currentVal = sel.value;
    sel.innerHTML = idx === 0
      ? `<option value="">-- Pilih Afdeling --</option>`
      : (idx === 1 ? `<option value="">Semua Afdeling</option>` : "");
    afdNames.forEach(afd => {
      sel.innerHTML += `<option value="${afd}">${afd}</option>`;
    });
    if (afdNames.includes(currentVal)) sel.value = currentVal;
  });

  const jobInp = document.getElementById("inpPekerjaan");
  const jobFlt = document.getElementById("fltPekerjaan");
  const curJob = jobInp.value;
  jobInp.innerHTML = `<option value="">-- Pilih Jenis Pekerjaan --</option>`;
  jobFlt.innerHTML = `<option value="">Semua Pekerjaan</option>`;

  masterData.jobs.forEach(j => {
    jobInp.innerHTML += `<option value="${j.nama}" data-unit="${j.unit}">${j.nama} (${j.unit})</option>`;
    jobFlt.innerHTML += `<option value="${j.nama}">${j.nama}</option>`;
  });
  if (curJob) jobInp.value = curJob;

  const unitInp = document.getElementById("inpSatuan");
  const unitMst = document.getElementById("newJobUnit");
  const curUnit = unitInp.value;
  unitInp.innerHTML = "";
  unitMst.innerHTML = "";
  masterData.units.forEach(u => {
    unitInp.innerHTML += `<option value="${u}">${u}</option>`;
    unitMst.innerHTML += `<option value="${u}">${u}</option>`;
  });
  if (masterData.units.includes(curUnit)) unitInp.value = curUnit;
}

function onAfdelingChange() {
  const afd = document.getElementById("inpAfdeling").value;
  const blokSel = document.getElementById("inpBlok");
  const infoLuas = document.getElementById("infoLuasBlok");
  infoLuas.textContent = "";

  if (!afd || !masterData.afdelings[afd]) {
    blokSel.innerHTML = `<option value="">-- Pilih Afdeling Terlebih Dahulu --</option>`;
    return;
  }

  const bloks = masterData.afdelings[afd];
  blokSel.innerHTML = `<option value="">-- Pilih Blok (${bloks.length} Blok) --</option>`;
  bloks.forEach(b => {
    blokSel.innerHTML += `<option value="${b.kode}" data-luas="${b.luas}">Blok ${b.kode} (${b.luas} Ha)</option>`;
  });
}

function onBlokChange() {
  const blokSel = document.getElementById("inpBlok");
  const selectedOpt = blokSel.options[blokSel.selectedIndex];
  const luas = selectedOpt ? selectedOpt.getAttribute("data-luas") : "";
  document.getElementById("infoLuasBlok").textContent = luas ? `• Luas: ${luas} Ha` : "";
}

function onPekerjaanChange() {
  const jobSel = document.getElementById("inpPekerjaan");
  const selectedOpt = jobSel.options[jobSel.selectedIndex];
  const defaultUnit = selectedOpt ? selectedOpt.getAttribute("data-unit") : "";
  if (defaultUnit && masterData.units.includes(defaultUnit)) {
    document.getElementById("inpSatuan").value = defaultUnit;
  }
}

// ==================== FORM SUBMIT (CREATE / UPDATE) ====================
function handleFormSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById("editId").value;

  const recordObj = {
    id: editId || "KC-" + Date.now().toString().slice(-6),
    tanggal: document.getElementById("inpTanggal").value,
    mandor: document.getElementById("inpMandor").value.trim(),
    afdeling: document.getElementById("inpAfdeling").value,
    blok: document.getElementById("inpBlok").value,
    pekerjaan: document.getElementById("inpPekerjaan").value,
    hasil: parseFloat(document.getElementById("inpHasil").value) || 0,
    satuan: document.getElementById("inpSatuan").value,
    hk: parseFloat(document.getElementById("inpHK").value) || 0,
    bahan: document.getElementById("inpBahan").value.trim() || "-",
    keterangan: document.getElementById("inpKeterangan").value.trim() || "-"
  };

  if (editId) {
    const idx = records.findIndex(r => r.id === editId);
    if (idx !== -1) records[idx] = recordObj;
    showToast("Data realisasi berhasil diperbarui!");
  } else {
    records.unshift(recordObj);
    showToast("Realisasi tersimpan & terupdate di Sheet!");
    if (sheetConfig.autoSync && sheetConfig.url) {
      postRecordToWebhook(recordObj);
    }
  }

  saveAllStorage();
  resetForm(true);
  renderRecentFeed();
  renderSheetTable();
  updateDashboardKPI();
}

function resetForm(keepContext = false) {
  document.getElementById("editId").value = "";
  document.getElementById("btnSubmitForm").innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
    <span>Simpan & Update ke Sheet</span>`;
  document.getElementById("btnCancelEdit").classList.add("hidden");

  if (!keepContext) {
    document.getElementById("realisasiForm").reset();
    document.getElementById("inpTanggal").value = new Date().toISOString().split("T")[0];
    onAfdelingChange();
  } else {
    document.getElementById("inpHasil").value = "";
    document.getElementById("inpHK").value = "";
    document.getElementById("inpBahan").value = "";
    document.getElementById("inpKeterangan").value = "";
  }
}

function editRecord(id) {
  const rec = records.find(r => r.id === id);
  if (!rec) return;

  switchTab("input");
  document.getElementById("editId").value = rec.id;
  document.getElementById("inpTanggal").value = rec.tanggal;
  document.getElementById("inpMandor").value = rec.mandor;
  document.getElementById("inpAfdeling").value = rec.afdeling;
  onAfdelingChange();
  document.getElementById("inpBlok").value = rec.blok;
  onBlokChange();
  document.getElementById("inpPekerjaan").value = rec.pekerjaan;
  document.getElementById("inpHasil").value = rec.hasil;
  document.getElementById("inpSatuan").value = rec.satuan;
  document.getElementById("inpHK").value = rec.hk;
  document.getElementById("inpBahan").value = rec.bahan === "-" ? "" : rec.bahan;
  document.getElementById("inpKeterangan").value = rec.keterangan === "-" ? "" : rec.keterangan;

  document.getElementById("btnSubmitForm").innerHTML = `<span>💾 Update Perubahan Data</span>`;
  document.getElementById("btnCancelEdit").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteRecord(id) {
  if (!confirm("Hapus baris realisasi ini dari sheet?")) return;
  records = records.filter(r => r.id !== id);
  saveAllStorage();
  renderRecentFeed();
  renderSheetTable();
  updateDashboardKPI();
  showToast("Data berhasil dihapus", "🗑️");
}

// ==================== RENDER FEED & KPI ====================
function updateDashboardKPI() {
  const selDate = document.getElementById("inpTanggal").value;
  const dayRecords = records.filter(r => r.tanggal === selDate);
  const totalHK = dayRecords.reduce((sum, r) => sum + Number(r.hk || 0), 0);
  const uniqueAfd = new Set(dayRecords.map(r => r.afdeling)).size;

  document.getElementById("kpiTanggalCount").textContent = `${dayRecords.length} Baris`;
  document.getElementById("kpiTotalHK").textContent = `${totalHK.toLocaleString("id-ID")} HK`;
  document.getElementById("kpiAfdelingAktif").textContent = `${uniqueAfd} Afd`;
  document.getElementById("kpiAllRecords").textContent = `${records.length} Data`;
  document.getElementById("badgeCount").textContent = records.length;
}

function renderRecentFeed() {
  const container = document.getElementById("recentFeedList");
  if (records.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 text-slate-400 text-xs">
        <p class="text-2xl mb-2">📋</p>
        <p class="font-semibold text-slate-600">Belum ada data realisasi</p>
        <p class="mt-1">Silakan isi form di samping untuk mulai mencatat realisasi harian.</p>
      </div>`;
    return;
  }

  container.innerHTML = records.slice(0, 8).map(r => `
    <div class="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50/60 transition flex items-start justify-between gap-3">
      <div class="space-y-1">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-800 text-white">${r.afdeling}</span>
          <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-900">Blok ${r.blok}</span>
          <span class="text-[11px] text-slate-500 font-medium">${r.tanggal}</span>
        </div>
        <p class="text-xs font-bold text-slate-800">${r.pekerjaan}</p>
        <p class="text-xs text-emerald-700 font-extrabold">
          Realisasi: ${Number(r.hasil).toLocaleString("id-ID")} ${r.satuan} 
          <span class="text-slate-500 font-normal">• ${r.hk} HK • Mandor: ${r.mandor}</span>
        </p>
      </div>
      <button onclick="editRecord('${r.id}')" class="text-xs text-slate-400 hover:text-emerald-700 font-bold px-2 py-1 cursor-pointer" title="Edit">✏️</button>
    </div>
  `).join("");
}

// ==================== RENDER LIVE SHEET & REKAPITULASI ====================
function getFilteredRecords() {
  const fTgl = document.getElementById("fltTanggal").value;
  const fAfd = document.getElementById("fltAfdeling").value;
  const fJob = document.getElementById("fltPekerjaan").value;
  const fSrc = document.getElementById("fltSearch").value.toLowerCase().trim();

  return records.filter(r => {
    if (fTgl && r.tanggal !== fTgl) return false;
    if (fAfd && r.afdeling !== fAfd) return false;
    if (fJob && r.pekerjaan !== fJob) return false;
    if (fSrc) {
      const hay = `${r.blok} ${r.mandor} ${r.pekerjaan} ${r.keterangan}`.toLowerCase();
      if (!hay.includes(fSrc)) return false;
    }
    return true;
  });
}

function resetFilters() {
  document.getElementById("fltTanggal").value = "";
  document.getElementById("fltAfdeling").value = "";
  document.getElementById("fltPekerjaan").value = "";
  document.getElementById("fltSearch").value = "";
  renderSheetTable();
}

function renderSheetTable() {
  const filtered = getFilteredRecords();
  const tbody = document.getElementById("sheetTableBody");
  const tfoot = document.getElementById("sheetTableFoot");

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" class="py-8 text-center text-slate-400">Tidak ada data yang sesuai filter.</td></tr>`;
    tfoot.innerHTML = "";
    renderRekapTables([]);
    return;
  }

  let sumHK = 0;
  tbody.innerHTML = filtered.map((r, idx) => {
    const hk = Number(r.hk || 0);
    const hasil = Number(r.hasil || 0);
    sumHK += hk;
    const prestasi = hk > 0 ? (hasil / hk).toFixed(2) : "0.00";

    return `
      <tr class="hover:bg-emerald-50/40 transition">
        <td class="py-2.5 px-3.5 text-slate-500">${idx + 1}</td>
        <td class="py-2.5 px-3.5 font-medium whitespace-nowrap">${r.tanggal}</td>
        <td class="py-2.5 px-3.5 font-semibold text-emerald-900 whitespace-nowrap">${r.afdeling}</td>
        <td class="py-2.5 px-3.5 font-bold">${r.blok}</td>
        <td class="py-2.5 px-3.5 font-medium">${r.pekerjaan}</td>
        <td class="py-2.5 px-3.5 text-right font-extrabold text-emerald-800">${hasil.toLocaleString("id-ID")}</td>
        <td class="py-2.5 px-3.5"><span class="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">${r.satuan}</span></td>
        <td class="py-2.5 px-3.5 text-right font-bold">${hk.toLocaleString("id-ID")}</td>
        <td class="py-2.5 px-3.5 text-right text-slate-600">${prestasi} ${r.satuan}/HK</td>
        <td class="py-2.5 px-3.5 text-slate-600">${r.bahan}</td>
        <td class="py-2.5 px-3.5 text-slate-700">${r.mandor}</td>
        <td class="py-2.5 px-3.5 text-center whitespace-nowrap">
          <button onclick="editRecord('${r.id}')" class="text-blue-600 hover:underline font-bold mr-2 cursor-pointer">Edit</button>
          <button onclick="deleteRecord('${r.id}')" class="text-red-600 hover:underline font-bold cursor-pointer">Hapus</button>
        </td>
      </tr>
    `;
  }).join("");

  tfoot.innerHTML = `
    <tr>
      <td colspan="7" class="py-3 px-3.5 text-right uppercase">Total Tenaga Kerja (HK) Terfilter (${filtered.length} Baris):</td>
      <td class="py-3 px-3.5 text-right text-sm">${sumHK.toLocaleString("id-ID")} HK</td>
      <td colspan="4"></td>
    </tr>
  `;

  renderRekapTables(filtered);
}

function renderRekapTables(dataList) {
  const jobMap = {};
  dataList.forEach(r => {
    const key = `${r.pekerjaan}|||${r.satuan}`;
    if (!jobMap[key]) jobMap[key] = { pekerjaan: r.pekerjaan, satuan: r.satuan, totalHasil: 0, totalHK: 0 };
    jobMap[key].totalHasil += Number(r.hasil || 0);
    jobMap[key].totalHK += Number(r.hk || 0);
  });

  const jobRows = Object.values(jobMap);
  document.getElementById("rekapPekerjaanBody").innerHTML = jobRows.length
    ? jobRows.map(j => {
        const avg = j.totalHK > 0 ? (j.totalHasil / j.totalHK).toFixed(2) : "0.00";
        return `
          <tr>
            <td class="py-2.5 px-4 font-semibold text-slate-800">${j.pekerjaan}</td>
            <td class="py-2.5 px-4 text-right font-extrabold text-emerald-800">${j.totalHasil.toLocaleString("id-ID")}</td>
            <td class="py-2.5 px-4 font-bold text-amber-800">${j.satuan}</td>
            <td class="py-2.5 px-4 text-right font-bold">${j.totalHK.toLocaleString("id-ID")}</td>
            <td class="py-2.5 px-4 text-right text-slate-600">${avg}</td>
          </tr>`;
      }).join("")
    : `<tr><td colspan="5" class="py-4 text-center text-slate-400">Belum ada data rekap</td></tr>`;

  const afdMap = {};
  dataList.forEach(r => {
    const key = `${r.afdeling}|||${r.blok}`;
    if (!afdMap[key]) afdMap[key] = { afdeling: r.afdeling, blok: r.blok, count: 0, totalHK: 0 };
    afdMap[key].count += 1;
    afdMap[key].totalHK += Number(r.hk || 0);
  });

  const afdRows = Object.values(afdMap).sort((a, b) => a.afdeling.localeCompare(b.afdeling) || a.blok.localeCompare(b.blok));
  document.getElementById("rekapAfdelingBody").innerHTML = afdRows.length
    ? afdRows.map(a => `
        <tr>
          <td class="py-2.5 px-4 font-semibold text-emerald-950">${a.afdeling}</td>
          <td class="py-2.5 px-4 font-bold">Blok ${a.blok}</td>
          <td class="py-2.5 px-4 text-right">${a.count}x</td>
          <td class="py-2.5 px-4 text-right font-bold text-amber-700">${a.totalHK.toLocaleString("id-ID")} HK</td>
        </tr>`).join("")
    : `<tr><td colspan="4" class="py-4 text-center text-slate-400">Belum ada data rekap</td></tr>`;
}

// ==================== MASTER DATA CRUD ====================
function renderMasterUI() {
  refreshAllDropdowns();

  const afdContainer = document.getElementById("masterAfdList");
  afdContainer.innerHTML = Object.entries(masterData.afdelings).map(([afdName, bloks]) => `
    <div class="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
      <div class="flex items-center justify-between">
        <span class="font-bold text-xs text-emerald-950">${afdName}</span>
        <button onclick="deleteAfdeling('${afdName}')" class="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer">Hapus Afd</button>
      </div>
      <div class="flex flex-wrap gap-1.5">
        ${bloks.length ? bloks.map((b, i) => `
          <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-300 text-[11px] font-semibold">
            ${b.kode} <span class="text-slate-400">(${b.luas}Ha)</span>
            <button onclick="deleteBlok('${afdName}', ${i})" class="text-red-500 hover:text-red-700 ml-1 font-bold cursor-pointer">×</button>
          </span>
        `).join("") : `<span class="text-[11px] text-slate-400 italic">Belum ada blok</span>`}
      </div>
    </div>
  `).join("");

  const jobContainer = document.getElementById("masterJobList");
  jobContainer.innerHTML = masterData.jobs.map((j, idx) => `
    <div class="py-2.5 flex items-center justify-between gap-2 text-xs">
      <div>
        <p class="font-semibold text-slate-800">${j.nama}</p>
        <span class="inline-block mt-0.5 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">Satuan Default: ${j.unit}</span>
      </div>
      <button onclick="deleteJob(${idx})" class="text-red-500 hover:text-red-700 font-bold px-2 cursor-pointer">Hapus</button>
    </div>
  `).join("");

  const unitContainer = document.getElementById("masterUnitList");
  unitContainer.innerHTML = masterData.units.map((u, idx) => `
    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
      ${u}
      <button onclick="deleteUnit(${idx})" class="text-red-500 hover:text-red-700 font-extrabold cursor-pointer">×</button>
    </span>
  `).join("");
}

function addAfdeling() {
  const name = document.getElementById("newAfdName").value.trim();
  if (!name) return;
  if (masterData.afdelings[name]) return showToast("Afdeling sudah ada!", "⚠️");
  masterData.afdelings[name] = [];
  document.getElementById("newAfdName").value = "";
  saveAllStorage();
  renderMasterUI();
  showToast("Afdeling berhasil ditambahkan");
}

function deleteAfdeling(name) {
  if (!confirm(`Hapus ${name} beserta daftar bloknya?`)) return;
  delete masterData.afdelings[name];
  saveAllStorage();
  renderMasterUI();
}

function addBlokToAfdeling() {
  const afd = document.getElementById("mstSelectAfd").value;
  const kode = document.getElementById("newBlokCode").value.trim().toUpperCase();
  const luas = parseFloat(document.getElementById("newBlokLuas").value) || 0;
  if (!afd || !kode) return showToast("Pilih Afdeling & isi Kode Blok!", "⚠️");

  masterData.afdelings[afd].push({ kode, luas });
  document.getElementById("newBlokCode").value = "";
  document.getElementById("newBlokLuas").value = "";
  saveAllStorage();
  renderMasterUI();
  onAfdelingChange();
  showToast(`Blok ${kode} ditambahkan ke ${afd}`);
}

function deleteBlok(afd, idx) {
  masterData.afdelings[afd].splice(idx, 1);
  saveAllStorage();
  renderMasterUI();
  onAfdelingChange();
}

function addJob() {
  const nama = document.getElementById("newJobName").value.trim();
  const unit = document.getElementById("newJobUnit").value;
  if (!nama) return;
  masterData.jobs.push({ nama, unit });
  document.getElementById("newJobName").value = "";
  saveAllStorage();
  renderMasterUI();
  showToast("Jenis pekerjaan ditambahkan");
}

function deleteJob(idx) {
  masterData.jobs.splice(idx, 1);
  saveAllStorage();
  renderMasterUI();
}

function addUnit() {
  const u = document.getElementById("newUnitName").value.trim();
  if (!u) return;
  if (!masterData.units.includes(u)) masterData.units.push(u);
  document.getElementById("newUnitName").value = "";
  saveAllStorage();
  renderMasterUI();
  showToast(`Satuan "${u}" ditambahkan`);
}

function deleteUnit(idx) {
  masterData.units.splice(idx, 1);
  saveAllStorage();
  renderMasterUI();
}

function resetMasterToDefault() {
  if (!confirm("Kembalikan Master Data Afdeling, Blok, Pekerjaan & Unit ke pengaturan awal Wanggarasi?")) return;
  masterData = structuredClone(DEFAULT_MASTER);
  saveAllStorage();
  renderMasterUI();
  showToast("Master data dikembalikan ke default");
}

// ==================== LAPORAN RINGKASAN WHATSAPP ====================
function shareWhatsAppReport() {
  const targetDate = document.getElementById("fltTanggal").value || document.getElementById("inpTanggal").value;
  const list = records.filter(r => r.tanggal === targetDate);

  if (list.length === 0) {
    return showToast(`Belum ada data realisasi untuk tanggal ${targetDate}!`, "⚠️");
  }

  let totalHK = 0;
  let lines = list.map((r, i) => {
    totalHK += Number(r.hk || 0);
    const bahanStr = r.bahan && r.bahan !== "-" ? ` | Bahan: ${r.bahan}` : "";
    return `${i + 1}. *${r.afdeling}* - Blok *${r.blok}*
   • ${r.pekerjaan}: *${Number(r.hasil).toLocaleString("id-ID")} ${r.satuan}* (${r.hk} HK)${bahanStr}
   • Mandor: ${r.mandor}`;
  });

  const message =
    `*LAPORAN REALISASI PERAWATAN HARIAN*
` +
    `*PT KENCANA AGRI — KEBUN WANGGARASI*
` +
    `Tanggal: *${targetDate}*
` +
    `----------------------------------------
` +
    lines.join("

") +
    `
----------------------------------------
` +
    `*Total Aktivitas:* ${list.length} Blok/Item
` +
    `*Total Tenaga Kerja:* ${totalHK.toLocaleString("id-ID")} HK`;

  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(waUrl, "_blank");
}

// ==================== EXPORT EXCEL (.XLSX MULTI-SHEET) & CSV ====================
function exportToExcel() {
  const dataToExport = getFilteredRecords().length ? getFilteredRecords() : records;
  if (dataToExport.length === 0) {
    return showToast("Belum ada data realisasi untuk diexport!", "⚠️");
  }

  const wb = XLSX.utils.book_new();

  const ws1Rows = dataToExport.map((r, idx) => ({
    "No": idx + 1,
    "ID Transaksi": r.id,
    "Tanggal": r.tanggal,
    "Afdeling": r.afdeling,
    "Blok": r.blok,
    "Jenis Pekerjaan": r.pekerjaan,
    "Realisasi Kerja": Number(r.hasil),
    "Satuan Unit": r.satuan,
    "Tenaga Kerja (HK)": Number(r.hk),
    "Output per HK": r.hk > 0 ? Number((r.hasil / r.hk).toFixed(2)) : 0,
    "Pemakaian Bahan/Dosis": r.bahan,
    "Mandor / Pengawas": r.mandor,
    "Keterangan": r.keterangan
  }));
  const ws1 = XLSX.utils.json_to_sheet(ws1Rows);
  ws1["!cols"] = [
    { wch: 5 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 12 },
    { wch: 32 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 14 },
    { wch: 24 }, { wch: 18 }, { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Realisasi_Harian");

  const jobMap = {};
  dataToExport.forEach(r => {
    const key = `${r.pekerjaan}|||${r.satuan}`;
    if (!jobMap[key]) jobMap[key] = { "Jenis Pekerjaan": r.pekerjaan, "Satuan": r.satuan, "Total Realisasi": 0, "Total HK": 0 };
    jobMap[key]["Total Realisasi"] += Number(r.hasil || 0);
    jobMap[key]["Total HK"] += Number(r.hk || 0);
  });
  const ws2Rows = Object.values(jobMap).map(item => ({
    ...item,
    "Rata-rata Prestasi (Output/HK)": item["Total HK"] > 0 ? Number((item["Total Realisasi"] / item["Total HK"]).toFixed(2)) : 0
  }));
  const ws2 = XLSX.utils.json_to_sheet(ws2Rows);
  ws2["!cols"] = [{ wch: 34 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Rekap_Pekerjaan");

  const ws3Rows = [];
  Object.entries(masterData.afdelings).forEach(([afd, bloks]) => {
    bloks.forEach(b => {
      ws3Rows.push({ "Afdeling": afd, "Kode Blok": b.kode, "Luas (Ha)": b.luas });
    });
  });
  const ws3 = XLSX.utils.json_to_sheet(ws3Rows);
  ws3["!cols"] = [{ wch: 24 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Master_Afdeling_Blok");

  const tglFile = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `Realisasi_Perawatan_Kencana_Wanggarasi_${tglFile}.xlsx`);
  showToast("File Excel (.xlsx) berhasil didownload!", "📥");
}

function exportToCSV() {
  const dataToExport = getFilteredRecords().length ? getFilteredRecords() : records;
  if (dataToExport.length === 0) return showToast("Belum ada data!", "⚠️");

  const headers = ["ID", "Tanggal", "Afdeling", "Blok", "Pekerjaan", "Hasil", "Satuan", "HK", "Bahan", "Mandor", "Keterangan"];
  const csvLines = [
    headers.join(","),
    ...dataToExport.map(r => [
      r.id, r.tanggal, `"${r.afdeling}"`, `"${r.blok}"`, `"${r.pekerjaan}"`,
      r.hasil, `"${r.satuan}"`, r.hk, `"${r.bahan}"`, `"${r.mandor}"`, `"${r.keterangan}"`
    ].join(","))
  ];

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Realisasi_Kencana_Wanggarasi_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

// ==================== GOOGLE SHEETS WEBHOOK SYNC ====================
function saveWebhookUrl() {
  sheetConfig.url = document.getElementById("gsheetWebhookUrl").value.trim();
  sheetConfig.autoSync = document.getElementById("autoSyncCheck").checked;
  localStorage.setItem("kencana_gsheet_cfg", JSON.stringify(sheetConfig));
  showToast("Pengaturan koneksi Google Sheet disimpan");
}

function toggleScriptGuide() {
  document.getElementById("appsScriptGuide").classList.toggle("hidden");
}

async function postRecordToWebhook(recordObj) {
  if (!sheetConfig.url) return;
  try {
    await fetch(sheetConfig.url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recordObj)
    });
  } catch (err) {
    console.error("Sync error:", err);
  }
}

async function syncToGoogleSheet() {
  if (!sheetConfig.url) {
    switchTab("master");
    return showToast("Isi URL Google Apps Script terlebih dahulu di Tab 3!", "⚠️");
  }
  if (records.length === 0) return showToast("Belum ada data untuk dikirim!", "⚠️");

  const btn = document.getElementById("btnSyncGsheet");
  btn.disabled = true;
  btn.innerHTML = `<span>⏳ Mengirim ${records.length} data...</span>`;

  for (const rec of records) {
    await postRecordToWebhook(rec);
  }

  btn.disabled = false;
  btn.innerHTML = `<span>Kirim ke Google Sheet</span>`;
  showToast(`${records.length} baris berhasil dikirim ke Google Sheet!`, "☁️");
}