main = function(app,s){

	//set colors with random values
	// var color = iio.randomColor();
	var color = '#F7B051';

	var colors = ["#F38895", "#FBF528","#55AA2D", "#439AF1", "#F38895", "#DA3232", "#222E7B", "#294628", "#4F657B", "#976D35" ];
	// var inverted = iio.invertColor(color);
	var inverted = "#292F3A";
	app.set(inverted);

	//decide max number of rows/columns
	var res = 15;
	var ballLevel = 10;
	var ballCount = 0;
	var points = 0;
	var scoreboard = app.add([50,50], "'SCORE: 0' #FBF528 font Impact 40 left");
		// "'score: 0' #FBF528 font Impact 40 left", { fade: 0.02}, undefined, true);
	
	//create the grid
	var grid = app.add(app.center,
		(( app.height < app.width ) ? app.height-50 : app.width-50)
			+ ' outline 2 simple grid '+res+' '+color);
	for(var x=0; x<grid.C; x++)
		for(var y=0; y<grid.R; y++)
			grid.cells[y][x].Ball = 0;
		
	
	var neighbours = new Array(4);
	neighbours[0] = {x:1,y:0};
	neighbours[1] = {x:-1,y:0};
	neighbours[2] = {x:0,y:1};
	neighbours[3] = {x:0,y:-1};
	// neighbours[4] = {x:1,y:1};
	// neighbours[5] = {x:1,y:-1};
	// neighbours[6] = {x:-1,y:1};
	// neighbours[7] = {x:-1,y:-1};
	
	graph = new Array(res+2);
	for (var i = 0; i < res+2; i++)
		graph[i] = new Array(res+2);
	

	for (var i = 0; i < res+2; i++)
	for (var j = 0; j < res+2; j++)
		graph[i][j] = 1;
	
	for (var i = 0; i < res+2; i++){
		graph[i][0] = -2;
		graph[i][res+1] = -2;
	}
	for (var i = 0; i < res+2; i++){
		graph[0][i] = -2;
		graph[res+1][i] = -2;
	}
		
	
	var Add = function(a,b){
		return {x:a.x+b.x, y:a.y+b.y, z:0};
	};
	var Sub = function(a,b){
		return {x:a.x-b.x, y:a.y-b.y, z:0};
	};
	SetObstacle = function(cell){
		graph[cell.x+1][cell.y+1] = -2;
	};
	
	AStar = function(from, to){
		
		var visited = new Array(res+2);
		for (var i = 0; i < res+2; i++)
			visited[i] = new Array(res+2);
		

		for (var i = 0; i < res+2; i++)
		for (var j = 0; j < res+2; j++)
			visited[i][j] = -1;
		
		var queue = new PriorityQueue({ comparator: function(a, b) { return a.z - b.z; }});
		queue.queue(from);
		
		var g = function(cell){
			try {
				return visited[cell.x+1][cell.y+1];
			}
			catch(error){
				console.log(error);
				console.log((cell.x+1)+" "+(cell.y+1));
				return -2;
			}
		};
		var set_g = function(cell, x){
			visited[cell.x+1][cell.y+1] = x;
		};
		var heur = function(c){
			c = Sub(to, c);
			return Math.sqrt(c.x*c.x+c.y*c.y);
		}
		var resolvePatch = function(){
			var path = new Array(0);
			var s = to;
			var target = from;
			path.push(s);
			var count = 0;
			set_g(from, 0);
			var minval = 1000;
			while(minval!=0 && count++<200 ){
				var it;
				var n;
				minval = 100000;
				for(n of neighbours){
					var u = Add(s,n);
					var uval = g(u);
					if(uval < minval && (graph[u.x+1][u.y+1]!=-2 || uval ==0) && uval>-1){
						minval = uval;
						it = u;
					}
				}
				if(it != 'undefined'){
					// s = Add(s, it);
					s = it;
					set_g(s, -10);
					path.push(s);
				}
				else 
					return false;
			
			}
			return path;
		}
		
		
		set_g(from, 0);
		var terminate = false;
		var found = false;
		var last = from;
		var count = 0;
		var mindist = 1000;
		while(!terminate && queue.length > 0 && count++<1000 ){
			
			var top = queue.dequeue();
			
			var n;
			var topVal = g(top);
			for(n of neighbours){
				var u = Add(n,top);
				var uval = g(u);
				if(graph[u.x+1][u.y+1] != -2 && uval==-1 && uval<mindist){ //  non collide, non visited
					set_g(u, topVal+1);
					queue.queue({x:u.x, y:u.y, z:topVal+1+heur(u)});
				}  
				else if(graph[u.x+1][u.y+1] != -2 && uval>-1 && uval>topVal+1){
					set_g(u, topVal+1);
					queue.queue({x:u.x, y:u.y, z:topVal+1+heur(u)});
				}
				if(graph[u.x+1][u.y+1] == -2)
					set_g(u, -2);
				
				
				
				if(u.x==to.x && u.y==to.y && uval < mindist){
					mindist = Math.min(topVal+1, mindist);
					set_g(u, mindist);
					uval = g(u);
					found = true;
					last = u;
					// console.log("!");
				}
			} // neighbours
			
		}
		
		
		set_g(from, 0);
		// for (var i = 1; i < res+1; i++)
		// for (var j = 1; j < res+1; j++){
			// grid.cells[i-1][j-1].add( [6,0],'"'+visited[i][j]+'" font Consolas 10 center gray', {}, true);
			// grid.cells[i-1][j-1].add( [6,16],'"'+(i-1)+" "+(j-1)+'" font Consolas 8 center gray', {}, true);
		// }
			
		app.draw();
		
		var _path = resolvePatch();
		if(_path){
			var color = grid.cells[from.x][from.y].Ball;
			// var shrinking = _path.length/100.0;
			var shrinking = 0;
			for(var i=0; i<_path.length-1; i++){
				var n = _path[i]
				grid.cells[n.x][n.y].add('height/1.2: simple '+ colors[color], { shrink: 0.02+shrinking }, undefined, true);
				shrinking += 0.01;
			}
			
		}
		return {bool: found, path: _path };
	};

	onClick = function(){};

	function spawn(count){
		var spawned = 0;
		while(spawned < count && ballCount < res*res){
			var x,y;
			x = iio.randomInt(0, grid.C);
			y = iio.randomInt(0, grid.R);
			
			if(grid.cells[y][x].Ball == 0){
				var number = iio.randomInt(1, ballLevel);
				spawned++;
				ballCount++;
				graph[y+1][x+1] = -2;
				grid.cells[y][x].Ball = number;
				// grid.cells[y][x].add( [0,6],'"'+number+'" font Consolas 25 center '+colors[number-1], {}, true);
				grid.cells[y][x].add('height/1.2: simple '+ colors[number], {}, undefined, true);
			}
		}
		app.draw();
	};
	spawn(7);
	
	
	function updateScoreboard(score){
		points += score;
		scoreboard.text = "SCORE: "+points;
		app.add([250,75], "'+"+score+"' #C12424 font Impact 60 left", { fade: 0.02}, undefined, true);
		app.draw();
		
	}
	function testBalls(cell){
		var value = cell.Ball;
		var x = cell.c;
		var y = cell.r;
		
		var horizontalCount = 1;
		var verticalCount = 1;
		var inclinedCount1 = 1;
		var inclinedCount2 = 1;
		
		var testInDirection = function(x,y, d_x, d_y){
			var count = 0;
			for(var i=1; i<res; i++){
				if(x+i*d_x>=0 && x+i*d_x<res && y+i*d_y>=0 && y+i*d_y<res && grid.cells[x+i*d_x][y+i*d_y].Ball == value)
					count++;
				else
					break;
			}
			return count;
		}
		var deleteInDirection = function(x,y, d_x, d_y){
			for(var i=1; i<res; i++){
				if(x+i*d_x>=0 && x+i*d_x<res && y+i*d_y>=0 && y+i*d_y<res && grid.cells[x+i*d_x][y+i*d_y].Ball == value){
					grid.cells[x+i*d_x][y+i*d_y].Ball = 0;
					grid.cells[x+i*d_x][y+i*d_y].rmv(2);
					grid.cells[x+i*d_x][y+i*d_y].rmv(1);
					grid.cells[x+i*d_x][y+i*d_y].rmv(0);
					graph[x+i*d_x][y+i*d_y] = 1;
				}
				else
					break;
			}
			grid.cells[x][y].Ball = 0;
			grid.cells[x][y].rmv(2);
			grid.cells[x][y].rmv(1);
			grid.cells[x][y].rmv(0);
			graph[x][y] = 1;
		}
		horizontalCount += testInDirection(x,y, 1,0);
		horizontalCount += testInDirection(x,y, -1,0);
		verticalCount += testInDirection(x,y, 0,1);
		verticalCount += testInDirection(x,y, 0,-1);
		inclinedCount1 += testInDirection(x,y, 1,1);
		inclinedCount1 += testInDirection(x,y, -1,-1);
		inclinedCount2 += testInDirection(x,y, 1,-1);
		inclinedCount2 += testInDirection(x,y, -1,1);
		
		var score = 0;
		if(horizontalCount >= 5){
			score += horizontalCount;
			deleteInDirection(x,y, 1,0);
			deleteInDirection(x,y, -1,0);
			updateScoreboard(score);
			app.draw();
		}
		if(verticalCount >= 5){
			score += verticalCount;
			deleteInDirection(x,y, 0,1);
			deleteInDirection(x,y, 0,-1);
			updateScoreboard(score);
			app.draw();
		}
		if(inclinedCount1 >= 5){
			score += inclinedCount1;
			deleteInDirection(x,y, 1,1);
			deleteInDirection(x,y, -1,-1);
			updateScoreboard(score);
			app.draw();
		}
		if(inclinedCount2 >= 5){
			score += inclinedCount2;
			deleteInDirection(x,y, 1,-1);
			deleteInDirection(x,y, -1,1);
			updateScoreboard(score);
			app.draw();
		}

	}

	app.canvas.oncontextmenu=function(){ return false };

	function testCoherence(){
		for (var i = 1; i < res+1; i++)
		for (var j = 1; j < res+1; j++){
			if(grid.cells[i-1][j-1].Ball==0 && graph[i][j]==-2)
				alert(i+" :  "+j);
			if(grid.cells[i-1][j-1].Ball!=0 && graph[i][j]!=-2)
				alert(i+" "+j);
			if(grid.cells[i-1][j-1].Ball!=0 && grid.cells[i-1][j-1].objs.length==0)
				alert(i+" "+j);
			
		}
		
	};
	
	var selectedCell = 'undefined';
	grid.click = function(event,ePos,cell){
		if(event.button==0) {
			if(selectedCell != 'undefined' && cell != selectedCell && cell.Ball == 0){
				var response = AStar({x:selectedCell.c, y:selectedCell.r, z:0}, {x:cell.c, y:cell.r, z:0});
				if(response.bool == true){
					cell.Ball = selectedCell.Ball;
					// cell.add( [0,6],'"'+cell.Ball+'" font Consolas 25 center '+colors[cell.Ball-1  ], {}, true);
					cell.add('height/1.2: simple '+ colors[cell.Ball], {}, undefined, true);
					// selectedCell.rmv(2);
					selectedCell.rmv(1);
					selectedCell.rmv(0);
					selectedCell.Ball = 0;
					graph[selectedCell.c+1][selectedCell.r+1] = 1;
					graph[cell.c+1][cell.r+1] = -2;
					selectedCell = 'undefined';
					testBalls(cell);
					app.draw();
					spawn(3);
				}
				else
					alert("No way!");
			}
			else if(cell.Ball != 0){
				if(selectedCell != 'undefined')
					selectedCell.add('height/1.2: simple '+ colors[selectedCell.Ball], {}, undefined, true);
				selectedCell = 'undefined';
				selectedCell = cell;
				selectedCell.rmv(1);
				selectedCell.rmv(0);
				selectedCell.add('height/1.5: simple '+ colors[selectedCell.Ball], {}, undefined, true);
			}
		} 
	}

}; 