var sketchModule = (function () 
{
	/******************************** Configurable options *****************************************************/
	var isStandalone = true;
	var enableDropzone = true;
	var lcConfig = {
					imageURLPrefix: 	'libs/literallycanvas-0.4.14/img',
					backgroundColor:	'#fff',
					toolbarPosition: 	'bottom',
					// available tools: "Pencil", "Eraser", "Line", "Rectangle", "Ellipse", "Text", "Polygon", 
					// 					"Pan", "Eyedropper", "SelectShape"
					tools:				[LC.tools.Pencil, LC.tools.Eraser, LC.tools.Line, LC.tools.Rectangle,
										 LC.tools.Ellipse, LC.tools.Polygon, LC.tools.Text, LC.tools.SelectShape
					      				],
					      				defaultStrokeWidth: 3,
					      				strokeWidths: 		[1, 2, 3, 5]
	};
	
	/**********************************************************************************************************/
	
	var currentSnapshot = null;
	var currentSnapshotName = null;
	var lc = null;
	var fileInput = null;
	var dragged = null;
	var ignoreOnChange = false;
	
	$(function() {
		init();
	});
	
	/*
	 * Initializes the literallyCanvas object, enables drag & drop functionality
	 * and inserts extra buttons for saving etc. if the tool is used as standalone.
	 */
	function init() 
	{
		lc = LC.init($('#lc')[0],lcConfig);
		fileInput = $('#file-input');
		if (isStandalone) {
			$('<button type="button" class="controls">Laden</button>').appendTo('#controls')
				.on('click', function(){fileInput.trigger('click');}); // forward to file input
			$('<button type="button" class="controls">Speichern unter</button>').appendTo('#controls')
				.on('click', onSave);
			$('<button type="button" class="controls">Exportieren</button>').appendTo('#controls')
				.on('click', onExport);
			$('<label class="controls">Format: <select name="format" size="1"><option value=".png">PNG</option><option value=".svg">SVG</option></select></label>')
				.appendTo('#controls');
		}
		
		// Set up listeners for the input element.
		// Reset input before opening the file input dialog (on click), so that load is triggered
		// even if the same file is selected again (because we always want to redraw the snapshot).
		fileInput.on('click', function() {
			ignoreOnChange = true;
			fileInput.val('');
			ignoreOnChange = false;
		});
		fileInput.on('change', function(){
			if (!ignoreOnChange) {
				load();
			}
		});
		
		// init drag and drop support
		var dropTarget = $('#lc');
		var dropHandler = function(droppedImage) {
			lc.saveShape(LC.createShape('Image', droppedImage));
		};
		if (enableDropzone) {
			var dropzoneParent = $('.lc-container');
			DragAndDrop.init(true, dropzoneParent, dropTarget, dropHandler)
		} else {
			DragAndDrop.init(false, null, dropTarget, dropHandler);
		}
		
	}
	
	/*
	 * Gets the snapshot from the file that is currently contained in this application's 
	 * file input and renders it.
	 */
	 function load() {
		// TODO alten snapshot speichern?
		if(fileInput[0].files[0]){
			IOHelpers.parseSketchFromFile(fileInput[0].files[0], function(snapshot){
				lc.loadSnapshot(snapshot); // render snapshot
				currentSnapshot = snapshot;
			});
		}
		else {
			alert('Keine Datei ausgewählt');
		}
	}
	
	/**
	 * Saves the current state of the canvas to a .svg-file, gets a name for it and lets the user download it.
	 **/
	function onSave()
	{
		var name = getFileName();
		if (name) {
			exportAs('.gws', name);
		}
		else {
			return;
		}
	}
	
	function onExport()
	{
		// test if there's anything to export at all
		if (!lc.getImage()) {
			alert('Das Bild ist noch leer.');
			return;
		}
		var name = getFileName();
		if(name) {
			var format = $('select[name="format"] :selected').val();
			exportAs(format, name);
		} else {
			return;
		}
	}
	
	/**
	 * Saves the current state of the canvas 
	 */
	function saveCurrentToLocalStorage() 
	{
		
	}
	
	/**
	 * Wraps the the data in a file of format as specified and lets the user download it.
	 **/
	function exportAs(format, name) 
	{
		name += format; // add file extension
		
		if (format === '.png'){
			var data = lc.getImage();
			if (data) {
				IOHelpers.clientDownloadCanvasAsPng(data, name);
				return;
			}
		}
		else if (format === '.svg') {
			var data = getSnapshotAs('svg');
			format = 'image/svg+xml';
		}
		else if( format === '.gws') {
			var data = getSnapshotAs('json')
			format = 'application/gw-sketch';
		}
		else {
			alert('Format "' + format + '" nicht unterstützt');
			return;
		}
		if(data) {
			IOHelpers.clientDownloadBlobbableData(data, name, format);
		}
		else {
			alert("Das Bild ist noch leer.");
		}
	};

	/**
	 * Returns the current state of the canvas in the specified format
	 */
	function getSnapshotAs(format)
	{
		switch(format) {
			case 'png':
				return lc.getImage().toDataURL('image/png');
			case 'jpeg':
				return lc.getImage().toDataURL('image/jpeg');
			case 'svg':
				return lc.getSVGString();
			case 'json':
				return JSON.stringify(lc.getSnapshot());
			default:
				return;
		}
	}
	
	/**
	 * Get a name for a file. Either the user has previously entered a name, or we get a new one.
	 * Returns null if the user was asked to enter a new name but cancelled.
	 */
	function getFileName(getNewName) {
		if (!currentSnapshotName || getNewName) {
			var name = prompt('Dateinamen eingeben:');
			if (!name) {
				return;
			}
			else {
				currentSnapshotName = name;
			}
		}
		return currentSnapshotName;
	}
	

	
	return {
		getSnapshotAs : getSnapshotAs
	};
})();

