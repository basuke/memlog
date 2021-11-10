import type { Config } from "../memlog";

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
            disabled: false,
        },
        mmap: {
            management: "flexible",
            types: {
                anon: { color: 'rgba(0,0,0,0)', border: 0.5 },
                free: { color: 'rgba(0,192,0,0.3)', border: 0.5 },
                no: { color: 'rgba(255,0,0,0.6)' },
            },
        },
        page: {
            management: "flexible",
            types: {
                free: { color: 'LightSlateGrey' },
            },
        },
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
