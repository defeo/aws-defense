export default class {
    constructor(ws) {
	this.ws = ws;
	this.data = null;
	this.ws.addEventListener('open', this.auth.bind(this));
	this.ws.addEventListener('message', (e) => {
	    let data = JSON.parse(e.data);
	    if (data.event == 'update') {
		this.data = data.data;
		this.data.auth = data.uid;
		this.ws.dispatchEvent(new CustomEvent('db.newdata', { detail: data }));
	    } else if (data.event == 'auth') {
		localStorage.token = data.token.token;
	    } else if (data.event == 'auth_error') {
		localStorage.removeItem('token');
		console.error('Authentication error');
	    } else {
		console.error('Unknown message', data);
	    }
	});
    }

    auth() {
	this.ws.send(JSON.stringify({
	    action: 'helo',
	    token: localStorage.token,
	}));
    }

    update(slot, gid) {
	this.ws.send(JSON.stringify({
	    action: 'update',
	    slot,
	    gid,
	}));
    }

    free(slot) {
	this.ws.send(JSON.stringify({
	    action: 'free',
	    slot,
	}));
    }
}
