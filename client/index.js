import { h, render, Component } from 'https://cdn.jsdelivr.net/npm/preact/dist/preact.mjs';
import DB from './db.js';

/******************************************************/
class Project extends Component {
    stopClick(e) {
	if (e.target.tagName == "A") e.stopPropagation();
    }
    
    render() {
	let glitch = this.props.data.glitch;
	let run = this.props.data.run
	    ? this.props.data.run
	    : (glitch ? `https://${glitch}.glitch.me/` : null);
	let github = this.props.data.github;
	let source = this.props.data.source;
	
	return h('div', { class: "project", onClick: this.props.onClick },
	         h('div', { class: "description" }, this.props.data.description),
	         h('div', { class: "buttons", onClick: this.stopClick.bind(this) },
	           glitch
                   ? h('a', {
                       class: "icon glitch",
                       href: `https://glitch.com/edit/#!/${glitch}`,
                       target: "_blank",
                       title: "Glitch"
                   }, "Glitch")
	           : null, 
		   
	           run ? h('a', {
                       class: "icon run",
                       href: run,
                       target: "_blank",
                       title: "Lancer"
                   }, "run")
	           : null, 
		   
	           github
                   ? h('a', {
                       class: "icon github",
                       href: `https://github.com/${github}`,
                       target: "_blank",
                       title: "GitHub"
                   }, "GitHub")
	           : null,
                   
	           source
                   ? h('a', {
                       class: "icon source",
                       href: source,
                       target: "_blank",
                       title: "Source"
                   }, "Source")
	           : null,
                   
	           this.props.closeBtn
                   ? h('a', {
                       class: "icon close",
                       onClick: this.props.closeBtn.bind(this),
                       title: "Annuler"
                   }, "close")
	           : null
                  )
                );
    }
}

/******************************************************/
class Slot extends Component {
    taken() {
	return !!this.props.booking;
    }

    editable() {
	return !this.props.booking || (this.props.booking.uid == this.props.auth);
    }

    mine() {
	return this.taken() && this.editable();
    }
    
    handleClick() {
	return this.props.onClick(this.taken(), this.editable());
    }
    
    render() {
	let classes = [
	    'slot',
	    this.props.selected && 'selected',
	    this.taken() && 'taken',
	    this.editable() && 'editable',
	].join(' ');
	let style = {
	    top: (this.props.time.getHours() - 8 + this.props.time.getMinutes() / 60) * 4 + 'em'
	};
	
	return h("div", { class: classes, style: style, onClick: this.handleClick.bind(this) },
		 h("div", { class: "time" }, Intl.DateTimeFormat('fr-FR', {
		     hour12: false,
		     hour: 'numeric',
		     minute: '2-digit'
		 }).format(this.props.time)),
		 h("div", { class: "info" }, this.props.project
		   ? h(Project, {
		       gid: this.props.booking.gid,
		       data: this.props.project, 
		       closeBtn: this.mine() ? this.props.empty : null
		   })
		   : null)
		);
    }
}


/******************************************************/
class Typeahead extends Component {
    constructor() {
        super();
	this.state =  {
	    filter: "",
	};
    }
    
    getActive() {
	return Object.keys(this.props.projects).reduce((comps, gid) => {
	    let p = this.props.projects[gid];
	    if (p.description.toLowerCase().match(this.state.filter))
		comps.push({ gid: gid, data: p });
	    return comps;
	}, []);
    }
    
    componentDidMount() {
	this.search.focus();
    }
    
    handleChange(e) {
	this.setState({
	    filter: e.target.value,
	});
    }

