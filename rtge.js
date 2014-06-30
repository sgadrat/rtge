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
		this.anchorX = 0; ///< horizontal position of the anchor point on the object
		this.anchorY = 0; ///< vertical position of the anchor point on the object
		this.tick = null; ///< function called to update the object for the next frame
		this.click = null; ///< function called when the object is left clicked
		this.rigthClick = null; ///< function called when the object is right clicked
	},

	init: function(canvasId, initialState, animations, preloads, callbacks) {
		// Set the initial game state
		rtge.state = initialState;

		// Set engine initial state
		rtge.lastUpdate = Date.now();
		rtge.canvas = document.getElementById(canvasId);
		rtge.canvas.width = 500;
		rtge.canvas.height = 500;
		rtge.canvasCtx = rtge.canvas.getContext("2d");
		rtge.animations = animations;

		// Import callbacks
		if ("worldClick" in callbacks) {
			rtge.worldClick = callbacks.worldClick;
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
		rtge.canvas.addEventListener("mouseup", rtge.canvasMouseUp, false);
		rtge.canvas.addEventListener("mousemove", rtge.canvasMouseMove, false);

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
		// White background
		rtge.canvasCtx.fillStyle = "#FFFFFF";
		rtge.canvasCtx.fillRect(0, 0, rtge.canvas.width, rtge.canvas.height);

		// Map
		rtge.canvasCtx.drawImage(rtge.getImage(rtge.state.terrain), -rtge.camera.x, -rtge.camera.y);

		// Dynamic objects
		for (var i = 0; i < rtge.state.objects.length; ++i) {
			var o = rtge.state.objects[i];
			var img = rtge.getAnimationImage(o.animation, o.animationPosition);
			rtge.canvasCtx.drawImage(img, o.x - o.anchorX - rtge.camera.x, o.y - o.anchorY - rtge.camera.y);
		}
	},

	getCanvasPos: function() {
		var rect = rtge.canvas.getBoundingClientRect();
		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
	},

	getWorldPos: function() {
		var canvasPos = rtge.getCanvasPos();
		return {
			x: canvasPos.x + rtge.camera.x,
			y: canvasPos.y + rtge.camera.y
		};
	},

	// Return true if a dynamic object is at a world position
	objectIsAt: function(o, x, y) {
		if (x >= o.x && y >= o.y) {
			var img = rtge.getAnimationImage(o.animation, o.animationPosition);
			if (x <= o.x + img.width && y <= o.y + img.height) {
				return true;
			}
		}
		return false;
	},

	canvasMouseClick: function() {
		var pos = rtge.getWorldPos();
		var i;

		// Check if we clicked an object, in reverse order to get the one drawn on top
		for (i = rtge.state.objects.length - 1; i >= 0; --i) {
			var o = rtge.state.objects[i];
			if (rtge.objectIsAt(o, pos.x, pos.y)) {
				if (event.button == 0 && o.click != null) {
					o.click();
				}
				if (event.button == 2 && o.rightClick != null) {
					o.rightClick();
				}
				return;
			}
		}

		// We didn't click an object, callback for clicking the world
		if (event.button == 0 && rtge.worldClick != null) {
			rtge.worldClick(pos.x, pos.y);
		}
	},

	canvasMouseDown: function() {
		rtge.cameraMoving = true;
		rtge.cameraMoved = false;
	},

	canvasMouseUp: function() {
		if (! rtge.cameraMoved) {
			rtge.canvasMouseClick();
		}
		rtge.cameraMoving = false;
		rtge.cameraMoved = false;
	},

	canvasMouseMove: function() {
		var pos = rtge.getCanvasPos();
		if (rtge.cameraMoving && rtge.lastCursorPosition != null) {
			rtge.cameraMoved = true;
			var diffX = pos.x - rtge.lastCursorPosition.x;
			var diffY = pos.y - rtge.lastCursorPosition.y;
			rtge.camera.x -= diffX;
			rtge.camera.y -= diffY;
		}
		rtge.lastCursorPosition = pos;
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

	// Function called when the user click on the world,
	// takes two number as parameters (x and y positions)
	worldClick: null,

	lastCursorPosition: null, ///< Mouse tracking for canvasMouseMove event
	cameraMoving: false, ///< Is camera is autorised to move
	cameraMoved: false, ///< Tracking when the camera has moved for event handling

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
}
