main = function(app,s){

	//set colors with random values
	// var color = iio.randomColor();
	var color = 'gray';
	var inverted = iio.invertColor(color);
	app.set(inverted);

	//decide max number of rows/columns
	var res = 10;
	var ballLevel = 9;
	var ballCount = 0;

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
			return visited[cell.x+1][cell.y+1];
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
			while(from.x!=to.x || from.y!=to.y){
				var it;
				var n;
				var minval = 100000;
				for(n of neighbours){
					var u = Add(s,n);
					var uval = g(u);
					console.log(uval);
					if(uval < minval && graph[u.x+1][u.y+1]!=-2 && uval>-1){
						minval = uval;
						it = u;
						
					}
				}
				if(it.x){
					s = Add(s, it);
					set_g(s, 10000);
					path.push(s);
				}
				else 
					break;
				
				
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
					console.log("!");
				}
			} // neighbours
			
		}
		if(found){
			var _path = resolvePatch();
			for(var n of _path)
				grid.cells[n.y][n.x].add( [-6,0],'"." font Consolas 20 center white', {}, true);
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
				graph[x+1][y+1] = -2;
				grid.cells[y][x].Ball = number;
				grid.cells[y][x].add( [0,6],'"'+number+'" font Consolas 20 center white', {}, true);
			}
		}
		app.draw();
	};
	spawn(15);
	
	
	app.draw();

	app.canvas.oncontextmenu=function(){ return false };

	var selectedCell = 'undefined';
	grid.click = function(event,ePos,cell){
		if(event.button==0) {
			if(selectedCell != 'undefined' && cell != selectedCell && cell.Ball == 0){
				cell.Ball = selectedCell.Ball;
				cell.add( [0,6],'"'+cell.Ball+'" font Consolas 20 center white', {}, true);
				if(AStar({x:selectedCell.c, y:selectedCell.r, z:0}, {x:cell.c, y:cell.r, z:0}).bool){
					selectedCell.rmv(0);
					selectedCell.Ball = 0;
					graph[selectedCell.c+1][selectedCell.r+1] = 0;
					graph[cell.c+1][cell.r+1] = -2;
					selectedCell = 'undefined';
					app.draw();
					spawn(3);
				}
			}
			else if(cell.Ball != 0){
				selectedCell = cell;
			}
		} 

	}

}; 