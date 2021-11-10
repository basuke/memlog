export type TypeConfig = {
    color?: string;
    border?: boolean|number|string|{width?:number, color?:string};
};

export type LayerConfig = {
    types: Record<string, TypeConfig>;
    disabled?: boolean;
    management?: "managed"|"flexible";
};

export type Config = {
    layers: Record<string, LayerConfig>;
};

