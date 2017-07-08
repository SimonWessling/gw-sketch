var dragAndDropHelpers = (function() 
{	
	var dragged = null;
	
	/*
	 * This function just cancels the default dragover event handler.
	 * This is mandatory, because no drop event would be triggered after the 
	 * default dragover handler ran.
	 */
	function onDragover(event)
	{
		event.preventDefault();
		// TODO prevent shrinking of "ghost" image or mark borders of current drop position or set ghost to corner
	}

	/*
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
	
	/*
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
				reader.onload = function(event) 
				{
					var img = new Image();
					img.src = event.target.result;
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
	
	return {
		onDragover : onDragover,
		makeImageFromEvent : makeImageFromEvent,
		calculateTargetOffsets : calculateTargetOffsets
	}
})();
	