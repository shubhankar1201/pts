"use strict";
// Source code licensed under Apache License 2.0.
// Copyright © 2017 William Ngan. (https://github.com/williamngan/pts)
Object.defineProperty(exports, "__esModule", { value: true });
const Pt_1 = require("./Pt");
/** Various functions to support typography */
class Typography {
    /**
     * Create a heuristic text width estimate function. It will be less accurate but faster.
     * @param fn a reference function that can measure text width accurately
     * @param samples a list of string samples. Default is ["M", "n", "."]
     * @param distribution a list of the samples' probability distribution. Default is [0.06, 0.8, 0.14].
     * @return a function that can estimate text width
     */
    static textWidthEstimator(fn, samples = ["M", "n", "."], distribution = [0.06, 0.8, 0.14]) {
        let m = samples.map(fn);
        let avg = new Pt_1.Pt(distribution).dot(m);
        return (str) => str.length * avg;
    }
    /**
     * Truncate text to fit width
     * @param fn a function that can measure text width
     * @param str text to truncate
     * @param width width to fit
     * @param tail text to indicate overflow such as "...". Default is empty "".
     */
    static truncate(fn, str, width, tail = "") {
        let trim = Math.floor(str.length * Math.min(1, width / fn(str)));
        if (trim < str.length) {
            trim = Math.max(0, trim - tail.length);
            return [str.substr(0, trim) + tail, trim];
        }
        else {
            return [str, str.length];
        }
    }
    /**
     * Get a function to scale font size proportionally to text box size changes.
     * @param box Initial box as a Group
     * @param ratio font-size change ratio. Default is 1.
     * @returns a function where input parameter is a new box, and returns the new font size value
     */
    static fontSizeToBox(box, ratio = 1, byHeight = true) {
        let i = byHeight ? 1 : 0;
        let h = (box[1][i] - box[0][i]);
        let f = ratio * h;
        return function (b) {
            let nh = (b[1][i] - b[0][i]) / h;
            return f * nh;
        };
    }
    /**
     * Get a function to scale font size based on a threshold value
     * @param defaultSize default font size to base on
     * @param threshold threshold value
     * @param direction if negative, get a font size <= defaultSize; if positive, get a font size >= defaultSize; Default is 0 which will scale font without min or max limits.
     * @returns a function where input parameter is the default font size and a value to compare with threshold, and returns new font size value
     */
    static fontSizeToThreshold(threshold, direction = 0) {
        return function (defaultSize, val) {
            let d = defaultSize * val / threshold;
            if (direction < 0)
                return Math.min(d, defaultSize);
            if (direction > 0)
                return Math.max(d, defaultSize);
            return d;
        };
    }
}
exports.Typography = Typography;
//# sourceMappingURL=Typography.js.map