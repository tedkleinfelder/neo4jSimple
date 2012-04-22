/**
 * @fileOverview This file defines an object, neo4jSimple that provides
 * a simple interface to the ne04j REST API as documented at: 
 * http://docs.neo4j.org/chunked/snapshot/rest-api.html
 * The goal was to create a simple interface that mapped closely to the 
 * interface so anyone reading the neo4j REST API documentation would
 * intuitively understand how to use this object.
 *
 * @author <a href="mailto:edmond.meinfelder@gmail.com">Edmond Meinfelder</a>
 */
var request = require('request');
var util = require('util');
var assert = require('assert');

exports.neo4jSimple = neo4jSimple;

/**
 * Creates and sets up a new neo4jSimple object.
 * @constructor
 */
function neo4jSimple(cb) {

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    this.protocol = 'http';
    this.host = 'localhost';
    this.port = 7474;
    this.baseUri = this.protocol+'://'+this.host+((this.port)?(':'+this.port):'');
    this.serviceRoot;
    var self = this;

    this.getServiceRoot(function(err, obj) {
        if (err) {
            cb(err);
            return;
        }

        assert.ok(self.serviceRoot !== undefined);
        assert.ok(self.serviceRoot.node);
        assert.ok(typeof self.serviceRoot.node === 'string');
        assert.ok(self.serviceRoot.node.length > 0);

        cb();
    });
}

////////////////////////////////////////////////////////////////////////////////
// Misc util functions
////////////////////////////////////////////////////////////////////////////////

/**
 * getServiceRoot contains the basic starting points for the databse, and 
 * some version and extension information. The reference_node entry will 
 * only be present if there is a reference node set and exists in the 
 * database.
 *
 * @param {Function} cb A callback where the first param is an an error 
 * and the second param is the service object.
 */
neo4jSimple.prototype.getServiceRoot = function(cb) {

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    if (this.serviceRoot !== undefined) {
       cb(null, this.serviceRoot);
       return;
    }

    var uri = this.baseUri + '/db/data/';
    var self = this;    // this won't mean anything in the request cb

    request.get(uri, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        self.serviceRoot = JSON.parse(body);
        assert.ok(self.serviceRoot !== undefined);
        assert.ok(typeof self.serviceRoot === 'object');
        assert.ok(self.serviceRoot.node !== undefined);
        assert.ok(typeof self.serviceRoot.node === 'string');
        assert.ok(self.serviceRoot.node.length > 0);
        self.serviceRoot.relationship = self.serviceRoot.relationship_types.replace(/\/types$/, '');
        assert.ok(self.serviceRoot.relationship !== undefined);
        assert.ok(typeof self.serviceRoot.relationship === 'string');
        cb(null, self.serviceRoot);
    });
};

////////////////////////////////////////////////////////////////////////////////
// Node management
////////////////////////////////////////////////////////////////////////////////

/**
 * createNode simply creates a node with no properties.
 *
 * @param {Function} cb A callback where the first param is an an error 
 * and the second param is the object id and the last param is the new 
 * node.
 */
neo4jSimple.prototype.createNode = function(cb) {

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }
    this.createNodeWithProperties({}, function(err, id, node) {
        cb(err, id, node);
    });
};

/**
 * getIdFromNode parses the id from a node object.
 * @param {object} node A node object
 * @return {number} id of the node
 */
neo4jSimple.prototype.getIdFromNode = function(node) {
    assert.ok(typeof node === 'object');
    assert.ok(node.self !== undefined);
    assert.ok(typeof node.self === 'string');
    var id = this.getIdFromUri(node.self);
    assert.ok(id !== undefined);
    assert.ok(typeof id === 'number');
    assert.ok(id >= 0);
    return id;
};

/**
 * getIdFromUrl returns the node id from a URI
 * @param {string} uri A fancy name for a URL
 * @return {number} The id of the node
 */
neo4jSimple.prototype.getIdFromUri = function(uri) {
    assert.ok(uri !== undefined);
    assert.ok(typeof uri === 'string');
    assert.ok(uri.length > 1);

    var parts = uri.split('/');   // split the URL into parts by te '/'
    assert.ok(parts && parts.length);   // ensure we got something

    var id = parts[parts.length-1];
    assert.ok(id !== undefined);
    id = parseInt(id);
    assert.ok(id !== undefined);
    assert.ok(typeof id === 'number');
    assert.ok(id >= 0);
    return id;
};

