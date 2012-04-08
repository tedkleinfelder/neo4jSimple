/**
 * @fileoverview A set of tests for the neo4jSimple object. When you execute this script,
 * the tests will all execute and, if there are no errors, the process exits with 0,
 * the exit value is 1 otherwise.
 *
 * @author <a href="mailto:edmond.meinfelder@gmail.com">Edmond Meinfelder</a>
 */
var neo4jSimple = require('../lib/neo4jSimple.js').neo4jSimple;
var async = require('async');
var assert = require('assert');
var util = require('util');
var neo4j;

var nodeHashName = {};
var nodeHashId = {};
var relationsList = [];
var IndexName = 'TestIndex';

var create_nodes = [
    { name: "a" },
    { name: "b" },
    { name: "c" },
    { name: "d" },
    { name: "e" },
    { name: "f" },
];

function testCreateNodes(cb) {
    createNode("a", {}, function(err, id, name) {
        if (err) { cb(err); return; }
        createNode("b", {}, function(err, id, name) {
            if (err) { cb(err); return; }
            createNode("c", {}, function(err, id, name) {
                if (err) { cb(err); return; }
                createNode("d", {}, function(err, id, name) {
                    if (err) { cb(err); return; }
                    createNode("e", {}, function(err, id, name) {
                        if (err) { cb(err); return; }
                        createNode("f", {}, function(err, id, name) {
                            if (err) { cb(err); return; }
                            cb();
                        });
                    });
                });
            });
        });
    });
}

function createNode(name, properties, cb) {
    if (typeof properties !== 'object') {
        cb('properties must be an object');
        return;
    }

    if (typeof name !== 'string' || name.length === 0) {
        cb('name must be a non-zero length string.');
        return;
    }

    properties.name = name;

    neo4j.createNodeWithProperties(properties, function(err, id) {
        if (err) {
            cb('createNode 1: '+err);
            return;
        }

        // verify id, get node with that id & verify properties
        neo4j.getNode(id, function(err, id2, node) {
            if (err) {
                cb('createNode 2: '+err);
                return;
            }
            assert.ok(typeof id2 === 'number');
            assert.ok(id === id2);
            assert.ok(typeof node === 'object');
            assert.ok(typeof node.data === 'object');
            assert.ok(node.data.name === name);

            nodeHashName[name] = id;
            nodeHashId[id] = name;

            cb(null, id, name);
        });
    });
}

function testCreateRelationships(cb) {
    createRelationship("edge", nodeHashName['a'], nodeHashName['b'], {from:'a',to:'b'}, function(err, rel_id, rel) {
        if (err) {
            cb('createRelationship: '+err);
            return;
        }
        createRelationship("edge", nodeHashName['a'], nodeHashName['c'], {from:'a',to:'c'}, function(err, rel_id, rel) {
            if (err) {
                cb('createRelationship: '+err);
                return;
            }
            createRelationship("edge", nodeHashName['c'], nodeHashName['d'], {from:'c',to:'d'}, function(err, rel_id, rel) {
                if (err) {
                    cb('createRelationship: '+err);
                    return;
                }
                createRelationship("edge", nodeHashName['c'], nodeHashName['e'], {from:'c',to:'e'}, function(err, rel_id, rel) {
                    if (err) {
                        cb('createRelationship: '+err);
                        return;
                    }
                    createRelationship("edge", nodeHashName['e'], nodeHashName['f'], {from:'e',to:'f'}, function(err, rel_id, rel) {
                        if (err) {
                            cb('createRelationship: '+err);
                            return;
                        }
                        cb();
                    });
                });
            });
        });
    });
}

function createRelationship(name, srcNodeId, dstNodeId, properties, cb) {
    neo4j.createRelationship(srcNodeId, dstNodeId, name, properties, function(err, rel_id, relationship) {
        if (err) {
            cb('test_getRelationshipById 3: '+err);
            return;
        }
        relationsList.push(rel_id);
        cb(null, rel_id, relationship);
    });
}

function testDeleteNodes(cb) {
    deleteNode(nodeHashName.a, function(err, id) {
        if (err) { cd(err); return; }
        deleteNode(nodeHashName.b, function(err, id) {
            if (err) { cd(err); return; }
            deleteNode(nodeHashName.c, function(err, id) {
                if (err) { cd(err); return; }
                deleteNode(nodeHashName.d, function(err, id) {
                    if (err) { cd(err); return; }
                    deleteNode(nodeHashName.e, function(err, id) {
                        if (err) { cd(err); return; }
                        deleteNode(nodeHashName.f, function(err, id) {
                            if (err) { cd(err); return; }
                            cb();
                        });
                    });
                });
            });
        });
    });
}

function testDeleteRelationships(cb) {
    neo4j.deleteRelationshipById(relationsList[0], function(err, id) {
        if (err) {
            cb(err);
            return;
        }
        neo4j.deleteRelationshipById(relationsList[1], function(err, id) {
            if (err) {
                cb(err);
                return;
            }
            neo4j.deleteRelationshipById(relationsList[2], function(err, id) {
                if (err) {
                    cb(err);
                    return;
                }
                neo4j.deleteRelationshipById(relationsList[3], function(err, id) {
                if (err) {
                        cb(err);
                        return;
                    }
                    neo4j.deleteRelationshipById(relationsList[4], function(err, id) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        cb();
                    });
                });
            });
        });
    });
}

