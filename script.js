// లోకల్ స్టోరేజ్ నుండి పాత డేటాను సురక్షితంగా లోడ్ చేయడం
let farmers = JSON.parse(localStorage.getItem("nbl_farmers_data")) || JSON.parse(localStorage.getItem("farmersData")) || [];

function saveData() {
    localStorage.setItem("nbl_farmers_data", JSON.stringify(farmers));
    localStorage.setItem("farmersData", JSON.stringify(farmers));
    updateDashboard();
    populateFarmerDropdowns();
    updateFarmerNameSelectDropdown();
    renderHarvestedTable();
    renderFarmerCards();
}

// 1. DASHBOARD & DROPDOWNS UPDATE
function updateDashboard() {
    let totalLands = 0;
    let totalHarvests = 0;
    let totalTonsSum = 0;

    farmers.forEach(farmer => {
        if (farmer.lands) {
            totalLands += farmer.lands.length;
            farmer.lands.forEach(land => {
                if (land.history) {
                    totalHarvests += land.history.length;
                    land.history.forEach(h => {
                        totalTonsSum += parseFloat(h.tons) || 0;
                    });
                }
            });
        }
    });

    const farmerCountEl = document.getElementById("farmerCount");
    const landCountEl = document.getElementById("landCount");
    const harvestCountEl = document.getElementById("harvestCount");
    const totalTonsEl = document.getElementById("totalTons");

    if (farmerCountEl) farmerCountEl.innerText = farmers.length;
    if (landCountEl) landCountEl.innerText = totalLands;
    if (harvestCountEl) harvestCountEl.innerText = totalHarvests;
    if (totalTonsEl) totalTonsEl.innerText = totalTonsSum.toFixed(2);
}

function populateFarmerDropdowns() {
    const farmerSelect = document.getElementById("farmerSelect");
    const harvestFarmer = document.getElementById("harvestFarmer");

    if (farmerSelect) {
        farmerSelect.innerHTML = '<option value="">Select Farmer</option>';
        farmers.forEach((farmer, idx) => {
            let displayId = farmer.owner && farmer.owner !== 'undefined' && farmer.owner !== '' ? farmer.owner : (farmer.sap || '');
            farmerSelect.innerHTML += `<option value="${idx}">${displayId} - ${farmer.name}</option>`;
        });
    }

    if (harvestFarmer) {
        harvestFarmer.innerHTML = '<option value="">Select Farmer</option>';
        farmers.forEach((farmer, idx) => {
            let displayId = farmer.owner && farmer.owner !== 'undefined' && farmer.owner !== '' ? farmer.owner : (farmer.sap || '');
            harvestFarmer.innerHTML += `<option value="${idx}">${displayId} - ${farmer.name}</option>`;
        });
    }
}

function updateFarmerNameSelectDropdown() {
    const selectEl = document.getElementById("farmerNameSelect");
    if (selectEl) {
        selectEl.innerHTML = '<option value="">-- Select Farmer --</option>';
        farmers.forEach(farmer => {
            let displayId = farmer.owner && farmer.owner !== 'undefined' && farmer.owner !== '' ? farmer.owner : (farmer.sap || '');
            selectEl.innerHTML += `<option value="${displayId}">${displayId} - ${farmer.name}</option>`;
        });
    }
}

