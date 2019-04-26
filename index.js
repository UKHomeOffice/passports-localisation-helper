#!/usr/bin/env node

const flatten = require('./flatten');

const json2csv = filename => {
    // read in file
    const json = require(filename);

    // flatten json object
    const flat = flatten.implode(json);

    // extract object items to an array
    const records = Object.keys(flat).map(id => ({
        id: id,
        en: flat[id],
        cy: ''
    }));

    // convert array to a csv file string
    const csvStringify = require('csv-stringify/lib/sync');
    const csv = csvStringify(records, {
        header: true,
        columns: [
            { key: 'id', header: 'ID' },
            { key: 'en', header: 'English content' },
            { key: 'cy', header: 'Welsh content' }
        ]
    });
    
    return csv;
};

const csv2json = (filename, lang) => {
    // read in file
    const csv = require('fs').readFileSync(filename);
    const csvParse = require('csv-parse/lib/sync');
    const records = csvParse(csv, {
        columns: true,
        columns: [ 'id', 'en', 'cy' ],
        skip_empty_lines: true
    });

    // extract csv rows by language
    const flat = records.reduce((flat, record) => {
        flat[record.id] = record[lang];
        return flat;
    }, {});

    // unflatten to object tree
    const localisation = flatten.explode(flat);

    // format to text string
    const json = JSON.stringify(localisation, null, 4);

    return json;
};

const usage = () => {
    console.error('Usage:\n  node . filename.csv [en|cy] > outfile.json\n  node . filename.json > outfile.csv\n');
    process.exit(1);
};

const args = process.argv.slice(2);

const filename = args.shift();
const lang = args.shift();

let result;

if (!filename) usage();
else if (filename.endsWith('.json')) result = json2csv(filename);
else if (filename.endsWith('.csv')) result = csv2json(filename, lang || 'cy');
else usage();

process.stdout.write(result);
