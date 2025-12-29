export async function loadCodingSystems() {
    let codingsystems = {};
    codingsystems.soc2010 = await fetch("https://danielruss.github.io/codingsystems/soc_2010_complete.json")
    .then((response) => response.json());
    codingsystems.soc2010.name = "SOC 2010";
    codingsystems.soc2010.key = "soc2010"

    codingsystems.naics2022 = {name: "NAICS 2022",key:"naics2022"};
    codingsystems.naics2022.codes = await fetch("https://danielruss.github.io/codingsystems/naics2022_all.json")
    .then((response) => response.json())
    .then( (response) => response.filter( (x) => x.Level<=5) )
    .then( (response) => response.reduce( (accum,currentCode) => {
        accum[currentCode.code] = currentCode;
        return accum;
    },{}) );
    buildNAICSTree(codingsystems.naics2022);

    return codingsystems;
}

function buildNAICSTree(naics) {
    naics.tree = [];
    let codeMap = {};
    let codes = Object.values(naics.codes).sort( (a,b) => {
        let x = a.Level-b.Level
        return (x!=0)?x:a.code.localeCompare(b.code)
    });

    codes.forEach( (codeObj) => {
        codeMap[codeObj.code] = {code: codeObj.code, title: codeObj.title, children: []};
        if (codeObj.Level == 5){
            delete codeMap[codeObj.code].children;
        }
    });

    codes.forEach( (codeObj) => {
        if (codeObj.Level == 2) {
            naics.tree.push( codeMap[codeObj.code] );
        } else {
            let parent_key = `naics${codeObj.Level-1}d`;
            let parent = codeMap[codeObj[parent_key]];
            parent.children.push( codeMap[codeObj.code] );
        }
    });
}