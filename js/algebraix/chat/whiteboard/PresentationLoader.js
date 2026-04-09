var PresentationLoader = function(container, opts){
    
    var self = this;
    var canvas = null;
    var ctx = null;
    var urlGenerator = '/bin/'+opts.urlGenerator+'/library2/x_get_resource_url';
    var loaded = false;
    var imageArray = {};
    var images = opts.presentation.images;
    var type = opts.presentation.type;
    var pdf = opts.presentation.pdf;
    var pdfDoc = null;
    var pages = 0;
    var numPage = 1;
    var loadedImages = 0;
    
    this.onPageChange =
	(opts.presentationLoader !== undefined && opts.presentationLoader.onPageChange !== undefined)
	    ? opts.presentationLoader.onPageChange : function(num){};
    this.onLoaded =
	(opts.presentationLoader !== undefined && opts.presentationLoader.onLoaded !== undefined)
	    ? opts.presentationLoader.onLoaded : function(num){};

    this.loadPresentation = function(){
		let outerWidth = document.getElementById('whiteboard').offsetWidth;
		let newHeight = outerWidth * 0.5625;
		canvas = $('<canvas/>').
		    attr('width', outerWidth).
		    attr('height', newHeight);
		container.append(canvas);
		ctx = canvas[0].getContext('2d');
		loadDocument();
    }

    this.getTotalPages = function(){
		return pages;
    }

    this.getActualPage = function(){
		return numPage;
    }
    
    this.next = function(){
		if(type == 'PDF'){
		    renderNextPage()
		}else if(type == 'IMG'){
		    renderNextImage();
		}
    }

    this.previous = function(){
	   	if(type == 'PDF'){
		    renderPreviousPage()
		}else if(type == 'IMG'){
		    renderPreviousImage();
		}
    }

    this.first = function(){
		numPage = 1;
		if(type == 'PDF'){
		    renderPDFPage(numPage);
		}else if(type == 'IMG'){
		    renderImage(numPage);
		}
    }

    this.last = function(){
		numPage = pages;
		if(type == 'PDF'){
		    renderPDFPage(numPage);
		}else if(type == 'IMG'){
		    renderImage(numPage);
		}
		
	    }
	    
	this.changePage = function(page){
		numPage = page;
		if(type == 'PDF'){
		    renderPDFPage(numPage);
		}else if(type == 'IMG'){
		    renderImage(numPage);
		}
    }
    
    function loadDocument(){
		if(type == 'PDF'){
		    loadPDF();
		}else if(type == 'IMG'){
		    pages = opts.presentation.images.length;
		    loadImages();
		}
    }
    
    function loadPDF(){
		$.get(urlGenerator, {
			file_id: pdf
		}, function(data){
			PDFJS.workerSrc = '/resources3/js/algebraix/chat/whiteboard/pdf.worker.js';
		    	PDFJS.getDocument(data.url).then(function(_pdfDoc) {
			    loaded = true;
			    pdfDoc = _pdfDoc;
			    renderPDFPage(numPage);
			    pages = pdfDoc.numPages;
			    self.onLoaded();
			});
		});
    }

    function loadImages(){
		loadedImages = 0; 
		for(var i=0; i<images.length; i++){
		    var file_id = images[i];
		    $.get(urlGenerator,{
			id: opts.classInstanceId,
			file_id: file_id
		    }, function(data){
			var imageObj = new Image();
			imageArray[data.file_id] = imageObj;
			imageObj.onload = function(){
			    loadedImages++;
			    if(loadedImages >= images.length){
				loaded = true;
				renderImage(numPage);
			    }
			}
			imageObj.src = data.url;
		    });
		}
    }
    
    function renderImage(num){
		self.onPageChange(num);
		if(loaded){
		    ctx.clearRect(0,0,canvas[0].width, canvas[0].height);
		    ctx.drawImage(imageArray[images[num-1]], 0, 0, canvas[0].width, canvas[0].height);
		}
    }
    
    function renderPDFPage(num){
		self.onPageChange(num);
		if(loaded){
		    pdfDoc.getPage(num).then(
			function(page) {
			    var viewport = page.getViewport(1);
			    var scale = canvas.height() / viewport.height;
			    viewport = page.getViewport(scale);
			    var renderContext = {
				canvasContext: ctx,
				viewport: viewport
			    };
			    page.render(renderContext);
			}
		    );
		}
    }
    
    function renderNextPage(){
		if(numPage >= pages)
		    return;
		numPage++;
		renderPDFPage(numPage);
    }
    
    function renderPreviousPage(){
		if(numPage <= 1)
		    return;
		numPage--;
		renderPDFPage(numPage);
    }
    
    function renderNextImage(){
		if(numPage >= pages)
		    return;
		numPage++;
		renderImage(numPage);
    }
    
    function renderPreviousImage(){
		if(numPage <= 1)
		    return;
		numPage--;
		renderImage(numPage);
    }

}
    
