var missiles = []
var bots = []

var Projectile = function() {
	this.Pos = {
		x: 0,
		y: 0
	};
	this.Vel = {
		x: 0,
		y: 0
	};
}

var Bot = function(name, fireMethod) {
	this.id = name;
	this.projectile = new Projectile();
	this.color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
	this.Fire = fireMethod;
}

function IOevent(name, fireLogic) {
	eval("fire = {" + fireLogic + "}");
	aBot = new Bot(name, fire.myFunction);
	bots.push(aBot);
}

//aBot = new Bot("Henry", "{fireLoic() {return false}}");
//bots.push(aBot);

IOevent("Bill", "myFunction() {return true}")
console.log(aBot.Fire())
//console.log(aBot.Fire())
