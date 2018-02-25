var neataptic = require('neataptic');
var fs = require('fs');
var statai = require('../statai.js');

function mean(numbers) {
    var total = 0,
        i;
    for (i = 0; i < numbers.length; i += 1) {
        total += numbers[i];
    }
    return total / numbers.length;
}

var filepath = "examples/orthogonal.tab";

var file = statai.loadTabFile(filepath);
var inputs = ['"V1"','"V2"','"V3"',];
var outputs = ['"V4"','"V5"'];
var dataset = statai.convertTabFormatToNetworkFormat(file, inputs, outputs);
//console.log(dataset);
var network = statai.createNetwork(inputs.length, outputs.length);
var halfs = statai.randomSplitDataset(dataset);
statai.evolveNetwork(network, halfs.half1).then(function() {
    if(!fs.existsSync("output")) {
        fs.mkdirSync("output");
    }
    fs.writeFileSync("output/output-network.json",JSON.stringify(network.toJSON(), null, 2));
    fs.writeFileSync("output/output-network-graph.json", JSON.stringify(network.graph(800,800), null, 2));
    fs.writeFileSync("output/output.js", "drawGraph(JSON.parse(`" + JSON.stringify(network.graph(800,800), null, 2) + "`), '.draw');");
    var e = statai.transpose(statai.computeError(network, halfs.half2));
    console.log(mean(e[0]));
    console.log(mean(e[1]));
});