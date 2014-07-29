var selectedObject = null;
var gob = null;

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
	this.lastShot = null;

	this.tick = function(timeElapsed) {
		var now = Date.now();
		if ((this.lastShot == null || now - this.lastShot > 5000) && gob.hitPoints > 0) {
			var ball = new MagicBall(this.x, this.y, gob);
			rtge.addObject(ball);
			this.lastShot = now;
		}
	};
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
	this.path = [];
	this.hitPoints = 10;
}

Goblin.prototype = {
	moveTo: function(x, y) {
		this.originX = this.x;
		this.originY = this.y;
		this.destinationX = x;
		this.destinationY = y;
		this.movingTime = 0;

		var diffX = this.destinationX - this.originX;
		var diffY = this.destinationY - this.originY;
		if (Math.abs(diffX) > Math.abs(diffY)) {
			if (diffX > 0) {
				this.animation = "unit.goblin.walk.right";
			}else {
				this.animation = "unit.goblin.walk.left";
			}
		}else {
			this.animation = "unit.goblin.walk.bot";
		}
		this.animationPosition = 0;

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
				if (this.path.length == 0) {
					this.stopMove();
					rtge.removeObject(this);
				}else {
					var next = this.path[0];
					this.path.splice(0, 1);
					this.moveTo(next.x, next.y);
				}
			}
		};
	},

	followPath: function(path) {
		var first = path[0];
		path.splice(0, 1);
		this.path = path;
		this.moveTo(first.x, first.y);
	},

	stopMove: function() {
		this.tick = null;
	},

	hit: function() {
		--this.hitPoints;
		if (this.hitPoints == 0) {
			rtge.removeObject(this);
		}
	},
};

function MagicBall(x, y, target) {
	rtge.DynObject.call(this);
	this.animation = "unit.ball.fly";
	this.x = x;
	this.y = y;
	this.anchorX = 12;
	this.anchorY = 12;

	this.target = target;
	this.speed = 0.5;

	this.tick = function(timeElapsed) {
		var diffX = this.target.x - this.x;
		var diffY = this.target.y - this.y;
		var targetDistance = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
		var tripDistance = timeElapsed * this.speed;

		if (targetDistance <= tripDistance) {
			this.target.hit();
			rtge.removeObject(this);
			return;
		}

		var factor = tripDistance / targetDistance;
		this.x = this.x + diffX * factor;
		this.y = this.y + diffY * factor;
	};
}

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
	var animUnitGoblinWalkBot = new rtge.Animation();
	animUnitGoblinWalkBot.steps = [
		"imgs/gob_walk_bot_0.png",
		"imgs/gob_walk_bot_1.png",
		"imgs/gob_walk_bot_2.png",
		"imgs/gob_walk_bot_3.png",
		"imgs/gob_walk_bot_4.png",
		"imgs/gob_walk_bot_5.png",
	];
	animUnitGoblinWalkBot.durations = [100, 100, 100, 100, 100, 100];
	var animUnitGoblinWalkRight = new rtge.Animation();
	animUnitGoblinWalkRight.steps = [
		"imgs/gob_walk_right_0.png",
		"imgs/gob_walk_right_1.png",
		"imgs/gob_walk_right_2.png",
		"imgs/gob_walk_right_3.png",
		"imgs/gob_walk_right_4.png",
		"imgs/gob_walk_right_5.png",
	];
	animUnitGoblinWalkRight.durations = [100, 100, 100, 100, 100, 100];

	var animUnitBallFly = new rtge.Animation();
	animUnitBallFly.steps = [
		"imgs/ball_0.png",
		"imgs/ball_1.png",
		"imgs/ball_2.png",
		"imgs/ball_3.png",
	]
	animUnitBallFly.durations = [50, 50, 50, 50];

	var gobPath = [
		{x: 300, y: 300},
		{x: 300, y: 670},
		{x: 1300, y: 670},
		{x: 1300, y: 1050},
		{x: 300, y: 1050},
		{x: 300, y: 1450},
		{x: 1300, y: 1450},
		{x: 1300, y: 1840},
		{x: 300, y: 1840},
		{x: 300, y: 2220},
		{x: 1300, y: 2220},
		{x: 1300, y: 2600},
		{x: 300, y: 2600},
		{x: 300, y: 3000},
		{x: 1300, y: 3000},
		{x: 1300, y: 3300},
	]
	gob = new Goblin(1600, 300);
	gob.followPath(gobPath);

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
			terrain: "imgs/terrain.jpg",
			objects: dynObjects
		},
		{
			"construction.idle": animConstructionSiteIdle,
			"construction.build": animConstructionSiteBuild,
			"tower.archery.idle": animTowerArcheryIdle,
			"unit.goblin.walk.left": animUnitGoblinWalkLeft,
			"unit.goblin.walk.bot": animUnitGoblinWalkBot,
			"unit.goblin.walk.right": animUnitGoblinWalkRight,
			"unit.ball.fly": animUnitBallFly,
		},
		[],
		[
			"imgs/terrain.jpg",
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
			"imgs/gob_walk_bot_0.png",
			"imgs/gob_walk_bot_1.png",
			"imgs/gob_walk_bot_2.png",
			"imgs/gob_walk_bot_3.png",
			"imgs/gob_walk_bot_4.png",
			"imgs/gob_walk_bot_5.png",
			"imgs/gob_walk_right_0.png",
			"imgs/gob_walk_right_1.png",
			"imgs/gob_walk_right_2.png",
			"imgs/gob_walk_right_3.png",
			"imgs/gob_walk_right_4.png",
			"imgs/gob_walk_right_5.png",
			"imgs/ball_0.png",
			"imgs/ball_1.png",
			"imgs/ball_2.png",
			"imgs/ball_3.png",
		],
		{
			"worldClick": null
		}
	);
}
