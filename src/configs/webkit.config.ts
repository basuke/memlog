const config = {
    layers: {
        vm: {
            types: {
                rw: { color: 'lightblue' },
                _: { color: 'DeepPink' },
            },
        },
        bmalloc: {
            types: {
                free: { color: 'lightgray' },
                large: { color: 'SlateBlue' },
                chunk: { color: 'SandyBrown' },
                perProcess: { color: 'lime' },
                perThread: { color: 'OrangeRed' },
                vector: { color: 'DeepPink' },
                objectTypeTable: { color: 'DarkOliveGreen' },
                external: { color: 'PaleGreen' },
                _: { color: 'Fuchsia' },
            },
        },
    },
};

export default config;
