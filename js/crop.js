// TODO return separate instance. As is, only one cropper at a time exists. Also, cropping only works once.
// Possibly attach this to jQuery (construct via element)
// In this way, creating instances is easier and disabling the cropper is possible without destroying the entire instance
var Cropper = (function()
{

	var jCrop, target, finishCropButton, coordinates;
	
	function init(elementToAttachTo)
	{
			target = elementToAttachTo;
			finishCropButton = $('<button type="button" id="finishCropButton" class="extraButton"></button>')
				.on('click', destroy)
				.insertAfter('#startCropButton');
		
		jCrop = $.Jcrop(target);
		jCrop.setOptions({
			setSelect:[0, 0, target.width(), target.height()],
			onChange: setCoordinates
		});
	}
	
	function destroy()
	{
		if(jCrop){ // make destroy() safe to call anytime
			//crop image before destroying (if image was changed)
			finishCropButton.remove();
			if (coordinates) {
				crop(target[0], coordinates);
			}
			jCrop.destroy();
		}
	}
	
	function setCoordinates(c) {
		coordinates = c;
	}
	
	// not used yet, because cropper can only be init'ed and destroyed
	function enable()
	{
		jCrop = $.Jcrop(target);
		jCrop.setOptions({
			setSelect:[0, 0, target.width(), target.height()],
			onChange: setCoordinates
		});
	}
	// not used yet, because cropper can only be init'ed and destroyed
	function disable() {
		jCrop.destroy();
	}
	// not used yet, because cropper can only be init'ed and destroyed
	var toggle = (function() {
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
	
	function crop(img,c)
	{
		canvas = $('<canvas/>')
					.attr({
						 width: c.w,
						 height: c.h
					 })
					.hide()
					.appendTo('body'),
		ctx = canvas.get(0).getContext('2d'),
		ctx.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
		img.src = canvas.get(0).toDataURL();
		var newImage = new Image();
		newImage.src = canvas.get(0).toDataURL();
		newImage.onload = function(loadedImage) {
			// TODO remove dependency -> change only image?
			DragAndDrop.setDropzoneImg(newImage);
		}
		canvas.remove();
	}
	return {
		init:init,
		destroy:destroy
	}
})();