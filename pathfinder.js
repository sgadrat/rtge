var pathfinder = {
	Maze: function() {
		this.waypoints = [];
	},

	Waypoint: function(x, y) {
		this.neighbors = [];
		this.x = x;
		this.y = y;
	},

	PriorityQueue: function() {
		this.elements = [];
		this.priorities = [];
	},
};

pathfinder.Maze.prototype = {
	findPath: function(origin, destination) {
		var openWp = new pathfinder.PriorityQueue();
		var closedWp = {};
		var precedence = {};

		var fVal = this.h(origin, destination)
		openWp.push({g: 0, h: fVal, wp: origin});
		var e = null;
		while (! openWp.empty()) {
			// Close the next most promising node
			e = openWp.pop();
			closedWp[e.wp.x+','+e.wp.y] = true;

			// Check if goal is reached
			if (e.wp == destination) {
				break;
			}

			// Open e neighbors
			for (var i = 0; i < e.wp.neighbors.length; ++i) {
				var newWp = e.wp.neighbors[i].wp;
				var newGVal = e.g + e.wp.neighbors[i].distance;
				var newHVal = this.h(newWp, destination);

				// Check if the new waypoint is not closed
				var openIt = !(newWp.x+','+newWp.y in closedWp);

				if (openIt) {
					if (openWp.has(newWp)) {
						// If the new waypoint is already open, reprioritize it
						if (openWp.get(newWp).g > newGVal) {
							openWp.reprioritize({g: newGVal, h: newHVal, wp: newWp});
							precedence[newWp.x+','+newWp.y] = e.wp;
						}
					}else {
						openWp.push({g: newGVal, h: newHVal, wp: newWp});
						precedence[newWp.x+','+newWp.y] = e.wp;
					}
				}
			}
		}

		// Construct the path
		var path = [];
		var wp = e.wp;
		while (wp.x+','+wp.y in precedence) {
			path.splice(0, 0, wp);
			wp = precedence[wp.x+','+wp.y];
		}
		path.splice(0, 0, wp);
		return path;
	},

	h: function(origin, destination) {
		var width = Math.abs(origin.x - destination.x);
		var height = Math.abs(origin.y - destination.y);
		return Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
	},
};

pathfinder.Waypoint.prototype = {
	addNeighbor: function(waypoint, distance) {
		if (typeof distance === 'undefined') {
			distance = Math.sqrt(Math.pow(Math.abs(this.x - waypoint.x), 2) + Math.pow(Math.abs(this.y - waypoint.y), 2));
		}
		var i = this.neighbors.indexOf(waypoint);
		if (i == -1) {
			this.neighbors.push({wp: waypoint, distance: distance});
		}
	},
};

pathfinder.PriorityQueue.prototype = {
	empty: function() {
		return this.elements.length == 0;
	},

	push: function(element) {
		priority = element.g + element.h;

		// Find the index to insert element in (TODO optimizable since priorities is sorted)
		var i;
		for (i = 0; i < this.priorities.length; ++i) {
			if (this.priorities[i] >= priority) {
				break;
			}
		}
	
		// Insert the element
		if (this.priorities[i] == priority) {
			this.elements[i].push(element);
		}else {
			this.priorities.splice(i, 0, priority);
			this.elements.splice(i, 0, [element]);
		}
	},

	pop: function() {
		var e = this.elements[0][0];

		this.elements[0].splice(0, 1);
		if (this.elements[0].length == 0) {
			this.elements.splice(0, 1);
			this.priorities.splice(0, 1);
		}

		return e;
	},

	has: function(wp) {
		for (var i = 0; i < this.elements.length; ++i) {
			for (var j = 0; j < this.elements[i].length; ++j) {
				if (this.elements[i][j].wp == wp) {
					return true;
				}
			}
		}
		return false;
	},

	get: function(wp) {
		for (var i = 0; i < this.elements.length; ++i) {
			for (var j = 0; j < this.elements[i].length; ++j) {
				if (this.elements[i][j].wp == wp) {
					return this.elements[i][j];
				}
			}
		}
		return false;
	},

	reprioritize: function(element) {
		for (var i = 0; i < this.elements.length; ++i) {
			for (var j = 0; j < this.elements[j].length; ++j) {
				if (this.elements[i][j].wp == element.wp) {
					this._removeElement(i, j);
					this.push(element);
					return;
				}
			}
		}
	},

	_removeElement: function(i, j) {
		this.elements[i].splice(j, 1);
		if (this.elements[i].length == 0) {
			this.elements.splice(i, 1);
			this.priorities.splice(i, 1);
		}
	},
};
