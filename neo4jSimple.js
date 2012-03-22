/**
 * @fileOverview This file defines an object, neo4jSimple that provides
 * a simple interface to the ne04j REST API as documented at: 
 * http://docs.neo4j.org/chunked/snapshot/rest-api.html
 * The goal was to create a simple interface that mapped directly to the 
 * interface so anyone reading the neo4j REST API documentation would
 * intuitively understand how to use this object.
 *
 * @author <a href="mailto:edmond.meinfelder@gmail.com">Edmond Meinfelder</a>
 */
var request = require('request');
var util = require('util');
var assert = require('assert');

/**
 * Creates and sets up a new neo4jSimple object.
 * @constructor
 */
function neo4jSimple() {

    this.protocol = 'http';
    this.host = 'localhost';
    this.port = 7474;
    this.baseUri = this.protocol+'://'+this.host+((this.port)?(':'+this.port):'');
    this.serviceRoot;
}

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
    var uri = this.baseUri + '/db/data/';
    var self = this;

    request.get(uri, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        //console.log(body);
        self.serviceRoot = JSON.parse(body);
        assert.ok(typeof self.serviceRoot == 'object');
        //console.log('serviceRoot: '+util.inspect(serviceRoot));
        cb(null, body);
    });
};

/**
 * createNode simply creates a node with no properties.
 *
 * @param {Function} cb A callback where the first param is an an error 
 * and the second param is the object id and the last param is the new 
 * node.
 */
neo4jSimple.prototype.createNode = function(cb) {
    this.createNodeWithProperties({}, function(err, id, node) {
        cb(err, id, node);
    });
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
    if (typeof properties !== 'object') {
        cb('Properties needs to be an object');
        return;
    }

    var uri = this.baseUri+ '/db/data/node';
    var options = {
        uri: uri,
        Accept: 'application/json',
        json: properties
    };

    request.post(options, function(err, resp, body) {
        if (err) {
            cb(err);
            return;
        }

        if (!body) {
            console.error('No body');
            cb('no body');
        }

        assert.ok(typeof body === 'object');

        // get the node id created
        assert.ok(body.self !== undefined);
        var parts = body.self.split('/');
        assert.ok(parts && parts.length);
        var id = parts[parts.length-1];
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

    if (typeof id !== 'number') {
        cb('id needs to be a number');
        return;
    }

    if (typeof cb !== 'function') {
        cb('cb needs to be a function');
        return;
    }

    var uri = this.baseUri + '/db/data/node/'+id;

    var options = {
        uri: uri,
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

        if (!body) {
            cb('no body');
            return;
        }

        var node = JSON.parse(body);
        assert.ok(typeof node === 'object');

        // get the node id created
        assert.ok(node.self !== undefined);
        var parts = node.self.split('/');
        assert.ok(parts && parts.length);
        var newId = parts[parts.length-1];
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
neo4jSimple.prototype.deleteNode = function(id, cb) {

    if (typeof id !== 'number') {
        cb('id needs to be a number');
        return;
    }

    if (typeof cb !== 'function') {
        cb('cb needs to be a function');
        return;
    }

    var uri = this.baseUri + '/db/data/node/'+id;

    var options = {
        uri: uri,
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

    if (typeof id !== 'number') {
        cb('id needs to be a number');
        return;
    }

    if (typeof cb !== 'function') {
        cb('cb needs to be a function');
        return;
    }

    var uri = this.baseUri + '/db/data/node/relationship/'+id;

    var options = {
        uri: uri,
        Accept: 'application/json'
    };

    request.get(options, function(err, resp, body) {

        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode >= 300 || resp.statusCode < 200) {
            cb('DELETE failed with '+resp.statusCode, resp.statusCode);
            return;
        }

        console.log('body type: '+typeof body);
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
 */
neo4jSimple.prototype.createRelationship = function(srcId, destId, relationship, data) {

    if (typeof srcId !== 'number') {
        cb('srcId needs to be a number');
        return;
    }

    if (typeof destid !== 'number') {
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

    var uri = this.baseUri+'/db/data/node/'+srcId+'/relationships';

    var postBody = {
        to: baseUri+'/db/data/node/'+destId,
        type: relationship,
        data: data
    };

    var options = {
        uri: uri,
        Accept: 'application/json',
        json: postBody
    };

    request.post(options, function(err, resp, body) {

        if (err) {
            cb(err);
            return;
        }

        if (resp.statusCode >= 300 || resp.statusCode < 200) {
            cb('DELETE failed with '+resp.statusCode, resp.statusCode);
            return;
        }

        console.log('body type: '+typeof body);
        if (typeof body !== 'object') {
            cb('body is not an object');
            return;
        }

        assert.ok(body.self !== undefined);
        var parts = body.self.split('/');
        assert.ok(parts && parts.length);
        var newId = parts[parts.length-1];
        assert.ok(typeof newId == 'number');
        cb(null, id, body);
    });
};

exports.neo4jSimple = neo4jSimple;
