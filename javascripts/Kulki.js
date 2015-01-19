
var fps = 60;

setBackground = function(){
	io.setBGColor('#0d0d0f');
	var starImgs = [];
	var starCount = 2;
	var starDensity = io.canvas.width/30;
	var baseVel = 5;
	for(var i=0; i<starCount; i++)
		starImgs[i] = new Image();
		
	
	moveToTop = function(obj){
		obj.setPos(iio.getRandomInt(10, io.canvas.width-10)
									,iio.getRandomInt(-340, -100));
		return true;
	}
	starImgs[0].src = imgPath+'StarSM1.png'
	starImgs[1].src = imgPath+'StarSM2.png'
	
	for(var i=0; i<starCount; i++){
	(function(n){
		starImgs[n].onload = function(){
			var zIndex, vel;
			
			switch(n){
				case 0: zIndex = -20;vel = baseVel;break;
				case 1: zIndex = -15;vel = baseVel*1.1;break;
			}
			
			
			for(var j=0; j<starDensity; j++){
				io.addToGroup('stars', new iio.SimpleRect(iio.getRandomInt(10, io.canvas.width-10),iio.getRandomInt(0, io.canvas.height)), zIndex)
					.createWithImage(starImgs[n])
					.enableKinematics()
					.setVel(0,vel*iio.getRandomNum(0.95, 1.05))
					.setBound('bottom',io.canvas.height+140, moveToTop);
					console.log('new Star '+n)
			}
		}
		
		})(i)
	}
	
	
}


var loadImages = function(obj, callback){
	var len = obj.length;
	var loaded = 0;
	// console.log(typeof callback);
	for(var i=0; i<len; i++){
		// console.log('loading '+obj[i].name);
		obj[i].image = new Image();
		obj[i].image.onload = function(){
			if(++loaded >= len-1){
				loaded=-2;
				// alert('loaded');
				callback();
			}
				
		}
		obj[i].image.src = imgPath+obj[i].name+'.png';
		};
}

