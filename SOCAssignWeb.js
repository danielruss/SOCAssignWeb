console.log("... in SOCAssignWeb.js ...")

let params = {
    soccerTableRow: 10,
    maxSelection: 3
}

function buildMenuItem(textItem, callback) {
    let aElement = document.createElement("a");
    aElement.innerHTML = textItem;

    let liElement = document.createElement("li");
    liElement.classList.add("nav-item");
    liElement.insertAdjacentElement("beforeend", aElement);

    if (!callback) callback = (event) => console.log(textItem, ": clicked");
    aElement.addEventListener("click", callback);
    return liElement;
}

function buildMenuDropdown(text) {

    let liElement = document.createElement("li");
    liElement.classList.add("nav-item", "dropdown");

    let aElement = document.createElement("a");
    aElement.classList.add("nav-link", "dropdown-toggle", "font75");
    aElement.dataset.bsToggle = "dropdown";
    aElement.innerHTML = text;

    let ulElement = document.createElement("ul");
    ulElement.classList.add("dropdown-menu")

    liElement.insertAdjacentElement("beforeend", aElement);
    liElement.insertAdjacentElement("beforeend", ulElement);
    return liElement;
}

function clearDropDown(navItemElement){
    // get the ul from the navItemElement (which should have class of dropdown-menu)
    let ulElement = navItemElement.querySelector(".dropdown-menu")
    ulElement.innerText=""
}

function addNavItemToDropDown(navItemElement, text, callback) {
    if (!callback) callback = (event) => console.log(`${text} clicked`)

    // get the ul from the navItemElement (which should have class of dropdown-menu)
    let ulElement = navItemElement.querySelector(".dropdown-menu")

    // create a li and add an a element...
    let liElement = document.createElement("li");
    liElement.dataset.menuText = text
    let aElement = document.createElement("a");
    aElement.classList.add("dropdown-item", "font75");
    aElement.innerText = text;
    aElement.addEventListener("click", callback);
    liElement.insertAdjacentElement("beforeend", aElement)

    // add the li to the list..
    ulElement.insertAdjacentElement("beforeend", liElement);

    return liElement;
}

function getMenuItem(text) {
    let menuItem = document.querySelector(`[data-menu-text="${text}"]`)
    if (!menuItem) throw new Error("bad menuItem  text: ", text, " menu item: ", menuItem)
    return menuItem
}
function deactivateMenuItem(text) {
    getMenuItem(text).children[0].classList.add("disabled")
}
function activateMenuItem(text) {
    getMenuItem(text).children[0].classList.remove("disabled")
}

function addDividerDropdown(navItemElement) {
    let ulElement = navItemElement.querySelector(".dropdown-menu");
    let liElement = document.createElement("li")
    let hrElement = document.createElement("hr");
    hrElement.classList.add("dropdown-divider")
    liElement.insertAdjacentElement("beforeend", hrElement)
    ulElement.insertAdjacentElement("beforeend", liElement)
}
function addTextToDropdown(navItemElement, text) {
    let ulElement = navItemElement.querySelector(".dropdown-menu");

    let liElement = document.createElement("li")
    liElement.classList.add("dropdown-header")
    let textElement = document.createElement("span", "font75");
    textElement.innerText = text;
    liElement.insertAdjacentElement("beforeend", textElement)
    ulElement.insertAdjacentElement("beforeend", liElement)
}

async function addLocalForageDataToFileMenu(navItemElement) {
    let fileDB = await getStoreDB()
    let stores = await fileDB.keys();

    if (stores.length > 0) {
        addDividerDropdown(navItemElement)
        addTextToDropdown(navItemElement, "In browser")
    }

    navItemElement.dataset.stores = JSON.stringify(stores)
    stores.forEach(store => {
        addNavItemToDropDown(navItemElement, store, async () => {
            let soccerResults = await getDataFromLocalForage(store)
            buildSoccerResultsTable(soccerResults)
            document.title=`SOCAssign: ${store}`
        });
    })
}

function clearLocalForageData() {
    let fileMenuElement = document.querySelector("#file-menu")
    if (!fileMenuElement) return

    let stores = JSON.parse(fileMenuElement.dataset.stores)
    fileMenuElement.dataset.stores = '[]'
    fileMenuElement = document.querySelectorAll("#file-menu ul li")
    fileMenuElement.forEach(x => {
        if (!('menuText' in x.dataset)) x.remove()
        if (stores.includes(x.dataset.menuText)) x.remove()
    })
}

