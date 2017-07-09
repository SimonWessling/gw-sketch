/**
 * This module sets up drag and drop support for image file import.
 * If the dropzone is enabled, it inserts an element onto which an image file can be dropped and thereby 
 * inserted into the application. This dropzone is used as a temporary holding area, from which the image 
 * can subsequently be dragged to a different element, the target element.
 * The advantage of the dropzone is that the exact coordinates of the subsequent drop on the target can be
 * calculated (see onTargetDrop() for a more detailed explanation).
 * The dropzone can be enabled and disabled via init().
 * The container to insert the dropzone into as well as the target element and a function to handle the drop on 
 * the target element can also be configured via init().
 */
var DragAndDrop = (function() 
{	
	var enableDropzone = true;
	var dropZoneHtml = '<div id="dropzoneOverlay"></div><span>Ziehen Sie ein Bild per Drag &amp; Drop hierher, um es anschlie&szlig;end in die Skizze einf&uuml;gen zu k&ouml;nnen</span>';
	var defaultHeight = '200px'

	var imageWrapper = null;
	var offsetCorrection = null;
	var dropzoneEnabled = null;
	
	/**
	 * Sets up drag and drop functionality. See description above.
	 * Parameters:
	 * 	 enableDropzone  	Whether or not to display and set up the dropzone
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
	function init(enableDropzone, dropzoneContainer, dropTarget, targetDropHandler) 
	{
		dropzoneEnabled = enableDropzone;
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
				targetDropHandler({x:offsets.x, y:offsets.y, image:img});
			});
		}
	}
	
	/**
	 * Imports the image from the event and inserts it into the dropzone.
	 */
	function onDropzoneDrop(event)
	{
		event.preventDefault();
		makeImageFromEvent(event, function(img) {
			setDropzoneImg(img);
		});
	}
	
	/**
	 * Extracts the image file from the event and creates an HTML DOM image object from it.
	 * Since reading the file is asynchronous, it will pass the finished image to a callback
	 * function that can be used to retrieve the result.
	 * Note: The event must have originated from a file drag, otherwise the files property is not set.
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
				// TODO user feedback: not an image
			}
		}
	}

	/**
	 * Helper function to set an image on the dropzone and take care of the styling. 
	 */
	function setDropzoneImg(img) 
	{
		$('#dropzone')
			.html(img)
			.removeClass('dragover')
			.addClass('dropped')
			.css('height', img.height) // TODO or set img height to fit into dropzone while preserving original size info
	}
	
	/**
	 * Helper function to set up or restore the initial configuration of the dropzone
	 * (e.g. on initialising this module or after the image was dropped elsewhere).
	 */
	function initDropzone()
	{
		
		$('#dropzone')
			.html(dropZoneHtml)
			.removeClass('dropped')
			.css('height', defaultHeight)
			.on('dragstart', setImageWrapper);

		// register handlers
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

	return {
		init : init,
	}
})();
	
