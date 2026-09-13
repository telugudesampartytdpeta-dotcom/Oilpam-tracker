let farmers = JSON.parse(localStorage.getItem("nbl_farmers_data")) || JSON.parse(localStorage.getItem("farmersData")) || [];

const weighbridgeList = [
    { code: "C100", name: "Dondapudi" },
    { code: "C101", name: "Makkinavarigudem" },
    { code: "C102", name: "Rajupothepalli" },
    { code: "C103", name: "Lakshmipuram" },
    { code: "C104", name: "Borrampalem" },
    { code: "C105", name: "Devulapalli" },
    { code: "C106", name: "Taduvai" },
    { code: "C107", name: "Bandamcherla" },
    { code: "C108", name: "Jeelugumilli" },
    { code: "C109", name: "T.Narasapuram" },
    { code: "C110", name: "Thirumuladevipeta" },
    { code: "C111", name: "Nimmalagudem JRG" },
    { code: "C112", name: "Koyyalagudem" },
    { code: "C113", name: "Rajavaram" },
    { code: "C114", name: "Gopalapuram" },
    { code: "C116", name: "Kuntlagudem" },
    { code: "C117", name: "Annadevarapeta" },
    { code: "C118", name: "Kamayyapalem" },
    { code: "C119", name: "velagapadu" },
    { code: "C120", name: "Bandivarigudem" },
    { code: "C121", name: "Marrigudem" },
    { code: "M100", name: "Jangareddygudem" }
];

function saveData() {
    localStorage.setItem("nbl_farmers_data", JSON.stringify(farmers));
    localStorage.setItem("farmersData", JSON.stringify(farmers));
    updateDashboard();
    populateFarmerDropdowns();
    updateFarmerNameSelectDropdown();
    renderFarmerCards();
    renderTodayHarvestTable();
    render10DaysHarvestTable();
}

// 1. DASHBOARD & COUNTS
function updateDashboard() {
    let totalLands = 0, totalHarvests = 0, totalTonsSum = 0, todayHarvestCount = 0, todayTonsSum = 0;
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
    const todayBadge = document.getElementById("todayHarvestBadgeCount");

    if (farmerCountEl) farmerCountEl.innerText = farmers.length;
    if (landCountEl) landCountEl.innerText = totalLands;
    if (harvestCountEl) harvestCountEl.innerText = totalHarvests;
    if (totalTonsEl) totalTonsEl.innerText = totalTonsSum.toFixed(2);
    if (todayHarvestCountEl) todayHarvestCountEl.innerText = `${todayHarvestCount} (${todayTonsSum.toFixed(2)} Tons)`;
    if (todayBadge) todayBadge.innerText = todayHarvestCount;
    
    update10DaysBadge();
}

function populateFarmerDropdowns() {
    const harvestFarmer = document.getElementById("harvestFarmer");
    if (harvestFarmer) {
        let currentSelected = harvestFarmer.value;
        harvestFarmer.innerHTML = '<option value="">Select Farmer</option>';
        farmers.forEach((farmer, idx) => {
            let displayId = farmer.owner || farmer.sap || '';
            harvestFarmer.innerHTML += `<option value="${idx}">${displayId} - ${farmer.name}</option>`;
        });
        harvestFarmer.value = currentSelected;
    }

    const farmerSelect = document.getElementById("farmerSelect");
    if (farmerSelect) {
        let currentSel = farmerSelect.value;
        farmerSelect.innerHTML = '<option value="">Select Farmer</option>';
        farmers.forEach((farmer, idx) => {
            let displayId = farmer.owner || farmer.sap || '';
            farmerSelect.innerHTML += `<option value="${idx}">${displayId} - ${farmer.name}</option>`;
        });
        farmerSelect.value = currentSel;
    }

    const weightBridgeSelect = document.getElementById("harvestWeightBridge");
    if (weightBridgeSelect) {
        let currentWB = weightBridgeSelect.value;
        weightBridgeSelect.innerHTML = '<option value="">-- వెయిట్ బ్రిడ్జ్ ఎంచుకోండి --</option>';
        weighbridgeList.forEach(wb => {
            weightBridgeSelect.innerHTML += `<option value="${wb.name}">${wb.name} (${wb.code})</option>`;
        });
        weightBridgeSelect.value = currentWB;
    }
}