function showModal1() {
    document.querySelector(".modal-title").innerText = "CSV Modal";
    document.querySelector(".modal-body").innerHTML = "The file is already in memory.  Do you want to clear the memory and re-read?";
    let myModal = new bootstrap.Modal(document.getElementById("myModal"), { backdrop: "static", keyboard: false });
    myModal.show()
}

function showAboutSOCAssign(){
    document.getElementById("ModalSaveButton").classList.add("d-none")
    document.getElementById("ModalCloseButton").classList.remove("d-none")
    document.querySelector(".modal-title").innerText = "About SOCAssign";
    document.querySelector(".modal-body").innerHTML = 
    `<p>SOCAssign is an application to assist expert review of SOCcer Results.  SOCAssign read SOCcer (csv/json) 
    output and display the top 10 SOCcer assignments for each job description to the coder for assessment. 
    Before importing, the SOCcer results can be preprocessed to focus the expert review on a subset of 
    job descriptions, such as job 
    descriptions with SOC codes that are tied for the highest score or that had low SOCcer scores. 
    For each job description, SOCAssign will allow the selection of  up to 3 SOC-2010 codes. 
    The code scan be selected from the SOCcer output list, from a list of all SOC-2010 codes, 
    or manually entered. A validation check ensures that only valid SOC-2010 can be entered. </p>
    <p>This application was designed with privacy in mind.  Data never leaves your browser, until you choose to 
    download the results.</p>`
    let myModal = new bootstrap.Modal(document.getElementById("myModal"), { backdrop: "static", keyboard: false });
    myModal.show()
}


function rebuildFileMenu(fileMenuElement){
    // clear the stores in the File menu
    //clearLocalForageData()
    fileMenuElement = fileMenuElement ?? document.getElementById("file-menu");
    if (!fileMenuElement){
        throw new Error(" === ERROR: Could not find the File Menu ===" )
    }
    clearDropDown(fileMenuElement)
    addNavItemToDropDown(fileMenuElement, "Open CSV", loadCSVFile)
    addNavItemToDropDown(fileMenuElement, "Open JSON", loadJSONFile)
    addNavItemToDropDown(fileMenuElement, "Export CSV", exportCSVFile)
    addNavItemToDropDown(fileMenuElement, "Export JSON", exportJSONFile)
    addLocalForageDataToFileMenu(fileMenuElement)

}

function buildNavbar() {
    let nav = document.querySelector("nav")
    // add a toggler to handle small factors.
    nav.insertAdjacentHTML("beforeend",
        `<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" 
             aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span></button>`)
    // add a div+ul that contains all the dropdown menus
    nav.insertAdjacentHTML("beforeend",
        `<div class="collapse navbar-collapse lh-1 p-0 m-0" id="navbarSupportedContent"><ul class="navbar-nav"></ul><div>`)
    // get the unordered list and add the menuItems...
    let menuBarElement = nav.querySelector("ul")

    let fileMenuElement = buildMenuDropdown("File")
    fileMenuElement.id = "file-menu"
    rebuildFileMenu(fileMenuElement)
    
    let editMenuElement = buildMenuDropdown("Edit")
    addNavItemToDropDown(editMenuElement,"Remove Current Data",removeCurrentStore)
    addNavItemToDropDown(editMenuElement, "Copy")
    addNavItemToDropDown(editMenuElement, "Paste")
    
    
    let soccerMenuElement = buildMenuDropdown('&#x26bd;')
    addNavItemToDropDown(soccerMenuElement,"About SOCAssign",showAboutSOCAssign)
    
    menuBarElement.insertAdjacentElement("beforeend", soccerMenuElement)
    menuBarElement.insertAdjacentElement("beforeend", fileMenuElement)
    menuBarElement.insertAdjacentElement("beforeend", editMenuElement)
    

    deactivateMenuItem("Export CSV")
    deactivateMenuItem("Export JSON")
    deactivateMenuItem("Copy")
    deactivateMenuItem("Paste")
    deactivateMenuItem("Remove Current Data")
}

async function getStoreDB() {
    return getStore("stores")
}
async function getStore(storeName) {
    return localforage.createInstance({
        name: "SOCAssign",
        storeName: storeName
    })
}

