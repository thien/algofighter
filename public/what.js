import javax.script.*;
ScriptEngineManager factory = new ScriptEngineManager();
// create a JavaScript engine
ScriptEngine engine =clear factory.getEngineByName("JavaScript");

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

var Bot = function(name, fireLogic) {
    this.id = name;
    this.projectile = new Projectile();
    this.color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
    this.Fire = engine.eval("function(){" + fireLogic + "}");
    // this.Fire = engine.eval(fireLogic);

}
// aBot = new Bot('Bill', '1');
// // aBot = new Bot('Bill', 'return this.id');
// console.log(aBot.Fire)


try {
     // evaluate JavaScript code from String
     aBot = new Bot('Bill', 'return this.id');
     console.log(aBot.Fire)
     // System.out.println(((Invocable) engine).invokeFunction("sum", new Object[]{10,20}));
} catch (ScriptException ex) {
     Logger.getLogger(doComms.class.getName()).log(Level.SEVERE, null, ex);
}
