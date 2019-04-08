const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const EventEmitter = require('events');

module.exports = class DB extends EventEmitter {
    constructor(name='.data/db.json') {
	super();
	this.adapter = new FileSync(name);
	this.db = low(this.adapter);
	this.db.defaults({ slots: [] }).write();
    }

    update(slot, gid, uid=null) {
	let sl = this.db.get(['slots', slot]);
	if (sl.value() &&
	    (!sl.has('booking').value()
	     || sl.get('booking.uid').value() === uid)) {
	    sl.set('booking', { uid, gid }).write();
	    this.emit('update', this.db.getState());
	} else {
	    throw Error('Invalid slot: ' + slot);
	}
    }

    free(slot, uid=null) {
	let sl = this.db.get(['slots', slot]);
	if (sl.value()
	    && sl.has('booking').value()
	    && sl.get('booking.uid').value() === uid) {
	    sl.unset('booking').write();
	    this.emit('update', this.db.getState());
	} else {
	    throw Error('Invalid slot: ' + slot);
	}
    }

    get() {
	return this.db.getState();
    }

    set(state) {
	this.db.setState();
    }
}

