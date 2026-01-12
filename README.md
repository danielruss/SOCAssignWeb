# SOCAssignWeb

SOCAssignWeb assists expert review of SOCcer, SOCcerNET, and CLIPS results.  SOCAssign reads results in  CSV, Excel, or JSON format and displays the top 10 SOCcer assignments for each job description to the coder for assessment.

Before importing, the SOCcer results can be preprocessed to focus the expert review on a subset of job descriptions, such as job descriptions with low SOCcer scores.

For each job description, experts can select up to 3 codes. The codes can be selected from the SOCcer output, a hierarchical list of all codes, or manually entered. A validation check ensures that only valid codes can be entered. SOCAssignWeb understands the US SOC2010 and NAICS2022 codes systems, which is the output of SOCccer and CLIPS, but it is extendable to other classification as needed.

This application was designed with privacy in mind.  Data never leaves your browser, until you choose to download the results.

## Expected CSV/Excel input

`<INPUT CSV COLUMNS>,<coding_system>_1,[title_1],score_1,...,<coding_system>_n,[title_n],score_n`

`<INPUT CSV COLUMNS>` - These columns are maintained as meta data and displayed in the Job Description Table.  An id is **highly recommended**.

`<coding_system>_1` ... `<coding_system>_n` -- All the apps in the SOCcer ecosystem create columns named soc2010_1..soc2020_10.  SOCAssignWeb extracts the coding system and converts it to lower case.  Currently only soc2010 and naics2022 are used, but the coding sytems are extendable.

`[title_1]` .. `[title_n]` -- This is optional.  This is the name of the code (i.e. 11-1011 is "Chief Executives")

`score_1`..`score_n` -- The score_i is the score associated with code_i.

## Expected JSON input
The JSON was designed to be saved work from SOCAssignWeb, however there is nothing wrong with using it as input.  
```
{
    data: [job1...,jobn]
    metadata: {
        code_columns: ['soc2010_1',...,'soc2010_4'],
        coding_system: 'soc2010',
        input_columns: ['Id','JobTitle','JobTask'],
        lines: 300,
        n:4,
        has_title: true,
        score_columns: ['score_1',...,'score_4'],
        title_columns: ['title_1',...,'title_4']
    }
}
```
where job1 is 
```
{
    codes: [{code:'19-4041', score:0.777,title:'Geological and Petroleum Technicians'} ... ]
    input: {
        Id: 'Study-00123',
        JobTitle: 'geology tech',
        JobTask: 'process samples'
    }
}
```
The input can have other keys, but it MUST match thee input columns in the metadata.  The number of length of the data array should equal lines in the metadatam and n should equal the number of codes returned by soccer.