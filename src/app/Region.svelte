<script type=ts>

import type { Geometry, Row } from "../memlog";

export let start = 0;
export let end = 0;
export let geo: Geometry;
export let color = 'green';
export let border: { color: string, width: number } = { color: 'black', width: 0.1 };

$: rows = geo.makeRows(start, end);
$: path = makePath(rows);

function makePath(rows: Row[]) {
    const commands =[];
    const d = border.width / 2;

    function box(row: Row) {
        const {top, left, bottom, right} = geo.rowToRect(row, d);
        commands.push(`M ${left},${top}`);
        commands.push(`L ${right},${top}`);
        commands.push(`L ${right},${bottom}`);
        commands.push(`L ${left},${bottom}`);
        commands.push(`z`);
    }

    if (rows.length === 1) {
        box(rows[0]);
    } else if (rows.length === 2 && rows[0].start >= rows[1].end) {
        box(rows[0]);
        box(rows[1]);
    } else if (rows.length >= 2) {
        const box1 = geo.rowToRect(rows[0]);
        const box2 = geo.rowToRect(rows[1]);
        const box3 = geo.rowToRect(rows[rows.length - 2]);
        const box4 = geo.rowToRect(rows[rows.length - 1]);
        commands.push(`M ${box2.left},${box2.top}`);
        commands.push(`L ${box1.left},${box2.top}`);
        commands.push(`L ${box1.left},${box1.top}`);
        commands.push(`L ${box1.right},${box1.top}`);
        commands.push(`L ${box3.right},${box3.bottom}`);
        commands.push(`L ${box4.right},${box3.bottom}`);
        commands.push(`L ${box4.right},${box4.bottom}`);
        commands.push(`L ${box4.left},${box4.bottom}`);
        commands.push(`z`);
    }
    return commands.join(' ');
}

</script>

<path d={path} fill={color} stroke={border.color} stroke-width={border.width}/>
