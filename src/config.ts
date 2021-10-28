export type TypeConfig = {
    color?: string;
    border?: boolean;
};

export type LayerConfig = {
    types: Record<string, TypeConfig>;
};

export type Config = {
    layers: Record<string, LayerConfig>;
};