function updateFarmerNameSelectDropdown() {
    const selectEl = document.getElementById("farmerNameSelect");
    if (selectEl) {
        selectEl.innerHTML = '<option value="">-- Select Farmer --</option>';
        farmers.forEach(farmer => {
            let displayId = farmer.owner || farmer.sap || '';
            selectEl.innerHTML += `<option value="${displayId}">${displayId} - ${farmer.name}</option>`;
        });
    }
}

// 2. RENDER CARDS
function renderFarmerCards(filteredData = null) {
    const list = document.getElementById("farmerList");
    if (!list) return;

    list.innerHTML = "";
    let sourceList = filteredData ? filteredData : farmers;

    if (sourceList.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#888;">రైతు వివరాలు ఏమీ లేవు.</p>`;
        return;
    }

    sourceList.forEach((farmer) => {
        let fIdx = farmers.indexOf(farmer);
        if (fIdx === -1) {
            fIdx = farmers.findIndex(f => f.name === farmer.name && (f.owner === farmer.owner || f.sap === farmer.sap));
        }

        let card = document.createElement("div");
        card.style.cssText = "background:#fff; border:1px solid #ddd; border-radius:8px; margin-bottom:15px; padding:15px; box-shadow:0 2px 5px rgba(0,0,0,0.05);";
        
        let headerDiv = document.createElement("div");
        headerDiv.style.cssText = "display:flex; justify-content:space-between; align-items:center;";
        headerDiv.innerHTML = `
            <h3 style="margin:0 0 5px 0; color:#333; font-size:15px;">${farmer.name}</h3>
            <div style="display:flex; gap:4px;">
                <button type="button" onclick="viewFarmerFullHistory(${fIdx})" style="background:#17a2b8; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px;">History</button>
                <button type="button" onclick="editFarmer(${fIdx})" style="background:#007bff; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">✏️ Edit</button>
                <button type="button" onclick="deleteFarmer(${fIdx})" style="background:#ffebee; color:#d32f2f; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Delete</button>
            </div>
        `;
        card.appendChild(headerDiv);

        let phoneVal = farmer.phone || farmer.mobile || farmer.phoneNumber || 'N/A';
        let infoP = document.createElement("p");
        infoP.style.cssText = "font-size:12px; color:#555; margin: 8px 0;";
        infoP.innerHTML = `<strong>Owner ID:</strong> ${farmer.owner || 'N/A'} | <strong>SAP ID:</strong> ${farmer.sap || 'N/A'} | <strong>Phone:</strong> ${phoneVal}`;
        card.appendChild(infoP);

        if (farmer.lands && farmer.lands.length > 0) {
            farmer.lands.forEach((land, lIdx) => {
                let landDiv = document.createElement("div");
                landDiv.style.cssText = "background:#f9f9f9; border-left:3px solid #4CAF50; padding:8px 10px; margin-top:6px; border-radius:4px; display:flex; justify-content:space-between; align-items:center;";
                landDiv.innerHTML = `
                    <span style="font-size:12px;"><strong>Land ID:</strong> ${land.landId} (${land.area} Acres)</span>
                    <div style="display:flex; gap:4px;">
                        <button type="button" onclick="selectFarmerForHarvest(${fIdx}, ${lIdx})" style="background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7; padding:2px 6px; border-radius:4px; cursor:pointer; font-size:11px;">🏝️ Harvester</button>
                        <button type="button" onclick="deleteLand(${fIdx}, ${lIdx})" style="font-size:11px; background:#ffebee; color:#d32f2f; border:none; padding:2px 6px; cursor:pointer;">Delete</button>
                    </div>
                `;
                card.appendChild(landDiv);
            });
        }
        list.appendChild(card);
    });
}