async function parseJSON(file){
    let fileReader = new FileReader()
    fileReader.addEventListener('load', (event) => {
        addJSONResultsToLocalForage(event.target.result)
    })
    fileReader.readAsText(file)
}
async function addJSONResultsToLocalForage(json) {
    let results = JSON.parse(json)
    let storeName = results.metadata.storeName;

    let storeDB = await getStoreDB()
    let dt = await storeDB.getItem(storeName)
    if (dt) {
        try {
            // the data is already in LocalForage... clean it out
            await storeDB.removeItem(storeName)
                .catch(error => console.error(error))

            let indexDB = await getStore(storeName);
            if (indexDB) {
                indexDB.clear()
            }
        } catch (error){
            console.error(error)
        }
    }
    // add the file the storeNames
    storeDB.setItem(storeName, new Date().toString())

    // create a store for the data..
    let indexDB = await localforage.createInstance({
        name: "SOCAssign",
        storeName: storeName
    })
    results.data.forEach(async (job) => {
        await indexDB.setItem(job.Id, job)
    })
    await indexDB.setItem("fields", results.fields)

    // let everyone know the store name.
    setStoreName(storeName)

    activateMenuItem("Export CSV")
    activateMenuItem("Export JSON")
    activateMenuItem("Remove Current Data")
    buildSoccerResultsTable(results)
}

// FILE > LOAD CSV
function loadCSVFile(event) {
    document.getElementById("csvFileButton").click();
}
// FILE > LOAD JSON
async function loadJSONFile(event) {
    try {
        let options = {
            types: [{
                description: 'JSON file',
                accept: { 'application/json': ['.json'] },
            }],
            multiple: false
        }
        let [newHandle] = await window.showOpenFilePicker(options)
        let file = await newHandle.getFile()
        await parseJSON(file)
        document.title = `SOCAssign: ${file.name}`;
    } catch (error) {
        console.error(error)
    }
}
// FILE > EXPORT CSV
async function exportCSVFile(event) {
    let results = await getDataFromLocalForage();
    let csvdata=results.data.map( (r,indx) => {
        // make a deep copy of the row...
        let nv = JSON.parse(JSON.stringify(r));
        delete nv.assignments
        delete nv.flags
        nv.coder_1 = r.assignments.codes.length>0 ? r.assignments.codes[0] : "",
        nv.coder_2 = r.assignments.codes.length>1 ? r.assignments.codes[1] : "",
        nv.coder_3 = r.assignments.codes.length>2 ? r.assignments.codes[2] : ""
        nv.comment = r.assignments.comment ?? ""
        nv.redflag = r.flags.redflag
        if (indx<3) console.log(nv)
        return nv
    } )
    let csv = Papa.unparse(csvdata)
    try {
        let options = {
            types: [{
                description: 'CSV file',
                accept: { 'text/csv': ['.csv'] },
            }],
        }
        let newHandle = await window.showSaveFilePicker(options)
        let writableStream = await newHandle.createWritable();
        const blob = new Blob([csv], {
            type: "text/csv",
        });
        await writableStream.write(blob);
        await writableStream.close();

    } catch (error) {
        if (error instanceof TypeError) {
            console.log("Your browser does not support File saving.  Using File Download")
            fileDownload()
            return
        }
        console.error(error)
    }
}

async function fileDownload() {
    throw new Error("File Download not Yet supported")
}

// FILE > EXPORT JSON
async function exportJSONFile(event) {
    // get the results from Local Forage
    let results = await getDataFromLocalForage()

    try {
        let options = {
            types: [{
                description: 'JSON file',
                accept: { 'application/json': ['.json'] },
            }],
            suggestedName: results.metadata.storeName.replace(/\.csv/,"_socassign.json")
        }
        let newHandle = await window.showSaveFilePicker(options)
        let writableStream = await newHandle.createWritable();
        const blob = new Blob([JSON.stringify(results, null, 2)], {
            type: "application/json",
        });
        await writableStream.write(blob);
        await writableStream.close();

    } catch (error) {
        if (error instanceof TypeError) {
            console.log("Your browser does not support File saving.  Using File Download")
            fileDownload()
            return
        }
        console.error(error)
    }
}

