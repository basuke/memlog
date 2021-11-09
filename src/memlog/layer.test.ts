import type { LayerConfig } from "./config";
import { FlexibleLayer } from "./layer";

const config: LayerConfig = {
    types: { },
};

describe("tests FlexibleLayer", () => {
    const layer = new FlexibleLayer('vm', config);
    layer.regions = [
        { addr: 10, end: 20, type: 'a'},
        { addr: 30, end: 40, type: 'a'},
    ];

    test("simple alloc without overwrap in the middle", () => {
        const result = layer.alloc(22, 5, 'b');
        expect(layer.length).toEqual(2);
        expect(result.length).toEqual(3);
        expect(result.regions[1]).toEqual({ addr: 22, end: 27, type: 'b' });
    });

    test("simple alloc without overwrap at the beginning", () => {
        const result = layer.alloc(2, 5, 'b');
        expect(result.length).toEqual(3);
        expect(result.regions[0]).toEqual({ addr: 2, end: 7, type: 'b' });
    });

    test("simple alloc without overwrap at the end", () => {
        const result = layer.alloc(45, 5, 'b');
        expect(result.length).toEqual(3);
        expect(result.regions[2]).toEqual({ addr: 45, end: 50, type: 'b' });
    });

    // ===

    test("alloc between 0 and 1, attached with 0", () => {
        const result = layer.alloc(20, 5, 'a');
        expect(result.length).toEqual(2);
        expect(result.regions[0]).toEqual({ addr: 10, end: 25, type: 'a' });
    });

    test("alloc between 0 and 1, overwrapped with 0", () => {
        const result = layer.alloc(15, 10, 'a');
        expect(result.length).toEqual(2);
        expect(result.regions[0]).toEqual({ addr: 10, end: 25, type: 'a' });
    });

    test("alloc between 0 and 1, overwrapped with 0 but different type", () => {
        const result = layer.alloc(15, 10, 'b');
        expect(result.length).toEqual(3);
        expect(result.regions[0]).toEqual({ addr: 10, end: 15, type: 'a' });
    });

    // ===

    test("alloc between 0 and 1, attached with 1", () => {
        const result = layer.alloc(25, 5, 'a');
        expect(result.length).toEqual(2);
        expect(result.regions[1]).toEqual({ addr: 25, end: 40, type: 'a' });
    });

    test("alloc between 0 and 1, overwrapped with 1", () => {
        const result = layer.alloc(25, 10, 'a');
        expect(result.length).toEqual(2);
        expect(result.regions[1]).toEqual({ addr: 25, end: 40, type: 'a' });
    });

    test("alloc between 0 and 1, overwrapped with 1 but different type", () => {
        const result = layer.alloc(25, 10, 'b');
        expect(result.length).toEqual(3);
        expect(result.regions[1]).toEqual({ addr: 25, end: 35, type: 'b' });
        expect(result.regions[2]).toEqual({ addr: 35, end: 40, type: 'a' });
    });

    // ===

    test("merging whole regions", () => {
        const result = layer.alloc(20, 10, 'a');
        expect(result.length).toEqual(1);
        expect(result.regions[0]).toEqual({ addr: 10, end: 40, type: 'a' });
    });
});
