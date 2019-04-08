const http = require('http');
const express = require('express');
const ws = require('ws');
const yaml = require('yamljs');
const DB = require('./db.js');
const auth = require('./auth.js');

/* Servers */

const app = express();
const server = http.createServer(app);
const wsserver = new ws.Server({ 
    server: server,
});

/* Data */
const groups = yaml.load('.data/groups.yml');
const db = new DB();

/* HTTP Server */
app.use(express.static('client'));
app.get('/projects', (req, res) => res.json(groups));

/* WebSocket server */
wsserver.on('connection', (wsconn) => {
    let uid = null;
    
    let sub = (data) => wsconn.send(JSON.stringify({
	event: 'update',
	data: data,
	uid: uid,
    }));
    db.on('update', sub);
    wsconn.on('close', () => db.off('update', sub));
    wsconn.on('error', () => db.off('update', sub));
    
    wsconn.on('message', async (data) => {
	try {
	    data = JSON.parse(data);
	} catch (e) {
	    console.error('Bad data', data);
	    return;
	}
	if (data.action == 'helo') {
	    if (data.token) {
		try {
		    uid = auth.decodeToken(data.token);
		} catch (e) {
		    wsconn.send(JSON.stringify({
			event: 'auth_error',
		    }));
		}
	    } else {
		let token = await auth.createToken();
		uid = token.id;
		wsconn.send(JSON.stringify({
		    event: 'auth',
		    token: token,
		}));
	    }
	    sub(db.get());
	} else if (data.action == 'update') {
	    try {
		db.update(data.slot, data.gid, uid);
	    } catch (e) {
		console.log('Error updating:', e);
	    }
	} else if (data.action == 'free') {
	    try {
		db.free(data.slot, uid);
	    } catch (e) {
		console.log('Error freeing:', e);
	    }
	} else {
	    console.error('Unhandled data:', data);
	}
    });
});

/* GO! */
server.listen(process.env.PORT);
