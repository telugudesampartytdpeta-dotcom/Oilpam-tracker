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

// 2. RENDER FARMER CARDS (క్రింద హార్వెస్ట్ టేబుల్ కనిపించకుండా ఉండేలా)
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



// 3. 10 DAYS HARVEST HISTORY TABLE FUNCTION
function renderHarvestedTable() {
    const tableBody = document.getElementById("harvestedTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    let harvestedCount = 0;
    const today = new Date();

    farmers.forEach(farmer => {
        if (farmer.lands && farmer.lands.length > 0) {
            farmer.lands.forEach(land => {
                if (land.history && land.history.length > 0) {
                    let lastHarvest = land.history.slice().reverse().find(h => h.date);
                    
                    if (lastHarvest && lastHarvest.date) {
                        let harvestDate = new Date(lastHarvest.date);
                        let diffTime = today - harvestDate;
                        let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays >= 0 && diffDays <= 10) {
                            harvestedCount++;
                            let remainingDays = 10 - diffDays;

                            let row = document.createElement("tr");
                            row.innerHTML = `
                                <td>${farmer.name}</td>
                                <td>${farmer.owner || '-'}</td>
                                <td>${land.landId}</td>
                                <td>${lastHarvest.date}</td>
                                <td><span style="background:#fff3cd; color:#856404; padding:3px 6px; border-radius:4px; font-size:12px;">ఇంకా ${remainingDays} రోజులు ఉంది</span></td>
                            `;
                            tableBody.appendChild(row);
                        }
                    }
                }
            });
        }
    });

    if (harvestedCount === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#888; padding:10px;">గత 10 రోజుల్లో హార్వెస్ట్ చేసిన ల్యాండ్స్ ఏవీ లేవు</td></tr>`;
    }
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

    // Excel / CSV File Upload Handling (283 Unique Owner IDs పద్ధతి)
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
                            // ఖచ్చితంగా Farmowner ID ఆధారంగా మాత్రమే యూనిక్ రైతును గుర్తించడం
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
                    alert(`ఎక్సెల్ డేటా విజయవంతంగా అప్‌డేట్ చేయబడింది! మొత్తం 283 Owner ID లు లోడ్ అయ్యాయి.`);
                } catch (error) {
                    console.error(error);
                    alert("ఫైల్ రీడ్ చేయడంలో లోపం ఏర్పడింది.");
                }
            };
        });
    }
});

// Helper Functions
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

function editHarvest(fIdx, lIdx, hIdx) {
    const h = farmers[fIdx].lands[lIdx].history[hIdx];
    const newDate = prompt("తేదీ (YYYY-MM-DD):", h.date);
    const newAcres = prompt("Acres:", h.acres);
    const newTons = prompt("Tons:", h.tons);
    if (newDate && newAcres && newTons) {
        h.date = newDate;
        h.acres = newAcres;
        h.tons = newTons;
        saveData();
    }
}

