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