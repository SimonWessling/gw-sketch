/**
 * This module sets up drag and drop support for image file import.
 * If the dropzone is enabled, it inserts an element onto which an image file can be dropped and thereby 
 * inserted into the application. This dropzone is used as a temporary holding area, from which the image 
 * can subsequently be dragged to a different element, the target element.
 * An image cropping feature can also be enabled, see the respective source (crop.js) code for a description.
 * The advantage of the dropzone is that the exact coordinates of the subsequent drop on the target can be
 * calculated (see onTargetDrop() for a more detailed explanation).
 * The dropzone can be enabled and disabled via init().
 * The container to insert the dropzone into as well as the target element and a function to handle the drop on 
 * the target element can also be configured via init().
 */
var DragAndDrop = (function() 
{	
	var dropZoneHtml = '<div id="dropzoneOverlay"></div><span>'+
	'Ziehen Sie ein Bild per Drag &amp; Drop hierher, um es anschlie&szlig;end in die Skizze einf&uuml;gen zu k&ouml;nnen</span>';
	var imageWrapper, offsetCorrection, dropzoneEnabled, croppingEnabled, dropzoneEmpty;
	
	/**
	 * Sets up drag and drop functionality. See description above.
	 * Parameters:
	 * 	 enableDropzone  	Whether or not to display and set up the dropzone
	 *	 enableCropping		Whether or not to enable imag cropping after an image is dropped
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
		if (dropzoneEnabled){
			dropzoneContainer.append('<div id="dropzone"></div>');
			initDropzone();
		}
		// register the handler for the target drop event
		dropTarget
			.on('dragover', onDragover)
			.on('drop', function(event) {
				event.preventDefault();
				onTargetDrop(event, targetDropHandler);
			});
		// disable drop for other elements
		onBodyDropPreventDefault();
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
		// TODO refactor: fire custom 'dropzone reset' event to inform other tools
		// rather than invoking methods on dependncies
		if (croppingEnabled) {
			Cropper.destroy();
			$('#startCropButton').remove();
		}
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
			$('#dropzone')
				.removeClass('dropped')
				.removeClass('dragover')
			$('#dropzoneOverlay')
				.removeClass('dropped')
				.removeClass('dragover');
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
			.css('height', img.height) // TODO or set img height to fit into dropzone while preserving original size info
		$('#wrapper').css('display', 'block'); // disable flex display
		
		// TODO fire custom 'dropzone image changed' or 'dropzone now has image' event
		// This decouples the tools (such as cropper) from the dropzone and facilitates integration of other tools,
		// because other components only need to register (i.e. cropping tool) and can define the handling themselves.
		// Idea: implement toggleDropzoneEmpty that fires the events, call in setDropzoneImg and initDropzone.
		if (croppingEnabled && dropzoneEmpty) {
			startCropButton = $('<button type="button" id="startCropButton" class="extraButton"></button>')
				.on('click', function() {
					Cropper.init($(img));
				})
				.insertAfter('#pastebutton');
		}
		dropzoneEmpty = false;
	}
	
		var toggleCropper = (function() {
		var active = 0;	
		// x, y: top left corner coordinates; x1, x2: bottom right corner; w,h: selection dimensions
		//var coordinates = {x:0, y:0, x1:target.width(), x2:target.height(), w:target.width(), h:target.height()};
		var coordinates;
		var setCoordinates = function(c) {
			coordinates = c;
		}
		return function() {
			if(!active) {
				//activate
				enable();
				active = (active+1)%2;
			}else {
				//crop image accordingly, then disable
				crop(target[0], coordinates);
				disable();
				active = (active+1)%2;
			}
		}
	})();
	
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
	
