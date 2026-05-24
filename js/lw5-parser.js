(function () {
    'use strict';

    // ============================================================
    // SVG Tag parser module
    // Ported from src/lib/lw.svg-parser/
    // ============================================================

    var LW = window.LW = window.LW || {};
    LW.parser = {};

    var Clipper = window.ClipperLib;

    // lw.svg-path and lw.svg-curves are vendored
    // They may not have been loaded yet - check
    var Path_ = window.svgPath && window.svgPath.Path;
    var Point_ = window.svgPath && window.svgPath.Point;
    var Arc_ = window.svgCurves && window.svgCurves.Arc;
    var CubicBezier_ = window.svgCurves && window.svgCurves.CubicBezier;
    var QuadricBezier_ = window.svgCurves && window.svgCurves.QuadricBezier;

    // ============================================================
    // Tag class
    // ============================================================
    function Tag(tag, parent) {
        this.tag = tag;
        this.parent = parent || null;
        this.children = [];
        this.attribs = {};
        this.data = '';

        if (parent) {
            parent.children.push(this);
        }
    }

    Tag.prototype.isValid = function () {
        return true;
    };

    Tag.prototype.getTransformMatrix = function () {
        var m = [1, 0, 0, 1, 0, 0];
        if (this.attribs.transform) {
            var s = this.attribs.transform;
            // parse simple transforms
            var translateMatch = s.match(/translate\(\s*([\d.-]+)\s*(?:,\s*([\d.-]+))?\s*\)/);
            if (translateMatch) {
                m[4] += parseFloat(translateMatch[1]);
                if (translateMatch[2]) m[5] += parseFloat(translateMatch[2]);
            }
            var scaleMatch = s.match(/scale\(\s*([\d.-]+)\s*(?:,\s*([\d.-]+))?\s*\)/);
            if (scaleMatch) {
                var sx = parseFloat(scaleMatch[1]);
                var sy = scaleMatch[2] ? parseFloat(scaleMatch[2]) : sx;
                m[0] *= sx;
                m[3] *= sy;
            }
            var rotateMatch = s.match(/rotate\(\s*([\d.-]+)\s*(?:,\s*([\d.-]+)\s*(?:,\s*([\d.-]+))?)?\s*\)/);
            if (rotateMatch) {
                var angle = parseFloat(rotateMatch[1]) * Math.PI / 180;
                var cx = rotateMatch[2] ? parseFloat(rotateMatch[2]) : 0;
                var cy = rotateMatch[3] ? parseFloat(rotateMatch[3]) : 0;
                var cos = Math.cos(angle);
                var sin = Math.sin(angle);
                var tx = cx - cx * cos + cy * sin;
                var ty = cy - cx * sin - cy * cos;
                m = [m[0] * cos + m[2] * sin, m[1] * cos + m[3] * sin,
                     m[0] * -sin + m[2] * cos, m[1] * -sin + m[3] * cos,
                     m[4] + tx, m[5] + ty];
            }
        }
        if (this.parent) {
            var pm = this.parent.getTransformMatrix();
            return [
                m[0] * pm[0] + m[2] * pm[1],
                m[1] * pm[0] + m[3] * pm[1],
                m[0] * pm[2] + m[2] * pm[3],
                m[1] * pm[2] + m[3] * pm[3],
                m[0] * pm[4] + m[2] * pm[5] + m[4],
                m[1] * pm[4] + m[3] * pm[5] + m[5]
            ];
        }
        return m;
    };

    // ============================================================
    // TagParser class
    // ============================================================
    function TagParser() {
        this.tags = [];
    }

    TagParser.prototype.parse = function (text) {
        var that = this;
        var parser = new DOMParser();
        var doc = parser.parseFromString(text, 'text/xml');
        var svgRoot = doc.documentElement;

        if (!svgRoot || svgRoot.tagName !== 'svg') {
            throw new Error('Not an SVG file');
        }

        var rootTag = new Tag(svgRoot.tagName, null);
        rootTag.attribs = extractAttributes(svgRoot);
        this.tags.push(rootTag);
        parseChildren(svgRoot, rootTag);
        return this.tags;
    };

    function extractAttributes(el) {
        var attrs = {};
        for (var i = 0; i < el.attributes.length; i++) {
            attrs[el.attributes[i].name] = el.attributes[i].value;
        }
        return attrs;
    }

    function parseChildren(el, parentTag) {
        for (var i = 0; i < el.children.length; i++) {
            var child = el.children[i];
            var tag = child.tagName;
            // Only process SVG elements we care about
            if (['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'g', 'svg', 'defs', 'use', 'clipPath', 'mask'].indexOf(tag) >= 0) {
                var childTag = new Tag(tag, parentTag);
                childTag.attribs = extractAttributes(child);
                parseChildren(child, childTag);
            }
        }
    }

    // ============================================================
    // Parser class - main entry point
    // ============================================================
    function Parser(options) {
        this.options = options || {};
        this.tagParser = new TagParser();
    }

    Parser.prototype.parse = function (text) {
        var that = this;
        return new Promise(function (resolve, reject) {
            try {
                var tags = that.tagParser.parse(text);
                resolve(tags);
            } catch (e) {
                reject(e);
            }
        });
    };

    LW.parser.Tag = Tag;
    LW.parser.TagParser = TagParser;
    LW.parser.Parser = Parser;

})();
