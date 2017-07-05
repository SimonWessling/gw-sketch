var sketchModule = (function () 
{
	/******************************** Configurable options ********************************************/
	var isStandalone = true;
	var lcConfig = {
//			onInit:				
					imageURLPrefix: 	'libs/literallycanvas-0.4.14/img',
					backgroundColor:	'#fff',
					toolbarPosition: 	'bottom',
					tools:				[
					      				 LC.tools.Pencil,
					      				 LC.tools.Eraser,
					      				 LC.tools.Line,
					      				 LC.tools.Rectangle,
					      				 LC.tools.Text,    						
					      				 ],
					      				 defaultStrokeWidth: 3,
					      				 strokeWidths: 		[1, 2, 3, 5]
	};
	
	/******************************** "Private" variables ********************************************/
	
	var moduleName = 'sketchModule'; // needs to correspond to the name of the variable this module is held in
	var localStorageSupported = typeof(Storage) == "undefined" ? false : true;
	var currentSnapshot = null;
	var currentSnapshotName = null;
	var lc = null;
	
	/******************************** "Private" functions ********************************************/
	
	/*
	 * Displays extra control buttons for the basic functions.
	 */
	initExtraControls = function()
	{
		$('#controls').append(
			 '<button type="button" class="controls" onclick="' + moduleName + '.load()">Laden</button>'
			+'<button type="button" class="controls" onclick="' + moduleName + '.save()">Speichern</button>'
			+'<button type="button" class="controls" onclick="' + moduleName + '.save(true)">Speichern unter</button>'
			+'<button type="button" class="controls" onclick="' + moduleName + '.exportAs(\'png\')">Exportieren</button>'
		);
	},
	
	
	/*
	 * Persists the current state to local storage under the given name.
	 */
	saveSnapshotUnderName = function(snapshotName)
	{
		if (!snapshotName) {
			return;
		}
		currentSnapshot = lc.getSnapshot();
		
		if (localStorageSupported) {
				localStorage.setItem(snapshotName, JSON.stringify(currentSnapshot));
		}
		else {
			// TODO error handling no storage
		}
	};

	/*
	 * Loads a persisted snapshot (as identified by the name) and renders it.
	 */
	loadSnapshotByName = function(snapshotName) 
	{
		if (!snapshotName) {
			return;
		}
		if (localStorageSupported) {
			var snapshot = JSON.parse(localStorage.getItem(snapshotName));
			if (snapshot) {
				lc.loadSnapshot(snapshot); // render snapshot
				currentSnapshot = snapshot;
			}
			else {
				// TODO
				alert("Keine Skizze mit diesem Namen gefunden!");
			}	
		} else {
			// TODO error handling no storage
		}
	}
	
	/******************************** "Public" API ********************************************/
	return {
		
		/*
		 * Initializes the literallyCanvas object and the extra buttons (if standalone)
		 */
		init: function() 
		{
			lc = LC.init(
					document.getElementById('lc'),
					lcConfig
			);
			if (isStandalone) {
				initExtraControls();
			}
		},

		/*
		 * Wraps the logic of persisting snapshots by getting a file name if necessary
		 * and then persisting the current state under that name.
		 */
		save : function(getNewName = false) {
			if (getNewName || !currentSnapshotName) { 
				currentSnapshotName = prompt('Speichern als:'); // TODO
				// TODO user feedback: Name der aktuellen Skizze anzeigen
				if (!currentSnapshotName)
					return;
			}
			saveSnapshotUnderName(currentSnapshotName);
			// TODO user feedback
		},
	
		/*
		 * Wraps the logic of loading a sketch by getting the name of the sketch
		 * and loading it.
		 */
		load : function() {
			// TODO alten snapshot speichern?
			currentSnapshotName = prompt('Name der zu ladenden Skizze:');
			if (currentSnapshotName) {
				loadSnapshotByName(currentSnapshotName);	
			}
		},
	
		/*
		 * Returns the current state as either png or svg
		 */
		exportAs : function(format) {
			if (format == 'png') {
				var image = lc.getImage();
				if(image) {
					return image.toDataURL();
				} else {
					//TODO warn: empty image
					return null;
				}
			}
			else if (format == 'svg'){
	
			}
			else {
				// Format nicht unterstützt
			}
		}
	};
})();

$(function() {
	sketchModule.init();
});

