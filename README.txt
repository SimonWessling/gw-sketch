Integration:
- Adapt page title
- Only use literally canvas library as is, since the source code was modified!

The following changes were made to the literally canvas source code in literallycanvas.js:
- fixed missing icon for SelectShape: defined iconName and added img/selectshape.png
- fixed alpha and saturation slider in IE 11: onchange event is not fired on input elements of type range
  => introduce "onMouseUp" to handle slider change in IE, duplicate "onChange" handlers for "onMouseUp"
