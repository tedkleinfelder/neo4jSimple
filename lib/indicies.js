/**
 * @fileOverview This file defines an object, neo4jSimple that provides
 * a simple interface to the ne04j REST API as documented at: 
 * http://docs.neo4j.org/chunked/snapshot/rest-api.html
 *
 * Specifically, this file defines methods related to the use of
 * neo4j indicies.
 *
 * @author <a href="mailto:edmond.meinfelder@gmail.com">Edmond Meinfelder</a>
 */

var request = require('request');
var util = require('util');
var assert = require('assert');

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

neo4jSimple.prototype.removeIndexEntriesWithNodeId = function(indexName, nodeId, cb) {
    this.removeIndexEntriesWithNodeIdAndKeyValue(indexName, nodeId, null, null, function(err, nodeId) {
        cb(err, nodeId);
    });
};

neo4jSimple.prototype.removeIndexEntriesWithNodeIdAndKey = function(indexName, nodeId, keyName, cb) {
    this.removeIndexEntriesWithNodeIdAndKeyValue(indexName, nodeId, keyName, null, function(err, nodeId) {
        cb(err, nodeId, keyName);
    });
};

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
