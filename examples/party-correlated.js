// matrix <- c(1,.2,.4,.2,0,
//     +        .2,1,0,0,0,
//     +        .4,0,1,0,0,
//     +        .2,0,0,1,0,
//     +        0,0,0,0,1)


var neataptic = require('neataptic');

var mutation = neataptic.methods.mutation;

var allowedfunctions = [
    neataptic.methods.activation.IDENTITY
];

mutation.MOD_ACTIVATION.allowed=allowedfunctions;
var allowedmutations = [
    mutation.ADD_NODE,
    mutation.SUB_NODE,
    mutation.ADD_CONN,
    mutation.SUB_CONN,
    mutation.MOD_WEIGHT,
    mutation.MOD_BIAS,
    mutation.MOD_ACTIVATION
];



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

var filepath = "examples/partly-correlated.tab";

var file = statai.loadTabFile(filepath);
var inputs = ['"V1"','"V2"','"V3"',];
var outputs = ['"V4"','"V5"'];
var dataset = statai.convertTabFormatToNetworkFormat(file, inputs, outputs);
//console.log(dataset);
var network = statai.createNetwork(inputs.length, outputs.length);

network.nodes.forEach(function(node){
    node.squash = neataptic.methods.activation.IDENTITY;
});

var halfs = statai.randomSplitDataset(dataset);
statai.evolveNetwork(network, halfs.half1, options={mutation: allowedmutations}).then(function() {
    statai.saveNetwork(network);
    var e = statai.transpose(statai.computeError(network, halfs.half2));
    console.log(mean(e[0]));
    console.log(mean(e[1]));
});