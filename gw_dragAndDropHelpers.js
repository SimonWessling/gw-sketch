var dragAndDropHelpers = (function() 
{	
	var dragged = null;
	
	function getDraggedObject(event) 
	{
		// Absolute position (x,y) of the element that is being dragged
//		var viewPortPosition = ($(event.target).parent().position();
		var position = event.target.getBoundingClientRect();
	    // the drop event coordinates are that of the mouse, 
		// but we need the distances relative to the top left corner of the element
		// (In other words, the point of the element where it is "grabbed")
	    var offsetX = event.clientX - position.left;
	    var offsetY = event.clientY - position.top;
	    var img = document.createElement('img');
		img.src = event.target.src
	    dragged = {offsetX: offsetX, offsetY: offsetY, img: event.target};
		return {offsetX: offsetX, offsetY: offsetY, img: img};
	}
	
	/*
	 * This function just cancels the default dragover event handler.
	 * This is mandatory, because no drop event would be triggered after the 
	 * default dragover handler ran.
	 */
	function onDragover(event)
	{
		event.preventDefault();
		// TODO prevent shrinking of "ghost" image or mark borders of current drop position
	}
	
	function getDroppedObject(event)
	{
		event.preventDefault();
		event.stopPropagation();
		
		// Again, we get absolute mouse coordinates but need an offset.
		var targetPosition = event.target.getBoundingClientRect();
		var offsetX = event.clientX - targetPosition.left - dragged.offsetX;
		var offsetY = event.clientY - targetPosition.top - dragged.offsetY;
		
		// TODO make sure that the element being dropped is an image
		// object corresponds to LC.createShape option parameter
		var dropped = {x: offsetX, y:offsetY, image:dragged.img};
		dragged = null; // consume the dragged element
		return dropped;
	}
	
	return {
		getDraggedObject : getDraggedObject,
		onDragover : onDragover,
		getDroppedObject : getDroppedObject,
	}
})();
	