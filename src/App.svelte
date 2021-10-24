<script lang="ts">

import MemoryView from './MemoryView.svelte';
import { M } from './utils';

const source = `# map file format
# allocation: start and size are mandatory. others are optional
alloc ts:12345 start:0x20014000 size:5242880 type:chunk layer:bmalloc color:green
alloc ts:12345 start:0x20514000 size:1015808 type:chunk layer:bmalloc color:gray
alloc ts:12345 start:0x20614000 size:970752 type:chunk layer:bmalloc color:pink
alloc ts:12345 start:0x20700000 size:1049806 type:chunk layer:bmalloc color:orange

# free:
free ts:12345 start:0x20514000 layer:bmalloc

# change
change ts:12345 start:0x20014000 layer:bmalloc type:free
`;

type Action = {
    action: "alloc" | "free" | "change";
    start: number;
    size?: number;
    layer?: string;
    type?: string;
    ts?: number;
    attrs: Record<string, string>;
};

let regions = [
    { layer: 'bmalloc', color: 'green', start: 0x20014000, size: 5 * M},
    { layer: 'bmalloc', color: 'gray', start: 0x20514000, size: 1 * M - 0x8000},
    { layer: 'bmalloc', color: 'pink', start: 0x20614000, size: M - 0x13000},
    { layer: 'bmalloc', color: 'orange', start: 0x20700000, size: 0x100000 + 1230},
];

function parseMapSource(source: string): Action[] {
    let n = 0;
    const actions = [];
    for (let line of source.split("\n")) {
        n++;
        line = line.trim();
        if (line.length === 0 || line[0] === '#') continue;
        const [action, ...parameters] = line.split(/ +/);
        let start = undefined;
        let size = undefined;
        let layer = undefined;
        let type = undefined;
        let ts = undefined;
        const attrs = parameters.reduce((result, param) => {
            const [key, value] = param.split(':');
            if (key === 'start' || key === 'size' || key === 'ts')
                eval(`${key} = ${value}`);
            else if (key === 'layer' || key === 'type')
                eval(`${key} = value`);
            else
                result[key] = value;
            return result;
        }, {});
        if (action === 'alloc') {
            actions.push({action: 'alloc', start, size, layer, type, ts, attrs})
        } else if (action === 'change') {
            actions.push({action: 'change', start, size, layer, type, ts, attrs})
        } else if (action === 'free') {
            actions.push({action: 'free', start, size, layer, type, ts, attrs})
        } else {
            throw new Error(`unknown map line in line ${n}`);
        }
    }
    return actions;
}

function applyCommand(regions: any[], action: Action): any[] {
    return regions;
}

const actions = parseMapSource(source);

regions
/*

ts:12345 start:0x1223000 size:12313 type:chunk layer:bmalloc
*/
</script>

<main>
    <h1>Memory Viewer</h1>
    {JSON.stringify(actions)}
    <MemoryView {regions} rowBytes={64 * 1024 * 4}/>
</main>

<style>

main {
}

h1 {
    text-align: center;
    color: #ff3e00;
    font-size: 1.5rem;
    font-weight: lighter;
}
</style>