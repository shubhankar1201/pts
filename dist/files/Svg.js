"use strict";
// Source code licensed under Apache License 2.0. 
// Copyright © 2017 William Ngan. (https://github.com/williamngan/pts)
Object.defineProperty(exports, "__esModule", { value: true });
const Form_1 = require("./Form");
const Num_1 = require("./Num");
const Util_1 = require("./Util");
const Pt_1 = require("./Pt");
const Op_1 = require("./Op");
const Dom_1 = require("./Dom");
/**
 * A Space for SVG elements
 */
class SVGSpace extends Dom_1.DOMSpace {
    /**
    * Create a SVGSpace which represents a Space for SVG elements
    * @param elem Specify an element by its "id" attribute as string, or by the element object itself. An element can be an existing `<svg>`, or a `<div>` container in which a new `<svg>` will be created. If left empty, a `<div id="pt_container"><svg id="pt" /></div>` will be added to DOM. Use css to customize its appearance if needed.
    * @param callback an optional callback `function(boundingBox, spaceElement)` to be called when canvas is appended and ready. Alternatively, a "ready" event will also be fired from the `<svg>` element when it's appended, which can be traced with `spaceInstance.canvas.addEventListener("ready")`
    * @example `new SVGSpace( "#myElementID" )`
    */
    constructor(elem, callback) {
        super(elem, callback);
        this.id = "svgspace";
        this._bgcolor = "#999";
        if (this._canvas.nodeName.toLowerCase() != "svg") {
            let s = SVGSpace.svgElement(this._canvas, "svg", `${this.id}_svg`);
            this._container = this._canvas;
            this._canvas = s;
        }
    }
    /**
    * Get a new `SVGForm` for drawing
    * @see `SVGForm`
    */
    getForm() { return new SVGForm(this); }
    /**
    * Get the html element
    */
    get element() {
        return this._canvas;
    }
    /**
    * This overrides Space's `resize` function. It's used as a callback function for window's resize event and not usually called directly. You can keep track of resize events with `resize: (bound ,evt)` callback in your player objects (See `Space`'s `add()` function).
    * @param b a Bound object to resize to
    * @param evt Optionally pass a resize event
    */
    resize(b, evt) {
        super.resize(b, evt);
        SVGSpace.setAttr(this.element, {
            "viewBox": `0 0 ${this.bound.width} ${this.bound.height}`,
            "width": `${this.bound.width}`,
            "height": `${this.bound.height}`,
            "xmlns": "http://www.w3.org/2000/svg",
            "version": "1.1"
        });
        return this;
    }
    /**
     * A static function to add a svg element inside a node. Usually you don't need to use this directly. See methods in `SVGForm` instead.
     * @param parent the parent element, or `null` to use current `<svg>` as parent.
     * @param name a string of element name,  such as `rect` or `circle`
     * @param id id attribute of the new element
     */
    static svgElement(parent, name, id) {
        if (!parent || !parent.appendChild)
            throw new Error("parent is not a valid DOM element");
        let elem = document.querySelector(`#${id}`);
        if (!elem) {
            elem = document.createElementNS("http://www.w3.org/2000/svg", name);
            elem.setAttribute("id", id);
            parent.appendChild(elem);
        }
        return elem;
    }
    /**
    * Remove an item from this Space
    * @param item a player item with an auto-assigned `animateID` property
    */
    remove(player) {
        let temp = this._container.querySelectorAll("." + SVGForm.scopeID(player));
        temp.forEach((el) => {
            el.parentNode.removeChild(el);
        });
        return super.remove(player);
    }
    /**
     * Remove all items from this Space
     */
    removeAll() {
        this._container.innerHTML = "";
        return super.removeAll();
    }
}
exports.SVGSpace = SVGSpace;
/**
* SVGForm is an implementation of abstract class VisualForm. It provide methods to express Pts on SVGSpace.
* You may extend SVGForm to implement your own expressions for SVGSpace.
*/
class SVGForm extends Form_1.VisualForm {
    /**
    * Create a new SVGForm. You may also use `space.getForm()` to get the default form.
    * @param space an instance of SVGSpace
    */
    constructor(space) {
        super();
        this._ctx = {
            group: null,
            groupID: "pts",
            groupCount: 0,
            currentID: "pts0",
            currentClass: "",
            style: {
                "filled": true,
                "stroked": true,
                "fill": "#f03",
                "stroke": "#fff",
                "stroke-width": 1,
                "stroke-linejoin": "bevel",
                "stroke-linecap": "sqaure"
            },
            font: "11px sans-serif",
            fontSize: 11,
            fontFamily: "sans-serif"
        };
        this._ready = false;
        this._space = space;
        this._space.add({ start: () => {
                this._ctx.group = this._space.element;
                this._ctx.groupID = "pts_svg_" + (SVGForm.groupID++);
                this._ready = true;
            } });
    }
    /**
    * get the SVGSpace instance that this form is associated with
    */
    get space() { return this._space; }
    /**
     * Update a style in _ctx context or throw an Erorr if the style doesn't exist
     * @param k style key
     * @param v  style value
     */
    styleTo(k, v) {
        if (this._ctx.style[k] === undefined)
            throw new Error(`${k} style property doesn't exist`);
        this._ctx.style[k] = v;
    }
    /**
      * Set current fill style. Provide a valid color string or `false` to specify no fill color.
      * @example `form.fill("#F90")`, `form.fill("rgba(0,0,0,.5")`, `form.fill(false)`
      * @param c fill color
      */
    fill(c) {
        if (typeof c == "boolean") {
            this.styleTo("filled", c);
        }
        else {
            this.styleTo("filled", true);
            this.styleTo("fill", c);
        }
        return this;
    }
    /**
      * Set current stroke style. Provide a valid color string or `false` to specify no stroke color.
      * @example `form.stroke("#F90")`, `form.stroke("rgba(0,0,0,.5")`, `form.stroke(false)`, `form.stroke("#000", 0.5, 'round', 'square')`
      * @param c stroke color which can be as color, gradient, or pattern. (See [canvas documentation](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/strokeStyle))
      * @param width Optional value (can be floating point) to set line width
      * @param linejoin Optional string to set line joint style. Can be "miter", "bevel", or "round".
      * @param linecap Optional string to set line cap style. Can be "butt", "round", or "square".
      */
    stroke(c, width, linejoin, linecap) {
        if (typeof c == "boolean") {
            this.styleTo("stroked", c);
        }
        else {
            this.styleTo("stroked", true);
            this.styleTo("stroke", c);
            if (width)
                this.styleTo("stroke-width", width);
            if (linejoin)
                this.styleTo("stroke-linejoin", linejoin);
            if (linecap)
                this.styleTo("stroke-linecap", linecap);
        }
        return this;
    }
    /**
     * Add custom class to the created element
     * @param c custom class name or `false` to reset it
     * @example `form.fill("#f00").cls("myClass").rects(r)` `form.cls(false).circles(c)`
     */
    cls(c) {
        if (typeof c == "boolean") {
            this._ctx.currentClass = "";
        }
        else {
            this._ctx.currentClass = c;
        }
        return this;
    }
    /**
    * Set the current font
    * @param sizeOrFont either a number to specify font-size, or a `Font` object to specify all font properties
    * @param weight Optional font-weight string such as "bold"
    * @param style Optional font-style string such as "italic"
    * @param lineHeight Optional line-height number suchas 1.5
    * @param family Optional font-family such as "Helvetica, sans-serif"
    * @example `form.font( myFont )`, `form.font(14, "bold")`
    */
    font(sizeOrFont, weight, style, lineHeight, family) {
        if (typeof sizeOrFont == "number") {
            this._font.size = sizeOrFont;
            if (family)
                this._font.face = family;
            if (weight)
                this._font.weight = weight;
            if (style)
                this._font.style = style;
            if (lineHeight)
                this._font.lineHeight = lineHeight;
            this._ctx.font = this._font.value;
        }
        else {
            this._font = sizeOrFont;
        }
        return this;
    }
    /**
    * Reset the context's common styles to this form's styles. This supports using multiple forms on the same canvas context.
    */
    reset() {
        this._ctx.style = {
            "filled": true, "stroked": true,
            "fill": "#f03", "stroke": "#fff",
            "stroke-width": 1,
            "stroke-linejoin": "bevel",
            "stroke-linecap": "sqaure"
        };
        this._font = new Form_1.Font(14, "sans-serif");
        this._ctx.font = this._font.value;
        return this;
    }
    /**
     * Set this form's group scope by an ID, and optionally define the group's parent element. A group scope keeps track of elements by their generated IDs, and updates their properties as needed. See also `scope()`.
     * @param group_id a string to use as prefix for the group's id. For example, group_id "hello" will create elements with id like "hello-1", "hello-2", etc
     * @param group Optional DOM or SVG element to define this group's parent element
     * @returns this form's context
     */
    updateScope(group_id, group) {
        this._ctx.group = group;
        this._ctx.groupID = group_id;
        this._ctx.groupCount = 0;
        this.nextID();
        return this._ctx;
    }
    /**
     * Set the current group scope to an item added into space, in order to keep track of any point, circle, etc created within it. The item must have an `animateID` property, so that elements created within the item will have generated IDs like "item-{animateID}-{count}".
     * @param item a "player" item that's added to space (see `space.add(...)`) and has an `animateID` property
     * @returns this form's context
     */
    scope(item) {
        if (!item || item.animateID == null)
            throw new Error("item not defined or not yet added to Space");
        return this.updateScope(SVGForm.scopeID(item), this.space.element);
    }
    /**
     * Get next available id in the current group
     * @returns an id string
     */
    nextID() {
        this._ctx.groupCount++;
        this._ctx.currentID = `${this._ctx.groupID}-${this._ctx.groupCount}`;
        return this._ctx.currentID;
    }
    /**
     * A static function to generate an ID string based on a context object
     * @param ctx a context object for an SVGForm
     */
    static getID(ctx) {
        return ctx.currentID || `p-${SVGForm.domID++}`;
    }
    /**
     * A static function to generate an ID string for a scope, based on a "player" item in the Space
     * @param item a "player" item that's added to space (see `space.add(...)`) and has an `animateID` property
     */
    static scopeID(item) {
        return `item-${item.animateID}`;
    }
    /**
     * A static function to help adding style object to an element. This put all styles into `style` attribute instead of individual attributes, so that the styles can be parsed by Adobe Illustrator.
     * @param elem A DOM element to add to
     * @param styles an object of style properties
     * @example `SVGForm.style(elem, {fill: "#f90", stroke: false})`
     * @returns this DOM element
     */
    static style(elem, styles) {
        let st = [];
        if (!styles["filled"])
            st.push("fill: none");
        if (!styles["stroked"])
            st.push("stroke: none");
        for (let k in styles) {
            if (styles.hasOwnProperty(k) && k != "filled" && k != "stroked") {
                let v = styles[k];
                if (v) {
                    if (!styles["filled"] && k.indexOf('fill') === 0) {
                        continue;
                    }
                    else if (!styles["stroked"] && k.indexOf('stroke') === 0) {
                        continue;
                    }
                    else {
                        st.push(`${k}: ${v}`);
                    }
                }
            }
        }
        return Dom_1.DOMSpace.setAttr(elem, { style: st.join(";") });
    }
    /**
      * Draws a point
      * @param ctx a context object of SVGForm
      * @param pt a Pt object or numeric array
      * @param radius radius of the point. Default is 5.
      * @param shape The shape of the point. Defaults to "square", but it can be "circle" or a custom shape function in your own implementation.
      * @example `SVGForm.point( p )`, `SVGForm.point( p, 10, "circle" )`
      */
    static point(ctx, pt, radius = 5, shape = "square") {
        if (shape === "circle") {
            return SVGForm.circle(ctx, pt, radius);
        }
        else {
            return SVGForm.square(ctx, pt, radius);
        }
    }
    /**
      * Draws a point
      * @param p a Pt object
      * @param radius radius of the point. Default is 5.
      * @param shape The shape of the point. Defaults to "square", but it can be "circle" or a custom shape function in your own implementation.
      * @example `form.point( p )`, `form.point( p, 10, "circle" )`
      */
    point(pt, radius = 5, shape = "square") {
        this.nextID();
        SVGForm.point(this._ctx, pt, radius, shape);
        return this;
    }
    /**
      * A static function to draw a circle
      * @param ctx a context object of SVGForm
      * @param pt center position of the circle
      * @param radius radius of the circle
      */
    static circle(ctx, pt, radius = 10) {
        let elem = SVGSpace.svgElement(ctx.group, "circle", SVGForm.getID(ctx));
        Dom_1.DOMSpace.setAttr(elem, {
            cx: pt[0],
            cy: pt[1],
            r: radius,
            'class': `pts-svgform pts-circle ${ctx.currentClass}`,
        });
        SVGForm.style(elem, ctx.style);
        return elem;
    }
    /**
      * Draw a circle
      * @param pts usually a Group of 2 Pts, but it can also take an array of two numeric arrays [ [position], [size] ]
      * @see [`Circle.fromCenter`](./_op_.circle.html#frompt)
      */
    circle(pts) {
        this.nextID();
        SVGForm.circle(this._ctx, pts[0], pts[1][0]);
        return this;
    }
    /**
      * A static function to draw an arc.
      * @param ctx a context object of SVGForm
      * @param pt center position
      * @param radius radius of the arc circle
      * @param startAngle start angle of the arc
      * @param endAngle end angle of the arc
      * @param cc an optional boolean value to specify if it should be drawn clockwise (`false`) or counter-clockwise (`true`). Default is clockwise.
      */
    static arc(ctx, pt, radius, startAngle, endAngle, cc) {
        let elem = SVGSpace.svgElement(ctx.group, "path", SVGForm.getID(ctx));
        const start = new Pt_1.Pt(pt).toAngle(startAngle, radius, true);
        const end = new Pt_1.Pt(pt).toAngle(endAngle, radius, true);
        const diff = Num_1.Geom.boundAngle(endAngle) - Num_1.Geom.boundAngle(startAngle);
        let largeArc = (diff > Util_1.Const.pi) ? true : false;
        if (cc)
            largeArc = !largeArc;
        const sweep = (cc) ? "0" : "1";
        const d = `M ${start[0]} ${start[1]} A ${radius} ${radius} 0 ${largeArc ? "1" : "0"} ${sweep} ${end[0]} ${end[1]}`;
        Dom_1.DOMSpace.setAttr(elem, {
            d: d,
            'class': `pts-svgform pts-arc ${ctx.currentClass}`,
        });
        SVGForm.style(elem, ctx.style);
        return elem;
    }
    /**
      * Draw an arc.
      * @param pt center position
      * @param radius radius of the arc circle
      * @param startAngle start angle of the arc
      * @param endAngle end angle of the arc
      * @param cc an optional boolean value to specify if it should be drawn clockwise (`false`) or counter-clockwise (`true`). Default is clockwise.
      */
    arc(pt, radius, startAngle, endAngle, cc) {
        this.nextID();
        SVGForm.arc(this._ctx, pt, radius, startAngle, endAngle, cc);
        return this;
    }
    /**
      * A static function to draw a square
      * @param ctx a context object of SVGForm
      * @param pt center position of the square
      * @param halfsize half size of the square
      */
    static square(ctx, pt, halfsize) {
        let elem = SVGSpace.svgElement(ctx.group, "rect", SVGForm.getID(ctx));
        Dom_1.DOMSpace.setAttr(elem, {
            x: pt[0] - halfsize,
            y: pt[1] - halfsize,
            width: halfsize * 2,
            height: halfsize * 2,
            'class': `pts-svgform pts-square ${ctx.currentClass}`,
        });
        SVGForm.style(elem, ctx.style);
        return elem;
    }
    /**
     * Draw a square, given a center and its half-size
     * @param pt center Pt
     * @param halfsize half-size
     */
    square(pt, halfsize) {
        this.nextID();
        SVGForm.square(this._ctx, pt, halfsize);
        return this;
    }
    /**
    * A static function to draw a line
    * @param ctx a context object of SVGForm
    * @param pts a Group of multiple Pts, or an array of multiple numeric arrays
    */
    static line(ctx, pts) {
        if (!this._checkSize(pts))
            return;
        if (pts.length > 2)
            return SVGForm._poly(ctx, pts, false);
        let elem = SVGSpace.svgElement(ctx.group, "line", SVGForm.getID(ctx));
        Dom_1.DOMSpace.setAttr(elem, {
            x1: pts[0][0],
            y1: pts[0][1],
            x2: pts[1][0],
            y2: pts[1][1],
            'class': `pts-svgform pts-line ${ctx.currentClass}`,
        });
        SVGForm.style(elem, ctx.style);
        return elem;
    }
    /**
    * Draw a line or polyline
    * @param pts a Group of multiple Pts, or an array of multiple numeric arrays
    */
    line(pts) {
        this.nextID();
        SVGForm.line(this._ctx, pts);
        return this;
    }
    /**
     * A static helper function to draw polyline or polygon
     * @param ctx a context object of SVGForm
     * @param pts a Group of multiple Pts, or an array of multiple numeric arrays
     * @param closePath a boolean to specify if the polygon path should be closed
     */
    static _poly(ctx, pts, closePath = true) {
        if (!this._checkSize(pts))
            return;
        let elem = SVGSpace.svgElement(ctx.group, ((closePath) ? "polygon" : "polyline"), SVGForm.getID(ctx));
        let points = pts.reduce((a, p) => a + `${p[0]},${p[1]} `, "");
        Dom_1.DOMSpace.setAttr(elem, {
            points: points,
            'class': `pts-svgform pts-polygon ${ctx.currentClass}`,
        });
        SVGForm.style(elem, ctx.style);
        return elem;
    }
    /**
      * A static function to draw polygon
      * @param ctx a context object of SVGForm
      * @param pts a Group of multiple Pts, or an array of multiple numeric arrays
      */
    static polygon(ctx, pts) {
        return SVGForm._poly(ctx, pts, true);
    }
    /**
    * Draw a polygon
    * @param pts a Group of multiple Pts, or an array of multiple numeric arrays
    */
    polygon(pts) {
        this.nextID();
        SVGForm.polygon(this._ctx, pts);
        return this;
    }
    /**
    * A static function to draw a rectangle
    * @param ctx a context object of SVGForm
    * @param pts usually a Group of 2 Pts specifying the top-left and bottom-right positions. Alternatively it can be an array of numeric arrays.
    */
    static rect(ctx, pts) {
        if (!this._checkSize(pts))
            return;
        let elem = SVGSpace.svgElement(ctx.group, "rect", SVGForm.getID(ctx));
        let bound = Pt_1.Group.fromArray(pts).boundingBox();
        let size = Op_1.Rectangle.size(bound);
        Dom_1.DOMSpace.setAttr(elem, {
            x: bound[0][0],
            y: bound[0][1],
            width: size[0],
            height: size[1],
            'class': `pts-svgform pts-rect ${ctx.currentClass}`,
        });
        SVGForm.style(elem, ctx.style);
        return elem;
    }
    /**
      * Draw a rectangle
      * @param pts usually a Group of 2 Pts specifying the top-left and bottom-right positions. Alternatively it can be an array of numeric arrays.
      */
    rect(pts) {
        this.nextID();
        SVGForm.rect(this._ctx, pts);
        return this;
    }
    /**
      * A static function to draw text
      * @param ctx a context object of SVGForm
      * @param `pt` a Point object to specify the anchor point
      * @param `txt` a string of text to draw
      * @param `maxWidth` specify a maximum width per line
      */
    static text(ctx, pt, txt) {
        let elem = SVGSpace.svgElement(ctx.group, "text", SVGForm.getID(ctx));
        Dom_1.DOMSpace.setAttr(elem, {
            "pointer-events": "none",
            x: pt[0],
            y: pt[1],
            dx: 0, dy: 0,
            'class': `pts-svgform pts-text ${ctx.currentClass}`,
        });
        elem.textContent = txt;
        SVGForm.style(elem, ctx.style);
        return elem;
    }
    /**
      * Draw text on canvas
      * @param `pt` a Pt or numeric array to specify the anchor point
      * @param `txt` text
      * @param `maxWidth` specify a maximum width per line
      */
    text(pt, txt) {
        this.nextID();
        SVGForm.text(this._ctx, pt, txt);
        return this;
    }
    /**
      * A convenient way to draw some text on canvas for logging or debugging. It'll be draw on the top-left of the canvas as an overlay.
      * @param txt text
      */
    log(txt) {
        this.fill("#000").stroke("#fff", 0.5).text([10, 14], txt);
        return this;
    }
}
SVGForm.groupID = 0;
SVGForm.domID = 0;
exports.SVGForm = SVGForm;
//# sourceMappingURL=Svg.js.map