/**
 * creatNodeWithProperties creates a node with properties.
 *
 * @param {Object} properties An object containing keys with values that
 * will become properties on the new node.
 *
 * @param {Function} cb A callback where the first param is an an error 
 * and the second param is the object id and the last param is the new 
 * node.
 */
neo4jSimple.prototype.createNodeWithProperties = function(properties, cb) {

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    if (typeof properties !== 'object') {
        cb('Properties needs to be an object');
        return;
    }

    assert.ok(this.serviceRoot);
    assert.ok(this.serviceRoot.node);
    var self = this;

    var options = {
        uri: this.serviceRoot.node,
        Accept: 'application/json',
        json: properties
    };

    request.post(options, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        if (!body) {
            cb('no body');
            return;
        }

        assert.ok(typeof body === 'object');
        var id = self.getIdFromNode(body);
        cb(null, id, body);
    });
};

/**
 * Given an id number, will return the corresponding node.
 *
 * @param {Number} id An id number of the node you want to get.
 *
 * @param {Function} cb A callback where the first param is an an error 
 * and the second param is the object id and the last param is the node.
 */
neo4jSimple.prototype.getNode = function(id, cb) {

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    if (typeof id !== 'number') {
        cb('id needs to be a number');
        return;
    }

    if (typeof cb !== 'function') {
        cb('cb needs to be a function');
        return;
    }

    var options = {
        uri: this.serviceRoot.node+'/'+id,
        Accept: 'application/json'
    };

    var self = this;

    request.get(options, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode >= 300 || resp.statusCode < 200) {
            cb('GET failed with '+resp.statusCode, resp.statusCode);
            return;
        }

        if (!body) {
            cb('no body');
            return;
        }

        var node = JSON.parse(body);
        assert.ok(typeof node === 'object');
        var newId = self.getIdFromNode(node);
        assert.ok(newId == id);
        cb(null, id, node);
    });
};

/**
 * Deletes the node that corresponds to the id number.
 *
 * @param {Number} id
 *
 * @param {Function} cb A callback where the first param is an an error 
 * and the second param is the object id of the node deleted.
 */
neo4jSimple.prototype.deleteNodeById = function(id, cb) {

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    if (typeof id !== 'number') {
        cb('id needs to be a number');
        return;
    }

    if (typeof cb !== 'function') {
        cb('cb needs to be a function');
        return;
    }

    var options = {
        uri: this.serviceRoot.node+'/'+id,
        Accept: 'application/json'
    };

    request.del(options, function(err, resp, body) {

        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode >= 300 || resp.statusCode < 200) {
            cb('DELETE failed with '+resp.statusCode, resp.statusCode);
            return;
        }

        assert.ok(resp.statusCode == 204);
        cb(null, id);
    });
};

////////////////////////////////////////////////////////////////////////////////
// Relationship management
////////////////////////////////////////////////////////////////////////////////

/**
 * Will retrieve a relationship between two nodes by the reltaionship's
 * id.
 *
 * @param {Number} id The id of the relation you want to get.
 *
 * @param {Function} cb A callback where the first param is an an error 
 * and the second param is the relationship id and the third param
 * is the relationship.
 */
neo4jSimple.prototype.getRelationshipById = function(id, cb) {

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }


    if (typeof id !== 'number') {
        cb('id needs to be a number');
        return;
    }

    if (typeof cb !== 'function') {
        cb('cb needs to be a function');
        return;
    }

    var options = {
        uri: this.serviceRoot.relationship+'/'+id,
        Accept: 'application/json'
    };

    request.get(options, function(err, resp, body) {

        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode >= 300 || resp.statusCode < 200) {
            cb('GET failed with '+resp.statusCode, resp.statusCode);
            return;
        }

        var relationship = JSON.parse(body);
        assert.ok(typeof relationship == 'object');
        cb(null, id, relationship);
    });
};

/**
 * Creates a relationship between two nodes and optionally add properties.
 *
 * @param {Number} srcId The source object, from where the relationship originates.
 * @param {Number} destid The destinationship object where the relationship terminates.
 * @param {String} relationship The name of the relationship.
 * @param {Object} data An object whose key/values will become properties on the relationship.
 * @param {Function} cb A callback, which has the following args: 
 *      {number} id of of relationship
 *      {object} the relationship object
 */
