//<![CDATA[
// Daftar Worker Utama dan Cadangan untuk Failover Otomatis
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

let activeWorkerIndex = 0;
let WORKER_API_URL = WORKER_POOL[activeWorkerIndex];

// Fungsi pembantu untuk melakukan fetch dengan sistem failover otomatis ke worker cadangan jika limit/gagal
async function fetchWithFailover(endpointPath, options = {}) {
    let attempts = 0;
    while (attempts < WORKER_POOL.length) {
        let currentUrl = `${WORKER_POOL[activeWorkerIndex]}${endpointPath}`;
        try {
            let response = await fetch(currentUrl, options);
            if (response.status === 429 || response.status >= 500) {
                throw new Error(`Worker error status: ${response.status}`);
            }
            return response;
        } catch (err) {
            attempts++;
            activeWorkerIndex = (activeWorkerIndex + 1) % WORKER_POOL.length;
            WORKER_API_URL = WORKER_POOL[activeWorkerIndex];
            console.warn(`Worker utama bermasalah/limit. Beralih ke worker cadangan: ${WORKER_API_URL}`);
            
            if (attempts >= WORKER_POOL.length) {
                throw new Error("Semua worker dalam pool gagal atau mencapai limit.");
            }
        }
    }
}
//]]>
