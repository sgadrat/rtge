function log(msg) {
	var o = document.getElementById("logs");
	if (o) {
		o.innerHTML += '<p>'+ msg + '</p>';
	}
}

var rtge = {
	// A graphical animation
	Animation: function() {
		this.steps = []; ///< urls of images for each step
		this.durations = []; ///< duration, in milliseconds for each steps
	},

	// An interactive object in the game
	DynObject: function() {
		this.animation = null; ///< string, name of the current animation
		this.animationPosition = 0; ///< number of milliseconds since the start of the animation
		this.x = 0; ///< horizontal position on the map
		this.y = 0; ///< vertical position on the map
		this.z = 0; ///< objects with greater z value are drown on top of others
		this.anchorX = 0; ///< horizontal position of the anchor point on the object
		this.anchorY = 0; ///< vertical position of the anchor point on the object
		this.visible = true; ///< is the object drawn and clickable
		this.tick = null; ///< function called to update the object for the next frame
		this.click = null; ///< function called when the object is left clicked
	},

	// A camera viewing the scene
	Camera: function() {
		this.x = 0; ///< horizontal position in world coordinate
		this.y = 0; ///< vertical position in world coordinated
		this.worldMouseDown = null; ///< callback for mouse down outside of interface
		this.mouseUp = null; ///< callback for mouseUp
		this.mouseMove = null; ///< callback for mouseMove
	},

	// A GUI element
	// Positions and dimension are given in Relative PiXel (rpx)
	// a rpx is the 1/1000 of the minimum pixel size between viewport's height and width
	InterfaceElement: function() {
		this.anchorTop = true; ///< is the element position relative to the top of the view ? (else it is relative to the bottom)
		this.anchorLeft = true; ///< is the element position relative to the left of the view ? (else it is relative to the right)
		this.x = 0; ///< horizontal offset, in rpx
		this.y = 0; ///< vertical offset, in rpx
		this.width = 0; ///< width of the graphical element, in rpx
		this.height = 0; ///< height of the graphical element, in rpx
		this.image = null; ///< url of the image representing the element at rest
		this.imageOver = null; ///< url of the image representing the element when mouse is over, null for no special image
		this.imageClick = null; ///< url of the image representing the element when clicking on it, null for no special image
		this.click = null; ///< function called on click, take params (x, y) in rpx from the topleft of the element
		this.state = "rest"; ///< state of the element : rest=nothing special, over=mouse is over, click=being clicked (internally handled)
	},

	init: function(canvasId, initialState, animations, graphicInterface, preloads, callbacks) {
		// Set the initial game state
		rtge.state = initialState;
		rtge.state.objects.sort(function (a,b) {return a.z-b.z});
		rtge.graphicInterface = graphicInterface;

		// Set engine initial state
		rtge.lastUpdate = Date.now();
		rtge.canvas = document.getElementById(canvasId);
		var style = getComputedStyle(rtge.canvas);
		rtge.canvas.width = style.width.slice(0, style.width.length - 2);
		rtge.canvas.height = style.height.slice(0, style.height.length - 2);
		rtge.canvasCtx = rtge.canvas.getContext("2d");
		rtge.animations = animations;

		// Create the default camera
		rtge.camera = new rtge.Camera();
		rtge.camera.moving = false;
		rtge.camera.lastCursorPosition = null;
		rtge.camera.worldMouseDown = function(pos) {
			this.lastCursorPosition = pos;
			this.moving = true;
		};
		rtge.camera.mouseUp = function(pos) {
			this.moving = false;
		};
		rtge.camera.mouseMove = function(pos) {
			if (this.moving && this.lastCursorPosition != null) {
				var diffX = pos.x - this.lastCursorPosition.x;
				var diffY = pos.y - this.lastCursorPosition.y;
				this.x -= diffX;
				this.y -= diffY;
			}
			this.lastCursorPosition = pos;
		};

		// Import callbacks
		if ("worldClick" in callbacks) {
			rtge.worldClick = callbacks.worldClick;
		}
		if ("globalTick" in callbacks) {
			rtge.globalTick = callbacks.globalTick;
		}

		// Preload images
		for (var i = 0; i < preloads.length; ++i) {
			if ( !(preloads[i] in rtge.images)) {
				rtge.images[preloads[i]] = new Image();
			}
		}
		for (var i in rtge.images) {
			rtge.images[i].addEventListener("load", rtge.waitLoad, false);
			rtge.images[i].src = i;
		}
	},

	waitLoad: function() {
		var fullyLoaded = true;
		for (var i in rtge.images) {
			if (rtge.images[i].complete) {
				rtge.images[i].removeEventListener("load", rtge.waitLoad, false);
			}else {
				fullyLoaded = false;
			}
		}

		if (fullyLoaded) {
			rtge.loaded();
		}
	},

	loaded: function() {
		// Setup event system
		rtge.canvas.addEventListener("mousedown", rtge.canvasMouseDown, false);
		rtge.canvas.addEventListener("touchstart", rtge.canvasTouchStart, false);
		rtge.canvas.addEventListener("mouseup", rtge.canvasMouseUp, false);
		rtge.canvas.addEventListener("touchend", rtge.canvasTouchEnd, false);
		rtge.canvas.addEventListener("mousemove", rtge.canvasMouseMove, false);
		rtge.canvas.addEventListener("touchmove", rtge.canvasTouchMove, false);
		window.addEventListener("resize", rtge.canvasResize, false);

		// Start engine
		rtge.run();
	},

	run: function() {
		window.requestAnimationFrame(rtge.run);
		rtge.update();
		rtge.render();
	},

	update: function() {
		var begin = Date.now();
		var timeDiff = begin - rtge.lastUpdate;
		if (rtge.globalTick != null) {
			rtge.globalTick(timeDiff);
		}
		for (var i = 0; i < rtge.state.objects.length; ++i) {
			var o = rtge.state.objects[i];
			o.animationPosition += timeDiff;
			if (o.tick != null) {
				o.tick(timeDiff);
			}
		}
		rtge.lastUpdate = begin;
	},

	render: function() {
		// Black background
		rtge.canvasCtx.fillStyle = "#000000";
		rtge.canvasCtx.fillRect(0, 0, rtge.canvas.width, rtge.canvas.height);

		// Map
		rtge.canvasCtx.drawImage(rtge.getImage(rtge.state.terrain), -rtge.camera.x, -rtge.camera.y);

		// Dynamic objects
		for (var i = 0; i < rtge.state.objects.length; ++i) {
			var o = rtge.state.objects[i];
			if (o.visible) {
				var img = rtge.getAnimationImage(o.animation, o.animationPosition);
				rtge.canvasCtx.drawImage(img, o.x - o.anchorX - rtge.camera.x, o.y - o.anchorY - rtge.camera.y);
			}
		}

		// User interface
		for (var i = 0; i < rtge.graphicInterface.length; ++i) {
			for (var j = 0; j < rtge.graphicInterface[i].length; ++j) {
				var o = rtge.graphicInterface[i][j];
				var pos = rtge.interfaceElemPosition(o);
				var img = rtge.getImage(o.image);
				if (o.imageOver != null && o.state == "over") {
					img = rtge.getImage(o.imageOver);
				}else if (o.imageClick != null && o.state == "click") {
					img = rtge.getImage(o.imageClick);
				}
				rtge.canvasCtx.drawImage(img, pos.x, pos.y, rtge.rpxToPx(o.width), rtge.rpxToPx(o.height));
			}
		}
	},

	interfaceElemPosition: function(o) {
		var res = {
			x: 0,
			y: 0
		};
		if (o.anchorLeft) {
			res.x = rtge.rpxToPx(o.x);
		}else {
			res.x = rtge.canvas.width - rtge.rpxToPx(o.x);
		}
		if (o.anchorTop) {
			res.y = rtge.rpxToPx(o.y);
		}else {
			res.y = rtge.canvas.height - rtge.rpxToPx(o.y);
		}
		return res;
	},

	rpxToPx: function(rpxVal) {
		var ref = Math.min(rtge.canvas.height, rtge.canvas.width) / 1000.;
		return Math.floor(rpxVal * ref);
	},

	pxToRpx: function(pxVal) {
		var ref = Math.min(rtge.canvas.height, rtge.canvas.width) / 1000.;
		return Math.ceil(pxVal / ref);
	},

	getCanvasPos: function(clientPos) {
		if (typeof clientPos === "undefined") {
			clientPos = {
				x: event.clientX,
				y: event.clientY
			};
		}

		var rect = rtge.canvas.getBoundingClientRect();
		return {
			x: clientPos.x - rect.left,
			y: clientPos.y - rect.top
		};
	},

	canvasPosToWorldPos: function(pos) {
		return {
			x: pos.x + rtge.camera.x,
			y: pos.y + rtge.camera.y
		};
	},

	// Return true if a dynamic object is at a world position
	objectIsAt: function(o, pos) {
		var imageX = o.x - o.anchorX;
		var imageY = o.y - o.anchorY;
		if (pos.x >= imageX && pos.y >= imageY) {
			var img = rtge.getAnimationImage(o.animation, o.animationPosition);
			if (pos.x <= imageX + img.width && pos.y <= imageY + img.height) {
				return true;
			}
		}
		return false;
	},

	// Remove a dynamic objebject from the world
	removeObject: function(o) {
		var i = rtge.state.objects.indexOf(o);
		if (i > -1) {
			rtge.state.objects.splice(i, 1);
		}
	},

	// A a dynamic object to the world
	addObject: function(o) {
		rtge.state.objects.push(o);
		rtge.state.objects.sort(function (a,b) {return a.z-b.z});
	},

	// Return true if an interface element is at canvas position
	interfaceIsAt: function(o, pos) {
		var topLeft = rtge.interfaceElemPosition(o);
		var rightBottom = {
			x: topLeft.x + rtge.rpxToPx(o.width),
			y: topLeft.y + rtge.rpxToPx(o.height)
		};

		return (pos.x >= topLeft.x && pos.x <= rightBottom.x && pos.y >= topLeft.y && pos.y <= rightBottom.y);
	},

	// Return the interface element at canvas position pos, or null if there is none
	getInterfaceElem: function(pos) {
		// Search in reverse Z order to get the one drawn on top
		for (i = rtge.graphicInterface.length - 1; i >= 0; --i) {
			for (j = 0; j < rtge.graphicInterface[i].length; ++j) {
				o = rtge.graphicInterface[i][j];
				if (rtge.interfaceIsAt(o, pos)) {
					return o;
				}
			}
		}
		return null;
	},
	
	canvasActivate: function(pos) {
		var i, j, o;

		// Check if we clicked an interface element, in reverse Z order to get the one drawn on top
		o = rtge.getInterfaceElem(pos);
		if (o != null) {
			if (o.click != null) {
				var elemPos = rtge.interfaceElemPosition(o);
				o.click(rtge.pxToRpx(pos.x - elemPos.x), rtge.pxToRpx(pos.y, elemPos.y));
			}
			return;
		}

		// Check if we clicked an object, in reverse order to get the one drawn on top
		pos = rtge.canvasPosToWorldPos(pos);
		for (i = rtge.state.objects.length - 1; i >= 0; --i) {
			o = rtge.state.objects[i];
			if (o.visible && rtge.objectIsAt(o, pos)) {
				if (o.click != null) {
					o.click();
				}
				return;
			}
		}

		// We didn't click an object, callback for clicking the world
		if (rtge.worldClick != null) {
			rtge.worldClick(pos.x, pos.y);
		}
	},
	
	canvasBeginInteraction: function(pos) {
		// Prepare to trigger a click event
		rtge.canClick = true;

		// Change state of the interface element at cursor pos
		var o = rtge.getInterfaceElem(pos);
		if (o != null) {
			o.state = "click";
			return;
		}

		// Callbacks (worldMouseDown)
		if (rtge.camera.worldMouseDown != null) {
			rtge.camera.worldMouseDown(pos);
		}
	},
	
	canvasEndInteraction: function (pos) {
		// Process click event
		if (rtge.canClick) {
			rtge.canvasActivate(pos);
			rtge.canClick = false;
		}

		// Callbacks
		if (rtge.camera.mouseUp != null) {
			rtge.camera.mouseUp(pos);
		}

		// Release clicked interface elements
		for (var i = 0; i < rtge.graphicInterface.length; ++i) {
			for (var j = 0; j < rtge.graphicInterface[i].length; ++j) {
				var o = rtge.graphicInterface[i][j];
				if (o.state == "click") {
					o.state = "rest";
					return; // Only one element can be clicked at any time
				}
			}
		}
	},
	
	canvasMoveInteraction: function(pos) {
		// Moving forbids clicking
		rtge.canClick = false;

		// Update interface elements state
		for (var i = 0; i < rtge.graphicInterface.length; ++i) {
			for (var j = 0; j < rtge.graphicInterface[i].length; ++j) {
				var o = rtge.graphicInterface[i][j];
				var isUnderCursor = rtge.interfaceIsAt(o, pos);
				if (!isUnderCursor && o.state == "over") {
					o.state = "rest";
				}else if (isUnderCursor && o.state == "rest") {
					o.state = "over";
				}
			}
		}

		// Callbacks
		if (rtge.camera.mouseMove != null) {
			rtge.camera.mouseMove(pos);
		}
	},

	canvasMouseDown: function() {
		var pos = rtge.getCanvasPos();
		rtge.canvasBeginInteraction(pos);
	},

	canvasMouseUp: function() {
		var pos = rtge.getCanvasPos();
		rtge.canvasEndInteraction(pos);
	},

	canvasMouseMove: function() {
		var pos = rtge.getCanvasPos();
		rtge.canvasMoveInteraction(pos);
	},
	
	canvasTouchStart: function(evt) {
		evt.preventDefault();
		if (rtge.currentTouch == null) {
			var touch = evt.changedTouches[0];
			rtge.currentTouch = touch.identifier;

			var pos = rtge.getCanvasPos({
				x: touch.clientX,
				y: touch.clientY
			});
			rtge.canvasBeginInteraction(pos);
		}
	},
	
	searchCurrentTouch: function(evt) {
		var touch = null;
		for (var i = 0; i < evt.changedTouches.length; ++i) {
			if (evt.changedTouches[i].identifier == rtge.currentTouch) {
				touch = evt.changedTouches[i];
				break;
			}
		}
		return touch;
	},
	
	canvasTouchEnd: function(evt) {
		evt.preventDefault();
		if (rtge.currentTouch != null) {
			var touch = rtge.searchCurrentTouch(evt);
			if (touch != null) {
				rtge.currentTouch = null;
				var pos = rtge.getCanvasPos({
					x: touch.clientX,
					y: touch.clientY
				});
				rtge.canvasEndInteraction(pos);
			}
		}
	},
	
	canvasTouchMove: function(evt) {
		evt.preventDefault();
		if (rtge.currentTouch != null) {
			var touch = rtge.searchCurrentTouch(evt);
			if (touch != null) {
				var pos = rtge.getCanvasPos({
					x: touch.clientX,
					y: touch.clientY
				});
				rtge.canvasMoveInteraction(pos);
			}
		}
	},
	
	canvasResize: function(evt) {
		var style = getComputedStyle(rtge.canvas);
		rtge.canvas.width = style.width.slice(0, style.width.length - 2);
		rtge.canvas.height = style.height.slice(0, style.height.length - 2);
	},

	getAnimationImage: function(animation, currentDuration) {
		// Get the animation object
		var anim = rtge.animations[animation];

		// Compute animation total duration
		var animationLength = 0;
		var i;
		for (i = 0; i < anim.durations.length; ++i) {
			animationLength += anim.durations[i];
		}

		// Get the url of the current image
		var url = anim.steps[0];
		var dur = currentDuration % animationLength;
		var pos = 0;
		for (i = 0; i < anim.durations.length; ++i) {
			pos += anim.durations[i];
			if (pos >= dur) {
				url = anim.steps[i];
				break;
			}
		}

		// Return the image
		return rtge.getImage(url);
	},

	getImage: function(imageUrl) {
		return rtge.images[imageUrl];
	},

	// Current game state
	state: {
		terrain: null,
		objects: [
		]
	},
	
	// Tracking of interesting touch event
	currentTouch: null,

	// Function called when the user click on the world,
	// takes two number as parameters (x and y positions)
	worldClick: null,

	// Function called before updating the state
	// takes one number as parameter (the number of milliseconds since the last tick)
	globalTick: null,

	// True when the next mouseUp event is a click
	canClick: false,

	// Camera
	camera: {
		x: 0,
		y: 0
	},

	// Images data
	images: {
		//"url": Image(),
	},

	// Animation data
	animations: {
		//"animation name": Animation(),
	},

	// Graphical User interface
	graphicInterface: [
		//[ InterfaceElement(), ... ], ...
	],
}
