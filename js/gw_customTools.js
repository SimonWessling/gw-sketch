var GW_CustomTools = (function() 
{
	var DoubleArrow = function(lc) {
	  var self = this;
		return {
			name: 'DoubleArrow',
			iconName: 'double-arrow',
			strokeWidth: lc.opts.defaultStrokeWidth,
			optionsStyle: 'stroke-width',
			usesSimpleAPI: false,
			
			didBecomeActive: function(lc) {
				var onStrokeWidthChanged = function(arg) {
					self.strokeWidth = arg;
				};
				var onPointerDown = function(pt) {
					self.currentShape = LC.createShape('Line', {
						x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y,
						strokeWidth: self.strokeWidth, color: lc.getColor('primary')});
					self.currentShape.endCapShapes= ["arrow", "arrow"];
					lc.setShapesInProgress([self.currentShape]);
					lc.repaintLayer('main');
				};

				var onPointerDrag = function(pt) {
					self.currentShape.x2 = pt.x;
					self.currentShape.y2 = pt.y;
					lc.setShapesInProgress([self.currentShape]);
					lc.repaintLayer('main');
				};

				var onPointerUp = function(pt) {
					self.currentShape.x2 = pt.x;
					self.currentShape.y2 = pt.y;
					lc.setShapesInProgress([]);
					lc.saveShape(self.currentShape);
				};

				var onPointerMove = function(){};

				self.unsubscribeFuncs = [
					lc.on('lc-pointerdown', onPointerDown),
					lc.on('lc-pointerdrag', onPointerDrag),
					lc.on('lc-pointerup', onPointerUp),
					lc.on('lc-pointermove', onPointerMove),
					lc.on('setStrokeWidth', onStrokeWidthChanged)
				];
			},

			willBecomeInactive: function(lc) {
			  self.unsubscribeFuncs.map(function(f) { f() });
			}
		}
	};
	return {
		DoubleArrow : DoubleArrow
	}
})();