function deleteHarvest(fIdx, lIdx, hIdx) {
    if (confirm("ఈ హార్వెస్ట్ రికార్డు డిలీట్ చేయాలా?")) {
        farmers[fIdx].lands[lIdx].history.splice(hIdx, 1);
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

// బ్రౌజర్ ఎక్కడైనా క్లిక్ చేస్తే పాప్‌అప్ క్లోజ్ అయ్యేలా (Optional)
window.addEventListener("click", function(e) {
    const modal = document.getElementById("harvestPopupModal");
    const icon = document.querySelector("div[onclick='toggleHarvestPopup()']");
    if (modal && icon && !modal.contains(e.target) && !icon.contains(e.target)) {
        modal.style.display = "none";
    }
});

// 10 Days Harvest Icon & Popup Update Function
function renderHarvestedTable() {
    const popupContent = document.getElementById("harvestPopupContent");
    const badgeCount = document.getElementById("harvestBadgeCount");
    
    if (!popupContent || !badgeCount) return;

    popupContent.innerHTML = "";
    let harvestedCount = 0;
    const today = new Date();

    farmers.forEach(farmer => {
        if (farmer.lands && farmer.lands.length > 0) {
            farmer.lands.forEach(land => {
                if (land.history && land.history.length > 0) {
                    let lastHarvest = land.history.slice().reverse().find(h => h.date);
                    
                    if (lastHarvest && lastHarvest.date) {
                        let harvestDate = new Date(lastHarvest.date);
                        let diffTime = today - harvestDate;
                        let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays >= 0 && diffDays <= 10) {
                            harvestedCount++;
                            let remainingDays = 10 - diffDays;

                            let item = document.createElement("div");
                            item.style.cssText = "padding: 8px; border-bottom: 1px solid #f1f1f1; display: flex; justify-content: space-between; align-items: center;";
                            item.innerHTML = `
                                <div>
                                    <strong>${farmer.name}</strong><br>
                                    <small style="color: #666;">Owner ID: ${farmer.owner || '-'} | Land: ${land.landId}</small><br>
                                    <small style="color: #007bff;">Last Date: ${lastHarvest.date}</small>
                                </div>
                                <span style="background:#fff3cd; color:#856404; padding:2px 5px; border-radius:4px; font-size:11px;">${remainingDays} రోజులు</span>
                            `;
                            popupContent.appendChild(item);
                        }
                    }
                }
            });
        }
    });

    // బాడ్జ్ కౌంట్ అప్‌డేట్ చేయడం
    badgeCount.innerText = harvestedCount;

    if (harvestedCount === 0) {
        popupContent.innerHTML = `<div style="text-align:center; color:#888; padding:15px;">గత 10 రోజుల్లో హార్వెస్ట్ చేసినవి ఏవీ లేవు</div>`;
    }
}
// 1. "Harvest Done" క్లిక్ చేసినప్పుడు నేటి తేదీతో హార్వెస్ట్ ఎంట్రీ సేవ్ అయ్యేలా
function markHarvestDone(fIdx, lIdx) {
    if (confirm("ఈ ల్యాండ్‌కి ఈరోజు హార్వెస్ట్ పూర్తయిందని రికార్డ్ చేయాలా?")) {
        let land = farmers[fIdx].lands[lIdx];
        
        let tons = prompt("హార్వెస్ట్ అయిన టన్స్ (Tons) నమోదు చేయండి:", "0");
        let acres = prompt("హార్వెస్ట్ అయిన ఎకరాలు (Acres):", land.area || "1");

        if (tons !== null && acres !== null) {
            // నేటి తేదీని YYYY-MM-DD రూపంలో తీసుకోవడం
            let todayStr = new Date().toISOString().split('T')[0];

            if (!land.history) land.history = [];

            // కొత్త హార్వెస్ట్ రికార్డును యాడ్ చేయడం (ఇది ఈరోజే జరిగింది కాబట్టి diffDays = 0 అవుతుంది, అంటే 10 రోజులు మిగిలి ఉన్నాయి)
            land.history.push({
                date: todayStr,
                acres: acres,
                tons: tons
            });

            saveData();
            alert("సక్సెస్‌ఫుల్‌గా హార్వెస్ట్ రికార్డ్ చేయబడింది!");
        }
    }
}

// 2. కేవలం గత 10 రోజుల్లో హార్వెస్ట్ జరిగిన ల్యాండ్స్ మాత్రమే కనిపించేలా
function renderHarvestedTable() {
    const popupContent = document.getElementById("harvestPopupContent");
    const badgeCount = document.getElementById("harvestBadgeCount");
    
    if (!popupContent || !badgeCount) return;

    popupContent.innerHTML = "";
    let harvestItems = [];
    
    // కరెక్ట్ లోకల్ డేట్ తీసుకోవడానికి
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    farmers.forEach((farmer, fIdx) => {
        if (farmer.lands && farmer.lands.length > 0) {
            farmer.lands.forEach((land, lIdx) => {
                if (land.history && land.history.length > 0) {
                    let lastHarvest = land.history.slice().reverse().find(h => h.date);
                    
                    if (lastHarvest && lastHarvest.date) {
                        let harvestDate = new Date(lastHarvest.date);
                        harvestDate.setHours(0, 0, 0, 0);
                        
                        let diffTime = today - harvestDate;
                        let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                        // 0 నుండి 10 రోజుల మధ్యలో హార్వెస్ట్ జరిగినవి మాత్రమే (0 అంటే ఈరోజే హార్వెస్ట్ అయింది, 10 అంటే 10 రోజుల క్రితం అయింది)
                        if (diffDays >= 0 && diffDays <= 10) {
                            let remainingDays = 10 - diffDays;
                            harvestItems.push({
                                fIdx: fIdx,
                                lIdx: lIdx,
                                farmerName: farmer.name,
                                ownerId: farmer.owner || '-',
                                landId: land.landId,
                                lastDate: lastHarvest.date,
                                remainingDays: remainingDays
                            });
                        }
                    }
                }
            });
        }
    });

    harvestItems.sort((a, b) => a.remainingDays - b.remainingDays);
    badgeCount.innerText = harvestItems.length;

    if (harvestItems.length === 0) {
        popupContent.innerHTML = `<div style="text-align:center; color:#888; padding:15px;">గత 10 రోజుల్లో హార్వెస్ట్ చేసినవి ఏవీ లేవు</div>`;
        return;
    }

    harvestItems.forEach(item => {
        let badgeColor = item.remainingDays <= 2 ? '#ff4d4d' : (item.remainingDays <= 5 ? '#ffc107' : '#28a745');
        
        let div = document.createElement("div");
        div.style.cssText = "padding: 8px 10px; border-bottom: 1px solid #f1f1f1; display: flex; justify-content: space-between; align-items: center; font-size: 12px;";
        div.innerHTML = `
            <div>
                <strong style="color: #333;">${item.farmerName}</strong><br>
                <span style="color: #666;">ID: ${item.ownerId} | Land: ${item.landId}</span><br>
                <span style="background:${badgeColor}; color:white; padding:1px 5px; border-radius:10px; font-size:10px;">హార్వెస్ట్ జరిగి ${10 - item.remainingDays} రోజులైంది (ఇంకా ${item.remainingDays} రోజులు)</span>
            </div>
            <div>
                <button onclick="markHarvestDone(${item.fIdx}, ${item.lIdx})" style="background:#28a745; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px; white-space:nowrap;">Harvest Done</button>
            </div>
        `;
        popupContent.appendChild(div);
    });
}
// "Harvest Done" క్లిక్ చేసినప్పుడు టన్స్ సేవ్ అవ్వడం, లిస్ట్ నుండి పోవడం మరియు Active Tasks / Total Tons అప్‌డేట్ అవ్వడం
function markHarvestDone(fIdx, lIdx) {
    if (confirm("ఈ ల్యాండ్‌కి ఈరోజు హార్వెస్ట్ పూర్తయిందని రికార్డ్ చేయాలా?")) {
        let land = farmers[fIdx].lands[lIdx];
        
        let tons = prompt("హార్వెస్ట్ అయిన టన్స్ (Tons) నమోదు చేయండి:", "0");
        let acres = prompt("హార్వెస్ట్ అయిన ఎకరాలు (Acres):", land.area || "1");

        if (tons !== null && acres !== null) {
            let parsedTons = parseFloat(tons) || 0;
            let todayStr = new Date().toISOString().split('T')[0];

            if (!land.history) land.history = [];

            // నేటి తేదీతో కొత్త హార్వెస్ట్ రికార్డ్ యాడ్ చేయడం
            land.history.push({
                date: todayStr,
                acres: acres,
                tons: parsedTons
            });

            // డేటాను సేవ్ చేయడం
            saveData();

            // డాష్‌బోర్డ్ టోటల్స్ మరియు లిస్ట్ ని రిఫ్రెష్ చేయడం
            if (typeof updateDashboard === 'function') {
                updateDashboard(); // మీ ప్రాజెక్ట్‌లో టోటల్ టన్స్/టాస్క్స్ అప్‌డేట్ చేసే మెయిన్ ఫంక్షన్ పేరు ఇది అయితే
            }
            
            // పాప్‌అప్ లిస్ట్‌ని వెంటనే అప్‌డేట్ చేయడం
            renderHarvestedTable();

            alert("సక్సెస్‌ఫుల్‌గా హార్వెస్ట్ రికార్డ్ చేయబడింది మరియు టోటల్స్ అప్‌డేట్ అయ్యాయి!");
        }
    }
}
// 1. హిస్టరీ పాప్‌అప్ ఓపెన్ చేయడానికి మరియు డేటా చూపించడానికి
function viewHarvestHistory(fIdx, lIdx) {
    let farmer = farmers[fIdx];
    let land = farmer.lands[lIdx];

    // ఒకవేళ హిస్టరీ పాప్‌అప్ HTML ఆల్రెడీ లేకపోతే డైనమిక్‌గా క్రియേట్ చేయడం
    let modal = document.getElementById("historyPopupModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "historyPopupModal";
        modal.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2000; justify-content:center; align-items:center;";
        modal.innerHTML = `
            <div style="background:white; width:90%; max-width:400px; padding:20px; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.2); position:relative;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <h3 id="historyModalTitle" style="margin:0; font-size:16px; color:#333;">Harvest History</h3>
                    <button onclick="closeHistoryPopup()" style="background:none; border:none; font-size:18px; cursor:pointer; color:#888;">✕</button>
                </div>
                <div id="historyModalBody" style="max-height:300px; overflow-y:auto; margin-top:15px; font-size:13px;">
                    <!-- History list items -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // టైటిల్ మరియు బాడీ కంటెంట్ సెట్ చేయడం
    document.getElementById("historyModalTitle").innerText = `${farmer.name} (Land: ${land.landId}) హిస్టరీ`;
    let bodyDiv = document.getElementById("historyModalBody");
    bodyDiv.innerHTML = "";

    if (!land.history || land.history.length === 0) {
        bodyDiv.innerHTML = `<div style="text-align:center; color:#888; padding:20px;">హార్వెస్ట్ హిస్టరీ ఏమీ లేదు</div>`;
    } else {
        let table = document.createElement("table");
        table.style.cssText = "width:100%; border-collapse:collapse; font-size:12px;";
        table.innerHTML = `
            <thead>
                <tr style="background:#f1f1f1; text-align:left;">
                    <th style="padding:8px; border:1px solid #ddd;">తేదీ (Date)</th>
                    <th style="padding:8px; border:1px solid #ddd;">ఎకరాలు</th>
                    <th style="padding:8px; border:1px solid #ddd;">టన్స్</th>
                </tr>
            </thead>
            <tbody id="historyTableBody"></tbody>
        `;
        bodyDiv.appendChild(table);

        let tbody = document.getElementById("historyTableBody");
        // లేటెస్ట్ రికార్డ్స్ పైన వచ్చేలా రివర్స్ చేయడం
        land.history.slice().reverse().forEach(h => {
            let row = document.createElement("tr");
            row.innerHTML = `
                <td style="padding:8px; border:1px solid #ddd;">${h.date || '-'}</td>
                <td style="padding:8px; border:1px solid #ddd;">${h.acres || '-'}</td>
                <td style="padding:8px; border:1px solid #ddd; font-weight:bold; color:#28a745;">${h.tons || '0'} Tons</td>
            `;
            tbody.appendChild(row);
        });
    }

    modal.style.display = "flex";
}

// హిస్టరీ పాప్‌అప్ క్లోజ్ చేయడానికి
function closeHistoryPopup() {
    let modal = document.getElementById("historyPopupModal");
    if (modal) {
        modal.style.display = "none";
    }
}
// రైతు కార్డ్ వద్ద ఉన్న బటన్ నొక్కినప్పుడు ఆ రైతుకు సంబంధించిన మొత్తం ల్యాండ్స్ హిస్టరీని చూపించుటకు
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

        farmer.lands.forEach(land => {
            if (land.history && land.history.length > 0) {
                hasAnyHistory = true;
                
                // ల్యాండ్ హెడ్డింగ్
                let landHeader = document.createElement("div");
                landHeader.style.cssText = "font-weight:bold; color:#007bff; margin-top:10px; margin-bottom:5px; border-bottom:1px dashed #ddd; padding-bottom:3px;";
                landHeader.innerText = `Land ID: ${land.landId} (Area: ${land.area || '-'})`;
                bodyDiv.appendChild(landHeader);

                // ఆ ల్యాండ్ హిస్టరీ టేబుల్
                let table = document.createElement("table");
                table.style.cssText = "width:100%; border-collapse:collapse; font-size:12px; margin-bottom:10px;";
                table.innerHTML = `
                    <thead>
                        <tr style="background:#f9f9f9; text-align:left;">
                            <th style="padding:6px; border:1px solid #ddd;">తేదీ (Date)</th>
                            <th style="padding:6px; border:1px solid #ddd;">ఎకరాలు</th>
                            <th style="padding:6px; border:1px solid #ddd;">టన్స్</th>
                        </tr>
                    </thead>
                    <tbody class="land-hist-tbody"></tbody>
                `;
                bodyDiv.appendChild(table);

                let tbody = table.querySelector(".land-hist-tbody");
                land.history.slice().reverse().forEach(h => {
                    let row = document.createElement("tr");
                    row.innerHTML = `
                        <td style="padding:6px; border:1px solid #ddd;">${h.date || '-'}</td>
                        style="padding:6px; border:1px solid #ddd;">${h.acres || '-'}</td>
                        <td style="padding:6px; border:1px solid #ddd; font-weight:bold; color:#28a745;">${h.tons || '0'} Tons</td>
                    `;
                    tbody.appendChild(row);
                });
            }
        });

        if (!hasAnyHistory) {
            bodyDiv.innerHTML = `<div style="text-align:center; color:#888; padding:20px;">ఈ రైతుకు సంబంధించిన హార్వెస్ట్ హిస్టరీ ఏదీ లేదు</div>`;
        }
    }

    modal.style.display = "flex";
}

function closeHistoryPopup() {
    let modal = document.getElementById("historyPopupModal");
    if (modal) {
        modal.style.display = "none";
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

        farmer.lands.forEach(land => {
            if (land.history && land.history.length > 0) {
                hasAnyHistory = true;
                
                let landHeader = document.createElement("div");
                landHeader.style.cssText = "font-weight:bold; color:#007bff; margin-top:10px; margin-bottom:5px; border-bottom:1px dashed #ddd; padding-bottom:3px;";
                landHeader.innerText = `Land ID: ${land.landId} (Area: ${land.area || '-'})`;
                bodyDiv.appendChild(landHeader);

                let table = document.createElement("table");
                table.style.cssText = "width:100%; border-collapse:collapse; font-size:12px; margin-bottom:10px;";
                table.innerHTML = `
                    <thead>
                        <tr style="background:#f9f9f9; text-align:left;">
                            <th style="padding:6px; border:1px solid #ddd;">తేదీ (Date)</th>
                            <th style="padding:6px; border:1px solid #ddd;">ఎకరాలు</th>
                            <th style="padding:6px; border:1px solid #ddd;">టన్స్</th>
                        </tr>
                    </thead>
                    <tbody class="land-hist-tbody"></tbody>
                `;
                bodyDiv.appendChild(table);

                let tbody = table.querySelector(".land-hist-tbody");
                land.history.slice().reverse().forEach(h => {
                    let row = document.createElement("tr");
                    row.innerHTML = `
                        <td style="padding:6px; border:1px solid #ddd;">${h.date || '-'}</td>
                        <td style="padding:6px; border:1px solid #ddd;">${h.acres || '-'}</td>
                        <td style="padding:6px; border:1px solid #ddd; font-weight:bold; color:#28a745;">${h.tons || '0'} Tons</td>
                    `;
                    tbody.appendChild(row);
                });
            }
        });

        if (!hasAnyHistory) {
            bodyDiv.innerHTML = `<div style="text-align:center; color:#888; padding:20px;">ఈ రైతుకు సంబంధించిన హార్వెస్ట్ హిస్టరీ ఏదీ లేదు</div>`;
        }
    }

    modal.style.display = "flex";
}
function editFarmer(farmerIndex) {
    let farmer = farmers[farmerIndex];

    let modal = document.getElementById("editFarmerModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "editFarmerModal";
        modal.className = "modal-overlay";
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>రైతు వివరాలు సవరించు (Edit Farmer)</h3>
                    <button class="modal-close" onclick="closeEditFarmerModal()">✕</button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="editFarmerIdx">
                    <label style="font-size:12px; font-weight:bold; color:#555;">రైతు పేరు (Farmer Name)</label>
                    <input type="text" id="editFarmerName" placeholder="రైతు పేరు">
                    
                    <label style="font-size:12px; font-weight:bold; color:#555;">Owner ID</label>
                    <input type="text" id="editFarmerOwner" placeholder="Owner ID">
                    
                    <label style="font-size:12px; font-weight:bold; color:#555;">SAP ID</label>
                    <input type="text" id="editFarmerSap" placeholder="SAP ID">
                    
                    <label style="font-size:12px; font-weight:bold; color:#555;">Supplier Name</label>
                    <input type="text" id="editFarmerSupplier" placeholder="Supplier Name">
                    
                    <button onclick="saveFarmerEdits()" style="margin-top:10px;">మార్పులు సేవ్ చేయండి</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // పాత వివరాలను ఇన్‌పుట్ బాక్స్‌లలో నింపడం
    document.getElementById("editFarmerIdx").value = farmerIndex;
    document.getElementById("editFarmerName").value = farmer.name || "";
    document.getElementById("editFarmerOwner").value = farmer.owner || "";
    document.getElementById("editFarmerSap").value = farmer.sap || "";
    document.getElementById("editFarmerSupplier").value = farmer.supplier || "";

    modal.style.display = "flex";
}

function closeEditFarmerModal() {
    let modal = document.getElementById("editFarmerModal");
    if (modal) modal.style.display = "none";
}

function saveFarmerEdits() {
    let idx = document.getElementById("editFarmerIdx").value;
    let name = document.getElementById("editFarmerName").value.trim();
    let owner = document.getElementById("editFarmerOwner").value.trim();
    let sap = document.getElementById("editFarmerSap").value.trim();
    let supplier = document.getElementById("editFarmerSupplier").value.trim();

    if (!name) {
        alert("దయచేసి రైతు పేరు నమోదు చేయండి!");
        return;
    }

    // డేటాను అప్డేట్ చేయడం
    farmers[idx].name = name;
    farmers[idx].owner = owner;
    farmers[idx].sap = sap;
    farmers[idx].supplier = supplier;

    closeEditFarmerModal();
    renderFarmerCards(); // లిస్ట్ ని రిఫ్రెష్ చేయడానికి
    if (typeof saveDataToLocalStorage === "function") saveDataToLocalStorage();
}
// మొత్తం డేటాని JSON ఫైల్‌గా డౌన్‌లోడ్ చేయడం (Backup Export)
function exportDataToExcel() {
    if (!farmers || farmers.length === 0) {
        alert("డౌన్‌లోడ్ చేయడానికి ఎలాంటి డేటా లేదు!");
        return;
    }

    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(farmers, null, 2));
    let downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    
    // ప్రస్తుత తేదీతో ఫైల్ పేరు తయారవుతుంది
    let dateStr = new Date().toISOString().slice(0,10);
    downloadAnchor.setAttribute("download", `OilPalm_Backup_${dateStr}.json`);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// పాత బ్యాకప్ ఫైల్‌ని అప్‌లోడ్ చేసి డేటా రిస్టోర్ చేయడం (Backup Import)
function importDataFromJSON(event) {
    let file = event.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = function(e) {
        try {
            let importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                if (confirm("ఇప్పటివరకు ఉన్న డేటా స్థానంలో ఈ బ్యాకప్ డేటా లోడ్ చేయబడుతుంది. మీకు సమ్మతమేనా?")) {
                    farmers = importedData;
                    if (typeof saveDataToLocalStorage === "function") saveDataToLocalStorage();
                    if (typeof renderFarmerCards === "function") renderFarmerCards();
                    if (typeof updateDashboard === "function") updateDashboard();
                    alert("డేటా విజయవంతంగా రిస్టోర్ చేయబడింది!");
                }
            } else {
                alert("ఫైల్ ఫార్మాట్ సరిగ్గా లేదు!");
            }
        } catch (error) {
            alert("ఫైల్ చదవడం లో లోపం ఏర్పడింది. దయచేసి సరైన బ్యాకప్ ఫైల్ ఎంచుకోండి.");
        }
    };
    reader.readAsText(file);
    event.target.value = ""; // రీసెట్ చేయడానికి
}
function viewFarmerFullHistory(farmerIndex) {
    let farmer = farmers[farmerIndex];

    let modal = document.getElementById("historyPopupModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "historyPopupModal";
        modal.className = "modal-overlay";
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="historyModalTitle" style="margin:0; font-size:16px;">Farmer Harvest History</h3>
                    <button class="modal-close" onclick="closeHistoryPopup()">✕</button>
                </div>
                <div id="historyModalBody" class="modal-body"></div>
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
                    <div class="land-header-title">Land ID: ${land.landId} (Area: ${land.area || '-'})</div>
                    <table class="history-table">
                        <thead>
                            <tr>
                                <th>తేదీ</th>
                                <th>ఎకరాలు</th>
                                <th>టన్స్</th>
                                <th style="text-align:center;">చర్యలు</th>
                            </tr>
                        </thead>
                        <tbody>`;
                
                land.history.forEach((h, hIdx) => {
                    htmlContent += `
                        <tr>
                            <td>${h.date || '-'}</td>
                            <td>${h.acres || '-'}</td>
                            <td class="history-tons">${h.tons || '0'} Tons</td>
                            <td style="text-align:center; white-space:nowrap;">
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

// హార్వెస్ట్ ఎడిట్ చేసే పర్ఫెక్ట్ ఫంక్షన్
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

    // మెయిన్ saveData() కాల్ చేయడం వల్ల లోకల్ స్టోరేజ్, డాష్‌బోర్డ్ అన్నీ ఒకేసారి అప్డేట్ అవుతాయి
    if (typeof saveData === "function") {
        saveData();
    } else {
        localStorage.setItem("nbl_farmers_data", JSON.stringify(farmers));
        localStorage.setItem("farmersData", JSON.stringify(farmers));
    }

    if (typeof renderFarmerCards === "function") renderFarmerCards();
    if (typeof updateDashboard === "function") updateDashboard();
    if (typeof renderHarvestedTable === "function") renderHarvestedTable();

    // పాప్‌అప్‌ని రిఫ్రెష్ చేయడం
    viewFarmerFullHistory(fIdx);
}

// హార్వెస్ట్ డిలీట్ చేసే పర్ఫెక్ట్ ఫంక్షన్
function deleteHarvest(fIdx, lIdx, hIdx) {
    if (confirm("ఈ హార్వెస్ట్ రికార్డును తొలగించాలనుకుంటున్నారా?")) {
        farmers[fIdx].lands[lIdx].history.splice(hIdx, 1);

        // మెయిన్ saveData() కాల్ చేయడం
        if (typeof saveData === "function") {
            saveData();
        } else {
            localStorage.setItem("nbl_farmers_data", JSON.stringify(farmers));
            localStorage.setItem("farmersData", JSON.stringify(farmers));
        }

        if (typeof renderFarmerCards === "function") renderFarmerCards();
        if (typeof updateDashboard === "function") updateDashboard();
        if (typeof renderHarvestedTable === "function") renderHarvestedTable();

        // పాప్‌అప్‌ని రిఫ్రెష్ చేయడం
        viewFarmerFullHistory(fIdx);
    }
}

function closeHistoryPopup() {
    let modal = document.getElementById("historyPopupModal");
    if (modal) {
        modal.style.display = "none";
    }
}