neo4jSimple.prototype.createRelationship = function(srcId, destId, relationship, data, cb) {

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }


    if (typeof srcId !== 'number') {
        cb('srcId needs to be a number');
        return;
    }

    if (typeof destId !== 'number') {
        cb('destId needs to be a number');
        return;
    }

    if (typeof relationship !== 'string' || !relationship.length) {
        cb('relationship needs to be a non-empty string');
        return;
    }

    if (typeof cb !== 'function') {
        cb('cb needs to be a function');
        return;
    }

    var postBody = {
        to: this.serviceRoot.node+'/'+destId,
        type: relationship,
        data: data
    };

    var options = {
        uri: this.serviceRoot.node+'/'+srcId+'/relationships',
        Accept: 'application/json',
        json: postBody
    };

    var self = this;

    request.post(options, function(err, resp, body) {

        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode >= 300 || resp.statusCode < 200) {
            cb('DELETE failed with '+resp.statusCode, resp.statusCode);
            return;
        }

        if (typeof body !== 'object') {
            cb('body is not an object');
            return;
        }

        var id = self.getIdFromNode(body);
        cb(null, id, body);
    });
};

/**
 * getDirRelationshipsForNode gets either the incoming or outgoing relationships
 * for a node, specified by an id.
 * @param {number} id The id of the node.
 * @param {string} dir The direction of the relationship, must be either:
 *      'in' or 'out'.
 * @param {function} cb A callback with the following arguments:
 *     {string} An error paramenter, undefined if no error
 *     {object} An object with the relationship data.
 *
 */
neo4jSimple.prototype.getDirRelationshipsForNode = function(id, dir, cb) {

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    if (typeof dir !== 'string' && (dir !== 'out' || dir !== 'in')) {
        cb('dir must be a string that is either "in" or "out".');
        return;
    }

    if (typeof id !== 'number') {
        cb('srcId needs to be a number');
        return;
    }

    if ( !this.serviceRoot || !this.serviceRoot.node) {
        cb('There is no service root!');
        return;
    }

    var options = {
        uri: this.serviceRoot.node+'/'+id+'/relationships/'+dir,
        Accept: 'application/json'
    };

    request.get(options, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode !== 200) {
            cb('GET failed with '+resp.statusCode, resp.statusCode);
            return;
        }

        if (typeof body !== 'object')
            body = JSON.parse(body);

        if (typeof body !== 'object') {
            cb('body is not an object', []);
            return;
        }

        cb(null, body);
    });   
};

/**
 * getOutgoingRelationshipsForNode gets all the outgoing relationships for a node.
 * @param {number} id Id of the node to get the relationships.
 * @param {function} cb A callback with the following arguments:
 *     {string} An error paramenter, undefined if no error
 *     {object} An object with the relationship data.
 */
neo4jSimple.prototype.getOutgoingRelationshipsForNode = function(id, cb) {
    this.getDirRelationshipsForNode(id, 'out', cb);
};

/**
 * getIncomingRelationshipsForNode gets all the outgoing relationships for a node.
 * @param {number} id Id of the node to get the relationships.
 * @param {function} cb A callback with the following arguments:
 *     {string} An error paramenter, undefined if no error
 *     {object} An object with the relationship data.
 */
neo4jSimple.prototype.getIncomingRelationshipsForNode = function(id, cb) {
    this.getDirRelationshipsForNode(id, 'in', cb);
};

/**
 * deleteRelationshipById will given the relationship id, delete that
 * relationship.
 * @param {number} id The id of the relationship.
 * @param {function} cb A callback with the following parameters:
 *      {string} An error string, if undefined, there was no error.
 *      {id} Defined if successful has the id of the node deleted.
 */
neo4jSimple.prototype.deleteRelationshipById = function(id, cb) {

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    if (typeof id !== 'number') {
        cb('id id must be a number');
        return;
    }

    if (id < 0) {
        cb('Valid ids are positive non-zero integers.');
        return;
    }

    var options = {
        uri: this.serviceRoot.relationship+'/'+id,
        Accept: 'application/json',
    };

    request.del(options, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode !== 204) {
            cb('DELETE failed with '+resp.statusCode, resp.statusCode);
            return;
        }
        cb(null, id);
    });
};

/**
 * getRelationshipProperties will, given the id of a relationship,
 * return its properties, if any.
 * @param {number} id The id of the relationship.
 * @param {function} cb A callback with the following parameters:
 *      {string} An error string, if underfined there was no error.
 *      {number} The id of the relationship
 *      {object} An object with the properties.
 */
