/**
 * @fileoverview A set of tests for the neo4jSimple object. When you execute this script,
 * the tests will all execute and, if there are no errors, the process exits with 0,
 * the exit value is 1 otherwise.
 *
 * @author <a href="mailto:edmond.meinfelder@gmail.com">Edmond Meinfelder</a>
 */
var neo4jSimple = require('./neo4jSimple.js').neo4jSimple;
var async = require('async');
var assert = require('assert');
var util = require('util');
var neo4j;

/**
 * Tests for getServiceRoot.
 */
function test_getServiceRoot(cb) {
    neo4j.getServiceRoot(function(err, serviceRoot) {
        if (err) {
            cb('test_getServiceRoot: '+err);
            return;
        }

        // verify content in service root
        assert.ok(typeof serviceRoot === 'object');
        assert.ok(typeof serviceRoot.node === 'string');
        assert.ok(typeof serviceRoot.relationship === 'string');
        assert.ok(typeof serviceRoot.cypher === 'string');
        assert.ok(typeof serviceRoot.relationship_index === 'string');
        assert.ok(typeof serviceRoot.relationship_types === 'string');
        assert.ok(typeof serviceRoot.neo4j_version === 'string');
        assert.ok(typeof serviceRoot.batch === 'string');
        assert.ok(typeof serviceRoot.extensions_info === 'string');
        assert.ok(typeof serviceRoot.node_index === 'string');
        assert.ok(typeof serviceRoot.reference_node === 'string');
        cb();
    });
}

function getAndDeleteNode(id, cb) {
    assert.ok(typeof id === 'number');
    assert.ok(id >= 1);

    neo4j.getNode(id, function(err, id2, node) {
        if (err) {
            cb('getAndDeleteNode: '+err);
            return;
        }
        assert.ok(typeof id2 === 'number');
        assert.ok(id === id2);
        assert.ok(typeof node === 'object');

        // delete the node
        neo4j.deleteNodeById(id, function(err, id3) {
            if (err) {
                cb('getAndDeleteNode: '+err);
                retrn;
            }
            assert.ok(typeof id3 === 'number');
            assert.ok(id3 === id2);
            cb();
        });
    });
}

/**
 * Tests for createNode()
 */
function test_createNode(cb) {
    neo4j.createNode(function(err, id) {
        if (err) {
            cb('test_createNode: '+err);
            return;
        }

        // verify id, get node with that id
        assert.ok(typeof id === 'number');
        assert.ok(id >= 1);

        getAndDeleteNode(id, function(err) {
            cb(err);
        });
    });
}

/**
 * Tests for createNodeWithProperties()
 */
function test_createNodeWithProperties(cb) {
    neo4j.createNodeWithProperties({wife:'Wilma', friend: 'Barney'}, function(err, id) {
        if (err) {
            cb('test_createNodeWithProperties 1: '+err);
            return;
        }

        // verify id, get node with that id & verify properties
        neo4j.getNode(id, function(err, id2, node) {
            if (err) {
                cb('test_createNodeWithProperties 2: '+err);
                return;
            }
            assert.ok(typeof id2 === 'number');
            assert.ok(id === id2);
            assert.ok(typeof node === 'object');
            assert.ok(typeof node.data === 'object');

            //verify properties
            assert(node.data.wife === 'Wilma');
            assert(node.data.friend === 'Barney');
    
            // delete the node
            neo4j.deleteNodeById(id, function(err, id3) {
                if (err) {
                    cb('test_createNodeWithProperties 3: '+err);
                    retrn;
                }
                assert.ok(typeof id3 === 'number');
                assert.ok(id3 === id2);
                cb();
            });
        });
    });
}

/**
 * Tests for getNode()
 */
function test_getNode(cb) {
    neo4j.createNode(function(err, id) {            // create a node!
        if (err) {
            cb('test_getNode: '+err);
            return;
        }
        neo4j.getNode(id, function(err, id2) {       // get the node!
            if (err) {
                cb('test_getNode: '+err);
                return;
            }
            // verify id, get node with that id & verify properties
            neo4j.deleteNodeById(id, function(err, id3) {
                cb(err);
            });
        });
    });
}

function test_deleteNode(cb) {
    neo4j.createNode(function(err, id) {            // create a node!
        if (err) {
            cb('test_getNode: '+err);
            return;
        }
        neo4j.deleteNodeById(id, function(err, id2) {   // and delete it!
            if (err) {
                cb('test_deleteNode: '+err);
                return;
            }
            assert.ok(id === id2);
            cb();
        });
    });
}

function test_Relationships(cb) {
    neo4j.createNode(function(err, id1) {            // create a node!
        if (err) {
            cb('test_getRelationshipById 1: '+err);
            return;
        }
        neo4j.createNode(function(err, id2) {            // create a node!
            if (err) {
                cb('test_getRelationshipById 2: '+err);
                return;
            }
            neo4j.createRelationship(id1, id2, 'test', {key:"value"}, function(err, rel_id, relationship) {
                if (err) {
                    cb('test_getRelationshipById 3: '+err);
                    return;
                }
                neo4j.getRelationshipById(rel_id, function(err, rel_id2, relationship) {
                    if (err) {
                        cb('test_getRelationshipById 4: '+err);
                        return;
                    }
                    assert.ok(typeof relationship === 'object');
                    assert.ok(rel_id == rel_id2);
                    assert.ok(relationship.data !== undefined);
                    assert.ok(typeof relationship.data === 'object');
                    assert.ok(relationship.data.key === 'value');
                    //console.log('relationship: '+util.inspect(relationship));
                    neo4j.deleteRelationshipById(rel_id2, function(err, err_id) {
                        if (err) {
                            cb('test_getRelationshipById 5: '+err);
                            return;
                        }
                        cb();
                    });
                });
            });
        });
    });
}