var MainGame = function(){

	var rampage = 0;
	io.addGroup('lasers');
	io.addGroup('rockets');
	io.addGroup('elasers');
	io.addGroup('player');
	io.addGroup('enemy');
	io.addGroup('bonus');
	io.addGroup('explosion');
	setBackground();
	player = io.addToGroup('player', new Player(io.canvas.center.x, io.canvas.height-100, 'Dez'));
	player.switchWeapon(1);

 	window.addEventListener('keydown', function(event){
		player.updateInput(event, true);

		// check for pause
		if(iio.keyCodeIs('pause', event) || iio.keyCodeIs('p', event))
					io.pauseFramerate();
	});
	window.addEventListener('keyup', function(event){
		player.updateInput(event, false);
	});
	
	// bonusText = null;
	
	io.setCollisionCallback('lasers', 'enemy', function(laser, enemy){
		player.getPoints(14);
		enemy.hp -= laser.dmg;
		
		io.addToGroup('flashes'
		,new iio.SimpleRect((laser.pos.x+enemy.pos.x)/2
							 ,(laser.pos.y+enemy.pos.y)/2),10)
				.createWithImage(laserFlashImg)
				.enableKinematics()
				.setVel(enemy.vel.x, enemy.vel.y)
				.shrink(.1);
		
		io.rmvFromGroup(laser, 'lasers');
		if (enemy.hp < 0){
			dropBonus(enemy.pos.x, enemy.pos.y);
			spawnExplosion(enemy.pos.x, enemy.pos.y);
			rampage+=5;
			io.addToGroup('limitedLifetime', new iio.SimpleRect(enemy.pos))
				.enableKinematics()
				.setBound('bottom', io.canvas.height+120)
				// .createWithImage(scrapImage)
				.createWithAnim(scrapAnim.getSprite(0,5),'scrap',0)
				.playAnim('scrap', 10, io)
				.setLifetime(60/10*6)
				.setVel(0, enemy.vel.y);
			
			io.rmvFromGroup(enemy, 'enemy');
		}
	});
	io.setCollisionCallback('explosion', 'enemy', function(explosion, enemy){
		player.getPoints(enemy.hp);
		// enemy.hp -= explosion.dmg;
		enemy.hp -= 66;
		
		if (enemy.hp < 0){
			dropBonus(enemy.pos.x, enemy.pos.y);
			spawnExplosion(enemy.pos.x, enemy.pos.y);
			rampage+=5;
			io.addToGroup('limitedLifetime', new iio.SimpleRect(enemy.pos))
				.enableKinematics()
				.setBound('bottom', io.canvas.height+120)
				.createWithAnim(scrapAnim.getSprite(0,5),'scrap',0)
				.playAnim('scrap', 10, io)
				.setLifetime(60/10*6)
				.setVel(0, enemy.vel.y);
			
			io.rmvFromGroup(enemy, 'enemy');
		}
	});
	io.setCollisionCallback('player', 'enemy', function(player_, enemy){
		enemy.hp -= 100;
		player_.getHit(50);
		// if (enemy.hp < 0){
			spawnExplosion(enemy.pos.x, enemy.pos.y);
			rampage+=5;
			io.addToGroup('limitedLifetime', new iio.SimpleRect(enemy.pos))
				.enableKinematics()
				.setBound('bottom', io.canvas.height+120)
				.createWithAnim(scrapAnim.getSprite(0,5),'scrap',0)
				.playAnim('scrap', 10, io)
				.setLifetime(60/10*6)
				.setVel(0, enemy.vel.y);
			io.rmvFromGroup(enemy, 'enemy');
		// }
		// if (player_.hp < 0){
			// delete player.owner.handle;
			// delete player.owner;
				// io.rmvFromGroup(player, 'player');
		// }
	});
	io.setCollisionCallback('player', 'bonus', function(player_, bonus){
		bonuses[bonus.id].useBonus(player_);
		statementQueue.push(bonuses[bonus.id].text);
		io.rmvFromGroup(bonus, 'bonus');
	});
	io.setCollisionCallback('player', 'elasers', function(player_, elaser){
			
			player_.getHit(elaser.dmg);
			io.rmvFromGroup(elaser, 'elasers');
	});
	
	rampageText = io.addToGroup('GUI', new iio.Text('•Rampage•',io.canvas.width/2,15)
						.setFont('18px Impact')
						.setTextAlign('center')
						.setFillStyle('white'));
	var e1 = 0;
	var e2 = 5;
	var t1 = 0;
	var release = 0;
	
	statementQueue.push('Protect');
	statementQueue.push('Your');
	statementQueue.push('Homeland');
	statementQueue.push('Prepare');
	statementQueue.push('Prepare');
	statementQueue.push('ACHTUNG');
	//-----------------
	io.setFramerate(60, function(){
		if(quit)
			io.cancelFramerate();
			
		statement();
		
		if(rampage >= 100){
			statementQueue.push('✠RAMPAGE✠');
			rampageText.setText('Rampage');
			rampage = 0;
		}
		else{
			var tmp = Math.round(rampage/10);
			var str = '';
			for(var i=0; i<tmp; i++)
				str += '•';
			rampage = Math.max(0, rampage - 0.05);
			rampageText.setText(str);
		}
		
		t1++;
		
		if(t1 > release){
			t1 = 0;
			release = iio.getRandomInt(30,50);
			var x = iio.getRandomInt(30,io.canvas.width-30);
			var y = iio.getRandomInt(-50,-100);
				var tmp_en = io.addToGroup('enemy', new Enemy(x,y,iio.getRandomInt(0,enemyStats.length)))
			}
	});

}

function main(IO){
	io = IO;
	// io.activateDebugger();
	
	var scrapImage = new Image();
	var image90 = new Image();
	laserFlashImg = new Image();
	
	scrapImage.onload = function(){
		scrapAnim = new iio.SpriteMap(scrapImage,140,140);
	
		image90.onload = function(){
		
			explosionAnim = new iio.SpriteMap(image90,100,100);
			laserFlashImg.onload = function(){
				
				
				loadImages(enemyStats,
					loadImages(enemyProjectiles,
						loadImages(projectiles,
						loadImages(rockets,
							loadImages(bonuses, function(){MainGame()})))));
			}
			laserFlashImg.src = imgPath+'laserRedShot.png';
		}
		image90.src = imgPath+'explosion.png';
	}
	scrapImage.src = imgPath+'enemyScrap.png';
	
	
		
	
}


