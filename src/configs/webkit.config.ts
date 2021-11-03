import type { Config } from "../config";

const config: Config = {
    layers: {
        vm: {
            types: {
                rw: { color: 'lightblue' },
            },
        },
        bmalloc: {
            types: {
                free: { color: 'WhiteSmoke' },
                large: { color: 'SlateBlue' },
                chunk: { color: 'Wheat' },
                perProcess: { color: 'lime' },
                perThread: { color: 'Teal' },
                vector: { color: 'Turquoise' },
                objectTypeTable: { color: 'DarkOliveGreen' },
                external: { color: 'PaleGreen' },
            },
        },
        chunk: {
            // containedBy: 'bmalloc.chunk',
            types: {
                page: { color: 'SandyBrown' },
            },
            disabled: true,
        },
        // page: {
        //     types: {
        //         line: { color: 'Sienna', border: false },
        //         object: { color: 'Orchid', border: false },
        //     },
        // },
        // jsc: {
        //     types: {
        //         fastMalloc: { color: 'MediumVioletRed', border: true },
        //         "fastMalloc-aligned": { color: 'RebeccaPurple', border: true },
        //         "iso-aligned": { color: 'Orchid', border: true },
        //         "iso-decommit": { color: 'MistyRose', border: true },
        //     },
        // },
    },
};

export default config;