// 2. RENDER FARMER CARDS
function renderFarmerCards(filteredData = null) {
    const list = document.getElementById("farmerList");
    if (!list) return;

    list.innerHTML = "";

    let dataToRender = filteredData ? filteredData : farmers;

    if (dataToRender.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#888;">రైతు వివరాలు ఏమీ లేవు. దయచేసి ఎక్సెల్ ఫైల్ అప్‌లోడ్ చేయండి.</p>`;
        return;
    }

    dataToRender.forEach((farmer) => {
        let fIdx = farmers.indexOf(farmer);

        let card = `
        <div style="background:#fff; border:1px solid #ddd; border-radius:8px; margin-bottom:15px; padding:15px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0 0 10px 0; color:#333;">${farmer.name}</h3>
                <div>
                    <button onclick="viewFarmerFullHistory(${fIdx})" style="background:#17a2b8; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:5px; width:auto; font-size:11px;">History</button>
                    <button onclick="editFarmer(${fIdx})" style="background:#e3f2fd; color:#1976d2; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:5px; width:auto;">Edit</button>
                    <button onclick="deleteFarmer(${fIdx})" style="background:#ffebee; color:#d32f2f; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; width:auto;">Delete</button>
                </div>
            </div>
            <p><strong>Owner ID:</strong> ${farmer.owner || 'N/A'} | <strong>SAP ID:</strong> ${farmer.sap || 'N/A'} | <strong>Supplier:</strong> ${farmer.supplier || 'N/A'}</p>`;

        if (farmer.lands && farmer.lands.length > 0) {
            farmer.lands.forEach((land, lIdx) => {
                card += `
                <div style="background:#f9f9f9; border-left:3px solid #4CAF50; padding:10px; margin-top:8px; border-radius:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span><strong>Land ID:</strong> ${land.landId} (${land.area} Acres)</span>
                        <div>
                            <button onclick="selectFarmerForHarvest(${fIdx}, ${lIdx})" style="background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7; padding:3px 8px; border-radius:4px; cursor:pointer; font-size:12px; margin-right:5px; width:auto;">🌾 Harvester</button>
                            <button onclick="editLand(${fIdx}, ${lIdx})" style="font-size:11px; background:#f0f0f0; border:none; padding:3px 6px; cursor:pointer; margin-right:3px; width:auto;">Edit</button>
                            <button onclick="deleteLand(${fIdx}, ${lIdx})" style="font-size:11px; background:#ffebee; color:#d32f2f; border:none; padding:3px 6px; cursor:pointer; width:auto;">Delete</button>
                        </div>
                    </div>
                </div>`;
            });
        }
        card += `</div>`;
        list.innerHTML += card;
    });
}

