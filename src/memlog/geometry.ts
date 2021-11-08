import { roundDown, roundUp } from "./utils";

export type Row = {
    row: number;
    start: number;
    end: number;
};

export type Rect = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};

export class Geometry {
    rowBytes: number;
    rowWidth: number;
    rowHeight: number;

    constructor(rowBytes: number, rowWidth: number, rowHeight: number) {
        this.rowBytes = rowBytes;
        this.rowWidth = rowWidth;
        this.rowHeight = rowHeight;
    }

    makeRows(start: number, end: number): Row[] {
        const roundedStart = this.floor(start);
        const roundedEnd = this.ceil(end);
        const count = this.addressToRow(roundedEnd - roundedStart);
        const startRow = this.addressToRow(start);
        const rows = [];

        for (let n = 0; n < count; ++n) {
            let s = 0;
            let e = this.rowBytes;

            if (count === 1 || n === 0) {
                s = (start - roundedStart);
            }
            
            if (count === 1 || n === count - 1) {
                e = (end - this.floor(end - 1));
            }
            rows.push({row: startRow + n, start: s, end: e})
        };
        return rows;
    }

    rowToRect(row: Row, inset: number = 0): Rect {
        const top = this.rowToHeight(row.row) + inset;
        const bottom = top + this.rowHeight - inset;
        const left = this.rowWidth * row.start / this.rowBytes + inset;
        const right = this.rowWidth * row.end / this.rowBytes - inset;
        return {top, right, bottom, left};
    }

    addressToRow(val: number): number {
        return Math.floor(val / this.rowBytes);
    }

    rowToHeight(val: number): number {
        return val * this.rowHeight;
    }

    floor(val: number): number {
        return roundDown(val, this.rowBytes);
    }

    ceil(val: number): number {
        return roundUp(val, this.rowBytes);
    }
};