function parseCSV(file) {
    console.log(`parsing ${file.name}`)
    // show the loader...
    document.querySelector(".loader").classList.remove("d-none")
    Papa.parse(file, {
        header: true,
        complete: async function (results) {
            // localforage does not maintain a list of stores...
            // so create a new data store for it...
            let fileDB = await getStoreDB()
            fileDB.setItem(file.name, new Date().toString())

            let indexDB = await localforage.createInstance({
                name: "SOCAssign",
                storeName: file.name
            })
            let fields = results.meta.fields
            results.data.forEach(job => {
                if (!job.Id) return;

                if (Object.keys(job).length == Object.keys(fields).length) {
                    job.Id = job.Id.padStart(6, '0')
                    job.flags = {
                        selected: false,
                        comments: false,
                        redflag: false
                    };
                    job.assignments = {
                        codes: [],
                        comment: ""
                    }
                    indexDB.setItem(job.Id, job)
                }
            });

            indexDB.setItem("fields", fields)

            console.log(`=== finished parsing ${file.name} ===`)

            setStoreName(file.name)
            activateMenuItem("Export CSV")
            activateMenuItem("Export JSON")
            activateMenuItem("Remove Current Data")
            buildSoccerResultsTable({ fields: fields, data: results.data, metadata: { storeName: file.name } })
            document.title=document.title=`SOCAssign: ${file.name}`
            // turn off the loader...
            document.querySelector(".loader").classList.add("d-none")
        }
    })
}

async function getDataFromLocalForage(storeName, n) {
    storeName = storeName ?? getStoreName()
    setStoreName(storeName)
    let indexDB = await localforage.createInstance({
        name: "SOCAssign",
        storeName: storeName
    })

    let soccerResults = {
        fields: null,
        data: [],
        metadata: { storeName: storeName }
    };

    await indexDB.iterate(function (value, key, iterationNumber) {
        if (key == "fields") {
            soccerResults.fields = value;
        } else {
            soccerResults.data.push(value);
        }
    })

    activateMenuItem("Export JSON")
    activateMenuItem("Export CSV")
    activateMenuItem("Remove Current Data")

    return soccerResults
}

function updateSelectedSortDirection(sortColumn) {
    if (sortColumn.classList.contains("sortUp")) {
        sortColumn.dataset.sortDirection = "down"
        sortColumn.classList.replace("sortUp", "sortDown")
    } else if (sortColumn.classList.contains("sortDown")) {
        sortColumn.dataset.sortDirection = "up"
        sortColumn.classList.replace("sortDown", "sortUp")
    } else {
        sortColumn.dataset.sortDirection = "up"
        sortColumn.classList.remove("noSort")
        sortColumn.classList.add("sortUp")
    }
}
function updateNotSelectedSortDirection(column) {
    column.classList.remove("sortUp", "sortDown")
    column.classList.add("noSort")
    delete column.dataset.sortDirection
}

function createTableHead(head, labels) {
    head.innerText = ""
    let trElement = document.createElement("tr")
    head.insertAdjacentElement("beforeend", trElement)

    // create all the table header cells
    labels.forEach(label => {
        let colHeadElement = document.createElement("th")
        colHeadElement.innerText = label
        trElement.insertAdjacentElement("beforeend", colHeadElement)
    })
}

function sortTable(col, direction, data) {
    function mySort(a, b) {
        if (/^flag/.test(col)){
            let v1 = a.flags[col.slice(5)]
            let v2 = b.flags[col.slice(5)]
            if (v1==v2) return 0;
            if (direction == "down") return v1 > v2 ? 1 : -1
            return v1 > v2 ? -1 : 1
        }
        if (/[Ss]core_/.test(col)) {
            a[col] = parseFloat(a[col])
            b[col] = parseFloat(b[col])
        }
        if (a[col] === b[col]) return 0;
        let rv = a[col] > b[col] ? 1 : -1
        if (direction == "down")  rv=-rv
        return rv
    }
    return data.sort(mySort)
}

