# GWSketch

This is a sketching tool that allows drawing to a canvas with various tools known from common photo editing software.
It was developed as a first prototype for Gelsenwasser AG within ten days and is based on the Literally Canvas library.

**Features**
* Load a sketch to continue drawing, save it and export it as png or jpeg
* Drag and drop image files to a dropzone to import them
* Paste images from system clipboard via Ctrl+V in Chrome or via the paste button in Internet Explorer
* Crop images in the dropzone
* Custom "double arrow" tool
* Toggle background raster

## Compatibility

Tested in 
* Google Chrome 59
* Internet Explorer 11

## Installation

The tool was designed to be used both as a standalone tool and integrated into other tools.
It can be used offline, since all dependencies are included in the project folder. Just copy all the files to where you need them.
Note: The Literally Canvas library had to be modified because of bugs. The following changes were made to literallycanvas.js:
- fixed missing icon for SelectShape: defined iconName and added img/selectshape.png
- fixed alpha and saturation slider: due to a bug in IE 11, the onchange event is not fired on input elements of type range
  => introduce "onMouseUp" to handle slider change in IE, duplicate "onChange" handlers for "onMouseUp"

#### Use as standalone tool

Open index.html in a browser and paint ahead ☺ Use the buttons to download, load and export the sketch (aka snapshot).

#### Integrate into another app

Open js/gw_sketch.js and set isStandalone to false.
In this mode, the buttons are not shown. Interact with the tool via sketchModule.getSnapshotAs() to retrieve the sketch in different formats and
via sketchModule.loadFromFile() to load a sketch from a file that has previously been exported from this tool (preferrably save those files as *.gws).

## Configure

All configurations are centralized in js/gw_sketch.js, which is the main file that puts together all the components.
Here you can enable and disable some of the features, set which tools to show and further options for Literally Canvas.

To change styling, modify css/custom.css. Literally Canvas has its own CSS files, but those need not be modified.
To change the tool icons, replace the images in libs/literallycanvas-0.4.14/img. Button icons for pasting and cropping can be found in the images
folder in the project root.

Last but not least: Maybe you want to choose a new page title? Set it in index.html!

## Extend

The GW_CustomTools module in gw_customTools.js contains tools that extend the Literally Canvas default tools through the Literally Canvas API.
Implement new tools in this file (see [Literally Canvas documentation](http://literallycanvas.com/api/tools.html) for the API) and add them to the 
loaded tools in the lcConfig property in gw_sketch.js.

The dropzone contains a toolbar that holds tools that shall only be available when an image is available in the dropzone (e.g. the image cropping tool).
New tools can be added here by inserting them in showHiddenDropzoneTools() in js/gw_dragAndDrop.js

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Author

Simon Wessling

