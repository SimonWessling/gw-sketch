var sketchModule = (function () 
{
	/******************************** Configurable options *****************************************************/
	var isStandalone = true;
	var enableDropzone = true;
	var enableImageCropping = true;
	var showBackgroundInitially = 0;
	var lcConfig = {
					imageURLPrefix: 	'libs/literallycanvas-0.4.14/img',
					backgroundColor:	'#fff',
					toolbarPosition: 	'bottom',
					// 					available default tools: 
					//					"Pencil", "Eraser", "Line", "Rectangle", "Ellipse", "Text", "Polygon", 
					// 					"Pan", "Eyedropper", "SelectShape"
					tools:				[LC.tools.Pencil, LC.tools.Eraser, LC.tools.Line, GW_CustomTools.DoubleArrow,
										 LC.tools.Rectangle,LC.tools.Ellipse, LC.tools.Polygon, LC.tools.Text,
										 LC.tools.Pan, LC.tools.SelectShape
					      				],
					      				defaultStrokeWidth: 3,
					      				strokeWidths: 		[1, 2, 3, 5]
	};
	
	/**********************************************************************************************************/
	
	var currentSnapshot = null;
	var lc = null;
	var fileInput = null;
	var dragged = null;
	var ignoreOnChange = false;
	
	$(function() {
		init();
	});
	
	/*
	 * Initializes the literallyCanvas object as well as all components (drag & drop, clipboard, image cropping)
	 * and inserts extra buttons for saving etc. if the tool is used as standalone.
	 */
	function init() 
	{
		lc = LC.init($('#lc')[0],lcConfig);
		fileInput = $('#file-input');
		
		if (isStandalone) {
			$('#controls').show();
		}

		if (showBackgroundInitially) {
			toggleBackground();
		}
		
		// Set up listeners for the input element.
		// Reset input before opening the file input dialog (on click), so that change a event is triggered
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
		var dropzoneParent = (enableDropzone) ? $('#wrapper') : null;
		DragAndDrop.init(enableDropzone, enableImageCropping, dropzoneParent, dropTarget, dropHandler);
		
		// set up pasting from clipboard
		ClipboardPaste.init('image', true, function(img){
			if(img) {
				DragAndDrop.setDropzoneImg(img);
			}else {
				alert('Einfügen nicht möglich. Haben Sie ein Bild in die Zwischenablage kopiert?');
			}
		});
		var pasteButton = $('<button type="button" id="pastebutton" onclick="ClipboardPaste.triggerPaste()"></button>');
		if (enableDropzone) {
			pasteButton.prependTo('#dropzoneToolbar');
		} else {
			pasteButton.addClass('no-dropzone').addClass('controls').prependTo('#controls');
		}
	}
	
	/**
	 * Use this function to load a snapshot (that has previously been exported from this tool)
	 * without any user interaction.
	 */
	function loadSnapshotFromFile(jsonFile)
	{
		IOHelpers.parseSketchFromFile(jsonFile,function(snapshot){
			lc.loadSnapshot(snapshot); // render snapshot
		});
	}
	
	/**
	 * Use this to get the current state of the canvas in the specified format
	 */
	function getSnapshotAs(format)
	{
		renderShapesInProgress();
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
	
	/*
	 * Gets the snapshot from the file that is currently contained in this application's 
	 * file input and renders it.
	 */
	 function load() {
		// TODO alten snapshot speichern?
		if(fileInput[0].files[0]){
			IOHelpers.parseSketchFromFile(fileInput[0].files[0], function(snapshot){
				lc.loadSnapshot(snapshot); // render snapshot
			});
		}
		else {
			alert('Keine Datei ausgewählt');
		}
	}
	
	/**
	 * Enable or disable the background image, without affecting the other shapes.
	 */
	var onToggleBackground = (function() {
		var bgImage = new Image(); 
		bgImage.src = 'images/raster.jpg';
		var bgShape = LC.createShape('Image', {x: 0, y: 0, image: bgImage, scale: 1});
		var active = 0;
		return function() {
			if(active) {
				//deactivate background
				lc.backgroundShapes = [];
				lc.repaintLayer('background');
				active = (active+1)%2;
			}else {
				//activate
				lc.backgroundShapes = [bgShape];
				lc.repaintLayer('background');
				active = (active+1)%2;
			}
		}
	})();
	
	
	/**
	 * Simply forward the click to the file input.
	 */
	function onLoad() {
		fileInput.trigger('click');
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
		renderShapesInProgress();
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
	 * Wraps the the data in a file of format as specified and lets the user download it.
	 **/
	function exportAs(format, name) 
	{
		renderShapesInProgress();
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
	 * Encapsulates the logic of getting a name for the file.
	 */
	function getFileName() 
	{
		var name = prompt('Dateinamen eingeben:');
		return name;
	}
	
	/**
	 * Repaint canvas with all shapes in progress (i.e. shapes that are currently being edited). 
	 * This should be called before saving or exporting, otherwise shapes in progress will not be included.
	 */
	function renderShapesInProgress() {
		lc.shapes.concat(lc.shapesInProgress);
		if(lc.tool.currentShape) {
			lc.shapes.push(lc.tool.currentShape);
		}
		lc.repaintLayer('main');
	}	
	
	return {
		/** Exports for standalone version (used by control buttons) **/
		onLoad : onLoad,
		onSave : onSave,
		onExport : onExport,
		onToggleBackground : onToggleBackground,
		/** Exports for integrated version **/
		init : init,
		loadSnapshotFromFile : loadSnapshotFromFile,
		getSnapshotAs : getSnapshotAs
	};
})();

