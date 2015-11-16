var behaviourtree = {
	// Return codes for nodes
	SUCCESS: 0,
	FAIL: 1,
	RUNNING: 2,

	// Create a new BehaviourTree execution context
	// tree: The behaviour tree description
	initContext: function(tree) {
		var nodes = [];
		behaviourtree.parseNode(tree, nodes);
		return {
			nodes: nodes
		};
	},

	// Tick a behaviour tree
	// btContext: The context from initContext()
	// privateContext: Obscure parameter passed to leafs
	tick: function(btContext, privateContext) {
		btContext.nodes[0].tick(btContext, privateContext);
	},

	parseNode: function(rawNode, nodes) {
		var node = null;
		if (rawNode.type == 'selector') {
			node = new behaviourtree.NodeSelector();
		} else if (rawNode.type == 'sequence') {
			node = new behaviourtree.NodeSequence();
		} else if (rawNode.type == 'leaf') {
			node = new behaviourtree.NodeLeaf(rawNode.action);
		} else {
			alert('behaviourtree: Unknown node type: "'+ rawNode.type +'"');
			return null;
		}
		nodes.push(node);

		if (typeof rawNode.childs != 'undefined') {
			for (var i = 0; i < rawNode.childs.length; ++i) {
				var childIndex = nodes.length;
				var child = behaviourtree.parseNode(rawNode.childs[i], nodes);
				if (child !== null) {
					node.childrens.push(childIndex);
				}
			}
		}
		return node;
	},

	Node: function() {
		this.childrens = [];
	},

	NodeSequence: function() {
		behaviourtree.Node.call(this);
		this.lastRunningNode = 0;
		this.continueResult = behaviourtree.SUCCESS;
	},

	NodeSelector: function() {
		behaviourtree.Node.call(this);
		this.lastRunningNode = 0;
		this.continueResult = behaviourtree.FAIL;
	},
	
	NodeLeaf: function(action) {
		behaviourtree.Node.call(this);
		this.action = action;
	},

	NodeCompositePrototype: {
		tick: function(context, privateContext) {
			var currentChild = this.lastRunningNode;
			this.lastRunningNode = 0;
			while (currentChild < this.childrens.length) {
				var childNode = context.nodes[this.childrens[currentChild]];
				var childRes = childNode.tick(context, privateContext);
				if (childRes != this.continueResult) {
					if (childRes == behaviourtree.RUNNING) {
						this.lastRunningNode = currentChild;
					}
					return childRes;
				}
				++currentChild;
			}
			this.lastRunningNode = 0;
			return this.continueResult;
		}
	}
};

behaviourtree.Node.prototype = {
	tick: function(context, privateContext) {
		alert('behaviourtree: BUG ! default Node.tick implementation');
		return behaviourtree.FAIL;
	}
};

behaviourtree.NodeSequence.prototype = behaviourtree.NodeCompositePrototype;
behaviourtree.NodeSelector.prototype = behaviourtree.NodeCompositePrototype;

behaviourtree.NodeLeaf.prototype = {
	tick: function(context, privateContext) {
		return this.action(privateContext);
	}
};
