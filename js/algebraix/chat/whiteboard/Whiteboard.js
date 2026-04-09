var resizeEvent = new Event('pencilSizeChanged');
var recolorEvent = new Event('pencilColorChanged');


// Se agrega la funcionalidad al picker para modificar el tamaño del trazo en el canvas
// Al cambiar de tamaño el pincel, se cambia de tamaño y ajusta la posicion del picker, de modo que
// vuelva a quedar centrado y muestre el diametro real del que se haran los nuevos trazos
function resizeSizePicker(newSize = null) {
	if (newSize && newSize >= 7 && newSize <= 20) {
		let sp = document.getElementById('size-picker');
		if (sp) {
			newSize = newSize + 'px;';
			sp.setAttribute('style', 'height: ' + newSize + ' width: ' + newSize);
			let newMarginTop = ((sp.parentElement.clientHeight - sp.clientHeight) / 2) + 'px;';
			let newMarginLeft = ((sp.parentElement.clientWidth - sp.clientWidth) / 2) + 'px;';
			let currentStyle = sp.getAttribute('style');
			sp.setAttribute('style', currentStyle + ' margin-top: ' + newMarginTop + ' margin-left: ' + newMarginLeft);
			sp.dispatchEvent(resizeEvent);
		}
	}
}
// Se agrega la funcionalidad al picker para modificar el color de los trazos en el canvas.
// Al cambiar de color el pincel, se cambia el color del picker y, en caso de ser blanco, se le agrega un borde gris
function changeColor(color) {
	let cp = document.getElementById('color-picker');
	if (cp) {
		let newMarginTop = ((cp.parentElement.clientHeight - cp.clientHeight) / 2) + 'px;';
		let newMarginLeft = ((cp.parentElement.clientWidth - cp.clientWidth) / 2) + 'px;';
		cp.setAttribute('style', 'margin-top: ' + newMarginTop + ' margin-left: ' + newMarginLeft + ' background-color: ' + color + ';' +
			(color === '#FFFFFF' ? 'border: 1px solid #818490;' : (color === '#2C2F36' ? 'border: 1px solid #FFFFFF;' : '')));
		cp.dataset.colorPicked = color;
		cp.dispatchEvent(recolorEvent);
	}
}



// Para que los pickers se oculten al hacer click sobre cualquier otra parte de la pagina que no sean las
// paletas de los pickers o los botones para desplegarlos (pues se ocultarian tan pronto como se muestran)
window.addEventListener('click', function (event) {
	const sizePalette = document.getElementById('sizePalette');
	if (sizePalette && (event.target.id !== 'showSizePicker' && event.target.id !== 'size-picker')) {
		if (sizePalette.style.display !== "none") {
			$(sizePalette).hide();
		}
	}
	const colorPalette = document.getElementById('colorPalette');
	if (colorPalette && (event.target.id !== 'showColorPicker' && event.target.id !== 'color-picker')) {
		if (colorPalette.style.display !== "none") {
			$(colorPalette).hide();
		}
	}
});