function clearSoccerResultsTable(){
    let element = document.getElementById("soccerResultsBody")
    element.innerText = ""
    element = document.getElementById("soccerResultsHead")
    element.innerText = ""
    document.getElementById("centerColumn").classList.add("invisible")
    document.title="SOCAssign"
}
function fillSoccerResultsTable(soccerResults) {
    let tableBody = document.getElementById("soccerResultsBody")
    tableBody.innerText = ""

    soccerResults.data.forEach((row, index, all) => {
        if (!row.Id) return;

        // for each row create a cell for each column
        let rowElement = document.createElement("tr")
        rowElement.dataset.id = row.Id

        // create the flags
        Object.keys(row.flags).forEach( (flag,index) =>{
            rowElement.insertAdjacentElement("beforeend", document.createElement("td"))
        })
        if (row.flags.selected) rowElement.classList.add("selected")
        rowElement.children[0].classList.add(row.flags.selected?"annotated":"not-annotated")
        if (row.flags.redflag) rowElement.children[1].classList.add("redflag")
        if (row.flags.comments) rowElement.children[2].classList.add("infoflag")


        soccerResults.fields.forEach(col => {
            let colElement = document.createElement("td")
            if (!isNaN(row[col])) {
                colElement.setAttribute("nowrap", true)
                if (/[Ss]core_/.test(col)) {
                    row[col] = parseFloat(row[col]).toFixed(4)
                }
            }
            colElement.innerText = row[col] ?? ""
            rowElement.insertAdjacentElement("beforeend", colElement);
        });

        // create a event listenter for when a row is clicked...
        rowElement.addEventListener("click", async (event) => {
            // this really only needs to be done once.
            document.getElementById("centerColumn").classList.remove("invisible")

            // build the rank table...
            let rankTableHead = document.getElementById("rankHead")
            createTableHead(rankTableHead, ['Rank', 'Score', 'Code', 'Title'])
            fillRankTable(row)

            // build the JobDescription table
            buildJobDescriptionTable(row)

            // fill the comment textarea and Inputbox
            fillCommentTextArea(soccerResults.metadata.storeName, row.Id)

            // build the assignment table
            let previousResults = await getResult(row.Id)
            buildAssignmentTable(previousResults)

            // remove the border class from old id...
            let selectedRow = document.querySelector("tr.selectedRow")
            if (selectedRow) selectedRow.classList.remove("selectedRow")
            selectedRow=document.querySelector(`tr[data-id="${row.Id}"`)
            selectedRow?.classList.add('selectedRow')

            // let the soccer dataset know which row is selected for flagging...
            tableBody.parentElement.dataset.selectedId = row.Id
        })
        tableBody.insertAdjacentElement("beforeend", rowElement);
    })



    buildRankTable()
    buildJobDescriptionTable()
}

function makeFlagString(flags) {
    let circleClass = (flags.selected) ? "bi-check-circle" : "bi-circle"
    let commentClass = (flags.comments) ? "visible" : "invisible"
    let redflagClass = (flags.redflag) ? "visible" : "invisible"
    return `<i class="bi ${circleClass}"></i><i class="bi bi-info-circle-fill text-danger ${commentClass}"></i><i class="bi bi-flag-fill text-danger ${redflagClass}"></i>`
}
function updateFlag(id, flags) {
    let rowElement = document.querySelector(`#soccerResultsTable tr[data-id="${id}"`)
    
    rowElement.classList.remove("selected")
    if (flags.selected) rowElement.classList.add("selected")

    rowElement.children[0].classList.add(flags.selected?"annotated":"not-annotated")
    rowElement.children[0].classList.remove(flags.selected?"not-annotated":"annotated")

    rowElement.children[1].classList.remove("redflag")
    if (flags.redflag) rowElement.children[1].classList.add("redflag")

    rowElement.children[2].classList.remove("infoflag")
    if (flags.comments) rowElement.children[2].classList.add("infoflag")
}

function buildRankTable(result) {
    let rankTableHead = document.getElementById("rankHead")
    createTableHead(rankTableHead, ['Rank', 'Score', 'Code', 'Title'])
    fillRankTable(result)
}

function fillRankTable(result) {
    let tableBody = document.getElementById("rankBody")
    tableBody.innerText = ""
    for (let rank = 1; rank <= 10; rank++) {
        let tableRow = document.createElement("tr");
        let rankCol = document.createElement("td")
        rankCol.innerHTML = (result) ? rank : "&nbsp;"
        tableRow.insertAdjacentElement("beforeend", rankCol)

        let scoreCol = document.createElement("td")
        scoreCol.innerHTML = (result) ? result[`Score_${rank}`] : "&nbsp;"
        tableRow.insertAdjacentElement("beforeend", scoreCol)

        let codeCol = document.createElement("td")
        let titleCol = document.createElement("td")
        if (result) {
            let codeKey = (`SOC2010_${rank}` in result) ? `SOC2010_${rank}` : `soc2010_${rank}`
            codeCol.innerText = result[codeKey];
            codeCol.classList.add("nowrap")
            titleCol.innerText = soc2010_lookup.codes[result[codeKey]].title
        } else {
            codeCol.innerHTML = "&nbsp;"
        }
        tableRow.insertAdjacentElement("beforeend", codeCol)
        tableRow.insertAdjacentElement("beforeend", titleCol)


        tableRow.addEventListener("click", (event) => {
            assignCode(result.Id, event.target.parentElement.children[2].innerText)
        })
        tableBody.insertAdjacentElement("beforeend", tableRow)
    }
}