    handleKeys(e) {
	if (!(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
	    if (e.key == "ArrowDown" || e.key == "ArrowUp") {
	    } else if (this.props.callback && (e.key == "Enter" || e.key == "Escape")) {
		this.props.callback(e.key == "Enter" ? null : null);
	    }
	}
    }

    outClick() {
	this.props.callback && this.props.callback(null);
    }

    elementClick(gid, e) {
	this.props.callback(gid);
    }

    stopClick(e) {
	e.stopPropagation();
    }
    
    render() {
	let projects = this.getActive()
            .map((p) => h('div', { key: p.gid, class: "li" },
                          h(Project, {
                              gid: p.gid,
                              data: p.data,
		              onClick: this.elementClick.bind(this, p.gid)
                          })));
	
	return h('div', { class: "typeahead", onClick: this.outClick.bind(this) },
	         h('div', { class: "container", onClick: this.stopClick.bind(this) },
	           h('input', {
                       ref: input => this.search = input,
                       type: "text",
                       value: this.state.filter, 
	               placeholder: "search",
	               onInput: this.handleChange.bind(this),
                       onKeyDown: this.handleKeys.bind(this),
                   }),
	           projects
                  )
                );
    }
}

/******************************************************/
class Slots extends Component {
    constructor() {
        super();
	this.state = {
	    slots : [],
	    auth : null,
	    selected: null,
	    showList: document.location.hash == '#list',
	};
    }

    /*setCalendar(start, increments) {
	let slots = increments.map((i) => ({ time: new Date(start + i) }));
	console.log(slots);
	return this.props.db.update({ slots: slots });
    }*/
    
    componentDidMount() {
	this.setState(this.props.db.data);
	this.props.db.ws.addEventListener('db.newdata', (e) => {
	    console.log("got data", e.detail);
	    this.setState(this.props.db.data);
	});
	  
	window.addEventListener('hashchange', this.handleHash.bind(this));
    }
    
    select(id, taken, editable) {
	if (editable) {
	    this.setState({
		selected: null,
		showList: (gid) => {
		    if (gid !== null) {
			this.props.db.update(id, gid);
		    }
		    this.setState({ showList: false });
		}
	    });
	} else {
	    this.setState({ selected: id });
	}
    }

    empty(id) {
	this.props.db.free(id);
    }

    handleHash() {
	this.setState({ showList: document.location.hash == "#list" });
    }
    
    render() {
	let slots = this.state.slots
            .map((s, i) => h(Slot, {
                key: i,
                auth: this.state.auth,
                selected: this.state.selected === i,
		time: new Date(s.time),
                booking: s.booking,
                project: s.booking ? this.props.projects[s.booking.gid] : null,
		onClick: this.select.bind(this, i),
                empty: this.empty.bind(this, i),
	    })).sort((a, b) => a.attributes.time - b.attributes.time);

	let days = new Map();
	slots.forEach((s) => {
	    let day = Intl.DateTimeFormat('fr-FR', {
		weekday:'long',
		day: 'numeric',
		month:'long'
	    }).format(s.attributes.time);
	    (days.get(day) || days.set(day, []).get(day)).push(s);
	});

	let groups = [];
	days.forEach((slots, day) =>
	             groups.push(
                         h('div', { class: "day", key: day },
		           h('div', { class: "header" }, day),
		           h('div', { class: "slots" }, slots))));
        
	return h('div', {},
	         h('div', { class: "main" }, groups),
                 this.state.showList
                 ? h(Typeahead, {
                     projects: this.props.projects,
		     callback: this.state.showList === true ? null : this.state.showList
                 })
	         : null
                );
    }
}

/******************************************************/
async function fetchProjects() {
    // Fetch project data from server
    const res = await fetch('/projects');
    const projs = await res.json();
    
    // Enrich data
    for (let g in projs.groups)
        projs.groups[g].students = [];
    for (let s of projs.students)
        projs.groups[s.group] && projs.groups[s.group].students.push(s);
    for (let g in projs.groups) {
        projs.groups[g].description = projs.groups[g].students
            .map((s) => s.nom + ' ' + s.prenom)
            .join(', ')
            + ` (${projs.groups[g].project})`;
    }

    return projs;
}

async function startApp() {
    // Initialise component with data from server
    let slots = window.slots = h(Slots, {
        db: new DB(new WebSocket(
	    (window.location.protocol == 'https:' ? 'wss://' : 'ws://')
		+ window.location.host)),
        projects: (await fetchProjects()).groups,
    });

    // Paint in the DOM
    render(slots, document.querySelector('#component'));
}

startApp();
