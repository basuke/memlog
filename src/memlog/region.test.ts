import { intersect, Region, subtract } from "./region";

const a: Region = { addr: 10, end: 20, type: 'foo' };

describe("test intersect of region", () => {
    test("a is contained by b", () => {
        expect(intersect(a, {addr:5, end:25})).toMatchObject(a);
    })

    test("b is contained by a", () => {
        expect(intersect(a, { addr:15, end:18})).toMatchObject({addr:15, end:18, type:'foo'});
    })

    test("a and b are overwrapped at the a'beginning", () => {
        expect(intersect(a, { addr:8, end:12})).toMatchObject({addr:10, end:12, type:'foo'});
    })

    test("a and b are overwrapped at the a'end", () => {
        expect(intersect(a, { addr:15, end:25})).toMatchObject({addr:15, end:20, type:'foo'});
    })

    test("a and b is not overwrapped entierly", () => {
        expect(intersect(a, {addr:30, end:35})).toBeNull();
    })

    test("a nad b are attached at a.end", () => {
        expect(intersect(a, { addr:20, end:25})).toBeNull();
    })

    test("a and b are attached at a.addr", () => {
        expect(intersect(a, { addr:3, end:10})).toBeNull();
    })
});

describe("test subtract of regions", () => {
    test("a is contained by b", () => {
        expect(subtract(a, {addr:5, end:25})).toMatchObject([
        ]);
    })

    test("b is contained by a", () => {
        expect(subtract(a, { addr:15, end:18})).toMatchObject([
            {addr:10, end:15, type:'foo'},
            {addr:18, end:20, type:'foo'},
        ]);
    })

    test("a and b are overwrapped at the a'beginning", () => {
        expect(subtract(a, { addr:8, end:12})).toMatchObject([
            {addr:12, end:20, type:'foo'}
        ]);
    })

    test("a and b are overwrapped at the a'end", () => {
        expect(subtract(a, { addr:15, end:25})).toMatchObject([
            {addr:10, end:15, type:'foo'}
        ]);
    })

    test("a and b is not overwrapped entierly", () => {
        expect(subtract(a, {addr:30, end:35})).toMatchObject([
            a,
        ]);
    })

    test("a nad b are attached at a.end", () => {
        expect(subtract(a, { addr:20, end:25})).toMatchObject([
            a,
        ]);
    })

    test("a and b are attached at a.addr", () => {
        expect(subtract(a, { addr:3, end:10})).toMatchObject([
            a,
        ]);
    })

    test("a contains b and they are attached at the a'beginning", () => {
        expect(subtract(a, { addr:10, end:12})).toMatchObject([
            {addr:12, end:20, type:'foo'}
        ]);
    })

    test("a contains b and they are attached at the a'end", () => {
        expect(subtract(a, { addr:15, end:20})).toMatchObject([
            {addr:10, end:15, type:'foo'}
        ]);
    })
});
