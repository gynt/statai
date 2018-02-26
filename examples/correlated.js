//Covariance matrix of dataset
//        V1         V2         V3         V4         V5
// V1  2.193808  1.4547270  1.2688589  1.1855559 -0.7049190
// V2  1.454727  2.0878489  1.2558358  0.9438263 -0.6600630
// V3  1.268859  1.2558358  1.5740068  0.7959903 -0.4530023
// V4  1.185556  0.9438263  0.7959903  1.6827017 -0.5445391
// V5 -0.704919 -0.6600630 -0.4530023 -0.5445391  1.8328419

var statai = require('../statai.js');

var network = statai.createNetwork(4, 1);

var mutation = statai.neataptic.methods.mutation;

var allowedfunctions = [
    statai.neataptic.methods.activation.IDENTITY
];

mutation.MOD_ACTIVATION.allowed=allowedfunctions;
mutation.MOD_BIAS.min = 0.0000000;
mutation.MOD_BIAS.max = 0.0000000;
mutation.MOD_WEIGHT.min = -10;
mutation.MOD_WEIGHT.max = 10;
var allowedmutations = [
    mutation.ADD_NODE,
    mutation.SUB_NODE,
    mutation.ADD_CONN,
    mutation.SUB_CONN,
    mutation.MOD_WEIGHT,
    mutation.MOD_ACTIVATION
];

network.nodes.forEach(function(node){
    node.squash = statai.neataptic.methods.activation.IDENTITY;
});

var data = statai.convertTabFormatToNetworkFormat(statai.loadTabFile("examples/correlated.tab"), inputs=["V1","V2","V3","V4"],outputs=["V5"]);
var halfs = statai.randomSplitDataset(data);

var promise = statai.evolveNetwork(network, halfs.half1, {

});

promise.then(function(){
    statai.saveNetwork(network, "correlated");
    var error = statai.computeError(network, halfs.half2);
    console.log(mean(error[0]))
    //console.log(mean(error))
});

function mean(numbers) {
    var total = 0,
        i;
    for (i = 0; i < numbers.length; i += 1) {
        total += numbers[i];
    }
    return total / numbers.length;
}