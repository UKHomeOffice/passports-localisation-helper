
const implode = json => {
    const flat = {};

    // recurcively walk json and convert end nodes to flattened object entries.
    const walk = (obj, parent, child) => {
        let id = child;
        if (parent) id = parent + '.' + child;
        if (typeof obj === 'string') {
            flat[id] = obj.replace(/’/g, '\'');
        } else if (Array.isArray(obj)) {
            // convert array indexes to strings starting at 1 instead of zero
            obj.forEach((value, index) => walk(value, id, index + 1));
        } else if (typeof obj === 'object' && obj) {
            for (const key in obj) walk(obj[key], id, key);
        } else {
            throw new Error('Unknown localisation type at ' + id + ': ' + obj);
        }
    };

    walk(json);

    return flat;
};

const explode = flat => {
    const json = {};

    for (const id in flat) {
        let value = flat[id];
        if (typeof value === 'string') value = value.replace(/'/g, '’');
        if (value === '') continue;

        // convert numeric array index parts back to numbers beginning with zero
        const idParts = id
            .split('.')
            .map(id => id.match(/^[0-9]+$/) ? parseInt(id, 10) - 1 : id);

        // build up parents
        let obj = json;
        while(idParts.length > 1) {
            const id = idParts.shift();
            if (obj[id] === undefined) {
                const next = idParts[0];
                obj[id] = typeof next === 'number' ? [] : {};
            }
            obj = obj[id];
        }

        // set value
        const leafId = idParts.shift();
        obj[leafId] = value;
    }

    return json;
};


module.exports = { explode, implode };
