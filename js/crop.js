// TODO return separate instance each time init is called. As is, only one instance at a time can exist,
// because in order to initialize the jCrop API object to a different target, it needs to be destroyed first.
// This means losing the old cropper, unless that cropper is a separate instance with its own jCrop object.
// 
// Possibly make this a jQuery pluin to construct it on individual elements.

/**
  * Initializes a cropper that can be used once to crop an image. If cropping is done, the cropper is destroyed and 
  * the handler that was defined upon initialization is called with a data URL representing the cropped image.
  * If an image shall be cropped again, a new cropper neeeds to be initialized.
  */
var Cropper = (function()
{
	var jCrop, target, coordinates;
	
	function init(elementToAttachTo)
	{
		if (jCrop) { // see comment on top
			jCrop.destroy();
		}
		target = elementToAttachTo;
		// Set selection coordinates to full picture
		// x, y: top left corner coordinates; x2, y2: bottom right corner; w,h: selection dimensions
		coordinates = {x:0, y:0, x2:target.width(), y2:target.height(), w:target.width(), h:target.height()};
		jCrop = $.Jcrop(target);
		jCrop.setOptions({
			onChange: function(c) {coordinates = c}
		});
		jCrop.disable(); // Only init, don't show it yet
	}

	/*
	 * Destroys the jCrop plugin (without cropping).
	 */
	function destroy()
	{
		if(jCrop){ // make destroy() safe to call anytime
			jCrop.release()
			jCrop.destroy();
		}
	}

	/*
	 * Starts the cropper. Init needs to be called first.
	 */
	function startCropper()
	{
		jCrop.enable();
		jCrop.setSelect([0, 0, target.width(), target.height()]);
	}

	/**
	 * Crop the image and pass a result object to the handler.
	 * The result object contains a data url and the width and height of the image this url represents.
	 */
	function finishCropper(onCropFinishedHandler) {
		var img = getCroppedImage();
		onCropFinishedHandler(img);
		jCrop.release(); //remove selection
		jCrop.disable();
	}
	
	/**
	 * Returns an object containing
	 * 1) the data URL representing the image this cropper was initialized to (the target), but cropped to the currently set coordinates.
	 * 2) width and height of the cropped image
	 * It does not change the original image.
	 */ 
	function getCroppedImage()
	{
		canvas = $('<canvas/>')
					.attr({width: coordinates.w, height: coordinates.h})
					.hide()
					.appendTo('body'),
		ctx = canvas.get(0).getContext('2d'),
		ctx.drawImage(target.get(0), coordinates.x, coordinates.y, coordinates.w, coordinates.h, 0, 0, coordinates.w, coordinates.h);
		var dataURL = canvas.get(0).toDataURL();
		canvas.remove();
		return {dataURL: dataURL, width: coordinates.w, height: coordinates.h};
	}

	return {
		init:init,
		startCropper:startCropper,
		finishCropper:finishCropper,
		destroy:destroy
	}
})();
