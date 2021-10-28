const config = {
    layers: {
        vm: {
            types: {
                rw: { color: 'lightblue' },
            },
        },
        bmalloc: {
            types: {
                free: { color: 'lightgray' },
                large: { color: 'SlateBlue' },
                chunk: { color: 'Wheat' },
                perProcess: { color: 'lime' },
                perThread: { color: 'OrangeRed' },
                vector: { color: 'DeepPink' },
                objectTypeTable: { color: 'DarkOliveGreen' },
                external: { color: 'PaleGreen' },
            },
        },
        chunk: {
            types: {
                page: { color: 'SandyBrown' },
            },
        },
    },
};

export default config;
