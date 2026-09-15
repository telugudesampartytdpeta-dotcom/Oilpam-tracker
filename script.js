// ==========================================
// 1. LOCAL STORAGE LOAD & SAVE
// ==========================================
let farmers = JSON.parse(localStorage.getItem("nbl_farmers_data")) || JSON.parse(localStorage.getItem("farmersData")) || [];

function saveData() {
    localStorage.setItem("nbl_farmers_data", JSON.stringify(farmers));
    localStorage.setItem("farmersData", JSON.stringify(farmers));
    updateDashboard();
    populateFarmerDropdowns();
    updateFarmerNameSelectDropdown();
    renderHarvestedTable();
    renderTodayHarvestTable();
}

// ==========================================
// 2. DASHBOARD UPDATE
// ==========================================
function updateDashboard() {
    let totalLands = 0;
    let totalHarvests = 0;
    let totalTonsSum = 0;
    let todayHarvestCount = 0;
    let todayTonsSum = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < farmers.length; i++) {
        let farmer = farmers[i];
        if (farmer.lands) {
            totalLands += farmer.lands.length;
            for (let j = 0; j < farmer.lands.length; j++) {
                let land = farmer.lands[j];
                if (land.history) {
                    totalHarvests += land.history.length;
                    for (let k = 0; k < land.history.length; k++) {
                        let h = land.history[k];
                        let t = parseFloat(h.tons) || 0;
                        totalTonsSum += t;
                        if (h.date === todayStr) {
                            todayHarvestCount++;
                            todayTonsSum += t;
                        }
                    }
                }
            }
        }
    }

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

// ==========================================
// 3. DROPDOWNS & WEIGHT BRIDGES
// ==========================================
function populateFarmerDropdowns() {
    const farmerSelect = document.getElementById("farmerSelect");
    const harvestFarmer = document.getElementById("harvestFarmer");

    if (farmerSelect || harvestFarmer) {
        let options = '<option value="">Select Farmer</option>';
        for (let i = 0; i < farmers.length; i++) {
            let farmer = farmers[i];
            let displayId = farmer.owner || farmer.sap || '';
            options += `<option value="${i}">${displayId} - ${farmer.name}</option>`;
        }
        if (farmerSelect) farmerSelect.innerHTML = options;
        if (harvestFarmer) harvestFarmer.innerHTML = options;
    }
}

function updateFarmerNameSelectDropdown() {
    const selectEl = document.getElementById("farmerNameSelect");
    if (selectEl) {
        let options = '<option value="">-- Select Farmer --</option>';
        for (let i = 0; i < farmers.length; i++) {
            let farmer = farmers[i];
            let displayId = farmer.owner || farmer.sap || '';
            options += `<option value="${displayId}">${displayId} - ${farmer.name}</option>`;
        }
        selectEl.innerHTML = options;
    }
}

