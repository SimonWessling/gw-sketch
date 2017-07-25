var IOHelpers = (function() {
	
	var localStorageSupported = window.Storage ? true : false;
	
	/**
	 * Persists an object to in-browser storage under the given name.
	 */
	function saveToLocalStorage(obj, name)
	{
		if (!name) {
			return;
		}
		
		if (localStorageSupported) {
				localStorage.setItem(name, JSON.stringify(obj));
		}
		else {
			// TODO error handling no storage
		}
	};

	/**
	 * Loads a persisted object (as identified by the name) from in-browser storage.
	 */
	function getFromLocalStorage(name) 
	{
		if (!name) {
			return;
		}
		if (localStorageSupported) {
			var obj = JSON.parse(localStorage.getItem(name));
			if (obj) {
				return obj;
			}
			else {
				// TODO
				alert("Keine Skizze mit diesem Namen gefunden!");
			}	
		} else {
			// TODO error handling no storage
		}
	}
	


	/**
	 * A cross-browser tool to initiate downloading of data to the client file system.
	 * The data being passed in must be ready to be put into a blob. 
	 */
	function clientDownloadBlobbableData(data, name, type)
	{
		var blob = new Blob([data], {type: type});
		if (window.navigator.msSaveOrOpenBlob) {
		// Internet Explorer can be instructed to download blobs directly
			window.navigator.msSaveOrOpenBlob(blob, name);
		}
		// Other browsers support the download attribute
		else {
			var url = URL.createObjectURL(new Blob([data], {type: type}));
			var a = document.createElement('a');
			a.download = name;
			a.href = url;
			a.click();
			URL.revokeObjectURL(url);
		}
	}
	
	/**
	 * Initiate download of a canvas as png to the client file system.
	 */
	function clientDownloadCanvasAsPng(canvas, name)
	{
		if (window.navigator.msSaveOrOpenBlob && canvas.msToBlob) {
				var blob = canvas.msToBlob(); // canvas to blob
				window.navigator.msSaveOrOpenBlob(blob, name);
		}
		else {
			var a = document.createElement('a');
			a.download = name;
			a.href = canvas.toDataURL('image/png');
			document.body.appendChild(a);
//			a.click();
		}
	}
	
	function parseSketchFromFile(file, handler)
	{
		// TODO check mime type
		// if (file.type == 'application/gw-sketch') {
				var reader = new FileReader();
				reader.onload = function(loadEvent) 
				{
					handler(JSON.parse(loadEvent.target.result));
				};
				reader.readAsText(file);
		// }
		// else {
			// TODO
			// alert('Die ausgewählte Datei ist keine Skizze.');
		// }
	}
	
	return {
		saveToLocalStorage:saveToLocalStorage,
		getFromLocalStorage:getFromLocalStorage,
		parseSketchFromFile:parseSketchFromFile,
		clientDownloadBlobbableData:clientDownloadBlobbableData,
		clientDownloadCanvasAsPng:clientDownloadCanvasAsPng
	}

})();
