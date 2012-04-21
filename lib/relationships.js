/**
 * @fileOverview This file defines an object, neo4jSimple that provides
 * a simple interface to the ne04j REST API as documented at: 
 * http://docs.neo4j.org/chunked/snapshot/rest-api.html
 *
 * Specifically, this file deals with methods relating to management of
 * relationships.
 *
 * @author <a href="mailto:edmond.meinfelder@gmail.com">Edmond Meinfelder</a>
 */

var request = require('request');
var util = require('util');
var assert = require('assert');

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

