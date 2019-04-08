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
    
    lock(slot) {
	let sl = this.db.get(['slots', slot, 'booking']).set('uid', '---').write();
    }

    lock_all() {
	this.db.get('slots')
	    .filter('booking')
	    .forEach((s) => s.booking.uid = '---')
	    .write();
    }

    get() {
	return this.db.getState();
    }

    toString() {
	return this.db.get('slots')
	    .map((s, i) =>
		 `${i}\t(${new Date(s.time).toLocaleString()}): ${s.booking?JSON.stringify(s.booking):''}`)
	    .value()
	    .join('\n');
    }
    
    set(state) {
	this.db.setState();
    }
}

