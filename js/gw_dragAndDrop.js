/**
 * This module sets up drag and drop support for image file import.
 * If the dropzone is enabled, it inserts an element onto which an image file can be dropped and thereby 
 * inserted into the application. This dropzone is used as a temporary holding area, from which the image 
 * can subsequently be dragged to a different element, the target element. The dropzone can be enabled and 
 * disabled via init().
 * The dropzone contains a toolbar that is shown when an image is available. Tools can be added to this toolbar
 * by adding them in the function showHiddenDropzoneTools();
 * An image cropping feature is already attached, this can also be enabled and disabled.
 * Besides offering the possibility of attaching tools to it, the advantage of the dropzone is that the exact 
 * coordinates of the subsequent drop on the target can be calculated (see onTargetDrop() for a more detailed explanation).

 */
var DragAndDrop = (function() 
{	
	var imageWrapper, offsetCorrection, dropzoneEnabled, croppingEnabled, dropzoneEmpty, startCropButton, finishCropButton;
	var isIE = navigator.userAgent.toLowerCase().indexOf('Trident') > -1;
	if (isIE) {
		var dropzoneInstructions ='Ziehen Sie ein Bild per Drag &amp; Drop hierher oder f&uuml;gen Sie es über den Button aus der Zwischenablage ein';
	}else {
		var dropzoneInstructions ='Ziehen Sie ein Bild per Drag &amp; Drop hierher oder f&uuml;gen Sie es per Strg+V aus der Zwischenablage ein';
	}
	dropzoneInstructions +=  '. Anschlie&szlig;end k&ouml;nnen Sie es in die Skizze schieben.';
	var dropZoneHtml = '<div id="dropzoneOverlay"></div><span>' + dropzoneInstructions + '</span>';	

	
	/**
	 * Sets up drag and drop functionality. See description above.
	 * Parameters:
	 * 	 enableDropzone  	Whether or not to display and set up the dropzone
	 *	 enableCropping		Whether or not to display the image cropping button after an image is dropped.
	 * 	 dropzoneContainer 	A jQuery element to insert the dropzone into. Pass null, if dropzone disabled
	 * 	 dropTarget			A jQuery element onto which images shall be droppable
	 * 	 targetDropHandler	A handler to define what to do when the image is dropped onto dropTarget
	 * 
	 * Note: The image passed to the handler will be wrapped in an object containing the offset of its
	 * top left corner relative to the dropTarget at the time of the drop, e.g:
	 * {x: 42, y: 100, image: <HTML DOM image element>}
	 * If the image has not previously been dropped onto the dropzone, the offsets as defined above cannot
	 * be computed and will thus be set to the (absolute) mouse coordinates.
	 */
	function init(enableDropzone, enableCropping, dropzoneContainer, dropTarget, targetDropHandler) 
	{
		dropzoneEnabled = enableDropzone;
		croppingEnabled = enableCropping;

		// register the handler for the target drop event
		dropTarget
			.on('dragover', onDragover)
			.on('drop', function(event) {
				event.preventDefault();
				onTargetDrop(event, targetDropHandler);
			});

		// disable drop for other elements
		onBodyDropPreventDefault();

		// enable dropzone if necessary
		if (dropzoneEnabled){
			dropzoneContainer.append('<div id="dropzoneToolbar"></div><div id="dropzone"></div>');

			// enable cropping feature if necessary
			if(croppingEnabled){
				initCropperTool();
			}
			initDropzone();
		}
	}

	/**
	 *	Initializes the buttons to start and end the cropping tool.
	 */
	function initCropperTool()
	{
		startCropButton = $('<button type="button" id="startCropButton" </button>')
			.on('click', function() {
				Cropper.init($('#croppable'));
				Cropper.startCropper();
				finishCropButton.show();
			})
			.appendTo('#dropzoneToolbar')

		finishCropButton = $('<button type="button" id="finishCropButton"</button>')
			.on('click', function(){
				Cropper.finishCropper(function(croppedImage) {
					var newImage = new Image();
					newImage.src = croppedImage.dataURL;
					newImage.onload = function(loadevent) {
						setDropzoneImg(loadevent.target);
					};
				});
				Cropper.destroy(); // Cropper needs to be removed entirely to make the image draggable again
				$(this).hide();})
			.insertAfter('#startCropButton')
			.hide();
	}
	
	/**
	 * Helper function to set up or restore the initial configuration of the dropzone
	 * (e.g. on initialising this module or after the image was dropped elsewhere).
	 */
	function initDropzone()
	{
		// reset dropzone
		$('#dropzone')
			.html(dropZoneHtml)
			.removeClass('dropped')
			.removeClass('dragover')
			.css('height', '')
			.on('dragstart', setImageWrapper);
		$('#dropzoneOverlay')
			.html('')
			.removeClass('dropped')
			.removeClass('dragover');
		$('#wrapper').css('display', '');
		
		// (re-)register handlers
		$('#dropzoneOverlay')
			.on('dragenter', function(event){
				event.preventDefault();
				$('#dropzone').addClass('dragover');
			})
			.on('dragover', onDragover)
			.on('dragleave', function(event) {
				event.preventDefault();
				$('#dropzone').removeClass('dragover');
			})
			.on('drop', function(event) {
				event.preventDefault();
				onDropzoneDrop(event);
			});
		if (croppingEnabled) {
			Cropper.destroy();
		}
		hideDropzoneTools();
		dropzoneEmpty = true;
	}
	
	/**
	 * On a drop event at the target, fetch the image that was dropped, wrap it with its
	 * coordinates (as described in init()) and pass it to the drop handler.
	 */
	function onTargetDrop(event, targetDropHandler)
	{
		event.preventDefault();
			
		offsets = calculateTargetOffsets(event);
		// The image drag originated from the dropzone, so we already have the image in our local
		// variable and can also correct the image offset
		if (dropzoneEnabled && imageWrapper) {
			imageWrapper.x = offsets.x - imageWrapper.x;
			imageWrapper.y = offsets.y - imageWrapper.y;
			// let the handler take it from here
			targetDropHandler(imageWrapper);
			initDropzone();
			imageWrapper = null;
		
		// The image originated from a file drop, so construct the image first. No correction possible
		} else {
			var image = makeImageFromEvent(event, function(img) {
				if(img) {
					targetDropHandler({x:offsets.x, y:offsets.y, image:img});
				}
				else {
					alert('Bitte nur Bilddateien einfügen');
				}
			});
		}
	}
	
	/**
	 * Imports the image from the event and inserts it into the dropzone. If the dropped object
	 * is not an image, rejects the drop and resets the dropzone.
	 */
	function onDropzoneDrop(event)
	{
		event.preventDefault();
		if (!event.originalEvent.dataTransfer.files[0]) {
			return;
		}
		//make sure it's an image
		if (event.originalEvent.dataTransfer.files[0].type.match(/image.*/)) {
			makeImageFromEvent(event, function(img) {
				img.id = 'croppable';
				setDropzoneImg(img);
			});
		}else {
			alert('Bitte hier nur Bilder einfügen');
			if (dropzoneEmpty) {		
				$('#dropzone')
					.removeClass('dropped')
					.removeClass('dragover')
				$('#dropzoneOverlay')
					.removeClass('dropped')
					.removeClass('dragover');
				}
			}
	}
	
	/**
	 * Extracts the image file from the event and creates an HTML DOM image object from it.
	 * Since reading the file is asynchronous, it will pass the finished image to a callback
	 * function that can be used to retrieve the result.
	 * Note: The event must have originated from a file drag, otherwise the files property is not set
	 * and this function returns false.
	 */
	function makeImageFromEvent(event, onFinish) 
	{
		if (event.originalEvent.dataTransfer.files[0]) {
			var imgFile = event.originalEvent.dataTransfer.files[0];
			// make sure it's an image
			if (imgFile.type.match(/image.*/)) {
				var reader = new FileReader();
				// process the image when it's read in,
				reader.onload = function(loadEvent) 
				{
					var img = new Image();
					img.src = loadEvent.target.result;
					// call the callback function only when the image is loaded,
					// so that the image dimensions are set
					img.onload = function() {
						onFinish(img);
						img.onload = null;
					}
				};
				// start reading in
				reader.readAsDataURL(imgFile)
			} else {
				onFinish(false);
			}
		}
	}

	/**
	 * Helper function to set an image on the dropzone and take care of the styling.
	 * This will also set up the image cropper tool.
	 */
	function setDropzoneImg(img) 
	{
		$('#dropzoneOverlay')
			.html(img)
			.addClass('dropped');
		$('#dropzone')
			.removeClass('dragover')
			.addClass('dropped')
			.css('height', img.height) // TODO alternative: set img height to fit into dropzone while preserving original size info?
		$('#wrapper').css('display', 'block'); // disable flex display
		
		if (croppingEnabled) {
			img.id = 'croppable';
		}
		dropzoneEmpty = false;
		hideDropzoneTools(); // in case a tool was interrupted by setDropzoneImg
		showHiddenDropzoneTools();
	}
	/**
	 * This function is called when an image is set on the dropzone. Place buttons for further tools here, if they shall only be
	 * available if an image is set.
	 */
	function showHiddenDropzoneTools() {
		if (croppingEnabled) {
			startCropButton.show();
		}
	}

	/**
	 * Called when the dropzone is reset, i.e. no image is present anymore.
	 */
	function hideDropzoneTools() {
		startCropButton.hide();
		finishCropButton.hide();
	}

	/**
	 * Wrap the image that is currently dragged away from the dropzone with
	 * the coordinates where it was grabbed (relative to its top left corner).
	 */
	function setImageWrapper(event)
	{
		offsetCorrection = calculateTargetOffsets(event);
		imageWrapper = {x: offsetCorrection.x, y: offsetCorrection.y, image: event.target};
	}

	/**
	 * Converts the absolute coordinates of a drop event (i.e. the mouse position
	 * at the time of the drop) into coordinates relative to the target 
	 * (i.e. the mouse coordinates with the target's top left corner as the origin).
	 */
	function calculateTargetOffsets(event) 
	{
		var targetPosition = event.target.getBoundingClientRect();
		var offsetX = event.clientX - targetPosition.left;
		var offsetY = event.clientY - targetPosition.top;
		return {x : offsetX, y : offsetY};
	}
	
	/**
	 * This function just cancels the default dragover event handler.
	 * This is needed, because no drop event would be triggered after the 
	 * default dragover handler ran.
	 */
	function onDragover(event)
	{
		event.preventDefault();
		// TODO prevent shrinking of "ghost" image or mark borders of current drop position or set ghost to corner
	}
	
	/**
	 * To prevent the browser from opening an image when it is (accidentally) dropped outside of the dropzone,
	 * disable drop on body and document.
	 */
	function onBodyDropPreventDefault(){
		$('body').on('dragover drop', function(e) { e.preventDefault(); });
		$(document).on('dragover dragend drop', function(e) {
			e.stopPropagation();
			e.preventDefault();
		});
	}
	
	return {
		init:init,
		setDropzoneImg:setDropzoneImg,
	}
})();
	
