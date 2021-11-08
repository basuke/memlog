<script lang=ts>

import type { Geometry } from '../memlog';

export let geo: Geometry;
export let start: number;
export let end: number;
export let width = 80; // px

type Label = {
    y: number;
    text: string;
};

function addressLabels(geo: Geometry, start: number, end: number): Label[] {
    const labels = [];

    const lastAddress = geo.addressToRow(end) * geo.rowBytes;
    const lastLabel = lastAddress.toString(16);

    function format(addr) {
        let label = addr.toString(16);
        label = '0'.repeat(lastLabel.length - label.length) + label;
        const components = [];
        while (true) {
            if (label.length > 4) {
                components.unshift(label.substring(label.length - 4, label.length));
                label = label.substring(0, label.length - 4);
            } else {
                components.unshift(label);
                break;
            }
        }
        return components.join(" ");
    }

    while (start < end) {
        labels.push({
            y: geo.rowToHeight(geo.addressToRow(start)),
            text: format(start)
        });
        start += geo.rowBytes;
    }
    return labels;
}

</script>

<!-- label -->
<g stroke-width="0.2" font-family=monospace color=black font-size=12 text-anchor=end>
    {#each addressLabels(geo, start, end) as label(label.y)}
        <text x={width} y={label.y + 12}>{label.text}</text>
    {/each}
</g>
