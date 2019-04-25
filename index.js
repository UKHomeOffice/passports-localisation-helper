#!/usr/bin/env node

const json2csv = filename => {
    // read in file
    const json = require(filename);

    // recursively extract items
    const localisation = [];

    const extract = (obj, parent, child) => {
        let id = child;
        if (parent) id = parent + '.' + child;
        if (typeof obj === 'string') {
            localisation.push({id, en: obj, cy: '' });
        } else if (Array.isArray(obj)) {
            obj.forEach((value, index) => extract(value, id, index + 1));
        } else if (typeof obj === 'object' && obj) {
            for (const key in obj) extract(obj[key], id, key);
        } else {
            throw new Error('Unknown localisation type at ' + id + ': ' + obj);
        }
    };

    extract(json);

    // convert array to a valid csv file
    const csvStringify = require('csv-stringify/lib/sync');
    const csv = csvStringify(localisation, {
        header: true,
        columns: [
            { key: 'id', header: 'ID' },
            { key: 'en', header: 'English' },
            { key: 'cy', header: 'Welsh' }
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

    const localisation = {};

    records.forEach(record => {
        // convert numeric parts back to numbers
        const idParts = record.id
            .split('.')
            .map(id => id.match(/^[0-9]+$/) ? parseInt(id, 10) - 1 : id);

        // build up parents
        let obj = localisation;
        while(idParts.length > 1) {
            const id = idParts.shift();
            if (!obj[id]) {
                const next = idParts[0];
                obj[id] = typeof next === 'number' ? [] : {};
            }
            obj = obj[id];
        }

        // set value
        const id = idParts.shift();
        obj[id]= record[lang];
    });

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
