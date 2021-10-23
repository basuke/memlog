<script type=ts>

import type { Geometry, Row } from "./geometry";
import { hex } from "./utils";

export let start = 0;
export let end = 0;
export let geo: Geometry;
export let color = 'green';

const rows = geo.makeRows(start, end);
const path = makePath(rows);

function makePath(rows: Row[]) {
    const commands =[];
    if (rows.length === 1) {
        const {top, left, bottom, right} = geo.rowToRect(rows[0]);
        commands.push(`M ${left},${top}`);
        commands.push(`L ${right},${top}`);
        commands.push(`L ${right},${bottom}`);
        commands.push(`L ${left},${bottom}`);
        commands.push(`z`);
    } else if (rows.length > 1){
        for (const row of rows) {
            const {top, left, bottom, right} = geo.rowToRect(row);
            commands.push(`M ${left},${top}`);
            commands.push(`L ${right},${top}`);
            commands.push(`L ${right},${bottom}`);
            commands.push(`L ${left},${bottom}`);
            commands.push(`z`);
        }
    }
    return commands.join(' ');
}

</script>

    <path d={path} fill={color} stroke="black" />
