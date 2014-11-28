var canvas = document.getElementById('canvas'),
	cxt = canvas.getContext('2d');
	
var	strokeStyleSelect = document.getElementById('strokeStyleSelect'),
	fillStyleSelect = document.getElementById('fillStyleSelect'),
	drawRadio = document.getElementById('drawRadio'),
	eraserRadio = document.getElementById('eraserRadio'),
	eraserShapeSelect = document.getElementById('eraserShapeSelect'),
	eraserWidthSelect = document.getElementById('eraserWidthSelect'),
	
	ERASER_LINE_WIDTH = 3,
	ERASER_SHADOW_COLOR = 'rgb(0,0,0)',
	
	ERASER_SHADOW_STYLE = 'white',
	ERASER_STROKE_STYLE = 'rgb(255,255,255)',
	//ERASER_FILL_STYLE = 'rgbA(255,255,255,0.5)',
	ERASER_SHADOW_OFFSET = 20,
	ERASER_SHADOW_BLUR = 1,
	
	GRID_HORIZONTAL_SPACING = 10,
	GRID_VERTICAL_SPACING = 10,
	GRID_LINE_COLOR = 'lightblue',
	drawingSurfaceImageData,
	
	lastX,
	lastY,
	mousedown = {},
	rubberbandRect = {},
	dragging = false,
	guidewirse = true;

/* 绘制网格 */
function drawGrid(color, stepx, stepy){
	cxt.strokeStyle = color;
	cxt.lineWidth = 0.5;
	
	for( var i = stepx + 0.5; i < cxt.canvas.width; i += stepx){
		cxt.beginPath();
		cxt.moveTo(i, 0);
		cxt.lineTo(i, cxt.canvas.height);
		cxt.stroke();
	}
	for( var i = stepy + 0.5; i < cxt.canvas.height; i += stepy){
		cxt.beginPath();
		cxt.moveTo(0, i);
		cxt.lineTo(cxt.canvas.width, i);
		cxt.stroke();	
	}
}

function windowToCanvas(x, y){
	var bbox = canvas.getBoundingClientRect();
	return {
		x: x - bbox.left*(canvas.width/bbox.width),
		y: y - bbox.top*(canvas.height/bbox.height)	
	}
}

function saveDrawingSurface(){	
	drawingSurfaceImageData = cxt.getImageData(0, 0, canvas.width, canvas.height);
}

function restoreDrawingSurface(){
	cxt.putImageData(drawingSurfaceImageData, 0, 0);	
}

function updateRubberbandRectangle(loc){
	rubberbandRect.width = Math.abs(loc.x - mousedown.x);
	rubberbandRect.height = Math.abs(loc.y - mousedown.y);
	
	if(loc.x > mousedown.x)
		rubberbandRect.left = mousedown.x;
	else
		rubberbandRect.left = loc.x;
		
	if(loc.y > mousedown.y)
		rubberbandRect.top = mousedown.y;
	else
		rubberbandRect.top = loc.y;
}

function drawRubberbandShape(loc){
	var angle = Math.atan(rubberbandRect.height/rubberbandRect.width),
		radius = rubberbandRect.height/Math.sin(angle);
	
	if(mousedown.y === loc.y)
		radius = Math.abs(loc.x - mousedown.x);
		
	cxt.beginPath();
	cxt.arc(mousedown.x, mousedown.y, radius, 0, Math.PI*2, false);
	cxt.stroke();
	cxt.fill();	
}

function updateRubberband(loc){
	updateRubberbandRectangle(loc);
	drawRubberbandShape(loc);	
}

// Guidewires ...........................................................................................................
function drawVerticalLine(x){
	cxt.beginPath();
	cxt.moveTo(x+0.5, 0);
	cxt.lineTo(x+0.5, cxt.canvas.height);
	cxt.stroke();
}

function drawHorizontalLine(y){
	cxt.beginPath();
	cxt.moveTo(0, y+0.5);
	cxt.lineTo(cxt.canvas.width, y+0.5);
	cxt.stroke();
}

