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

require('./nodes.js');
require('./relationships');
require('./indicies');

exports.neo4jSimple = neo4jSimple;
