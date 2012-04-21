/**
 * @fileOverview This file defines an object, neo4jSimple that provides
 * a simple interface to the ne04j REST API as documented at: 
 * http://docs.neo4j.org/chunked/snapshot/rest-api.html
 *
 *
 * Specifically, this file defines methods relating to management of 
 * individual node, e.g.: creation deleteion, modification.
 *
 * @author <a href="mailto:edmond.meinfelder@gmail.com">Edmond Meinfelder</a>
 */

var request = require('request');
var util = require('util');
var assert = require('assert');

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