// ==========================================
// 4. RENDER FARMER CARDS (OPTIMIZED)
// ==========================================
function renderFarmerCards(filteredData = null) {
    const list = document.getElementById("farmerList");
    if (!list) return;

    let dataToRender = filteredData ? filteredData : farmers;

    if (dataToRender.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#888;">రైతు వివరాలు ఏమీ లేవు.</p>`;
        return;
    }

    let htmlArray = [];
    for (let i = 0; i < dataToRender.length; i++) {
        let farmer = dataToRender[i];
        let fIdx = farmers.indexOf(farmer);
        let phoneDisplay = farmer.phone ? `<a href="tel:${farmer.phone}" style="color:#28a745; text-decoration:none; font-weight:bold;">📞 ${farmer.phone}</a>` : '<span style="color:#888;">Phone N/A</span>';

        let landsHtml = '';
        if (farmer.lands && farmer.lands.length > 0) {
            for (let j = 0; j < farmer.lands.length; j++) {
                let land = farmer.lands[j];
                landsHtml += `
                <div style="background:#f9f9f9; border-left:3px solid #4CAF50; padding:10px; margin-top:8px; border-radius:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span><strong>Land ID:</strong> ${land.landId} (${land.area} Acres)</span>
                        <div>
                            <button onclick="selectFarmerForHarvest(${fIdx}, ${j})" style="background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7; padding:3px 8px; border-radius:4px; cursor:pointer; font-size:12px; margin-right:5px;">🏝️ Harvester</button>
                            <button onclick="deleteLand(${fIdx}, ${j})" style="font-size:11px; background:#ffebee; color:#d32f2f; border:none; padding:3px 6px; cursor:pointer;">Delete</button>
                        </div>
                    </div>
                </div>`;
            }
        }

        htmlArray.push(`
        <div style="background:#fff; border:1px solid #ddd; border-radius:8px; margin-bottom:15px; padding:15px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0 0 5px 0; color:#333;">${farmer.name}</h3>
                <div>
                    <button onclick="viewFarmerFullHistory(${fIdx})" style="background:#17a2b8; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:5px; font-size:11px;">History</button>
                    <button onclick="editFarmer(${fIdx})" style="background:#007bff; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">✏️ Edit</button>
                    <button onclick="deleteFarmer(${fIdx})" style="background:#ffebee; color:#d32f2f; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Delete</button>
                </div>
            </div>
            <p style="font-size:13px; color:#555; margin: 5px 0;">
                <strong>Phone:</strong> ${phoneDisplay}
            </p>
            <p style="font-size:13px; color:#555; margin: 0;">
                <strong>Owner ID:</strong> ${farmer.owner || 'N/A'} | 
                <strong>SAP ID:</strong> ${farmer.sap || 'N/A'} | 
                <strong>Supplier:</strong> ${farmer.supplier || 'N/A'}
            </p>
            ${landsHtml}
        </div>`);
    }
    list.innerHTML = htmlArray.join('');
}

