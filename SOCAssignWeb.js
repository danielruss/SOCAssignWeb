import * as soccerio from "./soccerio.js"
import * as cs from "./codingsystems.js"
import XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";

const soccerResultsTableElement = document.getElementById("soccerResultsTable");
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
    let stores = await ls();

    if (stores.length > 0) {
        addDividerDropdown(navItemElement)
        addTextToDropdown(navItemElement, "In browser")
    }

    navItemElement.dataset.stores = JSON.stringify(stores)
    stores.forEach(store => {
        addNavItemToDropDown(navItemElement, store, async () => {
            await buildSoccerResultsTable(store);
            buildTreeView();
            buildAssignmentTable();
            fillCommentTextArea();
            document.title=`SOCAssign: ${store}`
            activateMenuItem("Export CSV")
            activateMenuItem("Export JSON")
            activateMenuItem("Export Excel")
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
    addNavItemToDropDown(fileMenuElement, "Open File", loadFile)
    addNavItemToDropDown(fileMenuElement, "Export CSV", exportCSVFile)
    addNavItemToDropDown(fileMenuElement, "Export JSON", exportJSONFile)
    addNavItemToDropDown(fileMenuElement, "Export Excel", exportExcelFile)
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
    deactivateMenuItem("Export Excel")
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
    throw new Exception("Deprecated -- do not use")
    let results = JSON.parse(json)
    let storeName = results.metadata.storeName;
    let table_start = results.metadata?.table_start || 0

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
    storeDB.setItem(storeName, {
        "create_date":new Date().toString(),
        "table_start":table_start
    })

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
    activateMenuItem("Export Excel")
    activateMenuItem("Remove Current Data")
    await buildSoccerResultsTable(results)
}


// FILE > LOAD FILE
async function loadFile(event) {
    try {
        let options = {
            types: [{
                description: 'CSV file',
                accept: { 
                    'text/csv': ['.csv'],
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                    'application/json': ['.json'] 
                 },
            }],
            multiple: false
        }
        let [newHandle] = await window.showOpenFilePicker(options)
        let file = await newHandle.getFile()

        document.querySelector(".loader").classList.remove("d-none")
        // load the data into localForage...
        await soccerio.loadData(file)

        setStoreName(file.name)
        activateMenuItem("Export CSV")
        activateMenuItem("Export JSON")
        activateMenuItem("Export Excel")
        activateMenuItem("Remove Current Data")
        
        await buildSoccerResultsTable(file.name);
        buildTreeView();
        rebuildFileMenu();
        document.title=document.title=`SOCAssign: ${file.name}`
        // turn off the loader...
        document.querySelector(".loader").classList.add("d-none")
    } catch (error) {
        console.error(error)
        // turn off the loader...
        document.querySelector(".loader").classList.add("d-none")
    }
}

// FILE > EXPORT CSV
async function exportCSVFile(event) {
    let storeName = getStoreName()
    let results = await getDataFromLocalForage(storeName);
    let headers=[...results.metadata.input_columns]
    results.metadata.code_columns.forEach( (cc,indx) => {
        headers.push(cc)
        headers.push(results.metadata.score_columns[indx])
    })
    for (let indx=0;indx<params.maxSelection;indx++){
        headers.push(`coder_${indx}`)
    }
    headers.push("comment","redflag")

    let csvdata=results.data.map( (r,indx) => {
        // make a deep copy of the row...
        let nv = {...r.input}
        // copy the soccer results
        r.codes.forEach( (c,code_index) => {
            nv[results.metadata.code_columns[code_index]] = c.code
            nv[results.metadata.score_columns[code_index]] = c.score
        })
        // copy the assignments
        for (let indx=0;indx<params.maxSelection;indx++){
            nv[`coder_${indx+1}`] = r.assignments?.codes?.length>indx ? r.assignments.codes[indx] : "";
        }
        nv.comment = r.assignments?.comment ?? ""
        nv.redflag = r.flags?.redflag || false;
        return nv
    } )
    let csv = Papa.unparse(csvdata)
    try {
        let options = {
            types: [{
                description: 'CSV file',
                accept: { 'text/csv': ['.csv'] },
            }],
            suggestedName: storeName.replace(/\.\w+/,"_socassign.csv")
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
    const store = getStoreName()
    let results = await getDataFromLocalForage(store)

    try {
        let options = {
            types: [{
                description: 'JSON file',
                accept: { 'application/json': ['.json'] },
            }],
            suggestedName: store.replace(/\.\w+/,"_socassign.json")
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

// FILE > EXPORT Excel
async function exportExcelFile(event) {
    let store = getStoreName();
    let results = await getDataFromLocalForage(store);

    let headers=[...results.metadata.input_columns]
    results.metadata.code_columns.forEach( (cc,indx) => {
        headers.push(cc)
        headers.push(results.metadata.score_columns[indx])
    })
    for (let indx=0;indx<params.maxSelection;indx++){
        headers.push(`coder_${indx}`)
    }
    headers.push("comment","redflag")

    let csvdata=results.data.map( (r,indx) => {
        // make a deep copy of the row...
        let nv = {...r.input}
        // copy the soccer results
        r.codes.forEach( (c,code_index) => {
            nv[results.metadata.code_columns[code_index]] = c.code
            nv[results.metadata.score_columns[code_index]] = parseFloat(c.score)
        })
        // copy the assignments
        for (let indx=0;indx<params.maxSelection;indx++){
            nv[`coder_${indx+1}`] = r.assignments?.codes?.length>indx ? r.assignments.codes[indx] : "";
        }
        nv.comment = r.assignments?.comment ?? ""
        nv.redflag = r.flags?.redflag ? "\u{1F6A9}" : "";
        return nv
    } )

    // Sheet names have a max of 30 char
    let sheet_name = store.replace(/\.\w+$/,"")
    sheet_name = (sheet_name.length<30)?sheet_name:`${sheet_name.slice(0, 4)}...${sheet_name.slice(-4)}`;
    
    let download_file = store.replace(/\.\w+$/,"_socassign.xlsx")
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(csvdata);
    // format the scores...
    const range = XLSX.utils.decode_range(sheet['!ref']);
    const scoreIndices = results.metadata.score_columns.map( col => headers.indexOf(col));
    // .s.r <- the start row .e.r <- the end row
    // +1 to skip the header
    for (let row=range.s.r + 1; row <= range.e.r; ++row){
        scoreIndices.forEach(colIndex => {
            if (colIndex>-1){
                const cell = sheet[XLSX.utils.encode_cell({r:row,c:colIndex})]
                // .t = type ('n'=number) .z = format
                if (cell?.t == 'n') {
                    cell.z = "0.000"
                }
            }
        })
    }
    

    XLSX.utils.book_append_sheet(workbook,sheet,sheet_name)
    XLSX.utils.sheet_add_aoa(sheet, [headers], { origin: "A1" });
    XLSX.writeFile(workbook, download_file, { compression: true });
}



function parseCSV(file) {
    throw new Error("Deprecated -- do not use")
    console.log(`parsing ${file.name}`)
    // show the loader...
    document.querySelector(".loader").classList.remove("d-none")
    Papa.parse(file, {
        header: true,
        complete: async function (results) {
            console.log(results)
            // localforage does not maintain a list of stores...
            // so create a new data store for it...
            let fileDB = await getStoreDB()
            fileDB.setItem(file.name, {
                "create_date":new Date().toString(),
                "table_start":0
            })
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
            await buildSoccerResultsTable(file.name)
            rebuildFileMenu()
            document.title=document.title=`SOCAssign: ${file.name}`
            // turn off the loader...
            document.querySelector(".loader").classList.add("d-none")
        }
    })
}

async function getDataFromLocalForage(storeName) {
    let soccerResults = await soccerio.getData(storeName);

    activateMenuItem("Export JSON")
    activateMenuItem("Export CSV")
    activateMenuItem("Export Excel")
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
        let match=col.match(/([Ss][Oo][Cc]\d+)_(\d+)/)    
        if (/^flag/.test(col)){
            let v1 = a.flags[col.slice(5)]
            let v2 = b.flags[col.slice(5)]
            if (v1==v2) return 0;
            if (direction == "down") return v1 > v2 ? 1 : -1
            return v1 > v2 ? -1 : 1
        }
  
        let v1,v2;
        if (match=col.match(/([Ss]core)_(\d+)/)) {
            let indx = parseInt(match[2])-1
            v1 = parseFloat(a.codes[indx].score)
            v2 = parseFloat(b.codes[indx].score)
        } else if (match=col.match(/([Ss][Oo][Cc]\d+)_(\d+)/)) {
            let indx = parseInt(match[2])-1
            v1 = a.codes[indx].code
            v2 = b.codes[indx].code
        } else {
            v1 = a.input[col];
            v2 = b.input[col];
        }

        if (v1==v2) return 0;
        let rv = v1 > v2 ? 1 : -1
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
    Array.from(getCenterElements()).forEach((x)=>x.classList.add("invisible"))
    document.title="SOCAssign"
}
function getSortColumn(){
    let sortColumn = document.getElementById("soccerResultsHead").querySelector("[data-sort-direction]")
    return sortColumn?.dataset;
}
function addNavEventListener(){
    async function _get_data(){
        let latestSoccerResults = await soccerio.getData(getStoreName());
        let sortInfo = getSortColumn()
        if (sortInfo){//th.dataset.sortColumn, th.dataset.sortDirection, latestSoccerResults.data
            latestSoccerResults.data = sortTable(sortInfo.sortColumn,sortInfo.sortDirection,latestSoccerResults.data)
        }
        return latestSoccerResults;
    }
    document.getElementById("startButton").addEventListener("click",async (event)=>{
        let latestSoccerResults = await _get_data()
        setSoccerResultsTableStart( 0 )
        fillSoccerResultsTable(latestSoccerResults)
    })
    document.getElementById("prevButton").addEventListener("click",async (event)=>{
        let latestSoccerResults = await _get_data()
        setSoccerResultsTableStart( Math.max(0,parseInt(event.target.dataset.currentStart) - parseInt(event.target.dataset.numberOfVisibleRows)) )
        fillSoccerResultsTable(latestSoccerResults)
    })
    document.getElementById("nextButton").addEventListener("click",async (event)=>{
        let latestSoccerResults = await _get_data()
        setSoccerResultsTableStart( Math.min(latestSoccerResults.data.length,parseInt(event.target.dataset.currentStart) + parseInt(event.target.dataset.numberOfVisibleRows) ) )
        fillSoccerResultsTable(latestSoccerResults)
    })
    document.getElementById("endButton").addEventListener("click",async (event)=>{
        let latestSoccerResults = await _get_data()
        setSoccerResultsTableStart( latestSoccerResults.data.length - parseInt(event.target.dataset.numberOfVisibleRows??1)  )
        fillSoccerResultsTable(latestSoccerResults)
    })
}
async function fillSoccerResultsTable(soccerResults) {
    let storeName = soccerResultsTableElement.dataset.storeName
    let tableBody = document.getElementById("soccerResultsBody")
    tableBody.innerText = ""

    let startAtLine = parseInt(soccerResultsTableElement.dataset.tableStart)||0;
    let numRows = 150
    let endAtLine = Math.min(soccerResults.data.length,startAtLine+numRows)

    if (numRows < soccerResults.data.length){
        // add 1 because people consider the first row as 1 not 0
        document.getElementById("rowSpan").innerHTML=`rows: ${startAtLine+1} &rarr; ${endAtLine} of ${soccerResults.data.length}`
    }else{
        document.getElementById("rowSpan").innerText=""
    }

    for (let index=startAtLine;index<endAtLine;index++){
        let row = soccerResults.data[index];
        let defaultFlags = { selected: false, redflag: false, comments: false }
        row.flags = { ...defaultFlags, ...(row.flags ?? {}) };
        
        // I'm sticking the coding system into the row... but this
        // is not needed in the soccerResults, because it has
        // soccerResults.metadata
        row = structuredClone(row);
        row.codingsystem = soccerResults.metadata.coding_system;
        // for each row create a cell for each column
        let rowElement = document.createElement("tr")
        rowElement.dataset.id = row.input.Id
        
        // create the flags
        Object.keys(row.flags).forEach( (flag,index) =>{
            rowElement.insertAdjacentElement("beforeend", document.createElement("td"))
        })
        if (row.flags.selected) rowElement.classList.add("selected")
        rowElement.children[0].classList.add((row.flags?.selected)?"annotated":"not-annotated") 
        if (row.flags.redflag) rowElement.children[1].classList.add("redflag")
        if (row.flags.comments) rowElement.children[2].classList.add("infoflag")

        // create the columns for the input...
        soccerResults.metadata.input_columns.forEach(col => {
            let colElement = document.createElement("td");
            if (row.input[col] == "NA") row.input[col] = null;
            const value = row.input[col];
            colElement.innerText = (row.input[col] && row.input[col] != "NA") ? row.input[col] : "";
            if (col=="Id") colElement.setAttribute("nowrap", true)
            rowElement.insertAdjacentElement("beforeend", colElement);
        });
        // now alternate between soccer code, title, and score
        row.codes.forEach(col => {
            let code_element = document.createElement("td");
            code_element.innerText = col.code ?? ""
            rowElement.insertAdjacentElement("beforeend", code_element);

            if (soccerResults.metadata.has_title){
                let title_element = document.createElement("td");
                title_element.innerText = col.title ?? ""
                rowElement.insertAdjacentElement("beforeend", title_element);
            }

            let score_element = document.createElement("td");
            score_element.innerText = parseFloat(col.score).toFixed(4) ?? ""
            score_element.setAttribute("nowrap", true)
            rowElement.insertAdjacentElement("beforeend", score_element);
        });

        // create a event listenter for when a row is clicked...
        rowElement.addEventListener("click", async (event) => {
            // this really only needs to be done once.
            Array.from(getCenterElements()).forEach((x) => x.classList.remove("invisible"))

            // build the rank table...
            let rankTableHead = document.getElementById("rankHead")
            createTableHead(rankTableHead, ['Rank', 'Score', 'Code', 'Title'])
            fillRankTable(row)

            // build the JobDescription table
            buildJobDescriptionTable(row)

            // fill the comment textarea and Inputbox
            fillCommentTextArea(storeName, row.input.Id)

            // build the assignment table
            let previousResults = await soccerio.getRow(storeName,row.input.Id)
            buildAssignmentTable(previousResults)

            // remove the border class from old id...
            let selectedRow = document.querySelector("tr.selectedRow")
            if (selectedRow) selectedRow.classList.remove("selectedRow")
            selectedRow=document.querySelector(`tr[data-id="${row.Id}"`)
            selectedRow?.classList.add('selectedRow')

            // let the soccer dataset know which row is selected for flagging...
            tableBody.parentElement.dataset.selectedId = row.input.Id
        })
        tableBody.insertAdjacentElement("beforeend", rowElement);
    }
    displayNavButtons(startAtLine,endAtLine,soccerResults.data.length,numRows)


    buildRankTable()
    buildJobDescriptionTable()
}

function displayNavButtons(currentStart,currentEnd,dataLength,visibleRows){
    let startButton = document.getElementById("startButton")
    let prevButton = document.getElementById("prevButton")
    let nextButton = document.getElementById("nextButton")
    let endButton = document.getElementById("endButton")

    prevButton.dataset.currentStart=currentStart
    prevButton.dataset.numberOfVisibleRows=visibleRows

    nextButton.dataset.currentStart=currentStart
    nextButton.dataset.numberOfVisibleRows=visibleRows
    endButton.dataset.numberOfVisibleRows=visibleRows
    
    if (currentStart>0){
        startButton.classList.remove("invisible")
        prevButton.classList.remove("invisible")
    }else{
        startButton.classList.add("invisible")
        prevButton.classList.add("invisible")
    }
    if (currentEnd<dataLength){
        nextButton.classList.remove("invisible") 
        endButton.classList.remove("invisible")    
    }else{
        nextButton.classList.add("invisible")  
        endButton.classList.add("invisible")
    }
    
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

function getCenterElements(){
    return document.querySelectorAll(".inputSection,.assignments,.jobDescription,.comments,.singlejob")
}

function buildRankTable(result) {
    let rankTableHead = document.getElementById("rankHead")
    createTableHead(rankTableHead, ['Rank', 'Score', 'Code', 'Title'])
    fillRankTable(result)
}

function getSoccerKeys(result){
    throw new Error("getSoccerKeys is deprecated");
    let scores=[]
    let soc2010=[]
    let score_regex = /score_\d+/i
    let soc2010_regex = /soc2010_\d+/i
    for (col in result){
        if (score_regex.test(col)) scores.push(col)
        if (soc2010_regex.test(col)) soc2010.push(col)
    }
    return {score_keys:scores,soc2010_keys:soc2010}
}

function fillRankTable(result) {
    let tableBody = document.getElementById("rankBody")
    tableBody.innerText = ""
    if (!result) return
    result.codes.forEach( (item,rank)=>{
        let {code,title,score} = item;
        let tableRow = tableBody.insertRow();
        let rankCol = tableRow.insertCell();
        rankCol.innerHTML = (result) ? rank+1 : "&nbsp;"
        
        let scoreCol = tableRow.insertCell();
        scoreCol.innerHTML = parseFloat(score).toFixed(4);

        let codeCol = tableRow.insertCell();
        codeCol.innerText = code;
        codeCol.classList.add("nowrap")

        let titleCol = tableRow.insertCell();
        if (!title){
            let codingsystem = getCodingSystem()
            title = codingsystems[codingsystem].codes[code].title??""
        }
        titleCol.innerText = title

        tableRow.addEventListener("click", (event) => {
            assignCode(result.input.Id, code)
        })
        tableBody.insertAdjacentElement("beforeend", tableRow)
    });
}

async function fillCommentTextArea(storeName, id) {
    let commentTextArea = document.getElementById("comment")
    // if called with no parameter.. reset it to blank...
    if (!storeName){
        commentTextArea.value = ""
        return
    }
    let result = await soccerio.getRow(storeName, id)
    commentTextArea.value = result.assignments?.comment ?? "";

    commentTextArea.oninput = async (event) => {
        // update the result
        let result = await soccerio.getRow(storeName, id)
        let defaultFlags = { selected: false, redflag: false, comments: false }
        result.flags = { ...defaultFlags, ...(result.flags ?? {}) };
        result.flags.comments = commentTextArea.value.trim().length > 0
        result.assignments = result.assignments ?? { codes: [], comment: "" }
        result.assignments.comment = commentTextArea.value
        updateFlag(id, result.flags)
        await soccerio.updateRow(storeName, id, result)
    }

    // clear old values in the input box
    let coder_input = document.getElementById("coder_input");
    coder_input.value = ""

    // clear the datalist
    let datalist = document.getElementById("codingsystem")
    datalist.innerText = ""

    let codingSystem = getCodingSystem();
    coder_input.onkeyup = async (event) => {
        datalist.innerText = ""
        if (coder_input.value.length > 1 && coder_input.value.length < 7) {
            Object.keys(codingsystems[codingSystem].codes)
                .filter(key => key.startsWith(coder_input.value))
                .forEach(key => {
                    console.log(key)
                    datalist.insertAdjacentHTML("beforeend", `<option value="${key}">${key}</option>`)
                })
        }
        if (codingsystems[codingSystem].codes.hasOwnProperty(coder_input.value) && event.key == "Enter") {
            event.preventDefault()
            await assignCode(id, coder_input.value);
            coder_input.value = "";
            datalist.innerText = ""
        }
    }

    //handle user typing value
    coder_input.parentElement.querySelector("button").onclick = async (event) => {
        if (codingsystems[codingSystem].codes.hasOwnProperty(coder_input.value)) {
            await assignCode(id, coder_input.value);
            coder_input.value = "";
            datalist.innerText = ""
        }
    }

}

async function getResult(id, storeName) {
    throw new Exception("get Results is deprecated");
    storeName = storeName ?? getStoreName();
    let store = await localforage.createInstance({
        name: "SOCAssign",
        storeName: storeName
    })

    let results = await store.getItem(id)
    return results;
}

async function storeResults(id, results, storeName) {
    throw new Exception("storeResults is deprecated");
    storeName = storeName ?? getStoreName()
    let store = await localforage.createInstance({
        name: "SOCAssign",
        storeName: storeName
    })
    await store.setItem(id, results);
    getStoreDB()
}
async function removeCurrentStore(){
    await soccerio.clearDataStore(getStoreName());

    clearSoccerResultsTable()
    rebuildFileMenu()
}

function buildAssignmentTable(results) {
    // clear the assignment table...
    let tableElement = document.getElementById("AssignmentTable");
    tableElement.innerText = "";

    // add the header row...
    let trElement = document.createElement("tr")
    let thElement = document.createElement("th")
    thElement.innerText = "Assignments"
    thElement.setAttribute("colspan", 2)
    trElement.insertAdjacentElement("beforeend", thElement)
    tableElement.insertAdjacentElement("beforeend", trElement);

    // if the results are not defined... just return
    if (!results) return

    results.assignments = results.assignments ?? { codes: [], comment: "" }
    let selections = results.assignments.codes;

    function buildEmptyRow() {
        let trElement = document.createElement("tr")
        trElement.classList.add("overflow-hidden")
        for (let tdNum = 1; tdNum <= 2; tdNum++) {
            let tdElement = document.createElement("td")
            tdElement.innerHTML = "&nbsp;"
            tdElement.classList.add("nowrap", "overflow-hidden")
            trElement.insertAdjacentElement("beforeend", tdElement)
        }
        return trElement
    }

    

    if (selections?.length > 0) {
        let codingSystem = getCodingSystem();
        let selectionsMade = selections.length;
        selections.length = params.maxSelection;
        selections.forEach((selection, index) => {
            let trElement = buildEmptyRow()
            if (selection) {
                let up = (index > 0) ? `<i class="p-0 bi bi-arrow-up-circle-fill text-primary" data-id=${results.Id}  data-selection-index="${index}"></i>` : ''
                let down = (index < (selectionsMade - 1)) ? `<i class="p-0 bi bi-arrow-down-circle-fill text-primary" data-id=${results.Id}  data-selection-index="${index}"></i>` : ''
                trElement.children[0].innerHTML = `<i class="p-0 bi bi-x-circle-fill text-primary" data-id=${results.Id}  data-selection-index="${index}"></i>${up}${down}`;
                trElement.children[1].innerText = `${selection} ${codingsystems[codingSystem].codes[selection].title}`;
                let timeoutid=0;
                let popup = null;
                trElement.children[1].addEventListener("mouseenter",(event)=>{
                    if (timeoutid){
                        clearTimeout(timeoutid);
                        timeoutid = 0;
                    }
                    timeoutid = setTimeout( ()=>{
                        popup = document.createElement("div")
                        popup.style=`position:absolute;left:${event.clientX}px;top:${event.clientY}px;z-index:2;background-color:Beige;padding:5px;border:thin black solid;`
                        popup.innerText=codingsystems[codingSystem].codes[selection].title
                        document.body.appendChild(popup)
                    },1000)
                })
                trElement.children[1].addEventListener("mouseout",(event)=>{
                    if (timeoutid) {
                        clearTimeout(timeoutid)
                        timeoutid = 0                        
                    }
                    if (popup?.parentElement){
                        popup.parentElement.removeChild(popup)
                    }
                })
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
    let storeName = getStoreName();
    let result = await soccerio.getRow(storeName, soccerResultsTableElement.dataset.selectedId);
    let index = event.target.dataset.selectionIndex
    result.assignments.codes = swap(result.assignments.codes, index, index - 1)
    await soccerio.updateRow(storeName, result.input.Id, result)

    buildAssignmentTable(result)
}
async function moveDown(event) {
    let storeName = getStoreName();
    let result = await soccerio.getRow(storeName, soccerResultsTableElement.dataset.selectedId);
    let index = parseInt(event.target.dataset.selectionIndex)
    result.assignments.codes = swap(result.assignments.codes, index, index + 1)
    await soccerio.updateRow(storeName, result.input.Id, result)

    buildAssignmentTable(result)
}
async function deassign(event) {
    let storeName = getStoreName();
    let rowId = soccerResultsTableElement.dataset.selectedId;
    let result = await soccerio.getRow(storeName, rowId);
    let index = event.target.dataset.selectionIndex
    result.assignments.codes.splice(index, 1)
    if (result.assignments.codes.length == 0) {
        result.flags.selected = false;
        updateFlag(rowId, result.flags)
    }
    await soccerio.updateRow(storeName, rowId, result)

    buildAssignmentTable(result)
}

async function assignCode(id, code) {
    let storeName = getStoreName();
    let results = await soccerio.getRow(storeName, id);
    results.flags = results.flags ?? {}
    results.assignments = results.assignments ?? { codes: [], comment: "" }
    if (!results.flags.selected) {
        results.flags.selected = true;
        updateFlag(id, results.flags)
        await soccerio.updateRow(storeName, id, results);
    }
    if (!results.assignments.codes.includes(code)) {
        if (results.assignments.codes.length > 2) results.assignments.codes.pop()
        results.assignments.codes.push(code)

        await soccerio.updateRow(storeName, id, results);
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

    Object.entries(result.input).forEach(([key, entry]) => {

        trElement = document.createElement("tr")

        thElement = document.createElement("th")
        thElement.innerText = key
        trElement.insertAdjacentElement("beforeend", thElement)

        thElement = document.createElement("td")
        thElement.innerText = entry
        trElement.insertAdjacentElement("beforeend", thElement)
        tableElement.insertAdjacentElement("beforeend", trElement);
    })

}

function setStoreName(storeName) {
    soccerResultsTableElement.dataset.storeName = storeName;
    document.querySelector("footer").children[0].innerText = `File: ${storeName}`;
}
function getStoreName() {
    return soccerResultsTableElement.dataset.storeName
}
function setCodingsystem(coding_system) {
    soccerResultsTableElement.dataset.codingSystem = coding_system;
    document.getElementById("coder_input").placeholder = `Enter ${codingsystems[coding_system].name} code`
}
function getCodingSystem() {
    return soccerResultsTableElement.dataset.codingSystem
}

function clearCenterColumn() {
    buildRankTable()
    buildAssignmentTable()
}

function getSoccerResultsTableStart(){
    return parseInt(soccerResultsTableElement.dataset.tableStart??0)
}
function setSoccerResultsTableStart(value){
    soccerResultsTableElement.dataset.tableStart=value;
}

function addFlagColumn(flagClass,sortCol,row){
    let thElement = document.createElement("th")
    thElement.classList.add(flagClass)
    thElement.dataset.sortColumn=`flag_${sortCol}`
    row.insertAdjacentElement("afterbegin",thElement)
}


// the filename is the key in indexedDB and the the metadata data.
// pass in the key and I'll load the data + metadata for the file.
async function buildSoccerResultsTable(filename) {
    // get the data from localForage
    let soccerResults = await soccerio.getData(filename);

    setStoreName(filename)
    setCodingsystem(soccerResults.metadata.coding_system);

    // build the header row... starting the the flag columns
    let headers = [];
    headers.push(...soccerResults.metadata.input_columns);
    soccerResults.metadata.code_columns.forEach( (col,indx) => {
        headers.push(col)
        if (soccerResults.metadata.has_title) headers.push(soccerResults.metadata.title_columns[indx]);
        headers.push(soccerResults.metadata.score_columns[indx]);
    });

    let tableHead = document.getElementById("soccerResultsHead")
    createTableHead(tableHead, headers)
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
            
            let latestSoccerResults = await getDataFromLocalForage(getStoreName());
            latestSoccerResults.data = sortTable(th.dataset.sortColumn, th.dataset.sortDirection, latestSoccerResults.data)
            setSoccerResultsTableStart(0)
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
        let coder_input = document.getElementById("coder_input")
        if (!coder_input.classList.contains("invisible")){
            coder_input.value = code.slice(0, 7)
            coder_input.nextElementSibling.click()
        }
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
                    if (!document.querySelector(".inputSection").classList.contains("invisible")) {
                        addAndClick(object.code)
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
                addAndClick(object.code)
            })
        }

    }

    let treeview = document.querySelector(".treeview")
    treeview.innerText = "";
    let codingSystem = soccerResultsTableElement.dataset.codingSystem || "soc2010"
    codingSystem = codingsystems[codingSystem];
    codingSystem.tree.forEach((code) => buildNodes(code, treeview))

    treeview.insertAdjacentHTML("afterbegin", `<p class="fw-bold my-1 font75">${codingSystem.name}</p>`)
}

function buildUI() {
    buildNavbar()
    handleFileDrop()
    handleAssignmentMove()
    buildTreeView()
    addNavEventListener()
    document.title="SOCAssign"
}


let codingsystems = {};
let code_lookup = () => { console.error("code_lookup is not yet defined."); return null;};

window.addEventListener("load", async () => {
    codingsystems = await cs.loadCodingSystems();
    window.codingsystems = codingsystems;

    buildUI()
    document.querySelectorAll("input[type='text'],textarea").forEach((textinput =>{
        // prevent when I type an "F" in the comments/soc2010 input from toggling
        // the flag
        textinput.addEventListener("keyup",(event) => event.stopPropagation())
    }))
    document.addEventListener("keyup", async event => {
        if (event.code == "KeyF") {
            if ("selectedId" in soccerResultsTableElement.dataset) {
                let id = soccerResultsTableElement.dataset.selectedId;
                let storeName = getStoreName();

                // update the flag
                let result = await soccerio.getRow(storeName, id);
                result.flags = result.flags ?? {}
                result.flags.redflag = !result.flags.redflag
                updateFlag(id, result.flags)
                await soccerio.updateRow(storeName, id, result);
            }
        }
    })
})