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


    // ===

    test("case", () => {
        const layer = new FlexibleLayer('mmap', config);
        layer.regions = [
            {addr: 0x200f50000, end: 0x200f60000, type: 'anon'},
            {addr: 0x200f64000, end: 0x200f70000, type: 'anon'},
            {addr: 0x201000000, end: 0x20110c000, type: 'anon'},
            {addr: 0x201200000, end: 0x201300000, type: 'anon'},
        ];
        // 76: a 10 101928 mmap 0x201204000 16384 free
        const result = layer.alloc(0x201204000, 16384, 'free');
        expect(result.regions[3].end).toEqual(0x201204000);
        expect(result.length).toEqual(6);
        expect(result.regions[4].end).toEqual(0x201204000 + 16384);
        expect(result.regions[4].type).toEqual('free');
        expect(result.regions[5]).toEqual({ addr: 0x201204000 + 16384, end: 0x201300000, type: 'anon' });
    });
});
