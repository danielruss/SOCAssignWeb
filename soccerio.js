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
        case 'application/json':
            await loadJSON(file)
            break;
        default:
            throw new Error(`Unsupported file type ${file.type}`);
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
    let soccer_meta = {
        original_filename: file.name
    };

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
    if (workbook.Custprops){
        Object.entries(workbook.Custprops).forEach( ([key,value])=>{
            soccer_meta[key]=value
        } );
    }
    addMetaData(file.name, soccer_meta);
    //xldata.forEach((row, index) => {
    // forEach does not play nice with await..
    for await (const [index, row] of xldata.entries()){ 
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

        // DEBUG: Log the ACTUAL KEY being used
        const keyToUse = clean_row.input.Id;
        console.log(`Index ${index}: Key type="${typeof keyToUse}" value="${keyToUse}" length=${keyToUse?.length}`); 
        if (index < 3) console.log(`Full clean_row:`, JSON.parse(JSON.stringify(clean_row)));

        await dataStore.setItem(clean_row.input.Id, clean_row);
    };
}

export async function loadJSON(file) {
    console.log('JSON file selected:', file.name);
    try {
        const jsonText = await file.text();
        const object = JSON.parse(jsonText);
        JSONfillLocalForage(object,file.name);
    } catch (error) {
        console.error(`Problem loading the JSON from ${file.name}`,error)
    }

}

async function JSONfillLocalForage(object,storeName){
    // NOTE: At this point if you upload an object that is 
    // already in localforage, it will OVERWRITE it. 
    // NOTE: SOCcerNET does not natively write in JSON... Yet
    const isSOCAssignObject=checkForSOCAssignObject(object)
    if (isSOCAssignObject.valid){
        const store = await initIndexDB(storeName)
        // add each row to IdB.  keep the
        // promises in batches of 1K.
        const batchSize=1000;

        // first write the data...
        for (let rowIndex=0; rowIndex<object.data.length; rowIndex+=batchSize){
            const batch = object.data.slice(rowIndex,rowIndex+batchSize);
            const promises = batch.map( (row) => store.setItem(row.input.Id,row) );
            await Promise.all(promises);
        }
        // then the metadata
        await addMetaData(storeName,object.metadata)
    } else{
        console.error(object)
        console.error(`Problem loading the JSON file: ${storeName}`,isSOCAssignObject.error)
    }
}

function checkForSOCAssignObject(o){

    // check the object...
    let requiredKeys = ['data','metadata']
    if (!requiredKeys.every(key => key in o)) return {
        valid:false,
        error:'missing required key in the object'
    };

    // check the metadata
    if (!o.metadata || typeof o.metadata !== 'object') return {
        valid: false,
        error: 'metadata is not an object'
    };

    requiredKeys = ['input_columns','code_columns','n', 'lines', 'coding_system','has_title']
    if (!requiredKeys.every(key => key in o.metadata)) return {
        valid: false,
        error: 'missing required key in the metadata'
    };

    // check the data
    if (!Array.isArray(o.data) || o.data.length==0 || o.data.length != o.metadata.lines) return {
        valid: false,
        error: `data is${o.data?.length==0?"":" not"} an array of length ${o.metadata.lines}`
    }

    // check the first row of the data...
    requiredKeys = ['codes','input']
    if (!('codes' in o.data[0]) || !('input' in o.data[0]) || !('Id' in o.data[0].input) ) return {
        valid: false,
        error: 'data is malformed'
    };

    return {
        valid: true,
    }
}
