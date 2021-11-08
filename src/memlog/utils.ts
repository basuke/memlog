export const K = 1024;
export const M = 1024 * K;
export const G = 1024 * M;

export function roundDown(val, alignment) {
    return Math.floor(val / alignment) * alignment;
}

export function roundUp(val, alignment) {
    return Math.ceil(val / alignment) * alignment;
}

export function hex(val, places = 0) {
    return '0x' + val.toString(16);
}

export function arrayOfSize(count: number) {
    return Array.from(new Array(count)).map((_, index) => index);
}

export function bytes(value: number): string {
    let unit = 'bytes';
    const units = ['KB', 'MB', 'GB'];

    while (value >= 1024 && units.length > 0) {
        unit = units.shift();
        const mod = value % 1024;
        value = Math.floor(value / 1024);
    }
    return value + unit;
}