// 3. 10 DAYS HARVEST HISTORY TABLE FUNCTION (సరిచేసినది)
function renderHarvestedTable() {
    const popupContent = document.getElementById("harvestPopupContent");
    const badgeCount = document.getElementById("harvestBadgeCount");
    
    if (!popupContent || !badgeCount) return;

    popupContent.innerHTML = "";
    let harvestItems = [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    farmers.forEach((farmer, fIdx) => {
        if (farmer.lands && farmer.lands.length > 0) {
            farmer.lands.forEach((land, lIdx) => {
                if (land.history && land.history.length > 0) {
                    land.history.forEach(h => {
                        if (h.date) {
                            let harvestDate = new Date(h.date);
                            harvestDate.setHours(0, 0, 0, 0);
                            
                            let diffTime = today - harvestDate;
                            let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                            if (diffDays >= 0 && diffDays <= 10) {
                                harvestItems.push({
                                    fIdx: fIdx,
                                    lIdx: lIdx,
                                    farmerName: farmer.name,
                                    ownerId: farmer.owner || '-',
                                    landId: land.landId,
                                    date: h.date,
                                    tons: h.tons || 0,
                                    acres: h.acres || '-',
                                    diffDays: diffDays
                                });
                            }
                        }
                    });
                }
            });
        }
    });

    harvestItems.sort((a, b) => new Date(b.date) - new Date(a.date));
    badgeCount.innerText = harvestItems.length;

    if (harvestItems.length === 0) {
        popupContent.innerHTML = `<div style="text-align:center; color:#888; padding:15px;">గత 10 రోజుల్లో హార్వెస్ట్ రికార్డులు ఏవీ లేవు</div>`;
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
            <div>
                <span style="background:#e8f5e9; color:#2e7d32; padding:3px 6px; border-radius:4px; font-size:11px; font-weight:bold;">${item.diffDays === 0 ? 'ఈరోజే' : item.diffDays + ' రోజుల క్రితం'}</span>
            </div>
        `;
        popupContent.appendChild(div);
    });
}

// 4. DATE RANGE FILTER CSV DOWNLOAD FUNCTION
function downloadHarvestCSV() {
    let startDate = document.getElementById("startDate") ? document.getElementById("startDate").value : "";
    let endDate = document.getElementById("endDate") ? document.getElementById("endDate").value : "";
    
    let csvRows = [];
    csvRows.push(["Farmer Name", "Owner ID", "SAP ID", "Land ID", "Date", "Acres", "Tons"]);

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
                                farmer.name || '',
                                farmer.owner || '',
                                farmer.sap || '',
                                land.landId || '',
                                hDate || '',
                                h.acres || '',
                                h.tons || ''
                            ]);
                            recordCount++;
                        }
                    });
                }
            });
        }
    });

    if (recordCount === 0) {
        alert("సెలెక్ట్ చేసిన తేదీలలో హార్వెస్ట్ రికార్డులు ఏవీ లేవు!");
        return;
    }

    let csvContent = csvRows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    let blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    let url = URL.createObjectURL(blob);
    
    let a = document.createElement('a');
    a.href = url;
    a.download = startDate && endDate ? `Harvest_${startDate}_to_${endDate}.csv` : 'All_Harvest_History.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// 5. EVENT LISTENERS
document.addEventListener("DOMContentLoaded", () => {
    renderFarmerCards();
    updateDashboard();
    populateFarmerDropdowns();
    updateFarmerNameSelectDropdown();
    renderHarvestedTable();

    const saveFarmerBtn = document.getElementById("saveFarmer");
    if (saveFarmerBtn) {
        saveFarmerBtn.addEventListener("click", () => {
            const selectEl = document.getElementById("farmerNameSelect");
            let farmerName = "";
            let ownerId = document.getElementById("ownerId").value.trim();

            if (selectEl && selectEl.value) {
                let selectedOption = selectEl.options[selectEl.selectedIndex];
                farmerName = selectedOption.text.split('-')[1] ? selectedOption.text.split('-')[1].trim() : selectedOption.text.trim();
            } else {
                farmerName = prompt("రైతు పేరు నమోదు చేయండి:");
            }

            const sapId = document.getElementById("sapId").value.trim();
            const supplier = document.getElementById("supplier").value.trim();

            if (!ownerId || !farmerName) {
                alert("దయచేసి రైతు పేరు మరియు Owner ID ఇవ్వండి!");
                return;
            }

            farmers.push({
                name: farmerName,
                owner: ownerId,
                sap: sapId,
                supplier: supplier,
                lands: []
            });

            saveData();
            alert("రైతు సేవ్ అయ్యారు!");
        });
    }

    const saveLandBtn = document.getElementById("saveLand");
    if (saveLandBtn) {
        saveLandBtn.addEventListener("click", () => {
            const fIdx = document.getElementById("farmerSelect").value;
            const landId = document.getElementById("landId").value.trim();
            const landArea = document.getElementById("landArea").value.trim();

            if (fIdx === "" || !landId || !landArea) {
                alert("అన్ని భూమి వివరాలు పూరించండి!");
                return;
            }

            if (!farmers[fIdx].lands) farmers[fIdx].lands = [];

            farmers[fIdx].lands.push({
                landId: landId,
                area: landArea,
                history: []
            });

            saveData();
            alert("భూమి వివరాలు సేవ్ అయ్యాయి!");
        });
    }

    const harvestFarmer = document.getElementById("harvestFarmer");
    if (harvestFarmer) {
        harvestFarmer.addEventListener("change", (e) => {
            const fIdx = e.target.value;
            const harvestLand = document.getElementById("harvestLand");
            if (harvestLand) {
                harvestLand.innerHTML = '<option value="">Select Land</option>';
                if (fIdx !== "" && farmers[fIdx] && farmers[fIdx].lands) {
                    farmers[fIdx].lands.forEach((land, lIdx) => {
                        harvestLand.innerHTML += `<option value="${lIdx}">${land.landId} (${land.area} Acres)</option>`;
                    });
                }
            }
        });
    }

    const saveHarvestBtn = document.getElementById("saveHarvest");
    if (saveHarvestBtn) {
        saveHarvestBtn.addEventListener("click", () => {
            const fIdx = document.getElementById("harvestFarmer").value;
            const lIdx = document.getElementById("harvestLand").value;
            const hDate = document.getElementById("harvestDate").value;
            const hAcres = document.getElementById("harvestAcres").value;
            const hTons = document.getElementById("harvestTons").value;

            if (fIdx === "" || lIdx === "" || !hDate || !hAcres || !hTons) {
                alert("అన్ని హార్వెస్ట్ వివరాలు పూరించండి!");
                return;
            }

            if (!farmers[fIdx].lands[lIdx].history) farmers[fIdx].lands[lIdx].history = [];

            farmers[fIdx].lands[lIdx].history.push({
                date: hDate,
                acres: hAcres,
                tons: hTons
            });

            saveData();
            alert("హార్వెస్ట్ వివరాలు సేవ్ అయ్యాయి!");
        });
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

    const downloadCSVBtn = document.getElementById("downloadCSV");
    if (downloadCSVBtn) {
        downloadCSVBtn.addEventListener("click", downloadHarvestCSV);
    }

    // Excel / CSV File Upload Handling
    const importBtn = document.getElementById("importBtn");
    const excelFileInput = document.getElementById("excelFileInput");

    if (importBtn && excelFileInput) {
        importBtn.addEventListener("click", () => {
            const file = excelFileInput.files[0];
            if (!file) {
                alert("దయచేసి ముందుగా ఎక్సెల్ ఫైల్‌ని ఎంచుకోండి!");
                return;
            }

            let reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = function(e) {
                try {
                    let data = new Uint8Array(e.target.result);
                    let workbook = XLSX.read(data, {type: 'array', cellText: false, cellDates: true});
                    let firstSheet = workbook.SheetNames[0];
                    let excelData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], {raw: false});
                    
                    if (excelData.length === 0) {
                        alert("ఫైల్‌లో డేటా ఖాళీగా ఉంది!");
                        return;
                    }

                    excelData.forEach(row => {
                        let firstName = row['Farm Owner Name'] ? String(row['Farm Owner Name']).trim() : '';
                        let lastName = row['Owner Last Name'] ? String(row['Owner Last Name']).trim() : '';
                        let fName = (firstName + ' ' + lastName).trim();
                        
                        let oId = row['Farmowner ID'] !== undefined && row['Farmowner ID'] !== null && String(row['Farmowner ID']) !== 'undefined' ? String(row['Farmowner ID']).trim() : '';
                        let sId = row['SAP ID'] !== undefined && row['SAP ID'] !== null && String(row['SAP ID']) !== 'undefined' ? String(row['SAP ID']).trim() : '';
                        let lId = row['Farmer/Land ID'] !== undefined && row['Farmer/Land ID'] !== null ? String(row['Farmer/Land ID']).trim() : 'Land-1';
                        let areaSize = row['Area Proposed'] !== undefined ? row['Area Proposed'] : '1';
                        let supplierName = row['Supplier Name'] ? String(row['Supplier Name']).trim() : '';

                        if (oId) {
                            let existingFarmer = farmers.find(f => f.owner === oId);
                            
                            if (existingFarmer) {
                                if ((!existingFarmer.sap || existingFarmer.sap === '') && sId) existingFarmer.sap = sId;
                                if ((!existingFarmer.supplier || existingFarmer.supplier === '') && supplierName) existingFarmer.supplier = supplierName;

                                if (!existingFarmer.lands) existingFarmer.lands = [];
                                let landExists = existingFarmer.lands.some(l => l.landId === lId);
                                if (!landExists) {
                                    existingFarmer.lands.push({
                                        landId: lId,
                                        area: areaSize,
                                        history: []
                                    });
                                }
                            } else {
                                farmers.push({
                                    name: fName,
                                    owner: oId,
                                    sap: sId,
                                    supplier: supplierName,
                                    lands: [{
                                        landId: lId,
                                        area: areaSize,
                                        history: []
                                    }]
                                });
                            }
                        }
                    });

                    saveData();
                    alert(`ఎక్సెల్ డేటా విజయవంతంగా అప్‌డేట్ చేయబడింది!`);
                } catch (error) {
                    console.error(error);
                    alert("ఫైల్ రీడ్ చేయడంలో లోపం ఏర్పడింది.");
                }
            };
        });
    }
});

// Helper & Management Functions
function editFarmer(fIdx) {
    const farmer = farmers[fIdx];
    const newName = prompt("రైతు పేరు:", farmer.name);
    const newOwner = prompt("Owner ID:", farmer.owner);
    if (newName && newOwner) {
        farmer.name = newName;
        farmer.owner = newOwner;
        saveData();
    }
}

function deleteFarmer(fIdx) {
    if (confirm("ఈ రైతును డిలీట్ చేయాలా?")) {
        farmers.splice(fIdx, 1);
        saveData();
    }
}

function editLand(fIdx, lIdx) {
    const land = farmers[fIdx].lands[lIdx];
    const newLandId = prompt("Land ID:", land.landId);
    const newArea = prompt("Area:", land.area);
    if (newLandId && newArea) {
        land.landId = newLandId;
        land.area = newArea;
        saveData();
    }
}

function deleteLand(fIdx, lIdx) {
    if (confirm("ఈ భూమిని డిలీట్ చేయాలా?")) {
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
            const harvestLand = document.getElementById("harvestLand");
            if (harvestLand) harvestLand.value = lIdx;
        }, 100);

        harvestFarmer.scrollIntoView({ behavior: 'smooth' });
    }
}

// పాప్‌అప్ టోగుల్ చేయడానికి
function toggleHarvestPopup() {
    const modal = document.getElementById("harvestPopupModal");
    if (modal) {
        modal.style.display = modal.style.display === "block" ? "none" : "block";
    }
}

window.addEventListener("click", function(e) {
    const modal = document.getElementById("harvestPopupModal");
    const icon = document.querySelector("div[onclick='toggleHarvestPopup()']");
    if (modal && icon && !modal.contains(e.target) && !icon.contains(e.target)) {
        modal.style.display = "none";
    }
});

// పూర్తి హిస్టరీ మరియు ఎడిట్/డిలీట్ ఫంక్షన్స్
function viewFarmerFullHistory(farmerIndex) {
    let farmer = farmers[farmerIndex];

    let modal = document.getElementById("historyPopupModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "historyPopupModal";
        modal.className = "modal-overlay";
        modal.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2000; justify-content:center; align-items:center;";
        modal.innerHTML = `
            <div style="background:white; width:90%; max-width:450px; padding:20px; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.2); position:relative; max-height:80vh; display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <h3 id="historyModalTitle" style="margin:0; font-size:16px; color:#333;">Farmer Harvest History</h3>
                    <button onclick="closeHistoryPopup()" style="background:none; border:none; font-size:18px; cursor:pointer; color:#888;">✕</button>
                </div>
                <div id="historyModalBody" style="overflow-y:auto; margin-top:15px; font-size:13px; flex-grow:1;"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById("historyModalTitle").innerText = `${farmer.name} (Owner ID: ${farmer.owner || '-'}) పూర్తి హిస్టరీ`;
    let bodyDiv = document.getElementById("historyModalBody");
    bodyDiv.innerHTML = "";

    if (!farmer.lands || farmer.lands.length === 0) {
        bodyDiv.innerHTML = `<div style="text-align:center; color:#888; padding:20px;">ల్యాండ్స్ వివరాలు ఏవీ లేవు</div>`;
    } else {
        let hasAnyHistory = false;
        let htmlContent = "";

        farmer.lands.forEach((land, lIdx) => {
            if (land.history && land.history.length > 0) {
                hasAnyHistory = true;
                
                htmlContent += `
                    <div style="font-weight:bold; color:#007bff; margin-top:10px; margin-bottom:5px; border-bottom:1px dashed #ddd; padding-bottom:3px;">Land ID: ${land.landId} (Area: ${land.area || '-'})</div>
                    <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:10px;">
                        <thead>
                            <tr style="background:#f9f9f9; text-align:left;">
                                <th style="padding:6px; border:1px solid #ddd;">తేదీ</th>
                                <th style="padding:6px; border:1px solid #ddd;">ఎకరాలు</th>
                                <th style="padding:6px; border:1px solid #ddd;">టన్స్</th>
                                <th style="padding:6px; border:1px solid #ddd; text-align:center;">చర్యలు</th>
                            </tr>
                        </thead>
                        <tbody>`;
                
                land.history.forEach((h, hIdx) => {
                    htmlContent += `
                        <tr>
                            <td style="padding:6px; border:1px solid #ddd;">${h.date || '-'}</td>
                            <td style="padding:6px; border:1px solid #ddd;">${h.acres || '-'}</td>
                            <td style="padding:6px; border:1px solid #ddd; font-weight:bold; color:#28a745;">${h.tons || '0'} Tons</td>
                            <td style="padding:6px; border:1px solid #ddd; text-align:center; white-space:nowrap;">
                                <button onclick="editHarvest(${farmerIndex}, ${lIdx}, ${hIdx})" style="background:#e3f2fd; color:#1976d2; border:none; padding:3px 6px; border-radius:4px; font-size:10px; cursor:pointer; width:auto; margin-right:3px;">Edit</button>
                                <button onclick="deleteHarvest(${farmerIndex}, ${lIdx}, ${hIdx})" style="background:#ffebee; color:#d32f2f; border:none; padding:3px 6px; border-radius:4px; font-size:10px; cursor:pointer; width:auto;">Delete</button>
                            </td>
                        </tr>`;
                });

                htmlContent += `</tbody></table>`;
            }
        });

        if (!hasAnyHistory) {
            bodyDiv.innerHTML = `<div style="text-align:center; color:#888; padding:20px;">ఈ రైతుకు సంబంధించిన హార్వెస్ట్ హిస్టరీ ఏదీ లేదు</div>`;
        } else {
            bodyDiv.innerHTML = htmlContent;
        }
    }

    modal.style.display = "flex";
}

function editHarvest(fIdx, lIdx, hIdx) {
    let historyItem = farmers[fIdx].lands[lIdx].history[hIdx];
    
    let newDate = prompt("తేదీ (Date) సవరించండి:", historyItem.date || "");
    if (newDate === null) return;
    
    let newAcres = prompt("ఎకరాలు సవరించండి:", historyItem.acres || "");
    if (newAcres === null) return;
    
    let newTons = prompt("టన్స్ (Tons) సవరించండి:", historyItem.tons || "");
    if (newTons === null) return;

    farmers[fIdx].lands[lIdx].history[hIdx].date = newDate;
    farmers[fIdx].lands[lIdx].history[hIdx].acres = newAcres;
    farmers[fIdx].lands[lIdx].history[hIdx].tons = parseFloat(newTons) || 0;

    saveData();
    viewFarmerFullHistory(fIdx);
}

function deleteHarvest(fIdx, lIdx, hIdx) {
    if (confirm("ఈ హార్వెస్ట్ రికార్డును తొలగించాలనుకుంటున్నారా?")) {
        farmers[fIdx].lands[lIdx].history.splice(hIdx, 1);
        saveData();
        viewFarmerFullHistory(fIdx);
    }
}

function closeHistoryPopup() {
    let modal = document.getElementById("historyPopupModal");
    if (modal) {
        modal.style.display = "none";
    }
}
// సరిగ్గా 10వ రోజు జరిగిన హార్వెస్ట్ వివరాలు చూపించే ఫంక్షన్
function renderHarvestedTable() {
    const popupContent = document.getElementById("harvestPopupContent");
    const badgeCount = document.getElementById("harvestBadgeCount");
    
    if (!popupContent || !badgeCount) return;

    popupContent.innerHTML = "";
    let harvestItems = [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    farmers.forEach((farmer, fIdx) => {
        if (farmer.lands && farmer.lands.length > 0) {
            farmer.lands.forEach((land, lIdx) => {
                if (land.history && land.history.length > 0) {
                    land.history.forEach((h, hIdx) => {
                        // యూజర్ 'Done' నొక్కని హార్వెస్ట్ రికార్డ్స్ మాత్రమే తీసుకోవడానికి
                        if (h.date && !h.isHarvestDone) {
                            let harvestDate = new Date(h.date);
                            harvestDate.setHours(0, 0, 0, 0);
                            
                            let diffTime = today - harvestDate;
                            let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                            // కేవలం సరిగ్గా 10వ రోజు (10 Days back) జరిగినవి మాత్రమే
                            if (diffDays === 10) {
                                harvestItems.push({
                                    fIdx: fIdx,
                                    lIdx: lIdx,
                                    hIdx: hIdx,
                                    farmerName: farmer.name,
                                    ownerId: farmer.owner || '-',
                                    landId: land.landId,
                                    date: h.date,
                                    tons: h.tons || 0
                                });
                            }
                        }
                    });
                }
            });
        }
    });

    badgeCount.innerText = harvestItems.length;

    if (harvestItems.length === 0) {
        popupContent.innerHTML = `<div style="text-align:center; color:#888; padding:15px;">సరిగ్గా 10 రోజుల క్రితం జరిగిన హార్వెస్ట్ రికార్డులు ఏవీ లేవు</div>`;
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
            <div>
                <button onclick="markHarvestDone(${item.fIdx}, ${item.lIdx}, ${item.hIdx})" style="background:#28a745; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">Done</button>
            </div>
        `;
        popupContent.appendChild(div);
    });
}

// 'Done' బటన్ నొక్కినప్పుడు లిస్ట్ నుండి పోయేలా చేయడానికి ఫంక్షన్
function markHarvestDone(fIdx, lIdx, hIdx) {
    if (confirm("ఈ హార్వెస్ట్ పూర్తయినట్లు మార్క్ చేయాలా?")) {
        // ఈ హార్వెస్ట్ రికార్డ్‌కు 'Done' అయినట్లు ఫ్లాగ్ సెట్ చేయడం
        if (!farmers[fIdx].lands[lIdx].history[hIdx].isHarvestDone) {
            farmers[fIdx].lands[lIdx].history[hIdx].isHarvestDone = true;
            saveData(); // డేటా సేవ్ చేసి టేబుల్ రిఫ్రెష్ చేస్తుంది
        }
    }
}
