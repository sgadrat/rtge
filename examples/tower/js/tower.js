var selectedObject = null;

function ConstructionSite(x, y) {
	rtge.DynObject.call(this);
	this.animation = "construction.idle";
	this.x = x;
	this.y = y;
	this.constructionBegin = null;
	this.click = function(x, y) {
		selectedObject = this;

		var barIcon = new rtge.InterfaceElement();
		barIcon.width = 100;
		barIcon.height = 100;
		barIcon.image = "imgs/toolbar.png";

		var archeryIcon = new rtge.InterfaceElement();
		archeryIcon.x = 100;
		archeryIcon.width = 100;
		archeryIcon.height = 100;
		archeryIcon.image = "imgs/bow_button_idle.png";
		archeryIcon.imageClick = "imgs/bow_button_pushed.png";
		archeryIcon.click = function (x, y) {
			selectedObject.animation = "construction.build";
			selectedObject.constructionBegin = Date.now();
			selectedObject.tick = function() {
				if (Date.now() - this.constructionBegin >= 3000) {
					rtge.removeObject(this);
					rtge.addObject(new ArcheryTower(this.x, this.y));
					selectedObject = null;
					rtge.graphicInterface = [];
				}
			}
		};

		rtge.graphicInterface = [
			[
				barIcon,
				archeryIcon
			]
		];
	}
}

function ArcheryTower(x, y) {
	rtge.DynObject.call(this);
	this.animation = "tower.archery.idle";
	this.x = x;
	this.y = y;
	this.anchorY = 198;
}

function Goblin(x, y) {
	rtge.DynObject.call(this);
	this.animation = "unit.goblin.walk.left";
	this.x = x;
	this.y = y;
	this.anchorX = 35;
	this.anchorY = 35;

	this.originX = x;
	this.originY = y;
	this.destinationX = null;
	this.destinationY = null;
	this.movingTime = 0;
}

Goblin.prototype = {
	moveTo: function(x, y) {
		this.originX = this.x;
		this.originY = this.y;
		this.destinationX = x;
		this.destinationY = y;
		this.movingTime = 0;

		this.tick = function(timeElapsed) {
			this.movingTime += timeElapsed;
			var distance = Math.sqrt(Math.pow(this.destinationX - this.originX, 2) + Math.pow(this.destinationY - this.originY, 2));
			var timeTarget = distance * 10;
			var distanceX = this.destinationX - this.originX;
			var distanceY = this.destinationY - this.originY;
			var timeRatio = Math.min(1, this.movingTime / timeTarget);
			this.x = this.originX + distanceX * timeRatio;
			this.y = this.originY + distanceY * timeRatio;
			if (this.x == this.destinationX && this.y == this.destinationY) {
				this.stopMove();
			}
		};
	},

	stopMove: function() {
		this.tick = null;
	}
};

function init() {
	var animConstructionSiteIdle = new rtge.Animation();
	animConstructionSiteIdle.steps = ["imgs/construction_site.png"];
	animConstructionSiteIdle.durations = [600];

	var animConstructionSiteBuild = new rtge.Animation();
	animConstructionSiteBuild.steps = [
		"imgs/construction_site_build0.png",
		"imgs/construction_site_build1.png",
		"imgs/construction_site_build2.png",
		"imgs/construction_site_build3.png"
	];
	animConstructionSiteBuild.durations = [250, 250, 250, 250];

	var animTowerArcheryIdle = new rtge.Animation();
	animTowerArcheryIdle.steps = ["imgs/tower_old.png"];
	animTowerArcheryIdle.durations = [600];

	var animUnitGoblinWalkLeft = new rtge.Animation();
	animUnitGoblinWalkLeft.steps = [
		"imgs/gob_walk_left_0.png",
		"imgs/gob_walk_left_1.png",
		"imgs/gob_walk_left_2.png",
		"imgs/gob_walk_left_3.png",
		"imgs/gob_walk_left_4.png",
		"imgs/gob_walk_left_5.png",
	];
	animUnitGoblinWalkLeft.durations = [100, 100, 100, 100, 100, 100];

	var gob = new Goblin(1600, 300);
	gob.moveTo(300, 300);

	var dynObjects = [
		new ConstructionSite(1216, 0),
		new ConstructionSite(1216, 384),
		new ConstructionSite(1024, 768),
		new ConstructionSite(384, 1152),
		gob
	];

	rtge.init(
		"view",
		{
			terrain: "imgs/terrain.png",
			objects: dynObjects
		},
		{
			"construction.idle": animConstructionSiteIdle,
			"construction.build": animConstructionSiteBuild,
			"tower.archery.idle": animTowerArcheryIdle,
			"unit.goblin.walk.left": animUnitGoblinWalkLeft,
		},
		[],
		[
			"imgs/terrain.png",
			"imgs/construction_site.png",
			"imgs/toolbar.png",
			"imgs/bow_button_idle.png",
			"imgs/bow_button_pushed.png",
			"imgs/construction_site_build0.png",
			"imgs/construction_site_build1.png",
			"imgs/construction_site_build2.png",
			"imgs/construction_site_build3.png",
			"imgs/tower_old.png",
			"imgs/gob_walk_left_0.png",
			"imgs/gob_walk_left_1.png",
			"imgs/gob_walk_left_2.png",
			"imgs/gob_walk_left_3.png",
			"imgs/gob_walk_left_4.png",
			"imgs/gob_walk_left_5.png",
		],
		{
			"worldClick": null
		}
	);
}