async function fillCommentTextArea(storeName, id) {
    let result = await getResult(id, storeName)
    let commentTextArea = document.getElementById("comment")
    commentTextArea.value = result.assignments.comment;

    commentTextArea.oninput = async (event) => {
        result.flags.comments = commentTextArea.value.trim().length > 0
        result.assignments.comment = commentTextArea.value
        updateFlag(id, result.flags)
        await storeResults(id, result, storeName)
    }

    // clear old values in the input box
    let soc2010_input = document.getElementById("soc2010_input");
    soc2010_input.value = ""

    // clear the datalist
    let datalist = document.getElementById("soc2010")
    datalist.innerText = ""

    soc2010_input.onkeyup = (event) => {
        datalist.innerText = ""
        if (soc2010_input.value.length > 1 && soc2010_input.value.length < 7) {
            Object.keys(soc2010_lookup.codes)
                .filter(key => key.startsWith(soc2010_input.value))
                .forEach(key => {
                    datalist.insertAdjacentHTML("beforeend", `<option value="${key}">`)
                })
        }
    }

    //handle user typing value
    soc2010_input.parentElement.querySelector("input[type='button']").onclick = async (event) => {
        if (soc2010_lookup.codes.hasOwnProperty(soc2010_input.value)) {
            await assignCode(id, soc2010_input.value);
            soc2010_input.value = "";
            datalist.innerText = ""
        }
    }

}

async function getResult(id, storeName) {
    storeName = storeName ?? getStoreName();
    let store = await localforage.createInstance({
        name: "SOCAssign",
        storeName: storeName
    })

    let results = await store.getItem(id)
    return results;
}

async function storeResults(id, results, storeName) {
    storeName = storeName ?? getStoreName()
    let store = await localforage.createInstance({
        name: "SOCAssign",
        storeName: storeName
    })
    await store.setItem(id, results);
    getStoreDB()
}
async function removeCurrentStore(){
    let storeName = getStoreName();
    let storeDB = await getStoreDB()
    console.log(storeDB)
    await storeDB.removeItem(storeName)
                .catch(error => console.error(error))

    await localforage.dropInstance({
        name: "SOCAssign",
        storeName: storeName
      }).then(function() {
        console.log('Dropped otherStore')
      });

    clearSoccerResultsTable()
    rebuildFileMenu()
}

function buildAssignmentTable(results) {
    let selections = results.assignments.codes;

    function buildEmptyRow() {
        let trElement = document.createElement("tr")
        trElement.classList.add("overflow-hidden")
        for (let tdNum = 1; tdNum <= 2; tdNum++) {
            let tdElement = document.createElement("td")
            tdElement.innerHTML = "&nbsp;"
            tdElement.classList.add("nowrap", "overflow-hidden", "mw-90")
            trElement.insertAdjacentElement("beforeend", tdElement)
        }
        return trElement
    }

    let tableElement = document.getElementById("AssignmentTable");
    tableElement.innerText = "";

    let trElement = document.createElement("tr")

    let thElement = document.createElement("th")
    thElement.innerText = "Assignments"
    thElement.setAttribute("colspan", 2)
    trElement.insertAdjacentElement("beforeend", thElement)

    tableElement.insertAdjacentElement("beforeend", trElement);

    if (selections?.length > 0) {
        let selectionsMade = selections.length;
        selections.length = params.maxSelection;
        selections.forEach((selection, index) => {
            let trElement = buildEmptyRow()
            if (selection) {
                let up = (index > 0) ? `<i class="p-0 bi bi-arrow-up-circle-fill text-primary" data-id=${results.Id}  data-selection-index="${index}"></i>` : ''
                let down = (index < (selectionsMade - 1)) ? `<i class="p-0 bi bi-arrow-down-circle-fill text-primary" data-id=${results.Id}  data-selection-index="${index}"></i>` : ''
                trElement.children[0].innerHTML = `<i class="p-0 bi bi-x-circle-fill text-primary" data-id=${results.Id}  data-selection-index="${index}"></i>${up}${down}`;
                trElement.children[1].innerText = `${selection} ${soc2010_lookup.codes[selection].title}`;
                trElement.setAttribute("draggable", true)
            }
            tableElement.insertAdjacentElement("beforeend", trElement)
        });
        tableElement.querySelectorAll(".bi-arrow-up-circle-fill").forEach(up => up.addEventListener("click", moveUp))
        tableElement.querySelectorAll(".bi-arrow-down-circle-fill").forEach(up => up.addEventListener("click", moveDown))
        tableElement.querySelectorAll(".bi-x-circle-fill").forEach(up => up.addEventListener("click", deassign))
    } else {
        // build three empty rows...
        for (let rowNumber = 1; rowNumber <= params.maxSelection; rowNumber++) {
            tableElement.insertAdjacentElement("beforeend", buildEmptyRow());
        }
    }
}