neo4jSimple.prototype.getRelationshipProperties = function(id, cb) {

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    if (typeof id !== 'number') {
        cb('id id must be a number');
        return;
    }

    if (id < 0) {
        cb('Valid ids are positive non-zero integers.');
        return;
    }

    var options = {
        uri: this.serviceRoot.relationship+'/'+id+'/properties',
        Accept: 'application/json',
    };

    request.get(options, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode !== 200) {
            cb('GET failed with '+resp.statusCode, resp.statusCode);
            return;
        }
        
        var properties = JSON.parse(body);
        assert.ok(properties !== undefined);

        if (typeof properties !== 'object') {
            cb('Body returned is not an object.');
            return;
        }

        cb(null, id, properties);
    });
};

/**
 * setRelationshipProperties sets properties on a relationship.
 * @param {number} id The id of the relationship.
 * @param {object} properties A object with properties to set.
 * @param {function} cb A callback object with the following parameters:
 *      {string} An error string, if undefined, there was no error.
 *      {number} The id of the relationship object.
 *      {properties} The properties you set.
 */
neo4jSimple.prototype.setRelationshipProperties = function(id, properties, cb) {

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    if (typeof id !== 'number') {
        cb('id id must be a number');
        return;
    }

    if (id < 0) {
        cb('Valid ids are positive non-zero integers.');
        return;
    }

    if (typeof properties !== 'object') {
        cb('Properties needs to be an object.');
        return;
    }

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    var options = {
        uri: this.serviceRoot.relationship+'/'+id+'/properties',
        Accept: 'application/json',
        json: properties
    };

    request.put(options, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode !== 204) {
            cb('PUT failed with '+resp.statusCode, resp.statusCode);
            return;
        }
        
        cb(null, id, properties);
    });
};

/**
 * getRelationshipTypes will retrieve the various relationship types
 * that exist.
 * @param {function} cb A callback with the following parameters:
 *      {string} An error parameter, if undefined, there was no error.
 *      {object} An object with the list of relationship types.
 */
neo4jSimple.prototype.getRelationshipTypes = function(cb) {

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    var options = {
        uri: this.serviceRoot.relationship+'/types',
        Accept: 'application/json'
    };

    request.get(options, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode !== 200) {
            cb('Get failed with '+resp.statusCode, resp.statusCode);
            return;
        }

        body = JSON.parse(body);
        if (typeof body !== 'object') {
            cb('body is not a JSON object');
            return;
        }
        
        cb(null, body);
    });
};

/**
 * deleteRelationshipProperty will, by relationship id and property name, remove a
 * property from a relationship.
 * @param {number} relationshipId The id of the relationship.
 * @param {string} propertyName The name of the property.
 * @param {function} cb A callback with the following parameters:
 *      {string} An error pameter, if undefined, there was no error.
 *      {number} The id of the relationship.
 *      {string} The property name.
 */
neo4jSimple.prototype.deleteRelationshipProperty = function(relationshipId, propertyName, cb) {

    if (typeof relationshipId !== 'number') {
        cb('relationshipId must be a number');
        return;
    }

    if (typeof propertyName !== 'string') {
        cb('propertyName must be a string');
        return;
    }

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    var options = {
        uri: this.serviceRoot.relationship+'/'+id+'/properties/'+propertyName,
        Accept: 'application/json'
    };

    request.del(options, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode !== 204) {
            cb('Delete failed with '+resp.statusCode, resp.statusCode);
            return;
        }

        cb(null, relationshipName, propertyName);
    });
};

////////////////////////////////////////////////////////////////////////////////
// Index management
////////////////////////////////////////////////////////////////////////////////

/**
 * createNodeIndex will, given a name and a configuration object create a node index.
 * (imagine that).
 * @param {string} indexName The name of the of index to create.
 * @param {object} config A configuration object for for the index.
 * @param {function} cb A callback with the following parameters:
 *      {string} The index name.
 *      {object} The configuration object
 *      {obejct} An object describing the index.
 */
