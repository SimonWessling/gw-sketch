var sketchModule = (function () 
{
	/******************************** Configurable options *****************************************************/
	var isStandalone = true;
	var lcConfig = {
//			onInit:				
					imageURLPrefix: 	'libs/literallycanvas-0.4.14/img',
					backgroundColor:	'#fff',
					toolbarPosition: 	'bottom',
					tools:				[
					      				 LC.tools.Pencil,
					      				 LC.tools.Eraser,
					      				 LC.tools.Line,
					      				 LC.tools.Rectangle,
					      				 LC.tools.Text,    						
					      				 ],
					      				 defaultStrokeWidth: 3,
					      				 strokeWidths: 		[1, 2, 3, 5]
	};
	
	/**********************************************************************************************************/
	
	var localStorageSupported = typeof(Storage) == "undefined" ? false : true;
	var currentSnapshot = null;
	var currentSnapshotName = null;
	var lc = null;
	var dragged = null;
	
	$(function() {
		init();
	});

	/*
	 * Initializes the literallyCanvas object and the extra buttons (if standalone)
	 */
	function init() 
	{
		lc = LC.init($('#lc')[0],lcConfig);
		if (isStandalone) {
			$('<button type="button" class="controls">Laden</button>').appendTo('#controls')
				.on('click',load);
			$('<button type="button" class="controls">Speichern</button>').appendTo('#controls')
				.on('click', function(){ return save()});
			$('<button type="button" class="controls">Speichern unter</button>').appendTo('#controls')
				.on('click', function(){ return save(true)});
			$('<button type="button" class="controls">Exportieren</button>').appendTo('#controls')
				.on('click', function(){ return exportAs('png')});
			
			
		}
		
		var img = document.createElement('img');
		img.src = 'http://www.animaatjes.de/cliparts/cartoons/lucky-luke/clipart_lucky-luke_animaatjes-23.jpg';
		img.id = 'luckyLuke';
		$('body').append(img);
		
		// enable drag and drop to canvas
		$('#lc')
			.on('dragover', dragAndDropHelpers.onDragover)
			.on('drop', function(e) {
				var dropped = dragAndDropHelpers.getDroppedObject(e);
				lc.saveShape(LC.createShape('Image', dropped));
			});
		
		$('#luckyLuke')
		.on('dragstart', dragAndDropHelpers.getDraggedObject)
		
//		$('#dropzone')
//		.on('dragstart', dragAndDropHelpers.getDraggedObject)
//		.on('dragenter', function(event){
//			$('#dropzone').addClass('dragover');
//		})
//		.on('dragover', function(event){
//			event.preventDefault();})
//		.on('dragleave', function (event) {
//			$('#dropzone').removeClass('dragover');
//		})
//		.on('drop', dropzoneDrop);
//		
	}
	
	function dropzoneDrop(event) 
	{
		event.preventDefault();
		event.stopPropagation();
		
		var img = $(new Image());
		img.attr('src', 'http://www.animaatjes.de/cliparts/cartoons/lucky-luke/clipart_lucky-luke_animaatjes-23.jpg');
		$('#dropzone').html(img).addClass('dropped');
	}
	
	/*
	 * Wraps the logic of persisting snapshots by getting a file name if necessary
	 * and then persisting the current state under that name.
	 */
	function save(getNewName = false) {
		if (getNewName || !currentSnapshotName) { 
			currentSnapshotName = prompt('Speichern als:'); // TODO
			// TODO user feedback: Name der aktuellen Skizze anzeigen
			if (!currentSnapshotName)
				return;
		}
		saveSnapshotUnderName(currentSnapshotName);
		// TODO user feedback
	}

	/*
	 * Wraps the logic of loading a sketch by getting the name of the sketch
	 * and loading it.
	 */
	 function load() {
		// TODO alten snapshot speichern?
		currentSnapshotName = prompt('Name der zu ladenden Skizze:');
		if (currentSnapshotName) {
			loadSnapshotByName(currentSnapshotName);	
		}
	}

	/*
	 * Returns the current state as either png or svg
	 */
	function exportAs(format) {
		if (format == 'png') {
			var image = lc.getImage();
			if(image) {
				return image.toDataURL();
			} else {
				//TODO warn: empty image
				return null;
			}
		}
		else if (format == 'svg'){

		}
		else {
			// Format nicht unterstützt
		}
	};
	
	/*
	 * Persists the current state to local storage under the given name.
	 */
	function saveSnapshotUnderName(snapshotName)
	{
		if (!snapshotName) {
			return;
		}
		currentSnapshot = lc.getSnapshot();
		
		if (localStorageSupported) {
				localStorage.setItem(snapshotName, JSON.stringify(currentSnapshot));
		}
		else {
			// TODO error handling no storage
		}
	};

	/*
	 * Loads a persisted snapshot (as identified by the name) and renders it.
	 */
	function loadSnapshotByName(snapshotName) 
	{
		if (!snapshotName) {
			return;
		}
		if (localStorageSupported) {
			var snapshot = JSON.parse(localStorage.getItem(snapshotName));
			if (snapshot) {
				lc.loadSnapshot(snapshot); // render snapshot
				currentSnapshot = snapshot;
			}
			else {
				// TODO
				alert("Keine Skizze mit diesem Namen gefunden!");
			}	
		} else {
			// TODO error handling no storage
		}
	}
	
	/******************************** "Public" API ********************************************/
	return {
		load : load,
		save : save,
		exportAs : exportAs
	};
}).call(this);

