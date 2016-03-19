var bot = function() {
    this.pos = {
        x: 0,
        y: 0
    };
    this.vel = {
        x: 0,
        y: 0
    };
    this.color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
    this.state = 'not-connected';
    this.info_color = 'rgba(255,255,255,0.1)';
    this.name = '';

    //The world bounds we are confined to
    this.pos_limits = {
        x_min: this.size.hx,
        x_max: this.game.world.width - this.size.hx,
        y_min: this.size.hy,
        y_max: this.game.world.height - this.size.hy
    };
}
bot.prototype.Shoot = function() {
    // literal string plopped here
}

bot.prototype.Avoid_collisions = function() {
}
bot.prototype.Get_angle = function() {
    return Math.atan2(y,x);
}