neo4jSimple.prototype.createNodeIndex = function(indexName, config, cb) {

    if (typeof indexName !== 'string') {
        cb('indexName must be a string');
        return;
    }

    if (typeof config !== 'object') {
        cb('config must be an object');
        return;
    }

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }
    var body = {
        name: indexName,
        config: config
    };

    var options = {
        uri: this.serviceRoot.node_index,
        Accept: 'application/json',
        json: body
    };

    request.post(options, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode !== 201) {
            cb('Post failed with '+resp.statusCode, resp.statusCode);
            return;
        }

        if (typeof body !== 'object') {
            cb('Body was not a JSON object');
            return;
        }

        cb(null, indexName, config, body);
    });
};

/**
 * deleteNodeIndex will delete an index given the name of the index.
 * @param {string} indexName The name of the index.
 * @param {function} cb The callback with the following parameters:
 *      {string} An error string, if undefined, there was no error.
 *      {string} The index name deleted.
 */
neo4jSimple.prototype.deleteNodeIndex = function(indexName, cb) {

    if (typeof indexName !== 'string') {
        cb('indexName must be a string');
        return;
    }

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    var options = {
        uri: this.serviceRoot.node_index+'/'+indexName,
        Accept: 'application/json'
    };

    request.del(options, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode !== 204) {
            cb('Delete failed with '+resp.statusCode, resp.statusCode);
            return;
        }

        cb(null, indexName);
    });
};

/**
 * Get a listing of all the node indicies.
 * @param {function} cb The callback with the following parameters:
 *      {string} An error parameter, if undefined there was no error.
 *      {object} An object containing all the node indicies.
 */
neo4jSimple.prototype.listNodeIndexes = function(cb) {

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    var options = {
        uri: this.serviceRoot.node_index,
        Accept: 'application/json'
    };

    request.get(options, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode !== 200) {
            cb('Get failed with '+resp.statusCode, resp.statusCode);
            return;
        }

        if (typeof body !== 'object') {
            cb('Body was not a JSON object');
            return;
        }

        cb(null, body);
    });
};

/**
 * Adds a node to an index, given an index name, nodeId and a key/value pair.
 * @param {string} indexName The name of the index.
 * @param {number} nodeid The id of the node.
 * @param {string} key The name of the key.
 * @param value Can be any kind of value.
 * @param {function} cb The callback with the following parameters:
 *      {number} id of ? 
 *      {object} of ?
 */
neo4jSimple.prototype.addNodeToIndex = function(indexName, nodeId, key, value, cb) {

    if (typeof indexName !== 'string') {
        cb('indexName must be a string');
        return;
    }

    if (typeof nodeId !== 'number') {
        cb('nodeId must be a number');
        return;
    }

    if (typeof key !== 'string') {
        cb('key must be a string');
        return;
    }

    if (value === undefined) {
        cb('value must not be undefined');
        return;
    }

    if (typeof cb !== 'function') {
        cb('callback must be a function');
        return;
    }

    var config = {
        value: value,
        uri: this.serviceRoot.node+'/'+nodeId,
        key: key
    };

    var options = {
        uri: this.serviceRoot.node_index+'/favorites',
        Accept: 'application/json',
        json: config
    };

    var self = this;

    request.post(options, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode !== 201) {
            cb('addNodeToIndex: Post failed with '+resp.statusCode, resp.statusCode);
            return;
        }

        if (typeof body !== 'object') {
            cb('Body was not a JSON object');
            return;
        }

        assert.ok(body.indexed !== undefined);
        assert.ok(typeof body.indexed === 'string');
        var id = self.getIdFromUri(body.indexed);
        assert.ok(typeof id === 'number');

        cb(null, id, body);
    });
};

/**
 * removeIndexEntriesWithNodeId will remove all references of a node id from an index.
 * @param {string} indexName The name of the index.
 * @param {number} nodeId the id of the node to be removed.
 * @param {function} cb The callback with the following parameters:
 *      {string} An error parameter, if undefined there was no error.
 *
 */
neo4jSimple.prototype.removeIndexEntriesWithNodeId = function(indexName, nodeId, cb) {
    this.removeIndexEntriesWithNodeIdAndKeyValue(indexName, nodeId, null, null, function(err, nodeId) {
        cb(err, nodeId);
    });
};

/**
 * Will remove all references of a node id from an index associated with a key.
 * @param {string} indexName The name of the index.
 * @param {number} nodeId the id of the node to be removed.
 * @param {string} keyName The name of the key.
 * @param {function} cb The callback with the following parameters:
 *      {string} An error parameter, if undefined there was no error.
 */
