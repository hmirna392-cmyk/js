//<![CDATA[
/**
 * Daftar Pool Worker Cloudflare Anda
 */
const WORKER_POOL = [
    "https://cdn.abanggelo321.workers.dev",
    "https://cdn.avalangley6.workers.dev",
    "https://cdn.avanicholson24.workers.dev",
    "https://cdn.barrypalmer785.workers.dev",
    "https://cdn.bm2547276.workers.dev",
    "https://cdn.beatricejohns098.workers.dev",
    "https://cdn.belindaandrews845.workers.dev",
    "https://cdn.belindabecker852.workers.dev",
    "https://cdn.benunderwood73.workers.dev",
    "https://cdn.benitamoss93.workers.dev",
    "https://cdn.bernardhahn81.workers.dev",
    "https://cdn.bernicecook41.workers.dev",
    "https://cdn.bessiemovie.workers.dev",
    "https://cdn.beverlyfarrell1.workers.dev",
    "https://cdn.billhensley54.workers.dev",
    "https://cdn.bobbiryan383.workers.dev",
    "https://cdn.bobbieross6.workers.dev",
    "https://cdn.bobbybuchanan738.workers.dev",
    "https://cdn.bradleylevy6.workers.dev",
    "https://cdn.brettcurry139.workers.dev",
    "https://cdn.bretthogan9.workers.dev",
    "https://cdn.caseycotton92.workers.dev",
    "https://cdn.caseyfields152.workers.dev",
    "https://cdn.constancemcfarland65.workers.dev",
    "https://cdn.coreysolis541.workers.dev",
    "https://cdn.corinatownsend28.workers.dev",
    "https://cdn.adkinscornelia.workers.dev",
    "https://cdn.barnesdebbie518.workers.dev",
    "https://cdn.aguirreeliza64.workers.dev",
    "https://cdn.barrygregory7.workers.dev",
    "https://cdn.beulahjarvis.workers.dev"
];

// ⚠️ Ganti dengan informasi akun GitHub Anda
const GITHUB_USER = "hmirna329-cmyk";
const GITHUB_REPO = "js";
const GITHUB_TOKEN = ""; // GitHub Personal Access Token (izin repo)
const STATUS_FILE_PATH = "worker-status.json";

let WORKER_API_URL = WORKER_POOL[0];

/**
 * 1. Mengambil status cooldown global dari file GitHub (via jsDelivr yang super cepat)
 */
async function getGlobalCooldowns() {
    try {
        let res = await fetch(`https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@main/${STATUS_FILE_PATH}?t=` + Date.now());
        let data = await res.json();
        return data.cooldowns || {};
    } catch (e) {
        return {};
    }
}

/**
 * 2. Melaporkan worker yang kena limit secara otomatis ke GitHub agar seluruh dunia tahu
 */
async function reportWorkerCooldownGlobal(workerUrl) {
    if (!GITHUB_TOKEN || GITHUB_TOKEN === "PAT_GITHUB_ANDA") {
        console.warn("GitHub Token belum diatur, sinkronisasi global dilewati.");
        return;
    }

    try {
        let apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${STATUS_FILE_PATH}`;
        
        // Ambil data file terkini dari GitHub (wajib untuk mendapatkan SHA commit)
        let getRes = await fetch(apiUrl, {
            headers: { "Authorization": `token ${GITHUB_TOKEN}` }
        });
        let fileData = await getRes.json();
        let currentCooldowns = {};
        
        if (fileData.content) {
            let decodedContent = JSON.parse(atob(fileData.content));
            currentCooldowns = decodedContent.cooldowns || {};
        }

        // Set masa cooldown selama 24 jam ke depan untuk worker ini
        let oneDayMs = 24 * 60 * 60 * 1000;
        currentCooldowns[workerUrl] = Date.now() + oneDayMs;

        let newContentObject = { cooldowns: currentCooldowns };
        let encodedContent = btoa(JSON.stringify(newContentObject, null, 2));

        // Kirim update terbaru ke GitHub
        await fetch(apiUrl, {
            method: "PUT",
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Auto-cooldown worker: ${workerUrl}`,
                content: encodedContent,
                sha: fileData.sha
            })
        });
        console.log(`Worker ${workerUrl} berhasil di-blacklist secara global.`);
    } catch (err) {
        console.error("Gagal memperbarui status global ke GitHub:", err);
    }
}

/**
 * 3. Fungsi fetch utama dengan failover cerdas berbasis status global
 */
async function fetchWithFailover(endpointPath, options = {}) {
    let globalCooldowns = await getGlobalCooldowns();
    let now = Date.now();
    let attempts = 0;

    while (attempts < WORKER_POOL.length) {
        let currentWorkerBase = null;

        // Cari worker di pool yang TIDAK sedang dalam masa cooldown global
        for (let i = 0; i < WORKER_POOL.length; i++) {
            let testUrl = WORKER_POOL[i];
            let limitUntil = globalCooldowns[testUrl] || 0;
            
            if (now > limitUntil) {
                currentWorkerBase = testUrl;
                break;
            }
        }

        // Jika darurat (semua worker kena cooldown global), reset paksa ke worker pertama
        if (!currentWorkerBase) {
            console.error("Semua worker kena limit global! Menggunakan worker utama secara darurat...");
            currentWorkerBase = WORKER_POOL[0];
        }

        WORKER_API_URL = currentWorkerBase;
        let currentUrl = `${currentWorkerBase}${endpointPath}`;

        try {
            let response = await fetch(currentUrl, options);
            
            // Jika terkena limit (429) atau error server (500+)
            if (response.status === 429 || response.status >= 500) {
                // Lapor ke GitHub agar pengunjung lain langsung menghindari worker ini
                reportWorkerCooldownGlobal(currentWorkerBase);
                throw new Error(`Worker limit terdeteksi: ${response.status}`);
            }
            
            return response; // Berhasil!

        } catch (err) {
            attempts++;
            reportWorkerCooldownGlobal(currentWorkerBase);
            console.warn(`Mencoba worker sehat berikutnya... (Percobaan ke-${attempts})`);
            
            if (attempts >= WORKER_POOL.length) {
                throw new Error("Semua worker dalam pool gagal atau mencapai limit.");
            }
        }
    }
}
//]]>
