export type TypeConfig = {
    color?: string;
    border?: boolean;
};

export type LayerConfig = {
    types: Record<string, TypeConfig>;
    disabled?: boolean;
    management?: "managed"|"flexible";
};

export type Config = {
    layers: Record<string, LayerConfig>;
};

