var request = require('request');
var util = require('util');
var assert = require('assert');

function neo4jSimple() {

    this.protocol = 'http';
    this.host = 'localhost';
    this.port = 7474;
    this.baseUri = this.protocol+'://'+this.host+((this.port)?(':'+this.port):'');
    this.serviceRoot;
}

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

neo4jSimple.prototype.createNode = function(cb) {
    this.createNodeWithProperties({}, function(err, id, node) {
        cb(err, id, node);
    });
};

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

// TODO write test for createRealationship

/*
getRelationshipById(1, function(err, id, relationship) {
    if (err) {
        console.error(err);
        return;
    }
    console.log('relationship: '+relationship);
});
*/

/*
deleteNode(1, function(err, id) {
    if (err) {
        console.error(err);
        return;
    }
    console.log('node '+id+' deleted.');
});
*/

/*
var neo4j = new neo4jSimple();

neo4j.getNode(3, function(err, node) {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Object retrieved: '+util.inspect(node, true, null));
});

neo4j.getNode(230000, function(err, node) {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Object retrieved: '+util.inspect(node, true, null));
});
*/

/*
createNodeWithProperties({wife:'Wilma', friend: 'Barney'}, function(err, id) {
    if (err) {
        console.error(err);
        return;
    }

    console.log('Object created with id: '+id);
});
*/

exports.neo4jSimple = neo4jSimple;
