var ClipboardPaste = (function() {
	var preventDefault = true;
	var hiddenDiv;

	/**
	 * Set up support for paste from clipboard. 
	 * In Chrome, use Ctrl+V to paste, in Internet Explorer call triggerPaste() (e.g. via button).
	 * Parameters:
	 * dataOnly				set to true if only the data shall be intercepted (prevent default handler)
	 * allowedResultType	String defining what content to look for. Currently, only 'image' is supported
	 * handler				Handler that deals with the result. Note: result can be null.
	 */
	function init(allowedResultType, dataOnly, handler) {
		preventDefault = dataOnly;
		//create contenteditable dummy to receiv paste events, see comment below
		hiddenDiv = $('<!-- dummy for receiving paste events in IE -->' +
					  '<div contenteditable class="dummy" style="height:0; width:0;"></div>')
					  .appendTo('body'); 
		// decide what data to retrieve on paste
		if (allowedResultType === 'image') {
			var retrieveData = getPastedImage
		}else {
			// no other functions supported yet.
			return;
		}
		$('document').on('paste', function(evt){
				retrieveData(evt, handler);
				if (preventDefault){
					evt.preventDefault();
				}
		});
		if(document.addEventListener) { // for Chrome
			document.addEventListener('paste', function(evt){
					retrieveData(evt, handler);
					if (preventDefault){
						evt.preventDefault();
					}
			});
			
		}
	}

	/**
	 * Gets the first image it finds in the paste event, and passes it to the handler.
	 */
	function getPastedImage(evt, handler) {
		var pasteData = interceptDataOnPaste(evt, true); // in Chrome, get files only
		
		if (typeof(pasteData) === 'string'){ 
			// special case for IE, (see description below):
			// If this an image URL, then an image from within the browser was copied
			// TODO check url, for now disallow paste
			var isImageUrl = false;
			if(isImageUrl) {
				var img = new Image();
				img.src = pasteData;
				handler(img);
			}else {
				handler(null);
			}
		} else if(pasteData == null) {
			handler(null);
		}else {
			var itemList = pasteData;
			for (var i = 0; i < itemList.length; i++) {
				if (itemList[i].type.match('^image')) {
					var reader = new FileReader();
					reader.onload = function(loadEvent) 
					{
						var img = new Image();
						img.src = loadEvent.target.result;
						img.onload = function() {
							handler(img);
						}
					};
					reader.readAsDataURL(itemList[i]);
					break; //stop looking for further images
				}
			}
		}	
	}
	
	/**
	 * Get data from system clipboard (tested in Chrome and Internet Explorer 11).
	 *
	 * Here's an outline of the peculiarites of the clipboard in Chrome and IE (from my observations and research as of July 2017):
	 *
	 * In Chrome, the default paste handler will not paste images from the system clipboard, even if the target is contenteditable. 
	 * Therefore, the data needs to be obtained from the paste event and processed explicitly.
	 * In Chrome, pasted images will always be available as files in the event's files property (and also in the items property, but
	 * the latter may also contain other kinds, e.g strings). Set chromeGetFilesOnly to true to get only files.
	 * 
	 * In Internet Explorer, first of all, paste events are fired only if an input or contenteditable element is focused, so this 
	 * condition needs to be ensured before the paste action occurs (this is not necessary in Chrome). Consequently, the target element 
	 * of a paste event in IE is always editable, therefore the default handler will always paste data to it if event propagation is not 
	 * cancelled.
	 * Furthermore, the whole clipboard is separate from the paste event and accessible through window.clipboardData. This clipboardData 
	 * property will contain only files. If this file list is empty, it means that the pasted content originated from within the browser.
	 * In that case, it is accessible through window.clipboardData.getData('Text') in the form of text, where Images will be represented 
	 * by their URL.
	 */
	function interceptDataOnPaste(evt, chromeGetFilesOnly) {
		evt = evt.originalEvent || evt;
		var cbData;
		/** Chrome **/
		if (evt.clipboardData) { 
			if (chromeGetFilesOnly) {
				if (evt.clipboardData.files.length > 0) {
					return evt.clipboardData.files;
				} else{
					return null;
				}
			}
			else {
				return evt.clipboardData.items; // Files will also be included here, plus text/html/... from browser or system
			}
		/** Internet Explorer **/
		} else if (window.clipboardData) { 
			if (window.clipboardData.files && window.clipboardData.files.length > 0) {
				return window.clipboardData.files;
			}
			else {
				// text or HTML content
				return window.clipboardData.getData('URL');
			}
		}
		else {
			// there really was no data
			return null;
		}
	}
	
	/**
	 * Utility to trigger paste event programatically.
	 */
	function triggerPaste() 
	{
		hiddenDiv.focus();
		try {
			// TODO execCommand has no effect in Chrome, detect and inform caller.
			document.execCommand('paste');
			hiddenDiv.blur();
		}catch(e) {
			alert('Einfügen ist durch die Browsereinstellungen deaktiviert. Bitte Strg+V verwenden');
			hiddenDiv.blur();
		}
	}

	return {
		init:init,
		triggerPaste:triggerPaste
	}
})();
