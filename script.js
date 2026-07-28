// పాత డేటా పోకుండా ఉండేలా లోకల్ స్టోరేజ్ కీస్ సెట్ చేయడం
let farmers = JSON.parse(localStorage.getItem("nbl_farmers_data")) || JSON.parse(localStorage.getItem("farmersData")) || [];

function saveData() {
    localStorage.setItem("nbl_farmers_data", JSON.stringify(farmers));
    localStorage.setItem("farmersData", JSON.stringify(farmers));
    updateDashboard();
    populateFarmerDropdowns();
    updateFarmerNameSelectDropdown();
    renderHarvestedTable();
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
            farmerSelect.innerHTML += `<option value="${idx}">${farmer.sap} - ${farmer.name}</option>`;
        });
    }

    if (harvestFarmer) {
        harvestFarmer.innerHTML = '<option value="">Select Farmer</option>';
        farmers.forEach((farmer, idx) => {
            harvestFarmer.innerHTML += `<option value="${idx}">${farmer.sap} - ${farmer.name}</option>`;
        });
    }
}

function updateFarmerNameSelectDropdown() {
    const selectEl = document.getElementById("farmerNameSelect");
    if (selectEl) {
        selectEl.innerHTML = '<option value="">-- Select Farmer --</option>';
        farmers.forEach(farmer => {
            selectEl.innerHTML += `<option value="${farmer.sap}">${farmer.sap} - ${farmer.name}</option>`;
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

    dataToRender.forEach((farmer, originalIdx) => {
        let fIdx = farmers.indexOf(farmer);

        let card = `
        <div style="background:#fff; border:1px solid #ddd; border-radius:8px; margin-bottom:15px; padding:15px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0 0 10px 0; color:#333;">${farmer.name}</h3>
                <div>
                    <button onclick="editFarmer(${fIdx})" style="background:#e3f2fd; color:#1976d2; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:5px;">Edit</button>
                    <button onclick="deleteFarmer(${fIdx})" style="background:#ffebee; color:#d32f2f; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Delete</button>
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
                            <button onclick="editLand(${fIdx}, ${lIdx})" style="font-size:11px; background:#f0f0f0; border:none; padding:3px 6px; cursor:pointer; margin-right:3px;">Edit Land</button>
                            <button onclick="deleteLand(${fIdx}, ${lIdx})" style="font-size:11px; background:#ffebee; color:#d32f2f; border:none; padding:3px 6px; cursor:pointer;">Delete</button>
                        </div>
                    </div>`;

                if (land.history && land.history.length > 0) {
                    card += `<table style="width:100%; margin-top:8px; border-collapse:collapse; font-size:13px;">
                                <tr style="background:#eee; text-align:left;">
                                    <th style="padding:4px;">Date</th>
                                    <th style="padding:4px;">Acres</th>
                                    <th style="padding:4px;">Tons</th>
                                    <th style="padding:4px;">Action</th>
                                </tr>`;
                    land.history.forEach((h, hIdx) => {
                        card += `<tr>
                                    <td style="padding:4px; border-bottom:1px solid #ddd;">${h.date}</td>
                                    <td style="padding:4px; border-bottom:1px solid #ddd;">${h.acres}</td>
                                    <td style="padding:4px; border-bottom:1px solid #ddd;">${h.tons}</td>
                                    <td style="padding:4px; border-bottom:1px solid #ddd;">
                                        <button onclick="editHarvest(${fIdx}, ${lIdx}, ${hIdx})" style="color:blue; background:none; border:none; cursor:pointer; font-size:11px;">Edit</button>
                                        <button onclick="deleteHarvest(${fIdx}, ${lIdx}, ${hIdx})" style="color:red; background:none; border:none; cursor:pointer; font-size:11px;">Delete</button>
                                    </td>
                                 </tr>`;
                    });
                    card += `</table>`;
                }
                card += `</div>`;
            });
        }
        card += `</div>`;
        list.innerHTML += card;
    });
}


