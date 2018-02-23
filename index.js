
var neataptic = require('neataptic');
var fs = require('fs');

function createNetwork(inputSize, outputSize) {
    var network = new neataptic.Network(inputSize, outputSize);
    return network;
}

function evolveNetwork(network, dataset, options) {
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
   return new Promise(function(resolve, reject) {
      resolve(network.evolve(dataset, Object.assign(defaults, options)));
    });
}

function loadTabFile(file) {
    return fs.readFileSync(file, {encoding:"UTF-8"});
}

function transpose(matrix) {
    return Object.keys(matrix[0]).map(function(c) {
        return matrix.map(function(r) { return r[c]; });
    });
}

function normalizeData(data) {
    var max = Math.max.apply(Math, data);
    var min = Math.min.apply(Math, data);

    if(isNaN(max)) {
        console.log("data: " + JSON.stringify(data));
        throw "NaN";
    }

    return data.map(function(datum){
        if(isNaN((datum-min)/(max-min))) {
            console.log("datum: " + datum + " max: " + max + " min: " + min);
            throw "NaN";
        }
        return (datum-min)/(max-min);
    });
}

function convertDataToLines(data) {
    return data.split(/[\n\r]+/).map(function(line){
        return line.split("\t").filter(function(el){
            return el;
        }).map(function(el) {
            return convertStringToValue(el);
        });
    }).filter(function(el) {
        return el.length > 0;
    });
}

function convertStringToValue(s) {
    return s.replace(",",".");
}

function normalizeMatrix(matrix) {
    var tdata = transpose(matrix);
    var ntdata = tdata.map(function(row){
        return normalizeData(row);
    })
    return transpose(ntdata);
}

function mapVariablesToIndices(headers, variables) {
    return variables.map(function(input){
        var find = headers.indexOf(input);
        if(find==-1) {
            throw "Variable not found: " + input;
        }
        return find;
    });    
}

function keepInputsOutputsRow(row, indices) {
    return indices.map(function(index){
        return row[index];
    });
}

function keepInputsOutputsMatrix(data, indices) {
    return data.map(function(datum) {
        return keepInputsOutputsRow(datum, indices);
    });
}

function converTabFormatToNetworkFormat(data, inputs, outputs) {
    var lines = convertDataToLines(data);

    var headers = lines[0];
    var data = lines.slice(1);

    var iindexes = mapVariablesToIndices(headers, inputs);
    var oindexes = mapVariablesToIndices(headers, outputs);

    data = keepInputsOutputsMatrix(data, iindexes.concat(oindexes));
    headers = keepInputsOutputsRow(headers, iindexes.concat(oindexes));

    iindexes = mapVariablesToIndices(headers, inputs);
    oindexes = mapVariablesToIndices(headers, outputs);

    data=normalizeMatrix(data);

    var result = data.map(function(line){
        return {
            input: iindexes.map(function(index){
                return line[index];
            }),
            output:oindexes.map(function(index){
                return line[index];
            })
        };
    });

    return result;
}

var file = loadTabFile("../untrimmed.txt");
var inputs = []
var outputs = [];
var dataset = converTabFormatToNetworkFormat(file, inputs, outputs);
//console.log(dataset);
var network = createNetwork(inputs.length, outputs.length);
evolveNetwork(network, dataset).then(function() {
    if(!fs.existsSync("output")) {
        fs.mkdirSync("output");
    }
    fs.writeFileSync("output/output-network.json",JSON.stringify(network.toJSON(), null, 2));
    fs.writeFileSync("output/output-network-graph.json", JSON.stringify(network.graph(800,800), null, 2));
    fs.writeFileSync("output/output.js", "drawGraph(JSON.parse(`" + JSON.stringify(network.graph(800,800), null, 2) + "`), '.draw');");
});