function deleteNode(id, cb) {
    if (typeof id === 'string')
        id = nodeHashName[id];
    if (typeof id !== 'number') {
        cb('id must be a valid name or number');
        return;
    }

    // delete the node
    neo4j.deleteNodeById(id, function(err, id2) {
        if (err) {
            cb('deleteNode: '+err);
            retrn;
        }
        assert.ok(typeof id2 === 'number');
        assert.ok(id === id2);

        var name = nodeHashId[id];
        delete nodeHashId[id];
        delete nodeHashName[name];

        cb(null, id);
        return;
    });
}

function getNode(id, cb) {
    if (typeof id === 'string')
        id = nodeHashName[id];
    if (typeof id !== 'number') {
        cb('id must be a valid name or number');
        return;
    }

    neo4j.getNode(id, function(err, id2, node) {       // get the node!
        if (err) {
            cb('getNode: '+err);
            return;
        }
        cb(null, id2, node);
        return;
    });
}

function verifyNodesExist(cb) {
    getNode('a', function(err, id, node) {
         if (err) {
             cb(err);
             return;
         }
        getNode('b', function(err, id, node) {
            if (err) {
                cb(err);
                return;
            }
            getNode('c', function(err, id, node) {
                if (err) {
                    cb(err);
                    return;
                }
                getNode('d', function(err, id, node) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    getNode('e', function(err, id, node) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        getNode('f', function(err, id, node) {
                            if (err) {
                                cb(err);
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

function verifyRelationships(cb) {
    neo4j.getRelationshipById(relationsList[0], function(err, rel_id2, relationship) {
        if (err) {
            cb('verifyRelationships error: '+err);
            return;
        }
        neo4j.getRelationshipById(relationsList[1], function(err, rel_id2, relationship) {
            if (err) {
                cb('verifyRelationships error: '+err);
                return;
            }
            neo4j.getRelationshipById(relationsList[2], function(err, rel_id2, relationship) {
                if (err) {
                    cb('verifyRelationships error: '+err);
                    return;
                }
                neo4j.getRelationshipById(relationsList[3], function(err, rel_id2, relationship) {
                    if (err) {
                        cb('verifyRelationships error: '+err);
                        return;
                    }
                    neo4j.getRelationshipById(relationsList[4], function(err, rel_id2, relationship) {
                        if (err) {
                            cb('verifyRelationships error: '+err);
                            return;
                        }
                        cb();
                    });
                });
            });
        });
    });
}

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

function test_getRelationshipTypes(cb) {
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
                neo4j.createRelationship(id1, id2, 'test2', {key2:"value2"}, function(err, rel_id, relationship) {
                    if (err) {
                        cb('test_getRelationshipProperties 4: '+err);
                        return;
                    }
                    neo4j.getRelationshipTypes(function(err, types) {
                        if (err) {
                            cb('test_getRelationshipProperties 4: '+err);
                            return;
                        }
                        assert(types !== undefined);
                        assert(typeof types === 'object');
                        assert(types.length >= 2);
                        neo4j.deleteRelationshipById(rel_id, function(err, err_id) {
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

function testCreateNodeIndex(cb) {
    neo4j.createNodeIndex(IndexName, {}, function(err, name, config, body) {
        if (err) {
            //cb('testCreateNodeIndex err: '+err);
            cb();
            return;
        }
        //console.log('Index: '+name+' - '+util.inspect(body));
        cb();
    });
}

function testDeleteNodeIndex(cb) {
    neo4j.deleteNodeIndex(IndexName, function(err) {
        if ('testCreateNodeIndex err 2: '+err) {
            cb(err);
            return;
        }
        cb();
    });
}

function testAddNodesToIndex(cb) {

    neo4j.addNodeToIndex(IndexName, nodeHashName['a'], 'node', 'a', function(err, id, result) {
        if (err) {
            cb('testAddNodesToIndex: '+err);
            return;
        }
        cb();
    });
}








////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/**
 * Executes the testssequentially and handles the exit value.
 */
function do_tests() {
    async.series(
        [
            test_getServiceRoot,
            testCreateNodes,
            testCreateRelationships,
            verifyNodesExist,
            verifyRelationships,
            testCreateNodeIndex,
            testAddNodesToIndex,
            testDeleteNodeIndex,
            testDeleteRelationships,
            testDeleteNodes,
            //createNode(name, properties);
            // create relationship a->b // store rel ids in hash "a:b"
            // create relationship a->c
            // create relationship c->d
            // create relationship c->e
            // create relationship e->f
            // create index
            // add all nodes to index
            // query test for a node
            // delete all relationships
            // delete all nodes
            // done!
            //test_createNode,
            //test_createNodeWithProperties,
            //test_getNode,
            //test_deleteNode,
            //test_Relationships,
            //test_getRelationshipProperties,
            //test_setRelationshipProperties,
            //test_getRelationshipTypes
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