// 3. 10 DAYS HARVEST HISTORY TABLE FUNCTION (వేరే టేబుల్ కోసం)
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

                        // హార్వెస్ట్ చేసిన తేదీ నుండి 10 రోజుల లోపు ఉంటే టేబుల్‌లో చూపించడం
                        if (diffDays >= 0 && diffDays <= 10) {
                            harvestedCount++;
                            let remainingDays = 10 - diffDays;

                            let row = document.createElement("tr");
                            row.innerHTML = `
                                <td>${farmer.name}</td>
                                <td>${farmer.sap || '-'}</td>
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

// 4. EVENT LISTENERS
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
            let sapId = document.getElementById("sapId").value.trim();

            if (selectEl && selectEl.value) {
                let selectedOption = selectEl.options[selectEl.selectedIndex];
                let textParts = selectedOption.text.split('-');
                farmerName = textParts.length > 1 ? textParts[1].trim() : selectedOption.text.trim();
            } else {
                farmerName = prompt("రైతు పేరు నమోదు చేయండి:");
            }

            const ownerId = document.getElementById("ownerId").value.trim();
            const supplier = document.getElementById("supplier").value.trim();

            if (!sapId || !farmerName) {
                alert("దయచేసి రైతు పేరు మరియు SAP ID ఇవ్వండి!");
                return;
            }

            farmers.push({
                name: farmerName,
                sap: sapId,
                owner: ownerId,
                supplier: supplier,
                lands: []
            });

            saveData();
            renderFarmerCards();

            if (selectEl) selectEl.value = "";
            document.getElementById("sapId").value = "";
            document.getElementById("ownerId").value = "";
            document.getElementById("supplier").value = "";
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
            renderFarmerCards();

            document.getElementById("landId").value = "";
            document.getElementById("landArea").value = "";
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
            renderFarmerCards();
            renderHarvestedTable();

            document.getElementById("harvestDate").value = "";
            document.getElementById("harvestAcres").value = "";
            document.getElementById("harvestTons").value = "";
            alert("హార్వెస్ట్ వివరాలు సేవ్ అయ్యాయి!");
        });
    }

    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = farmers.filter(f => 
                (f.name && f.name.toLowerCase().includes(query)) || 
                (f.sap && f.sap.toLowerCase().includes(query))
            );
            renderFarmerCards(filtered);
        });
    }

    const downloadCSVBtn = document.getElementById("downloadCSV");
    if (downloadCSVBtn) {
        downloadCSVBtn.addEventListener("click", downloadCSV);
    }

    // Excel / CSV File Upload Handling (Farmowner ID ద్వారా గ్రూప్ అయ్యేలా)
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
                    let workbook = XLSX.read(data, {type: 'array'});
                    let firstSheet = workbook.SheetNames[0];
                    let excelData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
                    
                    if (excelData.length === 0) {
                        alert("ఫైల్‌లో డేటా ఖాళీగా ఉంది!");
                        return;
                    }

                    farmers = []; // పాత డేటా క్లియర్ చేసి కొత్త డేటా లోడ్ చేయడం

                    excelData.forEach(row => {
                        let firstName = row['Farm Owner Name'] ? String(row['Farm Owner Name']).trim() : '';
                        let lastName = row['Owner Last Name'] ? String(row['Owner Last Name']).trim() : '';
                        let fName = (firstName + ' ' + lastName).trim();
                        
                        let sId = row['Farmowner ID'] ? String(row['Farmowner ID']).trim() : '';
                        let lId = row['Farmer/Land ID'] ? String(row['Farmer/Land ID']).trim() : 'Land-1';
                        let areaSize = row['Area Proposed'] !== undefined ? row['Area Proposed'] : '1';
                        let supplierName = row['Supplier Name'] ? String(row['Supplier Name']).trim() : '';

                        if (fName) {
                            let existingFarmer = farmers.find(f => f.owner === sId || f.name.toLowerCase() === fName.toLowerCase());
                            
                            if (existingFarmer) {
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
                                    sap: sId,
                                    owner: sId,
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
                    renderFarmerCards();
                    renderHarvestedTable();
                    alert(`మొత్తం ${farmers.length} మంది రైతుల వివరాలు విజయవంతంగా అప్‌లోడ్ అయ్యాయి!`);
                } catch (error) {
                    console.error(error);
                    alert("ఫైల్ రీడ్ చేయడంలో లోపం ఏర్పడింది.");
                }
            };
        });
    }
});

function editFarmer(fIdx) {
    const farmer = farmers[fIdx];
    const newName = prompt("రైతు పేరు:", farmer.name);
    const newSap = prompt("SAP ID:", farmer.sap);
    if (newName && newSap) {
        farmer.name = newName;
        farmer.sap = newSap;
        saveData();
        renderFarmerCards();
    }
}

function deleteFarmer(fIdx) {
    if (confirm("డిలీట్ చేయాలా?")) {
        farmers.splice(fIdx, 1);
        saveData();
        renderFarmerCards();
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
        renderFarmerCards();
        renderHarvestedTable();
    }
}

function deleteHarvest(fIdx, lIdx, hIdx) {
    if (confirm("ఈ హార్వెస్ట్ రికార్డు డిలీట్ చేయాలా?")) {
        farmers[fIdx].lands[lIdx].history.splice(hIdx, 1);
        saveData();
        renderFarmerCards();
        renderHarvestedTable();
    }
}

function downloadCSV() {
    let csvContent = "Farmer Name,SAP ID,Owner ID,Supplier Name,Land ID,Land Area,Harvest Date,Harvest Acres,Harvest Tons\n";
    let recordCount = 0;

    if (farmers.length === 0) {
        alert("డౌన్‌లోడ్ చేయడానికి డేటా లేదు!");
        return;
    }

    farmers.forEach(farmer => {
        if (farmer.lands && farmer.lands.length > 0) {
            farmer.lands.forEach(land => {
                if (land.history && land.history.length > 0) {
                    land.history.forEach(h => {
                        csvContent += `"${farmer.name || ''}","${farmer.sap || ''}","${farmer.owner || ''}","${farmer.supplier || ''}","${land.landId || ''}","${land.area || ''}","${h.date || ''}","${h.acres || ''}","${h.tons || ''}"\n`;
                        recordCount++;
                    });
                }
            });
        }
    });

    if (recordCount === 0) {
        alert("ఇప్పటివరకు ఏ హార్వెస్ట్ రికార్డులు నమోదు చేయబడలేదు!");
        return;
    }

    let blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    let url = URL.createObjectURL(blob);
    let link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "harvest_completed_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
// CSV డౌన్‌లోడ్ చేయడానికి ఫంక్షన్
function downloadHarvestCSV() {
    let startDate = document.getElementById("startDate") ? document.getElementById("startDate").value : "";
    let endDate = document.getElementById("endDate") ? document.getElementById("endDate").value : "";
    
    let csvRows = [];
    // CSV హెడర్స్
    csvRows.push(["Farmer Name", "SAP ID", "Land ID", "Date", "Acres", "Tons"].join(","));

    farmers.forEach(farmer => {
        if (farmer.lands) {
            farmer.lands.forEach(land => {
                if (land.history) {
                    land.history.forEach(h => {
                        let hDate = h.date;
                        
                        // డేట్ రేంజ్ ఫిల్టర్ లాజిక్
                        let matches = true;
                        if (startDate && hDate < startDate) matches = false;
                        if (endDate && hDate > endDate) matches = false;

                        if (matches) {
                            let row = [
                                `"${farmer.name || ''}"`,
                                `"${farmer.sap || ''}"`,
                                `"${land.landId || ''}"`,
                                `"${hDate || ''}"`,
                                `"${h.acres || ''}"`,
                                `"${h.tons || ''}"`
                            ];
                            csvRows.push(row.join(","));
                        }
                    });
                }
            });
        }
    });

    // CSV ఫైల్‌గా డౌన్‌లోడ్ చేయడం
    let csvString = csvRows.join("\n");
    let blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', startDate && endDate ? `Harvest_${startDate}_to_${endDate}.csv` : 'All_Harvest_History.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
document.addEventListener("DOMContentLoaded", () => {
    let btn = document.getElementById("downloadCSV");
    if (btn) {
        btn.addEventListener("click", downloadHarvestCSV);
    }
});