// 3. FULL HISTORY POPUP
function viewFarmerFullHistory(farmerIndex) {
    let farmer = farmers[farmerIndex];
    if (!farmer) return;

    let modal = document.getElementById("historyPopupModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "historyPopupModal";
        modal.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2000; justify-content:center; align-items:center;";
        modal.innerHTML = `
            <div style="background:white; width:95%; max-width:500px; padding:20px; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.2); max-height:85vh; display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <h3 id="historyModalTitle" style="margin:0; font-size:15px; color:#333;">Farmer History</h3>
                    <button type="button" onclick="closeHistoryPopup()" style="background:none; border:none; font-size:18px; cursor:pointer; color:#888;">✕</button>
                </div>
                <div id="historyModalBody" style="overflow-y:auto; margin-top:15px; font-size:12px; flex-grow:1;"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById("historyModalTitle").innerText = `${farmer.name} (SAP: ${farmer.sap || farmer.owner || '-'}) పూర్తి హిస్టరీ`;
    let bodyDiv = document.getElementById("historyModalBody");
    bodyDiv.innerHTML = "";

    if (!farmer.lands || farmer.lands.length === 0) {
        bodyDiv.innerHTML = `<div style="text-align:center; color:#888; padding:20px;">ల్యాండ్ వివరాలు ఏవీ లేవు</div>`;
    } else {
        let hasAnyHistory = false;
        let htmlContent = "";

        farmer.lands.forEach((land, lIdx) => {
            if (land.history && land.history.length > 0) {
                hasAnyHistory = true;
                htmlContent += `
                    <div style="font-weight:bold; color:#007bff; margin-top:10px; margin-bottom:5px; border-bottom:1px dashed #ddd; padding-bottom:3px;">Land ID: ${land.landId} (${land.area || '-'} Acres)</div>
                    <table style="width:100%; border-collapse:collapse; font-size:11px; margin-bottom:10px;">
                        <thead>
                            <tr style="background:#f1f1f1; text-align:left;">
                                <th style="padding:5px; border:1px solid #ddd;">తేదీ</th>
                                <th style="padding:5px; border:1px solid #ddd;">ఎకరాలు</th>
                                <th style="padding:5px; border:1px solid #ddd;">టన్స్</th>
                                <th style="padding:5px; border:1px solid #ddd;">కాటా (WB)</th>
                                <th style="padding:5px; border:1px solid #ddd; text-align:center;">Action</th>
                            </tr>
                        </thead>
                        <tbody>`;
                
                land.history.forEach((h, hIdx) => {
                    htmlContent += `
                        <tr>
                            <td style="padding:5px; border:1px solid #ddd;">${h.date || '-'}</td>
                            <td style="padding:5px; border:1px solid #ddd;">${h.acres || '-'}</td>
                            <td style="padding:5px; border:1px solid #ddd; font-weight:bold; color:#28a745;">${h.tons || '0'}</td>
                            <td style="padding:5px; border:1px solid #ddd;">${h.weightBridge || '-'}</td>
                            <td style="padding:5px; border:1px solid #ddd; text-align:center;">
                                <button type="button" onclick="editHarvestRecord(${farmerIndex}, ${lIdx}, ${hIdx})" style="background:#007bff; color:white; border:none; padding:2px 6px; border-radius:3px; font-size:10px; cursor:pointer;">✏️</button>
                                <button type="button" onclick="deleteHarvestRecord(${farmerIndex}, ${lIdx}, ${hIdx})" style="background:#dc3545; color:white; border:none; padding:2px 6px; border-radius:3px; font-size:10px; cursor:pointer;">🗑️</button>
                            </td>
                        </tr>`;
                });
                htmlContent += `</tbody></table>`;
            }
        });

        if (!hasAnyHistory) {
            bodyDiv.innerHTML = `<div style="text-align:center; color:#888; padding:20px;">ఈ రైతుకు హార్వెస్ట్ హిస్టరీ ఏదీ లేదు</div>`;
        } else {
            bodyDiv.innerHTML = htmlContent;
        }
    }

    modal.style.display = "flex";
}

function editHarvestRecord(fIdx, lIdx, hIdx) {
    let item = farmers[fIdx].lands[lIdx].history[hIdx];
    let newDate = prompt("తేదీ సరిచేయండి (YYYY-MM-DD):", item.date || "");
    if (newDate === null) return;
    let newAcres = prompt("ఎకరాలు (Acres):", item.acres || "");
    if (newAcres === null) return;
    let newTons = prompt("టన్స్ (Tons):", item.tons || "");
    if (newTons === null) return;
    let newWB = prompt("Weigh Bridge:", item.weightBridge || "");
    if (newWB === null) return;

    farmers[fIdx].lands[lIdx].history[hIdx] = {
        date: newDate.trim(),
        acres: newAcres.trim(),
        tons: newTons.trim(),
        weightBridge: newWB.trim()
    };

    saveData();
    viewFarmerFullHistory(fIdx);
}

function deleteHarvestRecord(fIdx, lIdx, hIdx) {
    if (confirm("ఈ హార్వెస్ట్ రికార్డును తొలగించాలనుకుంటున్నారా?")) {
        farmers[fIdx].lands[lIdx].history.splice(hIdx, 1);
        saveData();
        viewFarmerFullHistory(fIdx);
    }
}

function closeHistoryPopup() {
    let modal = document.getElementById("historyPopupModal");
    if (modal) modal.style.display = "none";
}

// 4. TODAY HARVEST POPUP & TABLE (No Done Button)
function toggleTodayHarvestPopup() {
    let modal = document.getElementById("todayHarvestPopupModal");
    if (modal) {
        let currentDisplay = window.getComputedStyle(modal).display;
        modal.style.display = (currentDisplay === "none" || currentDisplay === "") ? "flex" : "none";
    }
}

function renderTodayHarvestTable() {
    const popupContent = document.getElementById("todayHarvestPopupContent");
    if (!popupContent) return;

    popupContent.innerHTML = "";
    const todayStr = new Date().toISOString().split('T')[0];
    let todayList = [];

    farmers.forEach(farmer => {
        if (farmer.lands) {
            farmer.lands.forEach(land => {
                if (land.history) {
                    land.history.forEach(h => {
                        if (h.date === todayStr) {
                            todayList.push({
                                farmerName: farmer.name,
                                ownerId: farmer.owner || farmer.sap || '-',
                                landId: land.landId,
                                date: h.date,
                                acres: h.acres,
                                tons: h.tons,
                                weightBridge: h.weightBridge
                            });
                        }
                    });
                }
            });
        }
    });

    if (todayList.length === 0) {
        popupContent.innerHTML = `<div style="text-align:center; color:#888; padding:15px; font-size:12px;">ఈరోజు హార్వెస్ట్ రికార్డులు ఏవీ లేవు</div>`;
        return;
    }

    todayList.forEach(item => {
        let div = document.createElement("div");
        div.style.cssText = "padding: 10px; border-bottom: 1px solid #eee; font-size: 12px;";
        div.innerHTML = `
            <strong style="color: #007bff; font-size:13px;">🧑‍🌾 ${item.farmerName}</strong><br>
            <span style="color: #555;">ID: ${item.ownerId} | Land: ${item.landId} | WB: ${item.weightBridge || '-'}</span><br>
            <span style="color: #28a745; font-weight:bold;">ఎకరాలు: ${item.acres} | టన్స్: ${item.tons} Tons</span>
        `;
        popupContent.appendChild(div);
    });
}

// 5. 10 DAYS HARVEST LOGIC (Auto-updates based on dates)
function toggle10DaysPopup() {
    let modal = document.getElementById("tenDaysPopupModal");
    if (modal) {
        let currentDisplay = window.getComputedStyle(modal).display;
        modal.style.display = (currentDisplay === "none" || currentDisplay === "") ? "flex" : "none";
        if (modal.style.display === "flex") {
            render10DaysHarvestTable();
        }
    }
}

function update10DaysBadge() {
    const badge = document.getElementById("tenDaysBadgeCount");
    if (!badge) return;

    let count = get10DaysHarvestData().length;
    badge.innerText = count;
}

function get10DaysHarvestData() {
    let list = [];
    const today = new Date();
    
    farmers.forEach(farmer => {
        if (farmer.lands) {
            farmer.lands.forEach(land => {
                if (land.history && land.history.length > 0) {
                    // Sort history to get the latest harvest date for this land
                    let sortedHistory = [...land.history].sort((a, b) => new Date(b.date) - new Date(a.date));
                    let lastHarvest = sortedHistory[0];
                    
                    if (lastHarvest && lastHarvest.date) {
                        let lastDate = new Date(lastHarvest.date);
                        let diffTime = today - lastDate;
                        let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        
                        // If last harvest was 10 or more days ago
                        if (diffDays >= 10) {
                            list.hostname = '';
                            list.push({
                                farmerName: farmer.name,
                                ownerId: farmer.owner || farmer.sap || '-',
                                landId: land.landId,
                                lastDate: lastHarvest.date,
                                daysAgo: diffDays
                            });
                        }
                    }
                } else {
                    // If land has no history at all, you can track it or skip. Let's track lands with no history if needed, or stick to last harvest.
                }
            });
        }
    });
    return list;
}

function render10DaysHarvestTable() {
    const content = document.getElementById("tenDaysPopupContent");
    if (!content) return;

    content.innerHTML = "";
    let data = get10DaysHarvestData();

    if (data.length === 0) {
        content.innerHTML = `<div style="text-align:center; color:#888; padding:15px;">10 రోజులు దాటిన హార్వెస్ట్ పెండింగ్‌లు ఏవీ లేవు</div>`;
        return;
    }

    data.forEach(item => {
        let div = document.createElement("div");
        div.style.cssText = "padding: 10px; border-bottom: 1px solid #eee; font-size: 12px;";
        div.innerHTML = `
            <strong style="color: #d9534f; font-size:13px;">🧑‍🌾 ${item.farmerName}</strong><br>
            <span style="color: #555;">ID: ${item.ownerId} | Land: ${item.landId}</span><br>
            <span style="color: #333; font-weight:bold;">చివరి హార్వెస్ట్ తేదీ: ${item.lastDate} (${item.daysAgo} రోజులు అయింది)</span>
        `;
        content.appendChild(div);
    });
}

// 6. DOM LOAD & EVENT LISTENERS
document.addEventListener("DOMContentLoaded", () => {
    renderFarmerCards();
    updateDashboard();
    populateFarmerDropdowns();
    updateFarmerNameSelectDropdown();
    renderTodayHarvestTable();

    const saveFarmerBtn = document.getElementById("saveFarmer");
    if (saveFarmerBtn) {
        saveFarmerBtn.addEventListener("click", () => {
            let selectEl = document.getElementById("farmerNameSelect");
            let sapInput = document.getElementById("sapId");
            let ownerInput = document.getElementById("ownerId");
            let supplierInput = document.getElementById("supplier");

            let selectedText = selectEl && selectEl.options[selectEl.selectedIndex] ? selectEl.options[selectEl.selectedIndex].text : "";
            let nameParts = selectedText.split(" - ");
            let farmerName = nameParts.length > 1 ? nameParts[1] : (selectEl ? selectEl.value : "");

            if (!farmerName || farmerName.includes("Select")) {
                farmerName = prompt("రైతు పేరు నమోదు చేయండి:");
            }

            if (!farmerName) {
                alert("దయచేసి రైతు పేరు ఇవ్వండి!");
                return;
            }

            let newFarmer = {
                name: farmerName.trim(),
                sap: sapInput ? sapInput.value.trim() : "",
                owner: ownerInput ? ownerInput.value.trim() : "",
                supplier: supplierInput ? supplierInput.value.trim() : "",
                lands: []
            };

            farmers.push(newFarmer);
            saveData();

            if (sapInput) sapInput.value = "";
            if (ownerInput) ownerInput.value = "";
            if (supplierInput) supplierInput.value = "";
            if (selectEl) selectEl.value = "";

            alert("రైతు వివరాలు విజయవంతంగా సేవ్ అయ్యాయి!");
        });
    }

    const saveLandBtn = document.getElementById("saveLand");
    if (saveLandBtn) {
        saveLandBtn.addEventListener("click", () => {
            let farmerSelect = document.getElementById("farmerSelect");
            let landIdInput = document.getElementById("landId");
            let landAreaInput = document.getElementById("landArea");

            let fIdx = farmerSelect ? farmerSelect.value : "";
            let landId = landIdInput ? landIdInput.value.trim() : "";
            let landArea = landAreaInput ? landAreaInput.value.trim() : "";

            if (fIdx === "" || !landId || !landArea) {
                alert("దయచేసి రైతును ఎంచుకుని, ల్యాండ్ ఐడీ మరియు ఎకరాలను నమోదు చేయండి!");
                return;
            }

            if (!farmers[fIdx].lands) {
                farmers[fIdx].lands = [];
            }

            farmers[fIdx].lands.push({
                landId: landId,
                area: landArea,
                history: []
            });

            saveData();

            if (landIdInput) landIdInput.value = "";
            if (landAreaInput) landAreaInput.value = "";

            alert("ల్యాండ్ వివరాలు విజయవంతంగా సేవ్ అయ్యాయి!");
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
                    selectAllDiv.style.cssText = "padding: 6px 0; border-bottom: 1px solid #eee; font-weight: bold; font-size: 13px; color: #007bff;";
                    selectAllDiv.innerHTML = `<label style="cursor:pointer;"><input type="checkbox" id="selectAllLands" style="margin-right: 8px;"> అన్ని ల్యాండ్స్ ఎంచుకోండి (Select All)</label>`;
                    container.appendChild(selectAllDiv);

                    farmers[fIdx].lands.forEach((land, lIdx) => {
                        let div = document.createElement("div");
                        div.style.cssText = "padding: 8px 0; border-bottom: 1px dashed #eee; font-size: 12px;";
                        div.innerHTML = `
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 4px;">
                                <label style="cursor:pointer; font-weight:bold;">
                                    <input type="checkbox" name="landCheckbox" value="${lIdx}" style="margin-right: 6px;">
                                    Land ID: <span style="color:#28a745;">${land.landId}</span> (విస్తీర్ణం: ${land.area} ఎకరాలు)
                                </label>
                            </div>
                            <div style="display:flex; gap:10px; padding-left: 20px;">
                                <input type="number" id="acres_${lIdx}" value="${land.area || ''}" placeholder="Acres" style="width:48%; padding:4px; font-size:12px; border:1px solid #ccc; border-radius:4px;">
                                <input type="number" id="tons_${lIdx}" placeholder="Tons" style="width:48%; padding:4px; font-size:12px; border:1px solid #ccc; border-radius:4px;">
                            </div>
                        `;
                        container.appendChild(div);
                    });

                    document.getElementById("selectAllLands").addEventListener("change", function() {
                        let checkboxes = document.querySelectorAll("input[name='landCheckbox']");
                        checkboxes.forEach(cb => cb.checked = this.checked);
                    });

                } else {
                    container.innerHTML = `<span style="color: #888; font-size: 12px;">ఈ రైతుకు ల్యాండ్స్ ఏవీ లేవు</span>`;
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
            const weightBridgeEl = document.getElementById("harvestWeightBridge");
            const weightBridgeVal = weightBridgeEl ? weightBridgeEl.value : "";

            if (fIdx === "" || selectedCheckboxes.length === 0) {
                alert("దయచేసి రైతును మరియు కనీసం ఒక ల్యాండ్‌ని ఎంచుకోండి!");
                return;
            }

            if (!weightBridgeVal) {
                alert("దయచేసి Weigh Bridge (కాటా)ని ఎంచుకోండి!");
                return;
            }

            let savedAny = false;
            let farmer = farmers[fIdx];

            selectedCheckboxes.forEach(cb => {
                let lIdx = cb.value;
                let acreInput = document.getElementById(`acres_${lIdx}`).value;
                let tonInput = document.getElementById(`tons_${lIdx}`).value;

                if (tonInput && parseFloat(tonInput) > 0) {
                    if (!farmer.lands[lIdx].history) {
                        farmer.lands[lIdx].history = [];
                    }

                    let harvestObj = {
                        date: hDate,
                        acres: acreInput || farmer.lands[lIdx].area,
                        tons: tonInput,
                        weightBridge: weightBridgeVal
                    };

                    farmer.lands[lIdx].history.push(harvestObj);
                    savedAny = true;
                }
            });

            if (!savedAny) {
                alert("దయచేసి ఎంచుకున్న తోటకు టన్నుల (Tons) వివరాలు నమోదు చేయండి!");
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

    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = farmers.filter(f => 
                (f.name && f.name.toLowerCase().includes(query)) || 
                (f.owner && f.owner.toLowerCase().includes(query)) ||
                (f.sap && f.sap.toLowerCase().includes(query))
            );
            renderFarmerCards(filtered);
        });
    }
});

// EXCEL / CSV DOWNLOAD
function downloadHarvestCSV() {
    let startDate = document.getElementById("startDate") ? document.getElementById("startDate").value : "";
    let endDate = document.getElementById("endDate") ? document.getElementById("endDate").value : "";
    
    let csvRows = [];
    csvRows.push(["Land ID", "Farmer Name", "Phone", "Acres", "Tons", "SAP ID", "Weight Name"]);

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
                            csvRows.push([
                                land.landId || '',
                                farmer.name || '',
                                farmer.phone || farmer.mobile || farmer.phoneNumber || '',
                                h.acres || land.area || '',
                                h.tons || '',
                                farmer.sap || farmer.owner || '',
                                h.weightBridge || ''
                            ]);
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

    let csvContent = csvRows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    let blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    let url = URL.createObjectURL(blob);
    
    let a = document.createElement('a');
    a.href = url;
    a.download = startDate && endDate ? `Harvest_${startDate}_to_${endDate}.csv` : 'Harvest_Report.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// BACKUP EXPORT / IMPORT
function exportDataToExcel() {
    let dataObj = { farmers: farmers };
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataObj, null, 2));
    let dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "OilPalm_Backup.json");
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    dlAnchorElem.remove();
}

function importDataFromJSON(event) {
    let file = event.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = function(e) {
        try {
            let json = JSON.parse(e.target.result);
            if (json.farmers) {
                farmers = json.farmers;
                saveData();
                alert("బ్యాకప్ విజయవంతంగా ఇంపోర్ట్ చేయబడింది!");
            } else {
                alert("ఫైల్ ఫార్మాట్ సరిగ్గా లేదు!");
            }
        } catch (err) {
            alert("JSON ఫైల్ చదవడంలో లోపం ఏర్పడింది!");
        }
    };
    reader.readAsText(file);
}

// EDIT / DELETE MODAL FUNCTIONS
function editFarmer(fIdx) {
    const farmer = farmers[fIdx];
    if (!farmer) return;

    let modal = document.getElementById("editFarmerPopupModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "editFarmerPopupModal";
        modal.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:3000; justify-content:center; align-items:center;";
        modal.innerHTML = `
            <div style="background:white; width:90%; max-width:350px; padding:20px; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.2);">
                <h3 style="margin:0 0 15px 0; font-size:15px; color:#333;">రైతు వివరాలు సవరించుట</h3>
                <input type="hidden" id="editFarmerIdx">
                <div style="margin-bottom:10px;">
                    <label style="font-size:12px; color:#555;">రైతు పేరు:</label><br>
                    <input type="text" id="editFarmerName" style="width:100%; padding:6px; box-sizing:border-box; font-size:13px; border:1px solid #ccc; border-radius:4px;">
                </div>
                <div style="margin-bottom:10px;">
                    <label style="font-size:12px; color:#555;">Owner ID:</label><br>
                    <input type="text" id="editFarmerOwner" style="width:100%; padding:6px; box-sizing:border-box; font-size:13px; border:1px solid #ccc; border-radius:4px;">
                </div>
                <div style="margin-bottom:10px;">
                    <label style="font-size:12px; color:#555;">SAP ID:</label><br>
                    <input type="text" id="editFarmerSap" style="width:100%; padding:6px; box-sizing:border-box; font-size:13px; border:1px solid #ccc; border-radius:4px;">
                </div>
                <div style="margin-bottom:10px;">
                    <label style="font-size:12px; color:#555;">Phone Number:</label><br>
                    <input type="text" id="editFarmerPhone" style="width:100%; padding:6px; box-sizing:border-box; font-size:13px; border:1px solid #ccc; border-radius:4px;">
                </div>
                <div style="margin-bottom:15px;">
                    <label style="font-size:12px; color:#555;">Supplier Name:</label><br>
                    <input type="text" id="editFarmerSupplier" style="width:100%; padding:6px; box-sizing:border-box; font-size:13px; border:1px solid #ccc; border-radius:4px;">
                </div>
                <div style="text-align:right;">
                    <button type="button" onclick="closeEditFarmerPopup()" style="background:#ccc; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; margin-right:5px; font-size:12px;">రద్దు చేయి</button>
                    <button type="button" onclick="saveEditedFarmer()" style="background:#28a745; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px;">సేవ్ చేయి</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById("editFarmerIdx").value = fIdx;
    document.getElementById("editFarmerName").value = farmer.name || "";
    document.getElementById("editFarmerOwner").value = farmer.owner || "";
    document.getElementById("editFarmerSap").value = farmer.sap || "";
    document.getElementById("editFarmerPhone").value = farmer.phone || farmer.mobile || farmer.phoneNumber || "";
    document.getElementById("editFarmerSupplier").value = farmer.supplier || "";

    modal.style.display = "flex";
}

function closeEditFarmerPopup() {
    let modal = document.getElementById("editFarmerPopupModal");
    if (modal) modal.style.display = "none";
}

function saveEditedFarmer() {
    let fIdx = document.getElementById("editFarmerIdx").value;
    if (fIdx === "" || !farmers[fIdx]) return;

    let newName = document.getElementById("editFarmerName").value.trim();
    let newOwner = document.getElementById("editFarmerOwner").value.trim();
    let newSap = document.getElementById("editFarmerSap").value.trim();
    let newPhone = document.getElementById("editFarmerPhone").value.trim();
    let newSupplier = document.getElementById("editFarmerSupplier").value.trim();

    if (!newName) {
        alert("రైతు పేరు తప్పనిసరిగా ఇవ్వాలి!");
        return;
    }

    farmers[fIdx].name = newName;
    farmers[fIdx].owner = newOwner;
    farmers[fIdx].sap = newSap;
    farmers[fIdx].phone = newPhone;
    farmers[fIdx].supplier = newSupplier;

    saveData();
    closeEditFarmerPopup();
    alert("వివరాలు అప్‌డేట్ చేయబడ్డాయి!");
}

function deleteFarmer(fIdx) {
    if (confirm("ఈ రైతును మరియు ఆయన ల్యాండ్స్‌ని డిలీట్ చేయాలా?")) {
        farmers.splice(fIdx, 1);
        saveData();
    }
}

function deleteLand(fIdx, lIdx) {
    if (confirm("ఈ భూమిని (Land) డిలీట్ చేయాలా?")) {
        farmers[fIdx].lands.splice(lIdx, 1);
        saveData();
    }
}

function selectFarmerForHarvest(fIdx, lIdx) {
    const harvestFarmer = document.getElementById("harvestFarmer");
    if (harvestFarmer) {
        harvestFarmer.value = fIdx;
        let event = new Event('change');
        harvestFarmer.dispatchEvent(event);

        setTimeout(() => {
            let checkbox = document.querySelector(`input[name='landCheckbox'][value='${lIdx}']`);
            if (checkbox) checkbox.checked = true;
        }, 150);

        harvestFarmer.scrollIntoView({ behavior: 'smooth' });
    }
}
