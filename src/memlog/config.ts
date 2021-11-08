export type TypeConfig = {
    color?: string;
    border?: boolean;
};

export type LayerConfig = {
    types: Record<string, TypeConfig>;
    disabled?: boolean;
    management?: "mmap";
};

export type Config = {
    layers: Record<string, LayerConfig>;
};

