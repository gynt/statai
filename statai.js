
var neataptic = module.exports.neataptic = require('neataptic');
var fs = require('fs');

module.exports.loadTabFile = function (file) {
    return fs.readFileSync(file, { encoding: "UTF-8" });
}

var transpose = module.exports.transpose = function (matrix) {
    if (matrix[0] === undefined) {
        console.log(matrix);
        throw "Undefined matrix"
    }
    return Object.keys(matrix[0]).map(function (c) {
        return matrix.map(function (r) { return r[c]; });
    });
}

function normalizeData(data) {
    var max = Math.max.apply(Math, data);
    var min = Math.min.apply(Math, data);

    if (isNaN(max)) {
        console.log("data: " + JSON.stringify(data));
        throw "NaN";
    }

    return data.map(function (datum) {
        if (isNaN((datum - min) / (max - min))) {
            console.log("datum: " + datum + " max: " + max + " min: " + min);
            throw "NaN";
        }
        return (datum - min) / (max - min);
    });
}

function readTabFormat(data) {
    return data.split(/[\n\r]+/).map(function (line) {
        return line.split("\t").filter(function (el) {
            return el;
        }).map(function (el) {
            return convertStringToValue(el);
        });
    }).filter(function (el) {
        return el.length > 0;
    });
}

function convertStringToValue(s) {
    return s.replace(",", ".");
}

function add(a, b) {
    return a + b;
}

function failOnEmptyMatrix(matrix) {
    if (matrix.map(function (row) {
        return row.length == 0;
    }).reduce(add, 0) == matrix.length) {
        throw "Empty matrix";
    };
}

var normalizeMatrix = function (matrix) {
    failOnEmptyMatrix(matrix);
    var tdata = transpose(matrix);
    var ntdata = tdata.map(function (row) {
        return normalizeData(row);
    })
    return transpose(ntdata);
}

function mapVariablesToIndices(headers, variables) {
    if (variables === undefined || variables.length == 0) {
        throw "No headers specified";
    }
    return variables.map(function (input) {
        var find = headers.indexOf(input);
        if (find == -1) {
            throw "Variable not found: " + input;
        }
        return find;
    });
}

function keepInputsOutputsRow(row, indices) {
    return indices.map(function (index) {
        return row[index];
    });
}

function keepInputsOutputsMatrix(data, indices) {
    return data.map(function (datum) {
        return keepInputsOutputsRow(datum, indices);
    });
}

module.exports.convertTabFormatToNetworkFormat = function (data, inputs, outputs) {
    var lines = readTabFormat(data);

    var headers = lines[0];
    var data = lines.slice(1);

    var iindexes = mapVariablesToIndices(headers, inputs);
    var oindexes = mapVariablesToIndices(headers, outputs);

    data = keepInputsOutputsMatrix(data, iindexes.concat(oindexes));
    headers = keepInputsOutputsRow(headers, iindexes.concat(oindexes));

    iindexes = mapVariablesToIndices(headers, inputs);
    oindexes = mapVariablesToIndices(headers, outputs);

    data = normalizeMatrix(data);

    var result = data.map(function (line) {
        return {
            input: iindexes.map(function (index) {
                return line[index];
            }),
            output: oindexes.map(function (index) {
                return line[index];
            })
        };
    });

    return result;
}

module.exports.createNetwork = function (inputSize, outputSize) {
    var network = new neataptic.Network(inputSize, outputSize);
    return network;
}

module.exports.randomSplitDataset = function (dataset) {
    var makeArrRandom = function (array) {

        var counter = array.length, temp, index;
        while (counter > 0) {
            index = Math.floor(Math.random() * counter);
            counter--;
            temp = array[counter];
            array[counter] = array[index];
            array[index] = temp;
        }
        return array;
    };
    var shuffled = makeArrRandom(dataset.slice());
    return { half1: shuffled.slice(0, Math.floor(dataset.length / 2)), half2: shuffled.slice(Math.floor(dataset.length / 2)) };
}

module.exports.computeError = function (network, dataset) {
    return dataset.map(function (row) {
        var outs = network.activate(row.input);
        return outs.map(function (out, i) {
            return row.output[i] - out;
        });
    });
}

module.exports.evolveNetwork = function (network, dataset, options) {
    defaults = {
        mutation: neataptic.methods.mutation.FFW,
        equal: true,
        popsize: 100,
        elitism: 10,
        log: 10,
        error: 0.03,
        iterations: 1000,
        mutationRate: 0.5
    };
    var opts = Object.assign(defaults, options);
    console.log(opts);
    return new Promise(function (resolve, reject) {
        resolve(network.evolve(dataset, opts));
    });
}

module.exports.saveNetwork = function (network, name) {
    name = name || "";
    var html = `<html>
    <head>
      <script src="http://d3js.org/d3.v3.min.js"></script>
      <script src="http://marvl.infotech.monash.edu/webcola/cola.v3.min.js"></script>
  
      <script src="https://rawgit.com/wagenaartje/neataptic/master/dist/neataptic.js"></script>
      <script src="https://rawgit.com/wagenaartje/neataptic/master/graph/graph.js"></script>
      <link rel="stylesheet" type="text/css" href="https://rawgit.com/wagenaartje/neataptic/master/graph/graph.css">
    </head>
    <body>
      <div class="container">
        <div class="row">
          <svg class="draw" width="800px" height="800px"/>
        </div>
      </div>
      <script src="output-`+name+`.js"></script>
    </body>
  </html>`;
    if (!fs.existsSync("output")) {
        fs.mkdirSync("output");
    }
    if(!fs.existsSync("output/graph-"+name+".html")) {
        fs.writeFileSync("output/graph-"+name+".html", html);
    }
    fs.writeFileSync("output/output-network-"+name+".json", JSON.stringify(network.toJSON(), null, 2));
    fs.writeFileSync("output/output-network-"+name+"-graph.json", JSON.stringify(network.graph(800, 800), null, 2));
    fs.writeFileSync("output/output-"+name+".js", "drawGraph(JSON.parse(`" + JSON.stringify(network.graph(800, 800), null, 2) + "`), '.draw');");

}