function swap(array, index1, index2) {
    // swap index1 and index2 ...
    let tmp = array[index1]
    array[index1] = array[index2]
    array[index2] = tmp
    return array;
}
async function moveUp(event) {
    let result = await getResult(event.target.dataset.id)
    let index = event.target.dataset.selectionIndex
    result.assignments.codes = swap(result.assignments.codes, index, index - 1)
    await storeResults(event.target.dataset.id, result)

    buildAssignmentTable(result)
}
async function moveDown(event) {
    let result = await getResult(event.target.dataset.id)
    let index = parseInt(event.target.dataset.selectionIndex)
    result.assignments.codes = swap(result.assignments.codes, index, index + 1)
    await storeResults(event.target.dataset.id, result)

    buildAssignmentTable(result)
}
async function deassign(event) {
    let result = await getResult(event.target.dataset.id)
    let index = event.target.dataset.selectionIndex
    result.assignments.codes.splice(index, 1)
    if (result.assignments.codes.length == 0) {
        result.flags.selected = false;
        updateFlag(event.target.dataset.id, result.flags)
    }
    await storeResults(event.target.dataset.id, result)

    buildAssignmentTable(result)
}

async function assignCode(id, code) {

    let results = await getResult(id)
    results.flags = results.flags ?? {}
    if (!results.flags.selected) {
        results.flags.selected = true;
        updateFlag(id, results.flags)
        await storeResults(id, results);
    }
    if (!results.assignments.codes.includes(code)) {
        if (results.assignments.codes.length > 2) results.assignments.codes.pop()
        results.assignments.codes.push(code)

        await storeResults(id, results);
        buildAssignmentTable(results);
    }
}

function buildJobDescriptionTable(result) {
    let tableElement = document.getElementById("JobDescriptionTable");
    tableElement.innerText = "";
    let trElement = document.createElement("tr")
    tableElement.insertAdjacentElement("beforeend", trElement);

    let thElement = document.createElement("th")
    thElement.innerText = "Job Description"
    thElement.setAttribute("colspan", 2)
    trElement.insertAdjacentElement("beforeend", thElement)

    if (!result) return;

    Object.entries(result).forEach(([key, entry]) => {
        if (!/_\d+$/.test(key) && typeof entry == "string") {
            trElement = document.createElement("tr")

            thElement = document.createElement("th")
            thElement.innerText = key
            trElement.insertAdjacentElement("beforeend", thElement)

            thElement = document.createElement("td")
            thElement.innerText = entry
            trElement.insertAdjacentElement("beforeend", thElement)
            tableElement.insertAdjacentElement("beforeend", trElement);
        }
    })

}

function setStoreName(storeName) {
    document.querySelector("footer").children[0].innerText = `File: ${storeName}`
}
function getStoreName() {
    return document.querySelector("footer").children[0].innerText.substring(6)
}

function clearCenterColumn() {
    buildRankTable()
}


function addFlagColumn(flagClass,sortCol,row){
    let thElement = document.createElement("th")
    thElement.classList.add(flagClass)
    thElement.dataset.sortColumn=`flag_${sortCol}`
    row.insertAdjacentElement("afterbegin",thElement)
}

function buildSoccerResultsTable(soccerResults) {
    let tableHead = document.getElementById("soccerResultsHead")
    createTableHead(tableHead, soccerResults.fields)
    Array.from(tableHead.children[0].children).forEach(thElement => {
        thElement.dataset.sortColumn=thElement.innerText
    })

    // add the flags (adding to the front, so do it backwards...)
    let fclass=["infoflag","redflag","annotated"]
    let fkey=["comments","redflag","selected"]
    fclass.forEach((value,index) =>{
        addFlagColumn(value,fkey[index],tableHead.children[0])
    })


    // all the header are in the "no-sort" state
    // add event listeners to the column headers.
    tableHead.querySelectorAll("tr th").forEach((th,index,group) => {
        th.classList.add("noSort")
        th.addEventListener("click", async () => {
            group.forEach(x => {
                if (x == th) {
                    updateSelectedSortDirection(x)
                } else {
                    updateNotSelectedSortDirection(x)
                }
            })

            let latestSoccerResults = await getDataFromLocalForage(getStoreName())
            latestSoccerResults.data = sortTable(th.dataset.sortColumn, th.dataset.sortDirection, latestSoccerResults.data)
            fillSoccerResultsTable(latestSoccerResults)
        })
    })

    fillSoccerResultsTable(soccerResults)
    clearCenterColumn()
}

