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
    rowSize: number;
    rowWidth: number;
    rowHeight: number;

    constructor(rowSize: number, rowWidth: number, rowHeight: number) {
        this.rowSize = rowSize;
        this.rowWidth = rowWidth;
        this.rowHeight = rowHeight;
    }

    makeRows(start: number, end: number): Row[] {
        const roundedStart = this.roundDown(start);
        const roundedEnd = this.roundUp(end);
        const count = this.addressToRow(roundedEnd - roundedStart);
        const startRow = this.addressToRow(start);
        const rows = [];

        for (let n = 0; n < count; ++n) {
            let s = 0;
            let e = this.rowSize;

            if (count === 1 || n === 0) {
                s = (start - roundedStart);
            }
            
            if (count === 1 || n === count - 1) {
                e = (end - this.roundDown(end));
            }
            rows.push({row: startRow + n, start: s, end: e})
        };
        return rows;
    }

    rowToRect(row: Row): Rect {
        const top = this.rowToHeight(row.row);
        const bottom = top + this.rowHeight;
        const left = this.rowWidth * row.start / this.rowSize;
        const right = this.rowWidth * row.end / this.rowSize;
        return {top, right, bottom, left};
    }

    addressToRow(val: number): number {
        return Math.floor(val / this.rowSize);
    }

    rowToHeight(val: number): number {
        return val * this.rowHeight;
    }

    roundDown(val: number): number {
        return roundDown(val, this.rowSize);
    }

    roundUp(val: number): number {
        return roundUp(val, this.rowSize);
    }
};
