main = function(app,s){

	//set colors with random values
	// var color = iio.randomColor();
	var color = 'gray';
	var colors = ["red","green", "blue", "yellow", "gray", "black", "aqua", "fuchsia", "lime", "navy" ];
	var inverted = iio.invertColor(color);
	app.set(inverted);

	//decide max number of rows/columns
	var res = 10;
	var ballLevel = 9;
	var ballCount = 0;
	var points = 0;
	
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
		// if(found){
			// for(var n of _path)
				// grid.cells[n.x][n.y].add( [0,0],'"." font Consolas 20 center red', {}, true);
			
		// }
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
				grid.cells[y][x].add( [0,6],'"'+number+'" font Consolas 25 center '+colors[number], {}, true);
			}
		}
		app.draw();
	};
	spawn(7);
	
	function testBalls(cell){
		var value = cell.Ball;
		var x = cell.c;
		var y = cell.r;
		
		var horizontalCount = 0;
		var verticalCount = 0;
		var inclinedCount1 = 0;
		var inclinedCount2 = 0;
		
		for(var i=0; i<res; i++){
			if(x+i<res && grid.cells[x+i][y].Ball == value)
				horizontalCount++;
			if(x-i>=0 && grid.cells[x-i][y].Ball == value)
				horizontalCount++;
			
			if(y+i<res && grid.cells[x][y+i].Ball == value)
				verticalCount++;
			if(y-i>=0 && grid.cells[x][y-i].Ball == value)
				verticalCount++;
			
			if(y+i<res && x-i>=0 && grid.cells[x-i][y+i].Ball == value)
				inclinedCount1++;
			if(y-i>=0 && x+i<res && grid.cells[x+i][y-i].Ball == value)
				inclinedCount1++;
			
			if(y+i<res && x+i<res && grid.cells[x+i][y+i].Ball == value)
				inclinedCount2++;
			if(y-i>=0 && x-i>=0 && grid.cells[x-i][y-i].Ball == value)
				inclinedCount2++;
		}
		if(horizontalCount >= 5)
			points += horizontalCount;
		if(verticalCount >= 5)
			points += verticalCount;
		if(inclinedCount1 >= 5)
			points += inclinedCount1;
		if(inclinedCount2 >= 5)
			points += inclinedCount2;

		console.log(points);
			
		if(horizontalCount >= 5){
			for(var i=0; i<res; i++){
				if(x+i<res && grid.cells[x+i][y].Ball == value){
					grid.cells[x+i][y].Ball = 0;
					grid.cells[x+i][y].rmv(0);
					graph[x+1+i][y+1] = 0;
				}
				if(x-i>=0 && grid.cells[x-i][y].Ball == value){
					grid.cells[x-i][y].Ball = 0;
					grid.cells[x-i][y].rmv(0);
					graph[x+1-i][y+1] = 0;
				}
			}
		}
		if(verticalCount >= 5){
			for(var i=0; i<res; i++){
				if(y+i<res && grid.cells[x][y+i].Ball == value){
					grid.cells[x][y+i].Ball = 0;
					grid.cells[x][y+i].rmv(0);
					graph[x+1][y+1+i] = 0;
				}
				if(y-i>=0 && grid.cells[x][y-i].Ball == value){
					grid.cells[x][y-i].Ball = 0;
					grid.cells[x][y-i].rmv(0);
					graph[x+1][y+1-i] = 0;
				}
			}
		}
		if(inclinedCount1 >= 5){
			for(var i=0; i<res; i++){
				if(y+i<res && x-i>=0 && grid.cells[x-i][y+i].Ball == value){
					grid.cells[x-i][y+i].Ball = 0;
					grid.cells[x-i][y+i].rmv(0);
					graph[x+1-i][y+1+i] = 0;
				}
				if(y-i>=0 && x+i<res && grid.cells[x+i][y-i].Ball == value){
					grid.cells[x+i][y-i].Ball = 0;
					grid.cells[x+i][y-i].rmv(0);
					graph[x+1+i][y+1-i] = 0;
				}
			}
		}
		if(inclinedCount2 >= 5){
			for(var i=0; i<res; i++){
				if(y+i<res && x+i<res && grid.cells[x+i][y+i].Ball == value){
					grid.cells[x+i][y+i].Ball = 0;
					grid.cells[x+i][y+i].rmv(0);
					graph[x+1+i][y+1+i] = 0;
				}
				if(y-i>=0 && x-i>=0 && grid.cells[x-i][y-i].Ball == value){
					grid.cells[x-i][y-i].Ball = 0;
					grid.cells[x-i][y-i].rmv(0);
					graph[x+1-i][y+1-i] = 0;
				}
			}
		}
		
		
		
		
		
	}
	app.draw();

	app.canvas.oncontextmenu=function(){ return false };

	var selectedCell = 'undefined';
	grid.click = function(event,ePos,cell){
		if(event.button==0) {
			if(selectedCell != 'undefined' && cell != selectedCell && cell.Ball == 0){
				cell.Ball = selectedCell.Ball;
				cell.add( [0,6],'"'+cell.Ball+'" font Consolas 25 center '+colors[cell.Ball], {}, true);
				if(AStar({x:selectedCell.c, y:selectedCell.r, z:0}, {x:cell.c, y:cell.r, z:0}).bool){
					selectedCell.rmv(0);
					selectedCell.Ball = 0;
					graph[selectedCell.c+1][selectedCell.r+1] = 0;
					graph[cell.c+1][cell.r+1] = -2;
					selectedCell = 'undefined';
					testBalls(cell);
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