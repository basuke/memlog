const config = {
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
            types: {
                page: { color: 'SandyBrown' },
            },
        },
    },
};

export default config;
