// 1. LOCAL STORAGE LOAD & SAVE
let farmers = JSON.parse(localStorage.getItem("nbl_farmers_data")) || JSON.parse(localStorage.getItem("farmersData")) || [];

function saveData() {
    localStorage.setItem("nbl_farmers_data", JSON.stringify(farmers));
    localStorage.setItem("farmersData", JSON.stringify(farmers));
    updateDashboard();
    populateFarmerDropdowns();
    updateFarmerNameSelectDropdown();
    renderHarvestedTable();
    renderTodayHarvestTable();
    renderFarmerCards();
}

// 2. DASHBOARD UPDATE
function updateDashboard() {
    let totalLands = 0;
    let totalHarvests = 0;
    let totalTonsSum = 0;
    let todayHarvestCount = 0;
    let todayTonsSum = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    farmers.forEach(farmer => {
        if (farmer.lands) {
            totalLands += farmer.lands.length;
            farmer.lands.forEach(land => {
                if (land.history) {
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

// 3. DROPDOWNS & WEIGHT BRIDGES
function populateFarmerDropdowns() {
    const farmerSelect = document.getElementById("farmerSelect");
    const harvestFarmer = document.getElementById("harvestFarmer");

    if (farmerSelect) {
        farmerSelect.innerHTML = '<option value="">Select Farmer</option>';
        farmers.forEach((farmer, idx) => {
            let displayId = farmer.sap || farmer.owner || '';
            farmerSelect.innerHTML += `<option value="${idx}">${displayId} - ${farmer.name}</option>`;
        });
    }

    if (harvestFarmer) {
        harvestFarmer.innerHTML = '<option value="">Select Farmer</option>';
        farmers.forEach((farmer, idx) => {
            let displayId = farmer.sap || farmer.owner || '';
            harvestFarmer.innerHTML += `<option value="${idx}">${displayId} - ${farmer.name}</option>`;
        });
    }

    // 22 ಕಾటా (Weight Bridge) పేర్లు
    const wbSelect = document.getElementById("harvestWeightBridge") || document.querySelector("select[name='weightBridge']");
    if (wbSelect) {
        const weightBridges = [
            "Dondapudi", "Makkinavarigudem", "Rajupothepalli", "Lakshmipuram", "Borrampalem",
            "Devulapalli", "Taduvai", "Bandamcherla", "Jeelugumilli", "T.Narasapuram",
            "Thirumuladevipeta", "Nimmalagudem JRG", "Koyyalagudem", "Rajavaram", "Gopalapuram",
            "Kuntlagudem", "Annadevarapeta", "Kamayyapalem", "Velagapadu", "Bandivarigudem",
            "Marrigudem", "Jangareddygudem"
        ];

        wbSelect.innerHTML = '<option value="">Select Weight Bridge</option>';
        weightBridges.forEach(wb => {
            wbSelect.innerHTML += `<option value="${wb}">${wb}</option>`;
        });
    }
}

function updateFarmerNameSelectDropdown() {
    const selectEl = document.getElementById("farmerNameSelect");
    if (selectEl) {
        selectEl.innerHTML = '<option value="">-- Select Farmer --</option>';
        farmers.forEach(farmer => {
            let displayId = farmer.sap || farmer.owner || '';
            selectEl.innerHTML += `<option value="${displayId}">${displayId} - ${farmer.name}</option>`;
        });
    }
}

// 4. RENDER FARMER CARDS (Supplier Name నష్టపోకుండా)
function renderFarmerCards(filteredData = null) {
    const list = document.getElementById("farmerList");
    if (!list) return;

    list.innerHTML = "";
    let dataToRender = filteredData ? filteredData : farmers;

    if (dataToRender.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#888;">రైతు వివరాలు ఏమీ లేవు.</p>`;
        return;
    }

    dataToRender.forEach((farmer) => {
        let fIdx = farmers.indexOf(farmer);

        let card = `
        <div style="background:#fff; border:1px solid #ddd; border-radius:8px; margin-bottom:15px; padding:15px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0 0 10px 0; color:#333;">${farmer.name}</h3>
                <div>
                    <button onclick="viewFarmerFullHistory(${fIdx})" style="background:#17a2b8; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:5px; font-size:11px;">History</button>
                    <button onclick="editFarmer(${fIdx})" style="background:#007bff; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">✏️ Edit</button>
                    <button onclick="deleteFarmer(${fIdx})" style="background:#ffebee; color:#d32f2f; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Delete</button>
                </div>
            </div>
            <p style="font-size:13px; color:#555;">
                <strong>SAP ID:</strong> ${farmer.sap || 'N/A'} | 
                <strong>Owner ID:</strong> ${farmer.owner || 'N/A'} | 
                <strong>Supplier Name:</strong> ${farmer.supplier || farmer.name || 'N/A'}
            </p>`;

        if (farmer.lands && farmer.lands.length > 0) {
            farmer.lands.forEach((land, lIdx) => {
                card += `
                <div style="background:#f9f9f9; border-left:3px solid #4CAF50; padding:10px; margin-top:8px; border-radius:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span><strong>Land ID:</strong> ${land.landId} (${land.area} Acres)</span>
                        <div>
                            <button onclick="selectFarmerForHarvest(${fIdx}, ${lIdx})" style="background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7; padding:3px 8px; border-radius:4px; cursor:pointer; font-size:12px; margin-right:5px;">🏝️ Harvester</button>
                            <button onclick="deleteLand(${fIdx}, ${lIdx})" style="font-size:11px; background:#ffebee; color:#d32f2f; border:none; padding:3px 6px; cursor:pointer;">Delete</button>
                        </div>
                    </div>
                </div>`;
            });
        }
        card += `</div>`;
        list.innerHTML += card;
    });
}

// 5. NOTIFICATION TABLES (Today Harvest లో Farmer Name కనిపిస్తుంది)
function renderHarvestedTable() {
    const popupContent = document.getElementById("harvestPopupContent");
    const badgeCount = document.getElementById("harvestBadgeCount");
    if (!popupContent || !badgeCount) return;

    popupContent.innerHTML = "";
    let harvestItems = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    farmers.forEach((farmer, fIdx) => {
        if (farmer.lands) {
            farmer.lands.forEach((land, lIdx) => {
                if (land.history) {
                    land.history.forEach((h, hIdx) => {
                        if (h.date && !h.isHarvestDone) {
                            let harvestDate = new Date(h.date);
                            harvestDate.setHours(0, 0, 0, 0);
                            let diffDays = Math.floor((today - harvestDate) / (1000 * 60 * 60 * 24));
                            if (diffDays === 10) {
                                harvestItems.push({ fIdx, lIdx, hIdx, farmerName: farmer.name, ownerId: farmer.owner || '-', landId: land.landId, date: h.date, tons: h.tons || 0 });
                            }
                        }
                    });
                }
            });
        }
    });

    badgeCount.innerText = harvestItems.length;
    if (harvestItems.length === 0) {
        popupContent.innerHTML = `<div style="text-align:center; color:#888; padding:15px;">10 రోజుల క్రితం రికార్డులు లేవు</div>`;
        return;
    }

    harvestItems.forEach(item => {
        let div = document.createElement("div");
        div.style.cssText = "padding: 8px 10px; border-bottom: 1px solid #f1f1f1; display: flex; justify-content: space-between; align-items: center; font-size: 12px;";
        div.innerHTML = `
            <div>
                <strong style="color: #333;">${item.farmerName}</strong><br>
                <span style="color: #666;">ID: ${item.ownerId} | Land: ${item.landId}</span><br>
                <span style="color: #007bff; font-weight:bold;">తేదీ: ${item.date} (${item.tons} Tons)</span>
            </div>
            <button onclick="markHarvestDone(${item.fIdx}, ${item.lIdx}, ${item.hIdx})" style="background:#28a745; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">Done</button>
        `;
        popupContent.appendChild(div);
    });
}

function renderTodayHarvestTable() {
    const popupContent = document.getElementById("todayHarvestPopupContent");
    const badgeCount = document.getElementById("todayHarvestBadgeCount");
    if (!popupContent || !badgeCount) return;

    popupContent.innerHTML = "";
    let harvestItems = [];
    const todayStr = new Date().toISOString().split('T')[0];

    farmers.forEach((farmer) => {
        if (farmer.lands) {
            farmer.lands.forEach((land) => {
                if (land.history) {
                    land.history.forEach((h) => {
                        if (h.date === todayStr) {
                            harvestItems.push({ farmerName: farmer.name, sapId: farmer.sap || farmer.owner || '-', landId: land.landId, date: h.date, tons: h.tons || 0, acres: h.acres || 0 });
                        }
                    });
                }
            });
        }
    });

    badgeCount.innerText = harvestItems.length;
    if (harvestItems.length === 0) {
        popupContent.innerHTML = `<div style="text-align:center; color:#888; padding:15px; font-size:13px;">ఈరోజు హార్వెస్ట్ రికార్డులు లేవు</div>`;
        return;
    }

    harvestItems.forEach(item => {
        let div = document.createElement("div");
        div.style.cssText = "padding: 10px; border-bottom: 1px solid #f1f1f1; display: flex; justify-content: space-between; align-items: center; font-size: 12px;";
        div.innerHTML = `
            <div>
                <strong style="color: #333; font-size:13px;">${item.farmerName}</strong><br>
                <span style="color: #666;">SAP: ${item.sapId} | Land: ${item.landId}</span><br>
                <span style="color: #28a745; font-weight:bold;">ఎకరాలు: ${item.acres} | టన్స్: ${item.tons} Tons</span>
            </div>
            <span style="background:#e8f5e9; color:#2e7d32; padding:3px 6px; border-radius:4px; font-size:11px; font-weight:bold;">ఈరోజే</span>
        `;
        popupContent.appendChild(div);
    });
}

function toggleTodayHarvestPopup() {
    const modal = document.getElementById("todayHarvestPopupModal");
    if (modal) {
        let isVisible = modal.style.display === "flex";
        modal.style.display = isVisible ? "none" : "flex";
        if (!isVisible) renderTodayHarvestTable();
    }
}

// 6. CSV DOWNLOAD (SAP ID INCLUDED)
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
    }, 100);
}

function downloadHarvestCSV() {
    let startDate = document.getElementById("startDate") ? document.getElementById("startDate").value : "";
    let endDate = document.getElementById("endDate") ? document.getElementById("endDate").value : "";
    
    let csvRows = [];
    csvRows.push(["Land ID", "Farmer Name", "Acres", "Tons", "Supplier ID", "Weight Bridge Name"].map(v => `"${v}"`).join(","));

    let recordCount = 0;

    farmers.forEach(farmer => {
        if (farmer.lands) {
            farmer.lands.forEach(land => {
                if (land.history) {
                    land.history.forEach(h => {
                        let hDate = h.date;
                        let matches = true;
                        if (startDate && hDate < startDate) matches = false;
                        if (endDate && hDate > endDate) matches = false;

                        if (matches) {
                            let sapId = farmer.sap || farmer.owner || '';

                            csvRows.push([
                                land.landId || '',
                                farmer.name || '',
                                h.acres || land.area || '',
                                h.tons || '',
                                sapId,
                                h.weightBridge || ''
                            ].map(v => `"${v}"`).join(","));
                            recordCount++;
                        }
                    });
                }
            });
        }
    });

    if (recordCount === 0) {
        alert("సెలెక్ట్ చేసిన తేదీలలో రికార్డులు ఏవీ లేవు!");
        return;
    }

    let csvContent = "\uFEFF" + csvRows.join("\n");
    let fileName = startDate && endDate ? `Harvest_${startDate}_to_${endDate}.csv` : 'Harvest_Report.csv';
    downloadCSVFile(csvContent, fileName);
}

// 7. EDIT, DELETE & HISTORY ACTIONS
function editFarmer(fIdx) {
    const farmer = farmers[fIdx];
    let newName = prompt("రైతు పేరు:", farmer.name || "");
    if (newName === null) return;
    let newSap = prompt("SAP ID:", farmer.sap || "");
    if (newSap === null) return;
    let newOwner = prompt("Owner ID:", farmer.owner || "");
    if (newOwner === null) return;
    let newSupplierName = prompt("Supplier Name:", farmer.supplier || farmer.name || "");
    if (newSupplierName === null) return;

    farmers[fIdx].name = newName.trim();
    farmers[fIdx].sap = newSap.trim();
    farmers[fIdx].owner = newOwner.trim();
    farmers[fIdx].supplier = newSupplierName.trim();
    saveData();
}

function deleteFarmer(fIdx) {
    if (confirm("ఈ రైతును డిలీట్ చేయాలా?")) {
        farmers.splice(fIdx, 1);
        saveData();
    }
}

function deleteLand(fIdx, lIdx) {
    if (confirm("ఈ భూమిని డిలీట్ చేయాలా?")) {
        farmers[fIdx].lands.splice(lIdx, 1);
        saveData();
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
            <div style="background:white; width:90%; max-width:450px; padding:20px; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.2); position:relative; max-height:80vh; display:flex; flex-direction:column;">
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
        farmer.lands.forEach((land, lIdx) => {
            if (land.history && land.history.length > 0) {
                hasHistory = true;
                htmlContent += `
                    <div style="font-weight:bold; color:#007bff; margin-top:10px;">Land ID: ${land.landId}</div>
                    <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:10px; margin-top:5px;">
                        <thead><tr style="background:#f1f1f1;"><th style="border:1px solid #ddd; padding:4px;">తేదీ</th><th style="border:1px solid #ddd; padding:4px;">ఎకరాలు</th><th style="border:1px solid #ddd; padding:4px;">టన్స్</th><th style="border:1px solid #ddd; padding:4px;">Action</th></tr></thead>
                        <tbody>`;
                land.history.forEach((h, hIdx) => {
                    htmlContent += `
                        <tr>
                            <td style="border:1px solid #ddd; padding:4px; text-align:center;">${h.date || '-'}</td>
                            <td style="border:1px solid #ddd; padding:4px; text-align:center;">${h.acres || '-'}</td>
                            <td style="border:1px solid #ddd; padding:4px; text-align:center; font-weight:bold; color:#28a745;">${h.tons || '0'} T</td>
                            <td style="border:1px solid #ddd; padding:4px; text-align:center;"><button onclick="deleteHarvest(${farmerIndex}, ${lIdx}, ${hIdx})" style="background:#ffebee; color:#d32f2f; border:none; padding:2px 5px; border-radius:3px; cursor:pointer;">Del</button></td>
                        </tr>`;
                });
                htmlContent += `</tbody></table>`;
            }
        });
        bodyDiv.innerHTML = htmlContent;
    }

    if (!hasHistory) {
        bodyDiv.innerHTML = `<div style="text-align:center; color:#888; padding:20px;">హిస్టరీ రికార్డులు ఏవీ లేవు</div>`;
    }

    modal.style.display = "flex";
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
        }, 100);

        harvestFarmer.scrollIntoView({ behavior: 'smooth' });
    }
}

// 8. DOM LISTENERS & HARVEST SAVE
document.addEventListener("DOMContentLoaded", () => {
    renderFarmerCards();
    updateDashboard();
    populateFarmerDropdowns();
    updateFarmerNameSelectDropdown();
    renderHarvestedTable();
    renderTodayHarvestTable();

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

                    farmers[fIdx].lands.forEach((land, lIdx) => {
                        let div = document.createElement("div");
                        div.style.cssText = "padding: 10px; font-size: 13px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 8px;";
                        div.innerHTML = `
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
                        `;
                        container.appendChild(div);
                    });

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
            const wbSelect = document.getElementById("harvestWeightBridge") || document.querySelector("select[name='weightBridge']");
            const weightBridge = wbSelect ? wbSelect.value : "";

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
                        acres: hAcres,
                        tons: parseFloat(hTons) || 0,
                        weightBridge: weightBridge
                    });
                    savedCount++;
                }
            });

            if (savedCount === 0) {
                alert("దయచేసి ఎంచుకున్న తోటకు టన్నులు (Tons) నమోదు చేయండి!");
                return;
            }

            saveData();
            alert("హార్వెస్ట్ వివరాలు విజయవంతంగా సేవ్ అయ్యాయి!");
        });
    }

    const downloadCSVBtn = document.getElementById("downloadCSV");
    if (downloadCSVBtn) {
        downloadCSVBtn.addEventListener("click", downloadHarvestCSV);
    }
});
