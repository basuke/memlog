export type TypeConfig = {
    color: string;
};

export type LayerConfig = {
    types: Record<string, TypeConfig>;
};

export type Config = {
    layers: Record<string, LayerConfig>;
};

