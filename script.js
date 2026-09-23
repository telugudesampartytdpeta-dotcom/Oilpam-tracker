// =========================================================
// OIL PALM HARVESTING MANAGEMENT SYSTEM - PRODUCTION SCRIPT
// =========================================================

// 1. HELPER FUNCTIONS FOR DATES & STRINGS
function getTodayStr() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseLocalDate(dateStr) {
    if (!dateStr) return new Date();
    let parts = String(dateStr).split('-');
    if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date(dateStr);
}

function normalizeDateStr(dateInput) {
    if (!dateInput) return getTodayStr();
    let str = String(dateInput).trim();
    
    // Excel Serial Date Number handling
    if (!isNaN(str) && Number(str) > 30000 && Number(str) < 60000) {
        let excelDate = new Date((Number(str) - (25567 + 2)) * 86400 * 1000);
        let y = excelDate.getFullYear();
        let m = String(excelDate.getMonth() + 1).padStart(2, '0');
        let d = String(excelDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // Format DD/MM/YYYY or DD-MM-YYYY handling
    if (str.includes('/') || (str.includes('-') && str.split('-')[0].length !== 4)) {
        let parts = str.split(/[\/\-]/);
        if (parts.length === 3) {
            let d = parts[0].padStart(2, '0');
            let m = parts[1].padStart(2, '0');
            let y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
            return `${y}-${m}-${d}`;
        }
    }

    return str;
}

// 2. LOCAL STORAGE & DATA INITIALIZATION
let farmers = JSON.parse(localStorage.getItem("nbl_farmers_data")) || JSON.parse(localStorage.getItem("farmersData")) || [];

// FIXED DEDUPLICATION BASED STRICTLY ON OWNER ID / UNIQUE IDENTIFIERS
function cleanupDuplicates() {
    if (!farmers || !Array.isArray(farmers) || farmers.length === 0) {
        farmers = [];
        return;
    }

    let cleanFarmersList = [];

    farmers.forEach(farmer => {
        let cleanOwner = String(farmer.owner || '').trim();
        let cleanName = String(farmer.name || '').trim().toLowerCase();

        let existing = cleanFarmersList.find(f => {
            let fOwner = String(f.owner || '').trim();
            if (cleanOwner && fOwner) {
                return fOwner === cleanOwner;
            }
            return cleanName && String(f.name || '').trim().toLowerCase() === cleanName;
        });

        if (!existing) {
            existing = {
                name: farmer.name || 'Unknown Farmer',
                owner: farmer.owner || '',
                sap: farmer.sap || '',
                supplierId: farmer.supplierId || farmer.sap || '',
                supplier: farmer.supplier || '',
                phone: farmer.phone || '',
                cluster: farmer.cluster || '',
                lands: []
            };
            cleanFarmersList.push(existing);
        } else {
            if (!existing.phone && farmer.phone) existing.phone = farmer.phone;
            if (!existing.cluster && farmer.cluster) existing.cluster = farmer.cluster;
            if (!existing.supplier && farmer.supplier) existing.supplier = farmer.supplier;
            if (!existing.supplierId && (farmer.supplierId || farmer.sap)) existing.supplierId = farmer.supplierId || farmer.sap;
        }

        if (farmer.lands && Array.isArray(farmer.lands)) {
            farmer.lands.forEach(land => {
                let cleanLandId = String(land.landId || '').trim();
                if (!cleanLandId) return;

                let existingLand = existing.lands.find(l => String(l.landId || '').trim() === cleanLandId);
                if (!existingLand) {
                    existingLand = {
                        landId: land.landId,
                        cluster: land.cluster || farmer.cluster || '',
                        area: parseFloat(land.area) || 0,
                        plantYear: land.plantYear || land.plantationYear || 'N/A', // Plant Year stored
                        history: []
                    };
                    existing.lands.push(existingLand);
                } else {
                    if (land.area > 0) existingLand.area = parseFloat(land.area);
                    if (land.plantYear || land.plantationYear) existingLand.plantYear = land.plantYear || land.plantationYear;
                }

                if (land.history && Array.isArray(land.history)) {
                    land.history.forEach(h => {
                        let isDupH = existingLand.history.some(exH => exH.date === h.date && parseFloat(exH.tons) === parseFloat(h.tons));
                        if (!isDupH) {
                            existingLand.history.push({
                                date: h.date,
                                acres: parseFloat(h.acres) || 0,
                                tons: parseFloat(h.tons) || 0,
                                weightBridge: h.weightBridge || '',
                                isHarvestDone: Boolean(h.isHarvestDone)
                            });
                        }
                    });
                }
            });
        }
    });

    farmers = cleanFarmersList;
}

// Fast Search Memory Index Map
let farmerSearchMap = new Map();

function buildSearchIndex() {
    farmerSearchMap.clear();
    farmers.forEach((farmer, idx) => {
        let landIds = (farmer.lands || []).map(l => `${l.plantYear || ''} ${l.landId || ''}`).join(' ');
        let key = `${farmer.name || ''} ${farmer.owner || ''} ${farmer.sap || ''} ${farmer.phone || ''} ${farmer.supplierId || ''} ${farmer.supplier || ''} ${farmer.cluster || ''} ${landIds}`.toLowerCase();
        farmerSearchMap.set(idx, key);
    });
}

function saveData() {
    try {
        let dataStr = JSON.stringify(farmers);
        localStorage.setItem("nbl_farmers_data", dataStr);
        localStorage.setItem("farmersData", dataStr);
    } catch (e) {
        console.error("LocalStorage Save Error:", e);
    }
    
    buildSearchIndex();
    updateDashboard();
    populateFarmerDropdowns();
    renderHarvestedTable();
    renderTodayHarvestTable();
    renderFarmerCards();
}

// 3. DASHBOARD UPDATE
function updateDashboard() {
    let totalLands = 0;
    let totalHarvests = 0;
    let totalTonsSum = 0;
    let todayHarvestCount = 0;
    let todayTonsSum = 0;

    const todayStr = getTodayStr();

    farmers.forEach(farmer => {
        if (farmer.lands && Array.isArray(farmer.lands)) {
            totalLands += farmer.lands.length;
            farmer.lands.forEach(land => {
                if (land.history && Array.isArray(land.history)) {
                    totalHarvests += land.history.length;
                    land.history.forEach(h => {
                        let t = parseFloat(h.tons) || 0;
                        totalTonsSum += t;
                        if (h.date === todayStr) {
                            todayHarvestCount++;
                            todayTonsSum += t;
                        }
                    });
                }
            });
        }
    });

    const farmerCountEl = document.getElementById("farmerCount");
    const landCountEl = document.getElementById("landCount");
    const harvestCountEl = document.getElementById("harvestCount");
    const totalTonsEl = document.getElementById("totalTons");
    const todayHarvestCountEl = document.getElementById("todayHarvestCount");

    if (farmerCountEl) farmerCountEl.innerText = farmers.length;
    if (landCountEl) landCountEl.innerText = totalLands;
    if (harvestCountEl) harvestCountEl.innerText = totalHarvests;
    if (totalTonsEl) totalTonsEl.innerText = totalTonsSum.toFixed(2);
    if (todayHarvestCountEl) todayHarvestCountEl.innerText = `${todayHarvestCount} (${todayTonsSum.toFixed(2)} Tons)`;
}

// 4. DROPDOWNS POPULATION
function populateFarmerDropdowns() {
    const harvestFarmer = document.getElementById("harvestFarmer");
    if (!harvestFarmer) return;

    let currentHarvestVal = harvestFarmer.value;

    let optionsHtml = '<option value="">-- రైతును ఎంచుకోండి (Select Farmer) --</option>';
    farmers.forEach((farmer, idx) => {
        let displayId = farmer.owner || farmer.sap || farmer.supplierId || 'ID:N/A';
        optionsHtml += `<option value="${idx}">${displayId} - ${farmer.name}</option>`;
    });

    harvestFarmer.innerHTML = optionsHtml;
    if (currentHarvestVal !== "" && Number(currentHarvestVal) < farmers.length) {
        harvestFarmer.value = currentHarvestVal;
    }
}

// 5. RENDER FARMER CARDS (14 Series Mundhu Plant Year)
function renderFarmerCards(filteredData = null) {
    const list = document.getElementById("farmerList");
    if (!list) return;

    let dataToRender = filteredData ? [...filteredData] : [...farmers];

    if (dataToRender.length === 0) {
        list.innerHTML = `<div style="text-align:center; color:#888; padding:30px; background:#fff; border-radius:10px; border:1px dashed #ccc;">రైతు వివరాలు ఏమీ లేవు.</div>`;
        return;
    }

    // Sort alphabetically by name (A to Z)
    dataToRender.sort((a, b) => {
        let nameA = (a.name || "").trim().toLowerCase();
        let nameB = (b.name || "").trim().toLowerCase();
        return nameA.localeCompare(nameB);
    });

    let fragment = document.createDocumentFragment();

    dataToRender.forEach((farmer) => {
        let fIdx = farmers.indexOf(farmer);
        let phoneDisplay = farmer.phone 
            ? `<a href="tel:${farmer.phone}" style="color:#0d6efd; text-decoration:none; font-weight:600;">📞 ${farmer.phone}</a>` 
            : '<span style="color:#adb5bd;">N/A</span>';

        let cardContainer = document.createElement("div");
        cardContainer.style.cssText = "background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:16px; padding:16px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); transition:all 0.3s ease;";

        let cardHeaderHtml = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #f1f5f9; padding-bottom:10px; margin-bottom:10px;">
                <div>
                    <h3 style="margin:0 0 4px 0; color:#1e293b; font-size:17px; font-weight:700;">🏝️ ${farmer.name}</h3>
                    <div style="font-size:12px; color:#64748b; font-weight:500;">
                        <span>Owner ID: <strong style="color:#334155;">${farmer.owner || 'N/A'}</strong></span> | 
                        <span>Cluster: <strong style="color:#334155;">${farmer.cluster || 'N/A'}</strong></span>
                    </div>
                </div>
                <div style="display:flex; gap:6px;">
                    <button onclick="viewFarmerFullHistory(${fIdx})" title="History" style="background:#0ea5e9; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600;">📜 History</button>
                    <button onclick="openFormModal('editFarmer', ${fIdx})" title="Edit" style="background:#3b82f6; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600;">✏️ Edit</button>
                    <button onclick="deleteFarmer(${fIdx})" title="Delete" style="background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600;">🗑️</button>
                </div>
            </div>
            
            <div style="background:#f8fafc; padding:8px 12px; border-radius:8px; font-size:12px; color:#475569; margin-bottom:10px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                <div><strong>Phone:</strong> ${phoneDisplay}</div>
                <div><strong>Supplier ID:</strong> ${farmer.supplierId || farmer.sap || 'N/A'}</div>
                <div><strong>Supplier Name:</strong> ${farmer.supplier || 'N/A'}</div>
            </div>`;

        if (farmer.lands && farmer.lands.length > 0) {
            cardHeaderHtml += `<div style="font-size:12px; font-weight:600; color:#334155; margin-bottom:6px;">మొత్తం తోటలు (Lands):</div>`;
            farmer.lands.forEach((land, lIdx) => {
                let historyCount = (land.history && land.history.length) ? land.history.length : 0;
                
                // Plantation Year Format (14 Series ID ki mundhu)
                let plantYearDisplay = (land.plantYear && land.plantYear !== 'N/A') 
                    ? `<span style="color:#16a34a; font-weight:700; margin-right:4px;">🌱 [${land.plantYear}]</span>` 
                    : '';

                cardHeaderHtml += `
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-left:4px solid #10b981; padding:8px 12px; margin-top:6px; border-radius:6px; font-size:12px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:#0f172a;">${plantYearDisplay}Land ID: <span style="color:#2563eb;">${land.landId}</span></strong> 
                        <span style="color:#64748b; margin-left:8px;">(${land.area} ఎకరాలు)</span>
                        <div style="color:#059669; font-size:11px; margin-top:2px;">హార్వెస్ట్‌లు: ${historyCount} రికార్డులు</div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button onclick="selectFarmerForHarvest(${fIdx}, ${lIdx})" style="background:#d1fae5; color:#065f46; border:1px solid #10b981; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:700;">🏝️Harvest</button>
                        <button onclick="deleteLand(${fIdx}, ${lIdx})" style="background:#fee2e2; color:#991b1b; border:1px solid #f87171; padding:4px 6px; border-radius:6px; cursor:pointer; font-size:11px;">🗑️</button>
                    </div>
                </div>`;
            });
        } else {
            cardHeaderHtml += `<div style="font-size:12px; color:#94a3b8; font-style:italic; padding:4px 0;">(ఈ రైతుకి భూమి వివరాలు నమోదు కాలేదు)</div>`;
        }

        cardContainer.innerHTML = cardHeaderHtml;
        fragment.appendChild(cardContainer);
    });

    list.innerHTML = "";
    list.appendChild(fragment);
}

// 6. 10 DAYS HARVEST REMINDER & POPUP
function renderHarvestedTable() {
    const popupContent = document.getElementById("harvestPopupContent");
    const badgeCount = document.getElementById("harvestBadgeCount");
    if (!popupContent || !badgeCount) return;

    popupContent.innerHTML = "";
    let harvestItems = [];
    const today = parseLocalDate(getTodayStr());
    today.setHours(0, 0, 0, 0);

    farmers.forEach((farmer, fIdx) => {
        if (farmer.lands && Array.isArray(farmer.lands)) {
            farmer.lands.forEach((land, lIdx) => {
                if (land.history && land.history.length > 0) {
                    let sortedHistory = [...land.history].sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));
                    let latestHarvest = sortedHistory[0];

                    if (latestHarvest && latestHarvest.date && !latestHarvest.isHarvestDone) {
                        let harvestDate = parseLocalDate(latestHarvest.date);
                        harvestDate.setHours(0, 0, 0, 0);
                        let diffDays = Math.floor((today - harvestDate) / (1000 * 60 * 60 * 24));

                        if (diffDays >= 10) {
                            let originalHIdx = land.history.indexOf(latestHarvest);
                            harvestItems.push({
                                fIdx, lIdx, hIdx: originalHIdx,
                                farmerName: farmer.name,
                                sapId: farmer.owner || farmer.sap || farmer.supplierId || '-',
                                landId: land.landId,
                                date: latestHarvest.date,
                                tons: latestHarvest.tons || 0,
                                days: diffDays
                            });
                        }
                    }
                }
            });
        }
    });

    badgeCount.innerText = harvestItems.length;

    if (harvestItems.length === 0) {
        popupContent.innerHTML = `<div style="text-align:center; color:#888; padding:20px; font-size:13px;">10 రోజులు దాటిన తోటల అలర్ట్‌లు ఏవీ లేవు. 👍</div>`;
        return;
    }

    harvestItems.sort((a, b) => b.days - a.days);

    harvestItems.forEach((item, index) => {
        let parts = item.date.split('-');
        let displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : item.date;

        let div = document.createElement("div");
        div.style.cssText = "padding: 10px 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; font-size: 12px;";
        div.innerHTML = `
            <div>
                <strong style="color: #333; font-size:13px;">${index + 1}. ${item.farmerName}</strong><br>
                <span style="color: #555;">Owner/SAP ID: ${item.sapId} | Land ID: <b>${item.landId}</b></span><br>
                <span style="color: #d32f2f; font-weight:bold;">చివరి హార్వెస్ట్: ${displayDate} (${item.days} రోజులు పూర్తయ్యాయి)</span>
            </div>
            <button onclick="markHarvestDone(${item.fIdx}, ${item.lIdx}, ${item.hIdx})" style="background:#28a745; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">Done</button>
        `;
        popupContent.appendChild(div);
    });
}

function toggleHarvestPopup() {
    const modal = document.getElementById("harvestPopupModal");
    if (modal) {
        let isVisible = modal.style.display === "block" || modal.style.display === "flex";
        modal.style.display = isVisible ? "none" : "flex";
        if (!isVisible) renderHarvestedTable();
    }
}

function markHarvestDone(fIdx, lIdx, hIdx) {
    if (farmers[fIdx] && farmers[fIdx].lands[lIdx] && farmers[fIdx].lands[lIdx].history[hIdx]) {
        farmers[fIdx].lands[lIdx].history[hIdx].isHarvestDone = true;
        saveData();
        renderHarvestedTable();
    }
}

// 7. TODAY HARVEST POPUP
function toggleTodayHarvestPopup() {
    const modal = document.getElementById("todayHarvestPopupModal");
    if (modal) {
        let isVisible = modal.style.display === "block" || modal.style.display === "flex";
        modal.style.display = isVisible ? "none" : "flex";
        if (!isVisible) renderTodayHarvestTable();
    }
}

function renderTodayHarvestTable() {
    const popupContent = document.getElementById("todayHarvestPopupContent");
    const badgeCount = document.getElementById("todayHarvestBadgeCount");
    if (!popupContent || !badgeCount) return;

    popupContent.innerHTML = "";
    let harvestItems = [];
    const todayStr = getTodayStr();

    farmers.forEach((farmer) => {
        if (farmer.lands && Array.isArray(farmer.lands)) {
            farmer.lands.forEach((land) => {
                if (land.history && Array.isArray(land.history)) {
                    land.history.forEach((h) => {
                        if (h.date === todayStr) {
                            harvestItems.push({ 
                                farmerName: farmer.name, 
                                sapId: farmer.owner || farmer.sap || farmer.supplierId || '-', 
                                landId: land.landId, 
                                date: h.date, 
                                tons: h.tons || 0, 
                                acres: h.acres || 0,
                                weightBridge: h.weightBridge || '-'
                            });
                        }
                    });
                }
            });
        }
    });

    if (badgeCount) badgeCount.innerText = harvestItems.length;
    if (harvestItems.length === 0) {
        popupContent.innerHTML = `<div style="text-align:center; color:#888; padding:15px; font-size:13px;">ఈరోజు హార్వెస్ట్ రికార్డులు ఏవీ నమోదు కాలేదు.</div>`;
        return;
    }
    harvestItems.forEach((item, idx) => {
        let div = document.createElement("div");
        div.style.cssText = "padding: 8px 10px; border-bottom: 1px solid #f1f1f1; display: flex; justify-content: space-between; align-items: center; font-size: 12px;";
        div.innerHTML = `
            <div>
                <strong style="color: #333; font-size:13px;">${idx + 1}. ${item.farmerName}</strong><br>
                <span style="color: #666;">Owner ID: ${item.sapId} | Land: ${item.landId} | CC: ${item.weightBridge}</span><br>
                <span style="color: #28a745; font-weight:bold;">ఎకరాలు: ${item.acres} | టన్స్: ${item.tons} T</span>
            </div>
            <span style="background:#e8f5e9; color:#2e7d32; padding:3px 6px; border-radius:4px; font-size:11px; font-weight:bold;">ఈరోజే</span>
        `;
        popupContent.appendChild(div);
    });
}

// 8. CSV / EXCEL EXPORT & BACKUP
function downloadCSVFile(csvContent, fileName) {
    let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    let url = URL.createObjectURL(blob);
    let link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 200);
}

function downloadHarvestCSV() {
    let startDate = document.getElementById("startDate") ? document.getElementById("startDate").value : "";
    let endDate = document.getElementById("endDate") ? document.getElementById("endDate").value : "";
    
    let csvRows = [];
    csvRows.push([
        "S.No", 
        "Cluster No.", 
        "Area Manager", 
        "Land ID", 
        "Owner Name", 
        "No. of Acres Harvesting", 
        "Estimated Tons", 
        "Supplier ID", 
        "Expected CC"
    ].map(v => `"${v}"`).join(","));

    let recordCount = 0;
    let serialNo = 1;

    farmers.forEach(farmer => {
        if (farmer.lands && Array.isArray(farmer.lands)) {
            farmer.lands.forEach(land => {
                if (land.history && Array.isArray(land.history)) {
                    land.history.forEach(h => {
                        let hDate = normalizeDateStr(h.date);
                        let matches = true;
                        
                        if (startDate && hDate < startDate) matches = false;
                        if (endDate && hDate > endDate) matches = false;

                        if (matches) {
                            let clusterNo = farmer.cluster || land.cluster || ''; 
                            let areaManager = "Dr.V.K. Gogireddy"; 
                            let supplierId = farmer.supplierId || farmer.sap || farmer.owner || '';
                            let expectedCC = h.weightBridge || '';

                            csvRows.push([
                                serialNo++,
                                clusterNo,
                                areaManager,
                                land.landId || '',
                                farmer.name || '',
                                h.acres || land.area || '',
                                h.tons || '',
                                supplierId,
                                expectedCC
                            ].map(v => `"${v}"`).join(","));

                            recordCount++;
                        }
                    });
                }
            });
        }
    });

    if (recordCount === 0) {
        alert("సెలెక్ట్ చేసిన తేదీలలో ఎలాంటి హార్వెస్ట్ రికార్డులు లేవు!");
        return;
    }

    let csvContent = "\uFEFF" + csvRows.join("\n");
    let fileName = (startDate && endDate) 
        ? `Harvest_Report_${startDate}_to_${endDate}.csv` 
        : `Harvest_Report_All.csv`;
    
    downloadCSVFile(csvContent, fileName);
}

// FULL BACKUP TO EXCEL (.XLSX)
function exportDataToExcel() {
    if (!farmers || farmers.length === 0) {
        alert("ఎక్స్‌పోర్ట్ చేయడానికి ఎలాంటి డేటా లేదు!");
        return;
    }

    if (typeof XLSX === "undefined") {
        alert("XLSX లైబ్రరీ కనుగొనబడలేదు! దయచేసి ఇంటర్నెట్ సరిగ్గా ఉందో లేదో సరిచూసుకోండి.");
        return;
    }

    let exportRows = [];

    farmers.forEach(farmer => {
        if (farmer.lands && farmer.lands.length > 0) {
            farmer.lands.forEach(land => {
                if (land.history && land.history.length > 0) {
                    land.history.forEach(h => {
                        exportRows.push({
                            "Cluster No.": farmer.cluster || '',
                            "Owner ID": farmer.owner || '',
                            "Farm Owner Name": farmer.name || '',
                            "Supplier ID": farmer.supplierId || farmer.sap || '',
                            "Supplier Name": farmer.supplier || '',
                            "Phone Number": farmer.phone || '',
                            "Plantation Year": land.plantYear || '',
                            "Land ID": land.landId || '',
                            "Area Proposed": land.area || '',
                            "Harvest Date": h.date || '',
                            "No. of Acres Harvesting": h.acres || '',
                            "Estimated Tons": h.tons || '',
                            "Expected CC": h.weightBridge || ''
                        });
                    });
                } else {
                    exportRows.push({
                        "Cluster No.": farmer.cluster || '',
                        "Owner ID": farmer.owner || '',
                        "Farm Owner Name": farmer.name || '',
                        "Supplier ID": farmer.supplierId || farmer.sap || '',
                        "Supplier Name": farmer.supplier || '',
                        "Phone Number": farmer.phone || '',
                        "Plantation Year": land.plantYear || '',
                        "Land ID": land.landId || '',
                        "Area Proposed": land.area || '',
                        "Harvest Date": '',
                        "No. of Acres Harvesting": '',
                        "Estimated Tons": '',
                        "Expected CC": ''
                    });
                }
            });
        } else {
            exportRows.push({
                "Cluster No.": farmer.cluster || '',
                "Owner ID": farmer.owner || '',
                "Farm Owner Name": farmer.name || '',
                "Supplier ID": farmer.supplierId || farmer.sap || '',
                "Supplier Name": farmer.supplier || '',
                "Phone Number": farmer.phone || '',
                "Plantation Year": '',
                "Land ID": '',
                "Area Proposed": '',
                "Harvest Date": '',
                "No. of Acres Harvesting": '',
                "Estimated Tons": '',
                "Expected CC": ''
            });
        }
    });

    let ws = XLSX.utils.json_to_sheet(exportRows);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Backup_Data");

    XLSX.writeFile(wb, `oil_palm_backup_${getTodayStr()}.xlsx`);
}

function exportData() {
    exportDataToExcel();
}

// 9. MODAL CONTROLLERS & EDIT / DELETE FARMER & HISTORY
function openFormModal(formType, paramIndex = null) {
    let modal = document.getElementById("formModal");
    let body = document.getElementById("formModalBody");
    let title = document.getElementById("formModalTitle");

    if (!modal) {
        modal = document.createElement("div");
        modal.id = "formModal";
        modal.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2000; justify-content:center; align-items:center;";
        modal.innerHTML = `
            <div style="background:white; width:90%; max-width:400px; padding:20px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.2);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:8px;">
                    <h3 id="formModalTitle" style="margin:0; font-size:16px; color:#1e293b;">Modal</h3>
                    <span style="font-size:20px; font-weight:bold; color:#888; cursor:pointer;" onclick="closeFormModal()">&times;</span>
                </div>
                <div id="formModalBody"></div>
            </div>
        `;
        document.body.appendChild(modal);
        body = document.getElementById("formModalBody");
        title = document.getElementById("formModalTitle");
    }

    if (formType === 'addFarmer') {
        title.innerText = "➕ నూతన రైతుని నమోదు చేయండి";
        body.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:10px;">
                <input type="text" id="mFarmerName" placeholder="రైతు పేరు (Farmer Name)" style="padding:10px; border:1px solid #ccc; border-radius:5px; font-size:14px;">
                <input type="text" id="mOwnerId" placeholder="Owner ID" style="padding:10px; border:1px solid #ccc; border-radius:5px; font-size:14px;">
                <input type="text" id="mSapId" placeholder="SAP / Supplier ID" style="padding:10px; border:1px solid #ccc; border-radius:5px; font-size:14px;">
                <input type="text" id="mCluster" placeholder="Cluster No." style="padding:10px; border:1px solid #ccc; border-radius:5px; font-size:14px;">
                <input type="text" id="mPhone" placeholder="Phone Number" style="padding:10px; border:1px solid #ccc; border-radius:5px; font-size:14px;">
                <input type="text" id="mPlantYear" placeholder="Plantation Year (e.g. 2020)" style="padding:10px; border:1px solid #ccc; border-radius:5px; font-size:14px;">
                <input type="text" id="mLandId" placeholder="Land ID (Optional)" style="padding:10px; border:1px solid #ccc; border-radius:5px; font-size:14px;">
                <input type="number" id="mLandArea" placeholder="Land Area / Acres (Optional)" step="any" style="padding:10px; border:1px solid #ccc; border-radius:5px; font-size:14px;">
                <button onclick="saveModalFarmer()" style="background:#10b981; color:white; border:none; padding:10px; border-radius:5px; font-weight:bold; cursor:pointer; font-size:14px; margin-top:5px;">Save Farmer</button>
            </div>
        `;
    } else if (formType === 'editFarmer') {
        const farmer = farmers[paramIndex];
        if (!farmer) return;
        title.innerText = "✏️ రైతు వివరాలు ఎడిట్ చేయండి";
        body.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:10px;">
                <input type="text" id="mFarmerName" value="${farmer.name || ''}" placeholder="రైతు పేరు" style="padding:10px; border:1px solid #ccc; border-radius:5px; font-size:14px;">
                <input type="text" id="mOwnerId" value="${farmer.owner || ''}" placeholder="Owner ID" style="padding:10px; border:1px solid #ccc; border-radius:5px; font-size:14px;">
                <input type="text" id="mSapId" value="${farmer.supplierId || farmer.sap || ''}" placeholder="Supplier ID / SAP ID" style="padding:10px; border:1px solid #ccc; border-radius:5px; font-size:14px;">
                <input type="text" id="mSupplierName" value="${farmer.supplier || ''}" placeholder="Supplier Name" style="padding:10px; border:1px solid #ccc; border-radius:5px; font-size:14px;">
                <input type="text" id="mCluster" value="${farmer.cluster || ''}" placeholder="Cluster No." style="padding:10px; border:1px solid #ccc; border-radius:5px; font-size:14px;">
                <input type="text" id="mPhone" value="${farmer.phone || ''}" placeholder="Phone Number" style="padding:10px; border:1px solid #ccc; border-radius:5px; font-size:14px;">
                <button onclick="saveEditedFarmer(${paramIndex})" style="background:#3b82f6; color:white; border:none; padding:10px; border-radius:5px; font-weight:bold; cursor:pointer; font-size:14px; margin-top:5px;">Update Details</button>
            </div>
        `;
    }
    modal.style.display = "flex";
}

function closeFormModal() {
    const modal = document.getElementById("formModal");
    if (modal) modal.style.display = "none";
}

function saveModalFarmer() {
    const name = document.getElementById("mFarmerName").value.trim();
    const owner = document.getElementById("mOwnerId").value.trim();
    const sap = document.getElementById("mSapId").value.trim();
    const cluster = document.getElementById("mCluster").value.trim();
    const phone = document.getElementById("mPhone").value.trim();
    const plantYear = document.getElementById("mPlantYear") ? document.getElementById("mPlantYear").value.trim() : "";
    const landId = document.getElementById("mLandId") ? document.getElementById("mLandId").value.trim() : "";
    const area = document.getElementById("mLandArea") ? parseFloat(document.getElementById("mLandArea").value) || 0 : 0;

    if (!name && !owner) {
        alert("Please enter Farmer Name or Owner ID!");
        return;
    }

    let existingFarmer = farmers.find(f => 
        (owner && String(f.owner).trim() === owner) || 
        (name && String(f.name).trim().toLowerCase() === name.toLowerCase())
    );

    if (!existingFarmer) {
        existingFarmer = {
            name: name || 'Unknown Farmer',
            owner: owner,
            sap: sap,
            supplierId: sap,
            phone: phone,
            cluster: cluster,
            lands: []
        };
        farmers.push(existingFarmer);
    } else {
        if (phone && !existingFarmer.phone) existingFarmer.phone = phone;
        if (cluster && !existingFarmer.cluster) existingFarmer.cluster = cluster;
        if (sap && !existingFarmer.sap) existingFarmer.sap = sap;
    }

    if (landId) {
        let existingLand = existingFarmer.lands.find(l => String(l.landId).trim() === landId);
        if (!existingLand) {
            existingFarmer.lands.push({
                landId: landId,
                cluster: cluster || existingFarmer.cluster || '',
                area: area,
                plantYear: plantYear || 'N/A',
                history: []
            });
        } else {
            if (area > 0) existingLand.area = area;
            if (plantYear) existingLand.plantYear = plantYear;
        }
    }

    cleanupDuplicates();
    saveData();
    closeFormModal();
    alert("Farmer successfully add ayyaru!");
}

function saveEditedFarmer(fIdx) {
    if (!farmers[fIdx]) return;

    const name = document.getElementById("mFarmerName").value.trim();
    const owner = document.getElementById("mOwnerId").value.trim();
    const sap = document.getElementById("mSapId").value.trim();
    const supplier = document.getElementById("mSupplierName").value.trim();
    const cluster = document.getElementById("mCluster").value.trim();
    const phone = document.getElementById("mPhone").value.trim();

    farmers[fIdx].name = name || farmers[fIdx].name;
    farmers[fIdx].owner = owner;
    farmers[fIdx].sap = sap;
    farmers[fIdx].supplierId = sap;
    farmers[fIdx].supplier = supplier;
    farmers[fIdx].cluster = cluster;
    farmers[fIdx].phone = phone;

    cleanupDuplicates();
    saveData();
    closeFormModal();
}

function deleteFarmer(fIdx) {
    if (confirm(`మీరు ఖచ్చితంగా '${farmers[fIdx].name}' రైతు వివరాలను డిలీట్ చేయాలనుకుంటున్నారా?`)) {
        farmers.splice(fIdx, 1);
        saveData();
    }
}

function deleteLand(fIdx, lIdx) {
    if (confirm("ఈ భూమి మరియు దాని హార్వెస్ట్ హిస్టరీని డిలీట్ చేయాలా?")) {
        farmers[fIdx].lands.splice(lIdx, 1);
        saveData();
    }
}

function viewFarmerFullHistory(farmerIndex) {
    let farmer = farmers[farmerIndex];
    if (!farmer) return;

    let modal = document.getElementById("historyPopupModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "historyPopupModal";
        modal.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2000; justify-content:center; align-items:center;";
        modal.innerHTML = `
            <div style="background:white; width:92%; max-width:500px; padding:18px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.2); position:relative; max-height:85vh; display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:8px;">
                    <h3 id="historyModalTitle" style="margin:0; font-size:16px; color:#333;">History</h3>
                    <button onclick="closeHistoryPopup()" style="background:none; border:none; font-size:20px; cursor:pointer; color:#888;">✕</button>
                </div>
                <div id="historyModalBody" style="overflow-y:auto; margin-top:12px; font-size:13px; flex-grow:1;"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById("historyModalTitle").innerText = `${farmer.name} - హార్వెస్ట్ హిస్టరీ`;
    let bodyDiv = document.getElementById("historyModalBody");
    bodyDiv.innerHTML = "";

    let hasHistory = false;
    if (farmer.lands && farmer.lands.length > 0) {
        let htmlContent = "";
        farmer.lands.forEach((land, lIdx) => {
            if (land.history && land.history.length > 0) {
                hasHistory = true;
                let plantYearTag = land.plantYear ? `🌱 [${land.plantYear}] ` : '';
                htmlContent += `
                    <div style="font-weight:bold; color:#007bff; margin-top:10px; background:#eef7ff; padding:4px 8px; border-radius:4px;">${plantYearTag}Land ID: ${land.landId} (${land.area} ఎకరాలు)</div>
                    <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:10px; margin-top:5px;">
                        <thead><tr style="background:#f1f1f1;"><th style="border:1px solid #ddd; padding:4px;">తేదీ</th><th style="border:1px solid #ddd; padding:4px;">ఎకరాలు</th><th style="border:1px solid #ddd; padding:4px;">టన్స్</th><th style="border:1px solid #ddd; padding:4px;">CC</th><th style="border:1px solid #ddd; padding:4px;">చర్యలు</th></tr></thead>
                        <tbody>`;
                land.history.forEach((h, hIdx) => {
                    htmlContent += `
                        <tr>
                            <td style="border:1px solid #ddd; padding:4px; text-align:center;">${h.date || '-'}</td>
                            <td style="border:1px solid #ddd; padding:4px; text-align:center;">${h.acres || '-'}</td>
                            <td style="border:1px solid #ddd; padding:4px; text-align:center; font-weight:bold; color:#28a745;">${h.tons || '0'} T</td>
                            <td style="border:1px solid #ddd; padding:4px; text-align:center;">${h.weightBridge || '-'}</td>
                            <td style="border:1px solid #ddd; padding:4px; text-align:center;">
                                <button onclick="editHarvest(${farmerIndex}, ${lIdx}, ${hIdx})" style="background:#e3f2fd; color:#0d6efd; border:none; padding:2px 5px; border-radius:3px; cursor:pointer;">✏️</button>
                                <button onclick="deleteHarvest(${farmerIndex}, ${lIdx}, ${hIdx})" style="background:#ffebee; color:#d32f2f; border:none; padding:2px 5px; border-radius:3px; cursor:pointer;">🗑️</button>
                            </td>
                        </tr>`;
                });
                htmlContent += `</tbody></table>`;
            }
        });
        bodyDiv.innerHTML = htmlContent;
    }

    if (!hasHistory) {
        bodyDiv.innerHTML = `<div style="text-align:center; color:#888; padding:20px;">ఈ రైతుకు గత హార్వెస్ట్ రికార్డులు ఏవీ లేవు.</div>`;
    }

    modal.style.display = "flex";
}

function editHarvest(fIdx, lIdx, hIdx) {
    let record = farmers[fIdx].lands[lIdx].history[hIdx];
    let newTons = prompt("నూతన టన్నులు (Tons) నమోదు చేయండి:", record.tons);
    if (newTons === null) return;

    let newAcres = prompt("నూతన ఎకరాలు (Acres) నమోదు చేయండి:", record.acres);
    if (newAcres === null) return;

    let newDate = prompt("తేదీ (YYYY-MM-DD):", record.date);
    if (newDate === null) return;

    farmers[fIdx].lands[lIdx].history[hIdx].tons = parseFloat(newTons) || 0;
    farmers[fIdx].lands[lIdx].history[hIdx].acres = parseFloat(newAcres) || 0;
    farmers[fIdx].lands[lIdx].history[hIdx].date = normalizeDateStr(newDate);

    saveData();
    viewFarmerFullHistory(fIdx);
}

function deleteHarvest(fIdx, lIdx, hIdx) {
    if (confirm("ఈ హార్వెస్ట్ రికార్డును తొలగించాలా?")) {
        farmers[fIdx].lands[lIdx].history.splice(hIdx, 1);
        saveData();
        viewFarmerFullHistory(fIdx);
    }
}

function closeHistoryPopup() {
    let modal = document.getElementById("historyPopupModal");
    if (modal) modal.style.display = "none";
}

function selectFarmerForHarvest(fIdx, lIdx) {
    const harvestFarmer = document.getElementById("harvestFarmer");
    if (harvestFarmer) {
        harvestFarmer.value = fIdx;
        harvestFarmer.dispatchEvent(new Event('change'));

        setTimeout(() => {
            const checkbox = document.querySelector(`input[name='landCheckbox'][value='${lIdx}']`);
            if (checkbox) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change'));
            }
        }, 120);

        harvestFarmer.scrollIntoView({ behavior: 'smooth' });
    }
}

// 10. INITIALIZATION & EVENT LISTENERS
document.addEventListener("DOMContentLoaded", () => {
    cleanupDuplicates();
    saveData();

    // EXCEL / CSV IMPORT FUNCTIONALITY (WITH PLANTATION YEAR SUPPORT)
    function processImportFile(file) {
        if (!file) {
            alert("దయచేసి ఫైల్‌ని సెలెక్ట్ చేయండి!");
            return;
        }

        if (typeof XLSX === "undefined") {
            alert("XLSX లైబ్రరీ కనుగొనబడలేదు!");
            return;
        }

        let reader = new FileReader();
        reader.onload = function(e) {
            try {
                let data = new Uint8Array(e.target.result);
                let workbook = XLSX.read(data, { type: 'array' });
                let firstSheetName = workbook.SheetNames[0];
                let worksheet = workbook.Sheets[firstSheetName];
                let jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                if (jsonData.length === 0) {
                    alert("ఫైల్‌లో డేటా ఖాళీగా ఉంది!");
                    return;
                }

                let addedFarmers = 0;
                let updatedFarmers = 0;
                let importedHarvests = 0;

                function getFieldValue(rowObj, possibleNames) {
                    let keys = Object.keys(rowObj);
                    for (let p of possibleNames) {
                        let cleanP = p.toLowerCase().replace(/[^a-z0-9]/g, '');
                        let matchedKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanP);
                        if (matchedKey && String(rowObj[matchedKey]).trim() !== '') {
                            return String(rowObj[matchedKey]).trim();
                        }
                    }
                    return '';
                }

                jsonData.forEach(row => {
                    let clusterNo = getFieldValue(row, ['Cluster No.', 'Cluster No', 'Cluster', 'CLUSTER', 'క్లస్టర్']);
                    
                    let fLastName = getFieldValue(row, ['Owner Last Name', 'Surname', 'ఇంటి పేరు', 'Last Name']);
                    let fFirstName = getFieldValue(row, ['Farm Owner Name', 'First Name', 'Farmer Name', 'పేరు', 'Name', 'Owner Name']);
                    let farmerName = (fLastName && fFirstName) ? `${fLastName} ${fFirstName}` : (fFirstName || fLastName || '');

                    let sLastName = getFieldValue(row, ['Supplier Last Name']);
                    let sFirstName = getFieldValue(row, ['Supplier Name']);
                    let supplierName = (sLastName && sFirstName) ? `${sLastName} ${sFirstName}` : (sFirstName || sLastName || farmerName);

                    let ownerId = getFieldValue(row, ['Farmowner ID', 'Owner ID', 'FarmownerID', 'OwnerID']);
                    let sapId = getFieldValue(row, ['SAP ID', 'SAP', 'SAPID']);
                    let supplierId = getFieldValue(row, ['Supplier ID', 'SupplierID']) || sapId;
                    let landId = getFieldValue(row, ['Farmer/Land ID', 'Land ID', 'LandID', 'భూమి ID', 'Plot ID', 'PlotID']);
                    let area = parseFloat(getFieldValue(row, ['Area Proposed', 'Acres', 'ఎకరాలు', 'Area', 'No. of Acres Harvesting'])) || 0;
                    let phoneNum = getFieldValue(row, ['Phone Number', 'Phone', 'Mobile', 'Cell']);

                    // Plantation Year Column Detection
                    let plantYear = getFieldValue(row, ['Plantation Year', 'Planting Year', 'Plant Year', 'Year', 'సంవత్సరం']);

                    let rawHDate = getFieldValue(row, ['Harvest Date', 'Date', 'తేదీ']);
                    let hDate = rawHDate ? normalizeDateStr(rawHDate) : '';
                    let hTons = parseFloat(getFieldValue(row, ['Estimated Tons', 'Tons', 'టన్నులు'])) || 0;
                    let hAcres = parseFloat(getFieldValue(row, ['No. of Acres Harvesting', 'Harvest Acres'])) || area;
                    let hWeightBridge = getFieldValue(row, ['Expected CC', 'CC', 'WeightBridge']);

                    if (farmerName || ownerId || landId) {
                        let cleanLandId = landId.trim();
                        let cleanOwnerId = ownerId.trim();
                        let cleanFarmerName = farmerName.trim().toLowerCase();

                        let targetFarmer = null;

                        if (cleanLandId) {
                            for (let f of farmers) {
                                if (f.lands && f.lands.some(l => String(l.landId || '').trim() === cleanLandId)) {
                                    targetFarmer = f;
                                    break;
                                }
                            }
                        }

                        if (!targetFarmer && cleanOwnerId) {
                            targetFarmer = farmers.find(f => String(f.owner || '').trim() === cleanOwnerId);
                        }

                        if (!targetFarmer && cleanFarmerName) {
                            targetFarmer = farmers.find(f => String(f.name || '').trim().toLowerCase() === cleanFarmerName);
                        }

                        if (targetFarmer) {
                            if (clusterNo && !targetFarmer.cluster) targetFarmer.cluster = clusterNo;
                            if (phoneNum && !targetFarmer.phone) targetFarmer.phone = phoneNum;
                            if (supplierId && !targetFarmer.supplierId) targetFarmer.supplierId = supplierId;
                            if (supplierName && !targetFarmer.supplier) targetFarmer.supplier = supplierName;
                            if (ownerId && !targetFarmer.owner) targetFarmer.owner = ownerId;
                            updatedFarmers++;
                        } else {
                            targetFarmer = {
                                name: farmerName || 'Unknown Farmer',
                                owner: ownerId,
                                sap: sapId,
                                supplierId: supplierId,
                                supplier: supplierName,
                                phone: phoneNum,
                                cluster: clusterNo,
                                lands: []
                            };
                            farmers.push(targetFarmer);
                            addedFarmers++;
                        }

                        if (landId) {
                            if (!targetFarmer.lands) targetFarmer.lands = [];

                            let existingLand = targetFarmer.lands.find(l => String(l.landId || '').trim() === cleanLandId);

                            if (!existingLand) {
                                existingLand = {
                                    landId: landId,
                                    cluster: clusterNo,
                                    area: area,
                                    plantYear: plantYear || 'N/A',
                                    history: []
                                };
                                targetFarmer.lands.push(existingLand);
                            } else {
                                if (area > 0) existingLand.area = area;
                                if (plantYear) existingLand.plantYear = plantYear;
                            }

                            if (hDate || hTons > 0) {
                                if (!existingLand.history) existingLand.history = [];
                                let dateToUse = hDate || getTodayStr();
                                
                                let isDup = existingLand.history.some(h => h.date === dateToUse && parseFloat(h.tons) === hTons);
                                if (!isDup) {
                                    existingLand.history.push({
                                        date: dateToUse,
                                        acres: hAcres,
                                        tons: hTons,
                                        weightBridge: hWeightBridge,
                                        isHarvestDone: false
                                    });
                                    importedHarvests++;
                                }
                            }
                        }
                    }
                });

                cleanupDuplicates();
                saveData();

                alert(`డేటా విజయవంతంగా ఇంపోర్ట్ చేయబడింది!\n- క్రొత్తగా చేరిన రైతులు: ${addedFarmers}\n- అప్‌డేట్ అయిన రైతులు: ${updatedFarmers}\n- చేరిన హార్వెస్ట్ రికార్డులు: ${importedHarvests}`);
            } catch (error) {
                console.error(error);
                alert("ఫైల్ ప్రాసెస్ చేయడంలో లోపం ఏర్పడింది. దయచేసి సరైన Excel/CSV ఫైల్‌ని ఇవ్వండి.");
            }
        };
        reader.readAsArrayBuffer(file);
    }

    const importBtn = document.getElementById("importBtn");
    const excelFileInput = document.getElementById("excelFileInput");

    if (importBtn && excelFileInput) {
        importBtn.addEventListener("click", () => {
            if (excelFileInput.files.length > 0) {
                processImportFile(excelFileInput.files[0]);
            } else {
                alert("దయచేసి ముందుగా ఒక ఎక్సెల్ లేదా సీఎస్‌వీ ఫైల్‌ని సెలెక్ట్ చేయండి!");
            }
        });
    }

    const harvestFarmer = document.getElementById("harvestFarmer");
    if (harvestFarmer) {
        harvestFarmer.addEventListener("change", (e) => {
            const fIdx = e.target.value;
            const container = document.getElementById("harvestLandContainer");
            if (container) {
                container.innerHTML = "";
                
                if (fIdx !== "" && farmers[fIdx] && farmers[fIdx].lands && farmers[fIdx].lands.length > 0) {
                    let selectAllDiv = document.createElement("div");
                    selectAllDiv.style.cssText = "padding: 6px 0; border-bottom: 2px solid #007bff; font-weight: bold; font-size: 13px; color: #007bff; margin-bottom: 8px;";
                    selectAllDiv.innerHTML = `<label style="cursor:pointer;"><input type="checkbox" id="selectAllLands" style="margin-right: 8px;"> Select All Lands</label>`;
                    container.appendChild(selectAllDiv);

                    farmers[fIdx].lands.forEach((land, lIdx) => {
                        let div = document.createElement("div");
                        div.style.cssText = "padding: 8px 10px; font-size: 13px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 8px;";
                        let plantYearTag = land.plantYear ? `🌱 [${land.plantYear}] ` : '';
                        div.innerHTML = `
                            <label style="cursor:pointer; font-weight:bold; display:block; margin-bottom: 4px;">
                                <input type="checkbox" name="landCheckbox" value="${lIdx}" class="land-select-cb" style="margin-right: 8px;">
                                ${plantYearTag}Land ID: <span style="color:#007bff;">${land.landId}</span> (విస్తీర్ణం: ${land.area} ఎకరాలు)
                            </label>
                            <div id="landInputs_${lIdx}" style="display:none; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #ccc;">
                                <div style="display:flex; gap:10px;">
                                    <div style="flex:1;">
                                        <label style="font-size:11px; color:#555;">ఎకరాలు (Acres):</label>
                                        <input type="number" id="acres_${lIdx}" value="${land.area || ''}" step="any" style="width:100%; padding:5px; font-size:12px; border:1px solid #ccc; border-radius:4px;">
                                    </div>
                                    <div style="flex:1;">
                                        <label style="font-size:11px; color:#555;">టన్నులు (Tons):</label>
                                        <input type="number" id="tons_${lIdx}" placeholder="Tons" step="any" style="width:100%; padding:5px; font-size:12px; border:1px solid #ccc; border-radius:4px;">
                                    </div>
                                </div>
                            </div>
                        `;
                        container.appendChild(div);
                    });

                    document.querySelectorAll(".land-select-cb").forEach(cb => {
                        cb.addEventListener("change", function() {
                            let inputDiv = document.getElementById(`landInputs_${this.value}`);
                            if (inputDiv) inputDiv.style.display = this.checked ? "block" : "none";
                        });
                    });

                    const selectAllCb = document.getElementById("selectAllLands");
                    if (selectAllCb) {
                        selectAllCb.addEventListener("change", function() {
                            let checkboxes = document.querySelectorAll(".land-select-cb");
                            checkboxes.forEach(cb => {
                                cb.checked = this.checked;
                                let inputDiv = document.getElementById(`landInputs_${cb.value}`);
                                if (inputDiv) inputDiv.style.display = this.checked ? "block" : "none";
                            });
                        });
                    }

                } else {
                    container.innerHTML = `<span style="color: #888; font-size: 13px;">ఈ రైతుకు తోటల వివరాలు లేవు.</span>`;
                }
            }
        });
    }

    const saveHarvestBtn = document.getElementById("saveHarvest");
    if (saveHarvestBtn) {
        saveHarvestBtn.addEventListener("click", () => {
            const fIdx = document.getElementById("harvestFarmer") ? document.getElementById("harvestFarmer").value : "";
            let selectedCheckboxes = document.querySelectorAll("input[name='landCheckbox']:checked");
            
            const harvestDateEl = document.getElementById("harvestDate");
            const hDate = harvestDateEl && harvestDateEl.value ? normalizeDateStr(harvestDateEl.value) : getTodayStr();
            const ccSelect = document.getElementById("harvestCC");
            const weightBridge = ccSelect ? ccSelect.value : "";

            if (fIdx === "" || selectedCheckboxes.length === 0) {
                alert("దయచేసి రైతును మరియు కనీసం ఒక తోటను ఎంచుకోండి!");
                return;
            }

            let savedCount = 0;

            selectedCheckboxes.forEach(cb => {
                let lIdx = cb.value;
                let hAcres = document.getElementById(`acres_${lIdx}`) ? document.getElementById(`acres_${lIdx}`).value : "0";
                let hTons = document.getElementById(`tons_${lIdx}`) ? document.getElementById(`tons_${lIdx}`).value : "0";

                if (parseFloat(hTons) > 0) {
                    if (!farmers[fIdx].lands[lIdx].history) {
                        farmers[fIdx].lands[lIdx].history = [];
                    }

                    farmers[fIdx].lands[lIdx].history.push({
                        date: hDate,
                        acres: parseFloat(hAcres) || farmers[fIdx].lands[lIdx].area || 0,
                        tons: parseFloat(hTons) || 0,
                        weightBridge: weightBridge,
                        isHarvestDone: false
                    });
                    savedCount++;
                }
            });

            if (savedCount === 0) {
                alert("దయచేసి ఎంచుకున్న తోటకు టన్నులు (Tons) నమోదు చేయండి!");
                return;
            }

            saveData();
            
            if (harvestFarmer) {
                harvestFarmer.value = "";
                harvestFarmer.dispatchEvent(new Event('change'));
            }

            alert("హార్వెస్ట్ వివరాలు సేవ్ అయ్యాయి!");
        });
    }

    const downloadCSVBtn = document.getElementById("downloadCSV");
    if (downloadCSVBtn) {
        downloadCSVBtn.addEventListener("click", downloadHarvestCSV);
    }

    const searchInput = document.getElementById("search");
    let searchDebounceTimer = null;

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            clearTimeout(searchDebounceTimer);
            let term = e.target.value.toLowerCase().trim();

            searchDebounceTimer = setTimeout(() => {
                if (!term) {
                    renderFarmerCards(farmers);
                    return;
                }

                let filtered = [];
                farmerSearchMap.forEach((searchKey, idx) => {
                    if (searchKey.includes(term)) {
                        filtered.push(farmers[idx]);
                    }
                });

                renderFarmerCards(filtered);
            }, 120);
        });
    }
});

// IMPORT HANDLER FOR FILE INPUT
function importData(event) {
    let inputNode = event.target;
    let file = inputNode.files[0];
    if (file) {
        let fileInput = document.getElementById("excelFileInput");
        if (fileInput) {
            let container = new DataTransfer();
            container.items.add(file);
            fileInput.files = container.files;
        }
        let importBtn = document.getElementById("importBtn");
        if (importBtn) {
            importBtn.click();
        }
    }
}

// Toggle Form Visibility
function toggleAddForm() {
    openFormModal('addFarmer');
}

// Save New Farmer and Land Details Together
function saveNewFarmerLand() {
    saveModalFarmer();
}
