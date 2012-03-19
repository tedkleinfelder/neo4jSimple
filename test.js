var neo4jSimple = require('./neo4j-simple.js').neo4jSimple;
var neo4j = new neo4jSimple();
var async = require('async');

function test_getServiceRoot(cb) {
    neo4j.getServiceRoot(function(err, serviceObj) {
        if (err) {
            console.error('test_getServiceRoot: '+err);
            cb(err);
            return;
        }
        // TODO: verify content in service root
        cb();
    });
}

function test_createNode(cb) {
    neo4j.createNode(function(err, id) {
        if (err) {
            cb('test_createNode: '+err);
            return;
        }
        // TODO: verify id, get node with that id
        cb();
    });
}

function test_createNodeWithProperties(cb) {
    neo4j.createNodeWithProperties({wife:'Wilma', friend: 'Barney'}, function(err, id) {
        if (err) {
            cb('test_createNodeWithProperties: '+err);
            return;
        }
        // TODO: verify id, get node with that id & verify properties
        cb();
    });
}

function test_getNode(cb) {
    neo4j.getNode(10, function(err, id) {
        if (err) {
            cb('test_getNode: '+err);
            return;
        }
        // TODO: verify id, get node with that id & verify properties
        cb();
    });
}

function do_tests() {

    async.series(
        [
            test_getServiceRoot,
            test_createNode,
            test_createNodeWithProperties,
            test_getNode
        ],

        // async callback
        function(err, results) {
            if (err)  {
                console.log('Err: '+err);
                process.exit(1);
                return;
            }
            console.log('All tests passed.');
            process.exit(0);
        }
    );
}

do_tests();