(function($){
    
    //var controlsTopDiv;
    var controlsBottomDiv;
    var opts;
    var presentationPanel;
    var sketchpad;
    var presentationLoader;


    $.fn.whiteboard = function(options){
	var self = this;
	opts = $.extend( true, {}, $.fn.whiteboard.defaults, options );

	this.css('width', '100%');
	$('#A_MAXIMIZE').unbind('A_MAXIMIZE');
	$('#A_MINIMIZE').unbind('A_MINIMIZE');
	$('#A_MAXIMIZE').bind('A_MAXIMIZE', fixPosition);
	$('#A_MINIMIZE').bind('A_MINIMIZE', fixPosition);

	//controlsTopDiv = $('<div/>');
	presentationPanel = $('<div/>');
	controlsBottomDiv = $('<div/>');
	//this.append(controlsTopDiv);
	this.append(presentationPanel);
	this.append(controlsBottomDiv);
	
	var hiddenDiv = $('<div/>');
	// probably not necessary anymore
	var selectorDiv = $('<div id=selectorDiv/>');
	selectorDiv.append('<table class="data_view" width="600px"/>');
	
	this.append(hiddenDiv);
	hiddenDiv.append(selectorDiv);
	hiddenDiv.hide();

	createDefaultPresentation();

	return this;
	
    }
    
    $.fn.whiteboard.startPresentation = function(){
	if(opts.presentation.type !== 'EMPTY'){
	    //controlsTopDiv.empty();
	    presentationPanel.empty();
	    controlsBottomDiv.empty();
	    sketchpad = new Sketchpad(presentationPanel, opts);
	    presentationLoader = new PresentationLoader(presentationPanel, opts);
	    presentationLoader.loadPresentation();
	    createControlsBottom();
	    sketchpad.init();
		Array.from(document.getElementsByTagName('canvas')).forEach(x=> {
			let outerWidth = document.getElementById('whiteboard').offsetWidth;
			let newHeight = outerWidth * 0.5625;

			// x.setAttribute('width', opts.width);
			x.setAttribute('width', opts.presentation.canvasWidth);
			$(x).css('width', outerWidth);
			// x.setAttribute('height', opts.height);
			x.setAttribute('height', opts.presentation.canvasHeight);
			$(x).css('height', newHeight);
			// x.setAttribute('width', outerWidth);
			// x.setAttribute('height', newHeight);
			$('#whiteboard').css('height', newHeight + 'px');
		});

		if(opts.enableControls){
			createControlsTop();
		}
	}
    }
    
    $.fn.whiteboard.addStroke = function(stroke){
	sketchpad.addStroke(stroke);
    }
    
    $.fn.whiteboard.setStrokes = function(strokes){
	sketchpad.setStrokes(strokes);
    }
    
    $.fn.whiteboard.undo = function(){
	sketchpad.undo();
    }
    
    $.fn.whiteboard.clear = function(){
	sketchpad.clear();
    }

    $.fn.whiteboard.changePage = function(page){
	presentationLoader.changePage(page);
	updatePageInformation();
    }


    function beforeLoadFileChooser(){
	//$.fancybox.showActivity();
	//$.fancybox.center();
    }
    
    function completeLoadFileChooser(){
	//$.fancybox.center();
	//$.fancybox.hideActivity();
    }

    function onSelectFileChooser(){
		//$.fancybox.close();
		var selected = this.getSelected();
		var presentation = {
		    type: selected.type,
		    pdf: selected.pdf,
		    images: selected.images
		}
		//controlsTopDiv.empty();
		presentationPanel.empty();
		controlsBottomDiv.empty();
		opts.presentation = presentation;
		opts.fileChooser.emitSelect(presentation);
		sketchpad = new Sketchpad(presentationPanel, opts);
		presentationLoader = new PresentationLoader(presentationPanel, opts);
		presentationLoader.loadPresentation();
		//createControlsTop(); // Ya se encuentran inicializados
		createControlsBottom();
		sketchpad.init();
    }

    function createControlsTop(){
		var selectorDiv = $('#selectorDiv2');
		var fileChooser = new FileChooser(selectorDiv, opts);

		let whiteboardControls = document.getElementById('whiteBoardControls');


		whiteboardControls.innerHTML = `
			<div class="body__1">${opts.controls.labels.size}:</div>
			<a class="nav--tab dropdown-toggle cursor-pointer" id="showSizePicker">
				<div class="round-picker-container">
					<div id="size-picker" class="round-picker-container__round-picker">
					</div>
				</div>
			</a>
			<div class="body__1">${opts.controls.labels.color}:</div>
			<a class="nav--tab dropdown-toggle cursor-pointer" id="showColorPicker">
				<div class="round-picker-container">
					<div id="color-picker" class="round-picker-container__round-picker">
					</div>
				</div>
			</a>
			<a class="nav--tab cursor-pointer text-dark" id="whiteboard-undo">
				<i class="fas fa-arrow-rotate-left"></i>
				${opts.controls.labels.undo}</a>
			<a class="nav--tab cursor-pointer text-dark" id="whiteboard-clear">
				<i class="fas fa-eraser"></i>
				${opts.controls.labels.clear}</a>
			<div class="panel scale-entrance picker-palette" id="sizePalette" style="display: none; width: auto;">
				<div id="sizeElements" style="position: relative; height: 100%; width: 100%;">
					<a class="cursor-pointer" data-size-picked="7">
						<div class="round-picker-container" style="margin-top:20.5px;">
							<div class="round-picker-container__round-picker"
								 style="height: 7px;width: 7px;margin-left:8.5px;">
							</div>
						</div>
					</a>
					<a class="cursor-pointer" data-size-picked="9">
						<div class="round-picker-container" style="margin-top:19.5px;">
							<div class="round-picker-container__round-picker"
								 style="height: 9px;width: 9px;margin-left:7.5px;">
							</div>
						</div>
					</a>
					<a class="cursor-pointer" data-size-picked="12">
						<div class="round-picker-container" style="margin-top:18px;">
							<div class="round-picker-container__round-picker"
								 style="height: 12px;width: 12px;margin-left:6px;">
							</div>
						</div>
					</a>
					<a class="cursor-pointer" data-size-picked="16">
						<div class="round-picker-container" style="margin-top:16px;">
							<div class="round-picker-container__round-picker"
								 style="height: 16px;width: 16px;margin-left:4px;">
							</div>
						</div>
					</a>
					<a class="cursor-pointer" data-size-picked="20">
						<div class="round-picker-container" style="margin-top:14px;">
							<div class="round-picker-container__round-picker"
								 style="height: 20px;width: 20px;margin-left:2px;">
							</div>
						</div>
					</a>
				</div>
			</div>
			<div class="panel scale-entrance picker-palette" id="colorPalette" style="display: none; width: auto;">
				<div id="colorElements" style="position: relative; height: 100%; width: 100%;">
					<a class="cursor-pointer" data-color-picked="#FF6771">
						<div class="round-picker-container">
							<div class="round-picker-container__round-picker"
							style="background-color: #FF6771;">
							</div>
						</div>
					</a>
					<a class="cursor-pointer" data-color-picked="#E52C28">
						<div class="round-picker-container">
							<div class="round-picker-container__round-picker"
							style="background-color: #E52C28;">
							</div>
						</div>
					</a>
					<a class="cursor-pointer" data-color-picked="#FF9800">
						<div class="round-picker-container">
							<div class="round-picker-container__round-picker"
							style="background-color: #FF9800;">
							</div>
						</div>
					</a>
					<a class="cursor-pointer" data-color-picked="#FFC106">
						<div class="round-picker-container">
							<div class="round-picker-container__round-picker"
							style="background-color: #FFC106;">
							</div>
						</div>
					</a>
					<a class="cursor-pointer" data-color-picked="#00A56F">
						<div class="round-picker-container">
							<div class="round-picker-container__round-picker"
							style="background-color: #00A56F;">
							</div>
						</div>
					</a>
					<a class="cursor-pointer" data-color-picked="#4A7DFF">
						<div class="round-picker-container">
							<div class="round-picker-container__round-picker"
							style="background-color: #4A7DFF;">
							</div>
						</div>
					</a>
					<a class="cursor-pointer" data-color-picked="#713BA7">
						<div class="round-picker-container">
							<div class="round-picker-container__round-picker"
							style="background-color: #713BA7;">
							</div>
						</div>
					</a>
					<a class="cursor-pointer" data-color-picked="#FFFFFF">
						<div class="round-picker-container">
							<div class="round-picker-container__round-picker"
							style="background-color: #FFFFFF; border: 1px solid #707070; margin-top: -1px;">
							</div>
						</div>
					</a>
					<a class="cursor-pointer" data-color-picked="#818490">
						<div class="round-picker-container">
							<div class="round-picker-container__round-picker"
							style="background-color: #818490;">
							</div>
						</div>
					</a>
					<a class="cursor-pointer" data-color-picked="#2C2F36">
						<div class="round-picker-container">
							<div class="round-picker-container__round-picker"
							style="background-color: #2C2F36; border: 1px solid #FFFFFF; margin-top: -1px;">
							</div>
						</div>
					</a>
				</div>
			</div>
		`;

		let whiteboard = document.getElementById('whiteboard');
		if(whiteboard){
			whiteboard.parentElement.parentElement.parentElement.parentElement.appendChild(whiteboardControls);
		}

		let sp = document.getElementById('size-picker');
		if(sp){
			sp.addEventListener('pencilSizeChanged', x=> {
				sketchpad.setLineWidth(x.target.clientWidth);
			})
		}
		let cp = document.getElementById('color-picker');
		if(cp){
			cp.addEventListener('pencilColorChanged', x=> {
				sketchpad.setLineColor(x.target.dataset.colorPicked);
			})
		}
		let undoButton = document.getElementById('whiteboard-undo');
		if(undoButton){
			undoButton.addEventListener('click', ()=> sketchpad.undo());
		}
		let clearButton = document.getElementById('whiteboard-clear');
		if(clearButton){
			clearButton.addEventListener('click', ()=> sketchpad.clear());
		}
		// Deprecated
		// let loadButton = document.getElementById('whiteboard-load-presentation');
		// if(loadButton){
		// 	loadButton.addEventListener('click', ()=> {
		// 		$('#modal').modal('show');
		// 		fileChooser.listFiles();
		// 	});
		// }

		['color', 'size'].forEach(picker => {
			let elementShower = document.getElementById('show'  + picker.charAt(0).toUpperCase() + picker.slice(1) + 'Picker');
			let paletteElement = document.getElementById(picker + 'Palette');
			let pickerElements = document.getElementById(picker + 'Elements');
			let childrenElements = Array.from(pickerElements.children);
			elementShower.addEventListener('click', () => {
				$(paletteElement).toggle(); // Se alterna la visibilidad, mostrando u ocultando en cada click
				if (paletteElement.style.top === "") {
					paletteElement.setAttribute('style', paletteElement.getAttribute('style') + ' top:' + (parseFloat(paletteElement.parentElement.parentElement.getBoundingClientRect().height) + 10) + 'px');
				}
				if (childrenElements[0].children[0].style.marginLeft === "") {
					childrenElements.forEach(x => {
						x.children[0].setAttribute('style', 'margin-top:' + (x.parentElement.clientHeight - x.children[0].children[0].clientHeight) / 2 + 'px;');
						x.children[0].children[0].setAttribute('style', x.children[0].children[0].getAttribute('style') + ' margin-left:' + (x.children[0].clientWidth - x.children[0].children[0].clientWidth) / 2 + 'px;');
					})
				}
				pickerElements.scrollIntoView({ behavior: 'smooth', block: 'end' });
			});
			if(picker === 'size'){
				childrenElements.forEach(x => x.addEventListener('click', function (event) {
					resizeSizePicker(x.dataset.sizePicked); // Se redimensiona el pincel
					$(paletteElement).hide(); // Se oculta la paleta de pinceles
				}));
			} else {
				childrenElements.forEach(x => x.addEventListener('click', function (event) {
					changeColor(x.dataset.colorPicked); // Se cambia el color de pincel
					$(paletteElement).hide(); // Se oculta la paleta de colores
				}));
			}
			paletteElement.addEventListener('click', function (e) {
				e.stopPropagation();
			});
		});


		/*close.fancybox({
		    hideOnOverlayClick : false,
		    onComplete: function(){
			fileChooser.listFiles();
		    }
		});*/
    }

    function createControlsBottom(){
	var mainTable = $('<table width="100%" cellspacing=0/>');
	var tr = $('<tr class="tr_header">');
	var td = $('<td align="center" style="border-top: 1px solid rgb(140, 172, 187);"/>');
	var first = $('<a href=#/>');
	var prev = $('<a href="#"/>');
	var span = $('<span id="pageStatusSpan"/>');
	var page = presentationLoader.getActualPage();
	var pages = presentationLoader.getTotalPages();
	var next = $('<a href="#"/>');
	var last = $('<a href="#"/>');
	if(opts.enableControls){
	    first.append($('<i class="'+ opts.controls.images.first + '"></i>'));
	    first.append('&nbsp;');
	    first.append(opts.controls.labels.first);
	    td.append(first);
	    td.append('&nbsp;&nbsp;&nbsp;&nbsp;');
	    prev.append($('<i class="'+ opts.controls.images.prev + '"></i>'));
	    prev.append('&nbsp;');
	    prev.append(opts.controls.labels.prev);
	    td.append(prev);
	    td.append('&nbsp;&nbsp;&nbsp;&nbsp;');
	}
	span.append(page);
	span.append('/');
	span.append(pages);
	td.append(span);
	if(opts.enableControls){
	    td.append('&nbsp;&nbsp;&nbsp;&nbsp;');
	    next.append(opts.controls.labels.next);
	    next.append('&nbsp;');
	    next.append($('<i class="'+ opts.controls.images.next + '"></i>'));
	    td.append(next);
	    td.append('&nbsp;&nbsp;&nbsp;&nbsp;');
	    last.append(opts.controls.labels.last);
	    last.append('&nbsp;');
	    last.append($('<i class="'+ opts.controls.images.last + '"></i>'));
	    td.append(last);
	}
	tr.append(td);
	mainTable.append(tr);
	controlsBottomDiv.append(mainTable);
	first.click(function(e){
	    if(presentationLoader.getActualPage() > 1){
		sketchpad.clear();
		presentationLoader.first();
		updatePageInformation();
	    }
	    return false;
	});
	prev.click(function(e){
	    if(presentationLoader.getActualPage() > 1){
		sketchpad.clear();
		presentationLoader.previous();
		updatePageInformation();
	    }
	    return false;
	});
	next.click(function(e){
	    if(presentationLoader.getActualPage() < presentationLoader.getTotalPages()){
		sketchpad.clear();
		presentationLoader.next();
		updatePageInformation();
	    }
	    return false;
	});
	last.click(function(e){
	    if(presentationLoader.getActualPage() < presentationLoader.getTotalPages()){
		sketchpad.clear();
		presentationLoader.last();
		updatePageInformation();
	    }
	    return false;
	});
    }
    
    function updatePageInformation(){
	var pageStatusSpan = $('#pageStatusSpan');
	pageStatusSpan.empty();
	pageStatusSpan.append(presentationLoader.getActualPage());
	pageStatusSpan.append('/');
	pageStatusSpan.append(presentationLoader.getTotalPages());
    }
    
    function fixPosition(){
	sketchpad.fixPosition();
    }
    
    function createDefaultPresentation(){
		//var background = $('<img src="'+opts.background + '" />');
		sketchpad = new Sketchpad(presentationPanel, opts);
		//presentationPanel.append(background);
		sketchpad.init();
		Array.from(document.getElementsByTagName('canvas')).forEach(x=> {
			let outerWidth = document.getElementsByClassName('whiteboardVideoContainer')[0].offsetWidth;
			let newHeight = outerWidth * 0.5625;
			if(opts.presentation){
				// x.setAttribute('width', opts.width);
				x.setAttribute('width', opts.presentation.canvasWidth);
				$(x).css('width', outerWidth);
				// x.setAttribute('height', opts.height);
				x.setAttribute('height', opts.presentation.canvasHeight);
				$(x).css('height', newHeight);
			} else {
				// x.setAttribute('width', opts.width);
				// x.setAttribute('height', opts.height);
				x.setAttribute('width', outerWidth);
				x.setAttribute('height', newHeight);
			}

			$('#whiteboard').css('height', newHeight + 'px');
		});

		if(opts.enableControls){
			createControlsTop();
		}
		//$('#whiteboard').append(controlsTopDiv);
    }
    
    $.fn.whiteboard.defaults = {
		baseURL: '',
		background: '/resources3/assets/images/chat/pizarron.png',
		fileChooser: {
		    libraryURL : '/api/t/library2/view_class',
		    folderImg: 'fa fa-folder text-yellow-algebraix',
		    documentImg: 'fa fa-file text-blue-algebraix',
		    imageImg: 'fa fa-image text-green-algebraix',
		    beforeLoad: beforeLoadFileChooser,
		    completeLoad: completeLoadFileChooser,
		    onSelect: onSelectFileChooser
		},
		controls: {
		    images: {
			pencil : 'fa fa-pencil',
			undo : 'fas fa-arrow-rotate-left text-dark',
			clear : 'fas fa-eraser text-dark',
			load : 'fa fa-rectangle-list',
			first : 'fa fa-angles-left',
			prev : 'fa fa-angle-left',
			next : 'fa fa-angle-right',
			last : 'fa fa-angles-right'
		    }
		},
		sketchpad : {
		    strokeStyle: "#000000",
		    lineWidth: 2,
		    lineCap: "round",
		    lineJoin: "round",
		    drawAllowed: true
		},
		presentationLoader: {
		    onLoaded: updatePageInformation
		},
		// Alternar valores cuando se use templates3 para el profesor
		width: '1920',
		height: '1080'
    };

}(jQuery));