function handleFileDrop() {
    // Set up the invisible CSV file upload
    let fileInputElement = document.getElementById("csvFileButton")
    fileInputElement.setAttribute("accept", "text/csv")
    fileInputElement.addEventListener("change", (event) => {
        let selectedFile = fileInputElement.files[0]
        parseCSV(selectedFile)
    })

    let row = document.querySelector(".left-column")
    row.addEventListener("dragover", (event) => {
        event.preventDefault();
        row.classList.add("border", "border-5")
    });
    row.addEventListener("dragleave", (event) => {
        row.classList.remove("border", "border-5")
    });
    row.addEventListener("drop", (event) => {
        event.preventDefault();
        row.classList.remove("border", "border-5")
        if (event.dataTransfer.items) {
            [...event.dataTransfer.items].forEach((item, i) => {
                let file = item.getAsFile(item);
                if (file.type == "text/csv") {
                    parseCSV(file)
                } else if (file.type == "application/json"){
                    parseJSON(file)
                } else {
                    console.log(`not parsed: ${i} ${file.name} ${file.type}`)
                }
            });
        }
    })
};

function handleAssignmentMove() {
    let tableElement = document.getElementById("AssignmentTable")
    tableElement.addEventListener("dragover", (event) => {
        event.preventDefault();
    })
    tableElement.addEventListener("drop", (event) => {
        event.preventDefault()
    })
}

function buildTreeView() {
    function addAndClick(code) {
        let soc2010_input = document.getElementById("soc2010_input")
        soc2010_input.value = code.slice(0, 7)
        soc2010_input.nextSibling.click()
    }
    function buildNodes(object, root) {
        let liElement = document.createElement("li");
        let caret = object.children?.length > 0
        liElement.innerText = `${object.code} ${object.title}`
        root.insertAdjacentElement("beforeend", liElement)
        if (caret) {
            liElement.classList.add("caret-up")
            liElement.addEventListener("click", (event) => {
                if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
                    if (!document.getElementById("centerColumn").classList.contains("invisible")) {
                        addAndClick(liElement.innerText)
                    }
                } else {
                    if (liElement.classList.contains("caret-up")) {
                        liElement.classList.replace("caret-up", "caret-down")
                    } else {
                        liElement.classList.replace("caret-down", "caret-up")
                    }
                }
            })
            let ulElement = document.createElement("ul")
            root.insertAdjacentElement("beforeend", ulElement)
            object.children.forEach((code) => buildNodes(code, ulElement))
        } else {
            liElement.addEventListener("click", (event) => {
                addAndClick(liElement.innerText)
            })
        }

    }

    let treeview = document.querySelector(".treeview")
    soc2010_lookup.tree.forEach((code) => buildNodes(code, treeview))
    treeview.insertAdjacentHTML("afterbegin", '<p class="fw-bold my-1 font75">SOC 2010</p>')
}

function buildUI() {
    buildNavbar()
    handleFileDrop()
    handleAssignmentMove()
    buildTreeView()
    document.title="SOCAssign"
}

let soc2010_lookup = {};
async function loadSOC2010() {
    soc2010_lookup = await fetch("https://danielruss.github.io/codingsystems/soc_2010_complete.json")
        .then((response) => response.json())
}

window.addEventListener("load", async () => {
    await loadSOC2010()
    buildUI()
    document.addEventListener("keyup", async event => {
        let soccerResultTable = document.getElementById("soccerResultsTable")
        if (event.code == "KeyF") {
            if ("selectedId" in soccerResultTable.dataset) {
                let id = soccerResultTable.dataset.selectedId
                let storeName = getStoreName()

                // update the flag
                let result = await getResult(id, storeName)
                result.flags.redflag = !result.flags.redflag
                updateFlag(id, result.flags)
                await storeResults(id, result, storeName)
            }
        }
    })
})