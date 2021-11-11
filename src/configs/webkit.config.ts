import type { Config } from "../memlog";

const config: Config = {
    layers: {
        bmalloc: {
            types: {
                free: { color: 'WhiteSmoke' },
                large: { color: 'MediumSlateBlue' },
                chunk: { color: 'Wheat' },
                perProcess: { color: 'MediumSeaGreen' },
                perThread: { color: 'MediumVioletRed' },
                vector: { color: 'Turquoise' },
                objectTypeTable: { color: 'DarkOliveGreen' },
            },
        },
        chunk: {
            management: "flexible",
            disabled: false,
            types: {
                header: { color: 'RosyBrown' },
                page: { color: 'SandyBrown' },
                decommit: { color: 'Wheat' },
            },
        },
        mmap: {
            management: "flexible",
            types: {
                anon: { color: 'rgba(0,0,0,0)', border: 0.5 },
                free: { color: 'rgba(0,192,0,0.3)', border: 0.5 },
                no: { color: 'rgba(255,0,0,0.6)' },
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
