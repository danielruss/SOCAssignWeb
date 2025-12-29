import Papa from 'https://cdn.jsdelivr.net/npm/papaparse@5.5.3/+esm'
import localforage from 'https://cdn.jsdelivr.net/npm/localforage@1.10.0/+esm'
import XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";
window.xlsx=XLSX;

function isString(value) {
    return typeof value === 'string';
}

let instanceName='SOCAssign';
export function setInstanceName(name='SOCAssign') {
    instanceName=name;
}

async function initIndexDB(filename="unnamed") {
    return await localforage.createInstance({
        name: instanceName,
        storeName: filename,
    });
}

async function getMetaDataTable(filename="unnamed") {
    return await localforage.createInstance({
        name: instanceName,
        storeName: "metadata",
    });
}

async function addMetaData(filename="unnamed",metadata) {
    if (!isString(filename)) throw new Error('Metadata key must be a string');
    let metaStore = await getMetaDataTable(filename);
    await metaStore.setItem(filename, metadata);
}

async function removeMetaData(filename="unnamed") {
    let metaStore = await getMetaDataTable(filename);
    await metaStore.removeItem(filename);
}

export async function getMetaData(filename="unnamed",metadata) {
    let metaStore = await getMetaDataTable(filename);
    return await metaStore.getItem(filename, metadata);
}

export async function clearDataStore(filename) {
    await removeMetaData(filename);
    return await localforage.dropInstance({ 
        name: instanceName, 
        storeName: filename
    });
}
export async function clearAllData() {
    return await localforage.dropInstance({ 
        name: instanceName, 
    });
}
export async function ls() {
    let metaStore = await getMetaDataTable();
    let keys = await metaStore.keys();
    return keys;
}

// Get data from IndexedDB
export async function getData(filenname) {
    let dataStore = await initIndexDB(filenname);
    let keys = await dataStore.keys();
    let results = {data:[]};
    await dataStore.iterate( (value,key,iterationNumber) => {
        results.data.push(value);
    })
    results.metadata = await getMetaData(filenname);
    return results;
}

export async function getRow(filename, id) {
    let dataStore = await initIndexDB(filename);
    return await dataStore.getItem(id);
}

export async function updateRow(filename, id, row) {
    let dataStore = await initIndexDB(filename);
    await dataStore.setItem(id, row);
}

window.ls = ls;
window.clear = clearDataStore;
window.clearAll = clearAllData;
window.getData = getData;

export async function loadData(file){
    switch (file.type) {
        case 'text/csv':
            await loadCSV(file);
            break;
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            await loadExcel(file);
            break;
        default:
            throw new Error('Unsupported file type');
    }
    console.log('File loaded:', file.name);
}

function createMetaData(header) {
    // each version of soccer produces different column names
    let [last_score, score_n] = header[header.length - 1].split('_');
    let [last_code, code_n] = header[header.length - 2].split('_');
    let has_title = false;
    let last_title = '';
    let soccer_meta = {};

    if (last_code.toLowerCase() == "title") {
        has_title = true;
        last_title = last_code;
        [last_code, code_n] = header[header.length - 3].split('_');
    }

    if (score_n === undefined || code_n === undefined) {
        console.error("CSV file does not have the expected format");
        parser.abort();
    }
    if (score_n !== code_n) {
        console.error("Score and Code columns do not match");
        parser.abort();
    }
    let code_regex = new RegExp(`^${last_code}_\\d+$`);
    let score_regex = new RegExp(`^${last_score}_\\d+$`);
    let title_regex = new RegExp(`^${last_title}_\\d+$`);

    soccer_meta.coding_system = last_code.toLowerCase();
    soccer_meta.n = parseInt(score_n);
    soccer_meta.has_title = has_title;
    soccer_meta.code_columns = header.filter(field => code_regex.test(field));
    soccer_meta.score_columns = header.filter(field => score_regex.test(field));
    if (has_title) {
        soccer_meta.title_columns = header.filter(field => title_regex.test(field));
    }
    soccer_meta.input_columns = header.filter(field => !code_regex.test(field) && !score_regex.test(field) && !title_regex.test(field));
    window.soccer_meta = soccer_meta;
    return soccer_meta;
}

export async function loadCSV(file) {
    console.log(file)
    let dataStore = await initIndexDB(file.name);
    if (await dataStore.length() > 0) {
        console.log("Data already exists in IndexedDB - skipping load");
        return;
    }

    let chunkIndex = 0;
    let soccer_meta = {};

    return new Promise( (resolve,reject) => Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        chunk: function (result, parser) {
            if (chunkIndex === 0) {
                soccer_meta = createMetaData(result.meta.fields);
                soccer_meta.lines = 0
            }
            if (window.verbose)console.log(result.data);
            result.data.forEach((row,iiii) => {
                if (!row.Id) {
                    console.error("Row does not have an Id", row);
                    return;
                }
                if (iiii==0) {
                    console.log("First row:", row);
                }
                let clean_row = {};
                let cs=soccer_meta.coding_system.toLowerCase()
                clean_row.input = soccer_meta.input_columns.reduce((acc, col) => {
                    acc[col] = row[col];
                    return acc;
                }, {});
                clean_row.codes = soccer_meta.code_columns.map( (col,indx) => {
                    let value = {code: row[col], score: row[soccer_meta.score_columns[indx]].toLowerCase()};
                    if (soccer_meta.has_title) {
                        value.title = row[soccer_meta.title_columns[indx]];
                    }
                    return value;
                });
                dataStore.setItem(row.Id, clean_row)
            });
            chunkIndex++;
            soccer_meta.lines += result.data.length;
        },
        complete: function(result) {
            addMetaData(file.name, soccer_meta);
            resolve()
        },
        error: function(error) {
            reject(error)
        }
    }));
}

export async function loadExcel(file) {
    console.log('XLSX file selected:', file.name);
    let dataStore = await initIndexDB(file.name);
    if (await dataStore.length() > 0) {
        console.log("Data already exists in IndexedDB - skipping load");
        return;
    }
    let workbook = XLSX.read(await file.arrayBuffer(), {type: 'buffer'});

    let xldata  = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let header = Object.keys(xldata[0]);
    let soccer_meta = createMetaData(header);
    soccer_meta.n = xldata.length;
    addMetaData(file.name, soccer_meta);
    xldata.forEach((row, index) => {
        let clean_row = {};
        clean_row.input = soccer_meta.input_columns.reduce((acc, col) => {
            acc[col] = row[col];
            return acc;
        }, {});
        clean_row.codes = soccer_meta.code_columns.map((col, indx) => {
            let value = { code: row[col], score: row[soccer_meta.score_columns[indx]] };
            if (soccer_meta.has_title) {
                value.title = row[soccer_meta.title_columns[indx]];
            }
            return value;
        });
        dataStore.setItem(clean_row.input.Id, clean_row);
    });
}