function test_getRelationshipProperties(cb) {
    neo4j.createNode(function(err, id1) {            // create a node!
        if (err) {
            cb('test_getRelationshipProperties 1: '+err);
            return;
        }
        neo4j.createNode(function(err, id2) {            // create a node!
            if (err) {
                cb('test_getRelationshipProperties 2: '+err);
                return;
            }
            neo4j.createRelationship(id1, id2, 'test', {key:"value"}, function(err, rel_id, relationship) {
                if (err) {
                    cb('test_getRelationshipProperties 3: '+err);
                    return;
                }
                neo4j.getRelationshipProperties(rel_id, function(err, rel_id2, properties) {
                    if (err) {
                        cb('test_getRelationshipProperties 4: '+err);
                        return;
                    }
                    assert(properties !== undefined);
                    assert(properties.key !== undefined);
                    assert(properties.key === 'value');
                    neo4j.deleteRelationshipById(rel_id2, function(err, err_id) {
                        if (err) {
                            cb('test_getRelationshipProperties 5: '+err);
                            return;
                        }
                        cb();
                    });
                });
            });
        });
    });
}

function test_setRelationshipProperties(cb) {
    neo4j.createNode(function(err, id1) {            // create a node!
        if (err) {
            cb('test_getRelationshipProperties 1: '+err);
            return;
        }
        neo4j.createNode(function(err, id2) {            // create a node!
            if (err) {
                cb('test_getRelationshipProperties 2: '+err);
                return;
            }
            neo4j.createRelationship(id1, id2, 'test', {key:"value"}, function(err, rel_id, relationship) {
                if (err) {
                    cb('test_getRelationshipProperties 3: '+err);
                    return;
                }
                neo4j.setRelationshipProperties(rel_id, {something:"else"}, function(err, rel_id2, properties) {
                    if (err) {
                        cb('test_getRelationshipProperties 4: '+err);
                        return;
                    }
                    neo4j.getRelationshipProperties(rel_id, function(err, rel_id3, properties) {
                        if (err) {
                            cb('test_getRelationshipProperties 4: '+err);
                            return;
                        }
                        assert(properties !== undefined);
                        assert(properties.something !== undefined);
                        assert(properties.something === 'else');
                        neo4j.deleteRelationshipById(rel_id3, function(err, err_id) {
                            if (err) {
                                cb('test_getRelationshipProperties 5: '+err);
                                return;
                            }
                            cb();
                        });
                    });
                });
            });
        });
    });
}

function test_getSingleRelationshipProperty(cb) {
    // FIXME: create relationship
    neo4j.getSingleRelationshipProperty(1, function(err, id, relProperties) {
        if (err) {
            cb('err');
            return;
        }
        // FIXME: delete said relationship
        cb();
    });
}

function test_setSingleRelationshipProperty(cb) {
    // FIXME: create relationship
    neo4j.setSingleRelationshipProperty(1, propName, propValue, function(err) {
        if (err) {
            cb('err');
            return;
        }
        // FIXME: delete said relationship
        cb();
    });
}

function test_getAllRelationships(cb) {
    // FIXME: create relationship
    neo4j.getAllRelationships(nodeId, function(err, nodeRelationships) {
        if (err) {
            cb('err');
            return;
        }
        // FIXME: delete said relationship
        cb();
    });
}

function test_getAllIncomingRelationships(cb) {
    // FIXME: create relationship
    neo4j.getIncomingAllRelationships(nodeId, function(err, nodeRelationships) {
        if (err) {
            cb('err');
            return;
        }
        // FIXME: delete said relationship
        cb();
    });
}

function test_getAllOutgoingRelationships(cb) {
    // FIXME: create relationship
    neo4j.getAllOutgoingRelationships(nodeId, function(err, nodeRelationships) {
        if (err) {
            cb('err');
            return;
        }
        // FIXME: delete said relationship
        cb();
    });
}

function test_getTypedRelationships(cb) {
    // FIXME: create relationship
    neo4j.getTypedRelationships(relationshipNames, function(err, relationshipNames, nodeRelationships) {
        if (err) {
            cb('err');
            return;
        }
        // FIXME: delete said relationship
        cb();
    });
}


function test_getRelationshipTypes(cb) {
            cb('err');
}

function test_getSetPropertyOnNode(cb) {
            cb('err');
}

function test_updateNodeProperties(cb) {
            cb('err');
}

function test_getNodeProperties(cb) {
            cb('err');
}

function test_deleteAllNodeProperties(cb) {
            cb('err');
}

function test_deleteNamedPropertyFromNode(cb) {
            cb('err');
}

function test_updateRelationshipProperties(cb) {
            cb('err');
}

function test_updateRelationshipProperties(cb) {
            cb('err');
}

function test_removeRelationshipProperty(cb) {
            cb('err');
}



/**
 * Executes the testssequentially and handles the exit value.
 */
function do_tests() {
    async.series(
        [
            test_getServiceRoot,
            test_createNode,
            test_createNodeWithProperties,
            test_getNode,
            test_deleteNode,
            test_Relationships,
            test_getRelationshipProperties,
            test_setRelationshipProperties
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

/**
 * Create the neo4j object and run the test driver, do_tests()
 */
function main() {
    neo4j = new neo4jSimple(function(err) {
        if (err) {
            console.error('Error creating neo4jSimple: '+err);
            process.exit(1);
        }
        do_tests();
    });
}

main();     // Causes all the tests to run.