// ==========================================
// 5. REMINDERS & POPUPS
// ==========================================
function renderHarvestedTable() {
    const popupContent = document.getElementById("harvestPopupContent");
    const badgeCount = document.getElementById("harvestBadgeCount");
    if (!popupContent || !badgeCount) return;

    let harvestItems = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let fIdx = 0; fIdx < farmers.length; fIdx++) {
        let farmer = farmers[fIdx];
        if (farmer.lands) {
            for (let lIdx = 0; lIdx < farmer.lands.length; lIdx++) {
                let land = farmer.lands[lIdx];
                if (land.history) {
                    for (let hIdx = 0; hIdx < land.history.length; hIdx++) {
                        let h = land.history[hIdx];
                        if (h.date && !h.isHarvestDone) {
                            let harvestDate = new Date(h.date);
                            harvestDate.setHours(0, 0, 0, 0);
                            let diffDays = Math.floor((today - harvestDate) / (1000 * 60 * 60 * 24));
                            
                            if (diffDays >= 10) {
                                harvestItems.push({
                                    fIdx, lIdx, hIdx,
                                    farmerName: farmer.name,
                                    sapId: farmer.owner || farmer.sap || '-',
                                    landId: land.landId,
                                    date: h.date,
                                    tons: h.tons || 0,
                                    days: diffDays
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    badgeCount.innerText = harvestItems.length;

    if (harvestItems.length === 0) {
        popupContent.innerHTML = `<div style="text-align:center; color:#888; padding:20px; font-size:13px;">10 రోజులు దాటిన తోటల అలర్ట్‌లు ఏవీ లేవు</div>`;
        return;
    }

    let groupedByDate = {};
    for (let i = 0; i < harvestItems.length; i++) {
        let item = harvestItems[i];
        let parts = item.date.split('-');
        let displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : item.date;
        
        if (!groupedByDate[displayDate]) {
            groupedByDate[displayDate] = [];
        }
        groupedByDate[displayDate].push(item);
    }

    let html = "";
    let sortedDates = Object.keys(groupedByDate).sort();
    for (let d = 0; d < sortedDates.length; d++) {
        let dateKey = sortedDates[d];
        html += `<div style="background: #e9ecef; color: #333; padding: 6px 10px; font-weight: bold; font-size: 13px; margin-top: 8px; border-radius: 4px;">📅 తేదీ: ${dateKey}</div>`;
        
        let dateItems = groupedByDate[dateKey];
        for (let idx = 0; idx < dateItems.length; idx++) {
            let item = dateItems[idx];
            html += `
                <div style="padding: 10px 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                    <div>
                        <strong style="color: #333; font-size:13px;">${idx + 1}. ${item.farmerName}</strong><br>
                        <span style="color: #555; display:inline-block; margin-left:14px;">Owner/SAP: ${item.sapId} | Land: ${item.landId}</span><br>
                        <span style="color: #d32f2f; font-weight:bold; display:inline-block; margin-left:14px;">(${item.days} రోజులు పూర్తయ్యాయి)</span>
                    </div>
                    <button onclick="markHarvestDone(${item.fIdx}, ${item.lIdx}, ${item.hIdx})" style="background:#28a745; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">Done</button>
                </div>`;
        }
    }
    popupContent.innerHTML = html;
}

function toggleHarvestPopup() {
    const modal = document.getElementById("harvestPopupModal");
    if (modal) {
        let isVisible = modal.style.display === "block" || modal.style.display === "flex";
        modal.style.display = isVisible ? "none" : "block";
        if (!isVisible) renderHarvestedTable();
    }
}

function markHarvestDone(fIdx, lIdx, hIdx) {
    farmers[fIdx].lands[lIdx].history[hIdx].isHarvestDone = true;
    saveData();
    renderHarvestedTable();
}

function toggleTodayHarvestPopup() {
    const modal = document.getElementById("todayHarvestPopupModal");
    if (modal) {
        let isVisible = modal.style.display === "flex";
        modal.style.display = isVisible ? "none" : "flex";
        if (!isVisible) renderTodayHarvestTable();
    }
}

function renderTodayHarvestTable() {
    const popupContent = document.getElementById("todayHarvestPopupContent");
    const badgeCount = document.getElementById("todayHarvestBadgeCount");
    if (!popupContent || !badgeCount) return;

    let harvestItems = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < farmers.length; i++) {
        let farmer = farmers[i];
        if (farmer.lands) {
            for (let j = 0; j < farmer.lands.length; j++) {
                let land = farmer.lands[j];
                if (land.history) {
                    for (let k = 0; k < land.history.length; k++) {
                        let h = land.history[k];
                        if (h.date === todayStr) {
                            harvestItems.push({ farmerName: farmer.name, sapId: farmer.sap || farmer.owner || '-', landId: land.landId, date: h.date, tons: h.tons || 0, acres: h.acres || 0 });
                        }
                    }
                }
            }
        }
    }

    if (badgeCount) badgeCount.innerText = harvestItems.length;
    if (harvestItems.length === 0) {
        popupContent.innerHTML = `<div style="text-align:center; color:#888; padding:15px; font-size:13px;">ఈరోజు హార్వెస్ట్ రికార్డులు లేవు</div>`;
        return;
    }

    let html = "";
    for (let i = 0; i < harvestItems.length; i++) {
        let item = harvestItems[i];
        html += `
            <div style="padding: 10px; border-bottom: 1px solid #f1f1f1; display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                <div>
                    <strong style="color: #333; font-size:13px;">${item.farmerName}</strong><br>
                    <span style="color: #666;">SAP ID: ${item.sapId} | Land: ${item.landId}</span><br>
                    <span style="color: #28a745; font-weight:bold;">ఎకరాలు: ${item.acres} | టన్స్: ${item.tons} Tons</span>
                </div>
                <span style="background:#e8f5e9; color:#2e7d32; padding:3px 6px; border-radius:4px; font-size:11px; font-weight:bold;">ఈరోజే</span>
            </div>`;
    }
    popupContent.innerHTML = html;
}

// ==========================================
// 6. CSV & BACKUP DOWNLOADS
// ==========================================
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

// మీరు అడిగిన 9 కాలమ్స్‌తో అప్‌డేట్ చేసిన డౌన్‌లోడ్ ఫంక్షన్
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

    for (let i = 0; i < farmers.length; i++) {
        let farmer = farmers[i];
        if (farmer.lands) {
            for (let j = 0; j < farmer.lands.length; j++) {
                let land = farmer.lands[j];
                if (land.history) {
                    for (let k = 0; k < land.history.length; k++) {
                        let h = land.history[k];
                        let hDate = h.date;
                        let matches = true;
                        if (startDate && hDate < startDate) matches = false;
                        if (endDate && hDate > endDate) matches = false;

                        if (matches) {
                            let clusterNo = farmer.cluster || ''; 
                            let areaManager = "Dr.V.K. Gogireddy"; // ఆటోమేటిక్‌గా వచ్చే పేరు
                            let supplierId = farmer.sap || farmer.owner || farmer.supplier || '';
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
                    }
                }
            }
        }
    }

    if (recordCount === 0) {
        alert("సెలెక్ట్ చేసిన తేదీలలో రికార్డులు ఏవీ లేవు!");
        return;
    }

    let csvContent = "\uFEFF" + csvRows.join("\n");
    let fileName = startDate && endDate ? `Harvest_${startDate}_to_${endDate}.csv` : 'Harvest_Report.csv';
    downloadCSVFile(csvContent, fileName);
}

function exportDataToExcel() {
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(farmers));
    let dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "oil_palm_backup.json");
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    dlAnchorElem.remove();
}

// ==========================================
// 7. EDIT, DELETE & HISTORY ACTIONS
// ==========================================
function editFarmer(fIdx) {
    const farmer = farmers[fIdx];
    let newName = prompt("రైతు పేరు:", farmer.name || "");
    if (newName === null) return;
    let newPhone = prompt("ఫోన్ నంబర్ (Phone Number):", farmer.phone || "");
    if (newPhone === null) return;
    let newOwner = prompt("Owner ID:", farmer.owner || "");
    if (newOwner === null) return;
    let newSap = prompt("SAP ID:", farmer.sap || "");
    if (newSap === null) return;
    let newSupplierName = prompt("Supplier Name:", farmer.supplier || "");
    if (newSupplierName === null) return;

    farmers[fIdx].name = newName.trim();
    farmers[fIdx].phone = newPhone.trim();
    farmers[fIdx].owner = newOwner.trim();
    farmers[fIdx].sap = newSap.trim();
    farmers[fIdx].supplier = newSupplierName.trim();
    saveData();
    renderFarmerCards();
}

function deleteFarmer(fIdx) {
    if (confirm("ఈ రైతును డిలీట్ చేయాలా?")) {
        farmers.splice(fIdx, 1);
        saveData();
        renderFarmerCards();
    }
}

function deleteLand(fIdx, lIdx) {
    if (confirm("ఈ భూమిని డిలీట్ చేయాలా?")) {
        farmers[fIdx].lands.splice(lIdx, 1);
        saveData();
        renderFarmerCards();
    }
}

function viewFarmerFullHistory(farmerIndex) {
    let farmer = farmers[farmerIndex];
    let modal = document.getElementById("historyPopupModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "historyPopupModal";
        modal.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2000; justify-content:center; align-items:center;";
        modal.innerHTML = `
            <div style="background:white; width:90%; max-width:480px; padding:20px; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.2); position:relative; max-height:80vh; display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <h3 id="historyModalTitle" style="margin:0; font-size:16px; color:#333;">History</h3>
                    <button onclick="closeHistoryPopup()" style="background:none; border:none; font-size:18px; cursor:pointer; color:#888;">✕</button>
                </div>
                <div id="historyModalBody" style="overflow-y:auto; margin-top:15px; font-size:13px; flex-grow:1;"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById("historyModalTitle").innerText = `${farmer.name} హిస్టరీ`;
    let bodyDiv = document.getElementById("historyModalBody");
    bodyDiv.innerHTML = "";

    let hasHistory = false;
    if (farmer.lands && farmer.lands.length > 0) {
        let htmlContent = "";
        for (let lIdx = 0; lIdx < farmer.lands.length; lIdx++) {
            let land = farmer.lands[lIdx];
            if (land.history && land.history.length > 0) {
                hasHistory = true;
                htmlContent += `
                    <div style="font-weight:bold; color:#007bff; margin-top:10px;">Land ID: ${land.landId}</div>
                    <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:10px; margin-top:5px;">
                        <thead><tr style="background:#f1f1f1;"><th style="border:1px solid #ddd; padding:4px;">తేదీ</th><th style="border:1px solid #ddd; padding:4px;">ఎకరాలు</th><th style="border:1px solid #ddd; padding:4px;">టన్స్</th><th style="border:1px solid #ddd; padding:4px;">Actions</th></tr></thead>
                        <tbody>`;
                for (let hIdx = 0; hIdx < land.history.length; hIdx++) {
                    let h = land.history[hIdx];
                    htmlContent += `
                        <tr>
                            <td style="border:1px solid #ddd; padding:4px; text-align:center;">${h.date || '-'}</td>
                            <td style="border:1px solid #ddd; padding:4px; text-align:center;">${h.acres || '-'}</td>
                            <td style="border:1px solid #ddd; padding:4px; text-align:center; font-weight:bold; color:#28a745;">${h.tons || '0'} T</td>
                            <td style="border:1px solid #ddd; padding:4px; text-align:center;">
                                <button onclick="editHarvest(${farmerIndex}, ${lIdx}, ${hIdx})" style="background:#e3f2fd; color:#0d6efd; border:none; padding:2px 5px; border-radius:3px; cursor:pointer; margin-right:3px;">✏️</button>
                                <button onclick="deleteHarvest(${farmerIndex}, ${lIdx}, ${hIdx})" style="background:#ffebee; color:#d32f2f; border:none; padding:2px 5px; border-radius:3px; cursor:pointer;">Del</button>
                            </td>
                        </tr>`;
                }
                htmlContent += `</tbody></table>`;
            }
        }
        bodyDiv.innerHTML = htmlContent;
    }

    if (!hasHistory) {
        bodyDiv.innerHTML = `<div style="text-align:center; color:#888; padding:20px;">హిస్టరీ రికార్డులు ఏవీ లేవు</div>`;
    }

    modal.style.display = "flex";
}

function editHarvest(fIdx, lIdx, hIdx) {
    let currentTons = farmers[fIdx].lands[lIdx].history[hIdx].tons;
    let currentAcres = farmers[fIdx].lands[lIdx].history[hIdx].acres;

    let newTons = prompt("నూతన టన్నులు (Tons) నమోదు చేయండి:", currentTons);
    if (newTons === null) return;

    let newAcres = prompt("నూతన ఎకరాలు (Acres) నమోదు చేయండి:", currentAcres);
    if (newAcres === null) return;

    farmers[fIdx].lands[lIdx].history[hIdx].tons = parseFloat(newTons) || 0;
    farmers[fIdx].lands[lIdx].history[hIdx].acres = parseFloat(newAcres) || 0;

    saveData();
    viewFarmerFullHistory(fIdx);
    renderFarmerCards();
}

function deleteHarvest(fIdx, lIdx, hIdx) {
    if (confirm("ఈ హార్వెస్ట్ రికార్డును తొలగించాలా?")) {
        farmers[fIdx].lands[lIdx].history.splice(hIdx, 1);
        saveData();
        viewFarmerFullHistory(fIdx);
        renderFarmerCards();
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
        }, 100);

        harvestFarmer.scrollIntoView({ behavior: 'smooth' });
    }
}

// ==========================================
// 8. DOM LOAD & INTERACTION LOGIC
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    renderFarmerCards();
    updateDashboard();
    populateFarmerDropdowns();
    updateFarmerNameSelectDropdown();
    renderHarvestedTable();
    renderTodayHarvestTable();

    // EXCEL IMPORT LOGIC
    const importBtn = document.getElementById("importBtn");
    const excelFileInput = document.getElementById("excelFileInput");

    if (importBtn && excelFileInput) {
        importBtn.addEventListener("click", () => {
            let file = excelFileInput.files[0];
            if (!file) {
                alert("దయచేసి ముందుగా ఒక ఎక్సెల్ లేదా సీఎస్‌వీ ఫైల్‌ని సెలెక్ట్ చేయండి!");
                return;
            }

            let reader = new FileReader();
            reader.onload = function(e) {
                try {
                    let data = new Uint8Array(e.target.result);
                    let workbook = XLSX.read(data, { type: 'array', cellText: false, cellDates: true });
                    let firstSheetName = workbook.SheetNames[0];
                    let worksheet = workbook.Sheets[firstSheetName];
                    let jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

                    if (jsonData.length === 0) {
                        alert("ఎక్సెల్ ఫైల్‌లో డేటా ఖాళీగా ఉంది!");
                        return;
                    }

                    for (let i = 0; i < jsonData.length; i++) {
                        let row = jsonData[i];
                        let fLastName = String(row['Owner Last Name'] || row['Surname'] || row['ఇంటి పేరు'] || row['Last Name'] || '').trim();
                        let fFirstName = String(row['Farm Owner Name'] || row['First Name'] || row['Farmer Name'] || row['పేరు'] || row['Name'] || '').trim();
                        let farmerName = (fLastName && fFirstName) ? `${fLastName} ${fFirstName}` : (fFirstName || fLastName || '');
                        farmerName = farmerName.replace(/\s+/g, ' ').trim();

                        let sLastName = String(row['Supplier Last Name'] || '').trim();
                        let sFirstName = String(row['Supplier Name'] || '').trim();
                        let supplierName = (sLastName && sFirstName) ? `${sLastName} ${sFirstName}` : (sFirstName || sLastName || farmerName);

                        let ownerId = String(row['Farmowner ID'] || row['Owner ID'] || '').trim();
                        let sapId = String(row['SAP ID'] || row['SAP'] || '').trim();
                        let rawLandId = String(row['Farmer/Land ID'] || row['Land ID'] || row['భూమి ID'] || '').trim();
                        let area = parseFloat(row['Area Proposed'] || row['Acres'] || row['ఎకరాలు'] || row['Area'] || 0);
                        let phoneNum = String(row['Phone Number'] || row['Phone'] || row['Mobile'] || '').trim();

                        if (ownerId || sapId || farmerName) {
                            let existingFarmer = null;

                            if (ownerId) {
                                existingFarmer = farmers.find(f => String(f.owner || '').trim().toLowerCase() === ownerId.toLowerCase());
                            }
                            if (!existingFarmer && sapId) {
                                existingFarmer = farmers.find(f => String(f.sap || '').trim().toLowerCase() === sapId.toLowerCase());
                            }
                            if (!existingFarmer && farmerName) {
                                existingFarmer = farmers.find(f => String(f.name || '').trim().toLowerCase() === farmerName.toLowerCase());
                            }

                            if (existingFarmer) {
                                if (farmerName) existingFarmer.name = farmerName;
                                if (sapId) existingFarmer.sap = sapId;
                                if (ownerId) existingFarmer.owner = ownerId;
                                if (supplierName) existingFarmer.supplier = supplierName;
                                
                                if (phoneNum && phoneNum !== "" && phoneNum !== "undefined" && phoneNum !== "null") {
                                    existingFarmer.phone = phoneNum;
                                }

                                if (!existingFarmer.lands) existingFarmer.lands = [];

                                if (rawLandId && rawLandId !== "undefined" && rawLandId !== "null" && rawLandId !== "") {
                                    let existingLand = existingFarmer.lands.find(l => 
                                        String(l.landId || '').trim().toLowerCase() === rawLandId.toLowerCase()
                                    );

                                    if (existingLand) {
                                        if (area > 0) existingLand.area = area;
                                        if (!existingLand.history) existingLand.history = [];
                                    } else {
                                        existingFarmer.lands.push({
                                            landId: rawLandId,
                                            area: area,
                                            history: []
                                        });
                                    }
                                }
                            } else {
                                farmers.push({
                                    name: farmerName,
                                    owner: ownerId,
                                    sap: sapId,
                                    supplier: supplierName,
                                    phone: (phoneNum !== "undefined" && phoneNum !== "null") ? phoneNum : "",
                                    lands: (rawLandId && rawLandId !== "undefined" && rawLandId !== "null" && rawLandId !== "") ? [{
                                        landId: rawLandId,
                                        area: area,
                                        history: []
                                    }] : []
                                });
                            }
                        }
                    }

                    saveData();
                    renderFarmerCards();
                    alert("ఎక్సెల్ ఫైల్ విజయవంతంగా ఇంపోర్ట్ అయింది!");
                    excelFileInput.value = "";
                } catch (error) {
                    console.error(error);
                    alert("ఫైల్ ప్రాసెస్ చేయడంలో లోపం ఏర్పడింది.");
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    const farmerNameSelect = document.getElementById("farmerNameSelect");
    if (farmerNameSelect) {
        farmerNameSelect.addEventListener("change", (e) => {
            let selectedVal = e.target.value;
            let foundFarmer = farmers.find(f => (f.owner === selectedVal || f.sap === selectedVal));
            if (foundFarmer) {
                document.getElementById("ownerId").value = foundFarmer.owner || "";
                document.getElementById("sapId").value = foundFarmer.sap || "";
                document.getElementById("supplier").value = foundFarmer.supplier || foundFarmer.name || "";
            }
        });
    }

    const saveFarmerBtn = document.getElementById("saveFarmer");
    if (saveFarmerBtn) {
        saveFarmerBtn.addEventListener("click", () => {
            let nameSelect = document.getElementById("farmerNameSelect");
            let nameText = nameSelect.options[nameSelect.selectedIndex] ? nameSelect.options[nameSelect.selectedIndex].text : "";
            let nameParts = nameText.split(" - ");
            let farmerName = nameParts.length > 1 ? nameParts[1] : nameSelect.value;

            let owner = document.getElementById("ownerId").value.trim();
            let sap = document.getElementById("sapId").value.trim();
            let supplier = document.getElementById("supplier").value.trim();
            let phone = prompt("రైతు ఫోన్ నంబర్ నమోదు చేయండి (Phone Number):", "") || "";

            if (!farmerName || farmerName.includes("--")) {
                alert("దయచేసి సరైన రైతును ఎంచుకోండి లేదా పేరు ఇవ్వండి!");
                return;
            }

            farmers.push({
                name: farmerName,
                owner: owner,
                sap: sap,
                supplier: supplier,
                phone: phone.trim(),
                lands: []
            });

            saveData();
            renderFarmerCards();
            alert("రైతు వివరాలు విజయవంతంగా సేవ్ అయ్యాయి!");
        });
    }

    const saveLandBtn = document.getElementById("saveLand");
    if (saveLandBtn) {
        saveLandBtn.addEventListener("click", () => {
            let fIdx = document.getElementById("farmerSelect").value;
            let landId = document.getElementById("landId").value.trim();
            let area = document.getElementById("landArea").value.trim();

            if (fIdx === "" || !landId || !area) {
                alert("దయచేసి అన్ని వివరాలను పూరించండి!");
                return;
            }

            if (!farmers[fIdx].lands) {
                farmers[fIdx].lands = [];
            }

            farmers[fIdx].lands.push({
                landId: landId,
                area: parseFloat(area) || 0,
                history: []
            });

            saveData();
            renderFarmerCards();
            alert("భూమి వివరాలు విజయవంతంగా సేవ్ అయ్యాయి!");
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
                    selectAllDiv.style.cssText = "padding: 8px 0; border-bottom: 2px solid #007bff; font-weight: bold; font-size: 13px; color: #007bff; margin-bottom: 10px;";
                    selectAllDiv.innerHTML = `<label style="cursor:pointer;"><input type="checkbox" id="selectAllLands" style="margin-right: 8px;"> Select All</label>`;
                    container.appendChild(selectAllDiv);

                    let landHtmlArr = [];
                    for (let lIdx = 0; lIdx < farmers[fIdx].lands.length; lIdx++) {
                        let land = farmers[fIdx].lands[lIdx];
                        landHtmlArr.push(`
                            <div style="padding: 10px; font-size: 13px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 8px;">
                                <label style="cursor:pointer; font-weight:bold; display:block; margin-bottom: 6px;">
                                    <input type="checkbox" name="landCheckbox" value="${lIdx}" class="land-select-cb" style="margin-right: 8px;">
                                    Land ID: <span style="color:#007bff;">${land.landId}</span> (విస్తీర్ణం: ${land.area} ఎకరాలు)
                                </label>
                                <div id="landInputs_${lIdx}" style="display:none; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ccc;">
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
                            </div>
                        `);
                    }
                    container.insertAdjacentHTML('beforeend', landHtmlArr.join(''));

                    document.querySelectorAll(".land-select-cb").forEach(cb => {
                        cb.addEventListener("change", function() {
                            let inputDiv = document.getElementById(`landInputs_${this.value}`);
                            if (inputDiv) inputDiv.style.display = this.checked ? "block" : "none";
                        });
                    });

                    document.getElementById("selectAllLands").addEventListener("change", function() {
                        let checkboxes = document.querySelectorAll(".land-select-cb");
                        checkboxes.forEach(cb => {
                            cb.checked = this.checked;
                            let inputDiv = document.getElementById(`landInputs_${cb.value}`);
                            if (inputDiv) inputDiv.style.display = this.checked ? "block" : "none";
                        });
                    });

                } else {
                    container.innerHTML = `<span style="color: #888; font-size: 13px;">ఈ రైతుకు తోటల వివరాలు లేవు</span>`;
                }
            }
        });
    }

    const saveHarvestBtn = document.getElementById("saveHarvest");
    if (saveHarvestBtn) {
        saveHarvestBtn.addEventListener("click", () => {
            const fIdx = document.getElementById("harvestFarmer").value;
            let selectedCheckboxes = document.querySelectorAll("input[name='landCheckbox']:checked");
            
            const hDate = document.getElementById("harvestDate") ? document.getElementById("harvestDate").value : new Date().toISOString().split('T')[0];
            const ccSelect = document.getElementById("harvestCC");
            const weightBridge = ccSelect ? ccSelect.value : "";

            if (fIdx === "" || selectedCheckboxes.length === 0) {
                alert("దయచేసి రైతును మరియు కనీసం ఒక తోటను ఎంచుకోండి!");
                return;
            }

            let savedCount = 0;

            for (let i = 0; i < selectedCheckboxes.length; i++) {
                let cb = selectedCheckboxes[i];
                let lIdx = cb.value;
                let hAcres = document.getElementById(`acres_${lIdx}`) ? document.getElementById(`acres_${lIdx}`).value : "0";
                let hTons = document.getElementById(`tons_${lIdx}`) ? document.getElementById(`tons_${lIdx}`).value : "0";

                if (parseFloat(hTons) > 0) {
                    if (!farmers[fIdx].lands[lIdx].history) {
                        farmers[fIdx].lands[lIdx].history = [];
                    }

                    farmers[fIdx].lands[lIdx].history.push({
                        date: hDate,
                        acres: hAcres,
                        tons: parseFloat(hTons) || 0,
                        weightBridge: weightBridge,
                        isHarvestDone: false
                    });
                    savedCount++;
                }
            }

            if (savedCount === 0) {
                alert("దయచేసి ఎంచుకున్న తోటకు టన్నులు (Tons) నమోదు చేయండి!");
                return;
            }

            saveData();
            renderFarmerCards();
            alert("హార్వెస్ట్ వివరాలు విజయవంతంగా సేవ్ అయ్యాయి!");
        });
    }

    const downloadCSVBtn = document.getElementById("downloadCSV");
    if (downloadCSVBtn) {
        downloadCSVBtn.addEventListener("click", downloadHarvestCSV);
    }

    const searchInput = document.getElementById("search");
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener("input", (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                let term = e.target.value.toLowerCase().trim();
                if (!term) {
                    renderFarmerCards();
                    return;
                }
                let filtered = farmers.filter(f => 
                    (f.name && f.name.toLowerCase().includes(term)) || 
                    (f.owner && f.owner.toLowerCase().includes(term)) ||
                    (f.sap && f.sap.toLowerCase().includes(term)) ||
                    (f.phone && f.phone.includes(term)) ||
                    (f.supplier && f.supplier.toLowerCase().includes(term))
                );
                renderFarmerCards(filtered);
            }, 200);
        });
    }
});
