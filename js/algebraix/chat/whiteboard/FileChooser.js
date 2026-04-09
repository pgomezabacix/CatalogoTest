var FileChooser = function(container, opts){

	var self = this;
	var images = [];
	var document = null;
	var url = opts.fileChooser.libraryURL;
	var classInstanceId = opts.classInstanceId;
	var baseURL = opts.baseURL;
	var folderImg = opts.fileChooser.folderImg;
	var documentImg = opts.fileChooser.documentImg;
	var imageImg = opts.fileChooser.imageImg
	var mainTable = null;
	var selected = null;
	var selectFolderButton = null;
	var nav = [ undefined ];

	this.listFiles = function(fileId){
		images = [];
		document = null;
		selected = null;
		getElementList(fileId);
	}

	this.getSelected = function(){
		return selected;
	}

	this.onSelect = opts.fileChooser.onSelect === undefined ? function(){} : opts.fileChooser.onSelect;

	this.beforeLoad = opts.fileChooser.beforeLoad === undefined ? function(){} : opts.fileChooser.beforeLoad;

	this.completeLoad = opts.fileChooser.completeLoad === undefined ? function(){} : opts.fileChooser.completeLoad;

	var folderEntry = function(data){
		
		var url = '/api/t/library2/view_class?folder_id='+data.id;

		createEntry(data, 'folder', folderImg, true, function(e){
		    var fileId = $(this).attr('fileId');
		    nav.push(fileId);
		    getElementList(fileId);
		    return false;
		});

	}
    
	var documentEntry = function(data){
		createEntry(data, 'file', documentImg, true, selectDocument);
	}

	var imageEntry = function(data){
		createEntry(data, 'file', imageImg, true, selectImage);
	}

	var createEntry = function(element, type, icon, link, click){
		if(type == 'folder'){
			var tr = $('<tr/>');
			var td = $('<td/>');
			var img = $('<i class="'+icon+'"></i>');
			var anchor = $('<a href="#" fileId="'+element.id+'"/>');
			td.append(img);
			td.append('&nbsp;');
			if(link){
			    anchor.append(element.name);
			    anchor.click(click);
			    td.append(anchor);
			}else{
			    td.append(element.name);
			}
			tr.append(td);
			mainTable.append(tr);
			}else{
				var url = '/api/t/library2/view?article_id='+element.id;
			$.get(url, function(data){
				try{
					data = data.data.library_item.items;
					$.each(data, function(index, val){
						var tr = $('<tr/>');
						var td = $('<td/>');
						var img = $('<i class="'+icon+'"></i>');
						var anchor = $('<a href="#" fileId="'+element.id+'" remoteId="'+val.file_id+'"/>');
						td.append(img);
						td.append('&nbsp;');
						if(link){
						    anchor.append(element.name);
						    anchor.click(click);
						    td.append(anchor);
						}else{
						    td.append(element.name);
						}
						tr.append(td);
						mainTable.append(tr);
					});
				}catch(e){}
			});
		}
	}

	var createRootEntry = function(){
		createEntry({name: '..', id: 'ROOTROOT'}, 'root', folderImg, true, function(e){
		    var fileId = $(this).attr('fileId');
		    getElementList(fileId);
		    return false;
		});
	}

	var selectImagesFolder = function(e){
		var filesIds = [];
		for (var i=0; i< images.length; i++){
		    filesIds.push(images[i].file_id);
		}
		selected = {
		    type : 'IMG',
		    images : filesIds
		};
		self.onSelect();
	}

	var selectImage = function(e){
		var fileId = $(this).attr('remoteId');
		images = [];
		images.push(fileId);
		selected = {
		    type : 'IMG',
		    images : images
		}
		self.onSelect();
		return false;
	}

	var selectDocument = function(e){
		var fileId = $(this).attr('remoteId');
		pdf = fileId;
		selected = {
		    type : 'PDF',
		    pdf : pdf
		}
		self.onSelect();
		return false;
	}

	var getElementList = function(fileId){
		container.empty();
		// container.append('<h3>'+opts.fileChooser.labels.title+'</h3>');
		container.append('<div class="loader mb10 text-center"><i class="fa fa-gear fa-2x fa-spin"></i></div>');
		mainTable = $('<table class="mainTable table table-condensed table-hover p10 i-width" width="600px" style="display: none;"/>');
		container.append(mainTable);
		self.beforeLoad();

		$.get(url,{
		    id: classInstanceId,
		    folder_id: fileId
		}, function(data){
			data = data.data
			if(typeof data.folders !== null){
				$(data.folders).each(function(index, val){
					folderEntry(val);
				});
			}
			if(data.library_items){
				if(data.library_items.length > 0){
					$(data.library_items).each(function(index, val){
						if(val.item_count == 1){
							if(val.type_counts[0].type == 'image'){
								imageEntry(val);
							}
							if(val.type_counts[0].type == 'document'){
								documentEntry(val);
							}
						}
					});
				}
			} else {
				self.completeLoad();
				$('[data-dismiss]').click();
				alert('Para abrir un archivo, primero deben existir archivos cargados en la biblioteca virtual.')
			}

			if(typeof fileId != "undefined"){
				container.append('<div class="nav mt10 mb10 text-right" style="display: none;"><a class="btn btn-primary" id="home"><i class="fa fa-house"></i></a> <a class="btn btn-success" id="back"><i class="fa fa-chevron-left"></i></a></div>');
				$('#back').on('click', function(){
					var current = nav.pop();
					nav.splice( current, 1 );
					getElementList(nav.pop());
				});
				$('#home').on('click', function(){
					getElementList();
				});
			}
			
			setTimeout(function(){
				$('.loader').remove();
				$('.mainTable').show();
				if(typeof fileId != "undefined"){$('.nav').show();};
			}, 500);
			
			self.completeLoad();
		});
	}
}