neo4jSimple.prototype.removeIndexEntriesWithNodeIdAndKey = function(indexName, nodeId, keyName, cb) {
    this.removeIndexEntriesWithNodeIdAndKeyValue(indexName, nodeId, keyName, null, function(err, nodeId) {
        cb(err, nodeId, keyName);
    });
};

/**
 * Will remove all references of a node id from an index associated with a key/value pair.
 * @param {string} indexName The name of the index.
 * @param {number} nodeId the id of the node to be removed.
 * @param {string} key The name of the key.
 * @param value The value associated with the key.
 * @param {function} cb The callback with the following parameters:
 *      {string} An error parameter, if undefined there was no error.
 */
neo4jSimple.prototype.removeIndexEntriesWithNodeIdAndKeyValue = function(indexName, nodeId, keyName, value, cb) {

    if (typeof indexName !== 'string') {
        cb('indexName must be a string');
        return;
    }

    if (typeof nodeid !== 'number') {
        cb('nodeId must be a number');
        return;
    }

    if (typeof keyName !== 'string') {
        cb('keyName must be a string');
        return;
    }

    if (typeof value !== undefined) {
        cb('value must be defined');
        return;
    }

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    var uri = this.serviceRoot.node_index+'/'+indexName;
    uri += (keyName !== undefined) ? ('/'+keyName) : '';
    uri += (value !== undefined) ? ('/'+value) : '';
    uri += ('/'+nodeId);

    var options = {
        uri: uri,
        Accept: 'application/json'
    };

    request.del(options, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode !== 204) {
            cb('Delete failed with '+resp.statusCode, resp.statusCode);
            return;
        }

        cb(null, indexName, nodeId, keyName, value);
    });
};

/**
 * findNodeByExactMatch will find a node in an index using a key and value which must match
 * the entry in the index.
 * @param {string} indexName The name of the index.
 * @param {sting} keyName The name of the key.
 * @param value The value associated with the key.
 * @param {function} The callback with the following parameters:
 *      {string} An error parameter, if undefined, there was no error.
 *      {string} The name of the index.
 *      {string|object|number} value associated with the key.
 *      {object} The node found.
 */
neo4jSimple.prototype.findNodeByExactMatch = function(indexName, keyName, value, cb) {

    if (typeof indexName !== 'string') {
        cb('indexName must be a string');
        return;
    }

    if (typeof keyName !== 'string') {
        cb('keyName must be a string');
        return;
    }

    if (typeof value !== undefined) {
        cb('value must be defined');
        return;
    }

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    // FIXME: ALL URIs have to be escaped
    var options = {
        uri: this.serviceRoot.node_index+'/'+indexName+'/'+keyName+'/'+value,
        Accept: 'application/json'
    };

    request.get(options, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode !== 200) {
            cb('Get failed with '+resp.statusCode, resp.statusCode);
            return;
        }

        var id = self.getIdFromUri(body.indexed);
        cb(null, indexName, keyName, value, id, body);
    });
};

/**
 * findNodeByQuery will locate a node in an index by a query.
 * @param {string} indexNameThe name of the index.
 * @param {string} queryString The query for the node
 * @param {function} cb The callback function with thefollowing parameters:
 *      {string} An error parameter, if undefined there was no error.
 *      {string} indexNameThe name of the index.
 *      {string} queryString The query for the node
 */
neo4jSimple.prototype.findNodeByQuery = function(indexName, queryStr, cb) {

    if (typeof indexName !== 'string') {
        cb('indexName must be a string');
        return;
    }

    if (typeof queryStr !== 'string') {
        cb('queryStr must be a string');
        return;
    }

    if (typeof cb !== 'function') {
        cb('Callback must be a function');
        return;
    }

    queryStr = escape(queryStr);

    var options = {
        uri: this.serviceRoot.node_index+'/'+indexName+'?'+queryStr,
        Accept: 'application/json'
    };
    var self = this;

    request.get(options, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        if (typeof body !== 'object') {
            cb('body returned is not a JSON object');
            return;
        }

        if (resp.statusCode !== 200) {
            cb('Get failed with '+resp.statusCode, resp.statusCode);
            return;
        }

        var id = self.getIdFromNode(body);
        assert.ok(typeof id === 'number');
        assert.ok(id >= 0);
        cb(null, indexName, nodeId, queryStr, id, body);
    });
};

////////////////////////////////////////////////////////////////////////////////
// EOF
////////////////////////////////////////////////////////////////////////////////