function drawGuidewires(x, y){
	cxt.save();
	cxt.strokeStyle = 'rgba(0,0,230,0.4)';
	cxt.lineWidth = 0.5;
	drawVerticalLine(x);
	drawHorizontalLine(y);
	cxt.restore();
}



function setDrawPathForEraser(loc){
	var eraserWidth = parseFloat(eraserWidthSelect.value);
	
	cxt.beginPath();
	
	if(eraserShapeSelect.value === 'circle'){
		cxt.arc(loc.x, loc.y, eraserWidth/2, 0, Math.PI*2, false);	
	}else{
		cxt.rect(loc.x - eraserWidth/2, loc.y - eraserWidth/2, eraserWidth, eraserWidth);	
	}
	cxt.clip();
}

function setErasePathForEraser(){
	var eraserWidth = parseFloat(eraserWidthSelect.value);
	
	cxt.beginPath();
	
	if(eraserShapeSelect.value === 'circle'){
		cxt.arc(lastX, lastY, eraserWidth/2 + ERASER_LINE_WIDTH, 0, Math.PI*2, false);	
	}else{
		cxt.rect(lastX - eraserWidth/2 - ERASER_LINE_WIDTH,
				 lastY - eraserWidth/2 - ERASER_LINE_WIDTH,
				 eraserWidth + ERASER_LINE_WIDTH*2,
				 eraserWidth + ERASER_LINE_WIDTH*2);	
	}
	cxt.clip();
}

function setEraserAttributes(){
	cxt.lineWidth     = ERASER_LINE_WIDTH;
	cxt.shadowColor   = ERASER_SHADOW_STYLE;
	cxt.shadowOffsetX = ERASER_SHADOW_OFFSET;
	cxt.shadowOffsetY = ERASER_SHADOW_OFFSET;
	cxt.shadowBlur    = ERASER_SHADOW_BLUR;
	cxt.strokeStyle   = ERASER_STROKE_STYLE;
	//cxt.fillStyle     = ERASER_FILL_STYLE;
}

function eraseLast(){
	cxt.save();
	
	setErasePathForEraser();
	drawGrid(GRID_LINE_COLOR, GRID_HORIZONTAL_SPACING, GRID_VERTICAL_SPACING);
	cxt.restore();	
}

function drawEraser(loc){
	cxt.save();
	
	setEraserAttributes();
	setDrawPathForEraser(loc);
	cxt.stroke();
	//cxt.fill();
	cxt.restore();	
}

canvas.onmousedown = function(e){
	var loc = windowToCanvas(e.clientX, e.clientY);
	
	e.preventDefault();
	if(drawRadio.checked){
		saveDrawingSurface();	
	}	
	mousedown.x = loc.x;
	mousedown.y = loc.y;
	
	lastX = loc.x;
	lastY = loc.y;
	
	dragging = true;
	
}

canvas.onmousemove = function(e){
	var loc;
	
	if (dragging){
		e.preventDefault();
		
		loc = windowToCanvas(e.clientX, e.clientY);
		
		if (drawRadio.checked){
			restoreDrawingSurface();
			updateRubberband(loc);
			
			if(guidewirse){
				drawGuidewires(loc.x, loc.y);	
			}	
			
		}
		else{
			eraseLast();
			drawEraser(loc);
		}
		lastX = loc.x;
		lastY = loc.y;
	}	
}

canvas.onmouseup = function(e){
	loc = windowToCanvas(e.clientX, e.clientY);
	
	if(drawRadio.checked){
		restoreDrawingSurface();
		updateRubberband(loc);
	}
	
	if(eraserRadio.checked){
		eraseLast();	
	}
		
	dragging = false;	
}

strokeStyleSelect.onchange = function(e){
	cxt.strokeStyle = strokeStyleSelect.value;
}

fillStyleSelect.onchange = function(e){
	cxt.fillStyle = fillStyleSelect.value;
}

cxt.strokeStyle = strokeStyleSelect.value;
cxt.fillStyle = fillStyleSelect.value;
drawGrid(GRID_LINE_COLOR, GRID_HORIZONTAL_SPACING, GRID_VERTICAL_SPACING);





