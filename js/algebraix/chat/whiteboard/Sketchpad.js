var Sketchpad = function(container, opts){
    
    var self = this;
    var canvas = null;
    var tmpCanvas = null;
    var ctx = null;
    var tmpCtx = null;
    var painting = false;
    var coords = new Array();
    var numStrokes = 0;
    var strokeStyle = opts.sketchpad.strokeStyle;
    var lineWidth = opts.sketchpad.lineWidth;
    var lineCap = opts.sketchpad.lineCap;
    var lineJoin = opts.sketchpad.lineJoin;
    var drawAllowed = opts.sketchpad.drawAllowed;

    this.onStroke = opts.sketchpad.onStroke !== undefined ? opts.sketchpad.onStroke : function(){};
    this.onClear = opts.sketchpad.onClear !== undefined ? opts.sketchpad.onClear : function(){};
    this.onUndo = opts.sketchpad.onUndo !== undefined ? opts.sketchpad.onUndo : function(){};

    this.init = function(){

	canvas = $('<canvas/>').
	    attr('width', opts.width).
	    attr('height', opts.height).
	    css('position','absolute').
	    css('top',container.position().top).
	    css('left',container.position().left);
	container.append(canvas);
	
	tmpCanvas = $('<canvas/>').
	    attr('width', opts.width).
	    attr('height', opts.height).
	    css('position','absolute').
	    css('top',container.position().top).
	    css('left',container.position().left);
	if(drawAllowed){
	    tmpCanvas.css('cursor','crosshair');
	}
	container.append(tmpCanvas);
	
	ctx = canvas[0].getContext('2d');
	tmpCtx = tmpCanvas[0].getContext('2d');
	tmpCtx.strokeStyle = strokeStyle;
	tmpCtx.fillStyle = strokeStyle;
	tmpCtx.lineWidth = lineWidth;
	tmpCtx.lineCap = "round";//lineCap;
	//tmpCtx.lineJoin = lineJoin;
	
	if(drawAllowed){
	    tmpCanvas.mousedown(startPainting);
	    tmpCanvas.mousemove(paint);
	    tmpCanvas.mouseup(stopPainting);
	    tmpCanvas.mouseout(stopPainting);
	}
    }

    this.fixPosition = function(){
	canvas.
	    css('top',container.position().top).
	    css('left',container.position().left);
	tmpCanvas.
	    css('top',container.position().top).
	    css('left',container.position().left);
    }

    function startPainting(e){
	var x,y;
	var offset = $(this).offset();
	offset.x = Math.round(offset.left);
	offset.y = Math.round(offset.top);
	coords[numStrokes] = new Array();
	x = e.pageX - offset.x;
	y = e.pageY - offset.y;
	coords[numStrokes].push(
	    {
		x: x, 
		y:y, 
		strokeStyle: strokeStyle, 
		lineWidth: lineWidth
	    }
	);
	painting = true;
	draw();
    }
    
    function paint(e){
	var x,y;
	var offset = $(this).offset();
	offset.x = Math.round(offset.left);
	offset.y = Math.round(offset.top);
	if(painting){
	    x = e.pageX - offset.x;
	    y = e.pageY - offset.y;
	    coords[numStrokes].push({x: x, y: y});
	    draw();
	}
    }
    
    function stopPainting(){
	ctx.drawImage(tmpCanvas[0],0,0);
	tmpCtx.clearRect(0,0,tmpCanvas[0].width, tmpCanvas[0].height);
	if(coords[numStrokes]!==undefined){
	    self.onStroke(coords[numStrokes]);
	    numStrokes++;
	}
	painting = false;
    }
    
    function draw(all){
	
	if(painting){
	    
	    tmpCtx.strokeStyle = coords[numStrokes][0].strokeStyle;
	    tmpCtx.fillStyle = coords[numStrokes][0].strokeStyle;
	    tmpCtx.lineWidth = coords[numStrokes][0].lineWidth;

	    if (coords[numStrokes].length < 3) {
		var b = coords[numStrokes][0];
		tmpCtx.beginPath();
		tmpCtx.arc(b.x, b.y, tmpCtx.lineWidth / 2, 0, Math.PI * 2, !0);
		tmpCtx.fill();
		tmpCtx.closePath();
		
		return;
	    }

	    if(!all){
		tmpCtx.clearRect(0, 0, tmpCanvas[0].width, tmpCanvas[0].height);
	    }

	    tmpCtx.beginPath();
	    tmpCtx.moveTo(coords[numStrokes][0].x, coords[numStrokes][0].y);
	    
	    for (var i = 1; i < coords[numStrokes].length - 2; i++) {
		var p1 = (coords[numStrokes][i].x + coords[numStrokes][i+1].x) / 2;
		var p2 = (coords[numStrokes][i].y + coords[numStrokes][i+1].y) / 2;
		
		tmpCtx.quadraticCurveTo(coords[numStrokes][i].x, coords[numStrokes][i].y, p1, p2);
	    }

	    tmpCtx.quadraticCurveTo(
		coords[numStrokes][i].x,
		coords[numStrokes][i].y,
		coords[numStrokes][i+1].x,
		coords[numStrokes][i+1].y
	    );

	    tmpCtx.stroke();
	}
	
    }

    function drawLast(){
	painting = true;
	numStrokes--;
	draw();
	ctx.drawImage(tmpCanvas[0],0,0);
	tmpCtx.clearRect(0,0,tmpCanvas[0].width, tmpCanvas[0].height);
	painting = false;
	numStrokes++;
    }

    function reDraw(){
	var strokeCount = numStrokes;
	painting = true;
	for(numStrokes=0; numStrokes<strokeCount; numStrokes++){
	    draw(true);
	}
	ctx.drawImage(tmpCanvas[0],0,0);
	tmpCtx.clearRect(0,0,tmpCanvas[0].width, tmpCanvas[0].height);
	painting = false;
    }

    this.clear = function(){
	this.onClear();
	tmpCtx.clearRect(0,0,tmpCanvas[0].width, tmpCanvas[0].height);
	ctx.clearRect(0,0,tmpCanvas[0].width, tmpCanvas[0].height);
	coords = new Array();
	numStrokes = 0;
    }

    this.undo = function(){
	if(coords.length > 0 ){
	    this.onUndo();
	    coords.pop();
	    numStrokes--;
	    ctx.clearRect(0,0,tmpCanvas[0].width, tmpCanvas[0].height);
	    reDraw();
	}
	return coords.length;
    }

    this.toString = function() {
	return JSON.stringify(coords);
    };

    this.setStrokes = function(strokes){
	coords = strokes;
	numStrokes = strokes.length;
	reDraw();
    }

    this.addStroke = function(stroke){
	coords.push(stroke);
	numStrokes++;
	drawLast();
    }

    this.setLineWidth = function(width){
	lineWidth = width;
    }

    this.setLineColor = function(color){
	strokeStyle = color;
    }

    this.getLastStroke = function(){
	return coords[numStrokes-1];
    }
    
}
