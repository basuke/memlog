import type { RegionMap } from "./region";
import { M } from "./utils";

export const source1 = `# map file format
# vm

alloc ts:122 layer:vm addr:0x20014000 size:0x20700000+1049806-0x20014000 type:rw

# allocation: start and size are mandatory. others are optional
alloc ts:12345 addr:0x20014000 size:5242880 type:free layer:bmalloc
alloc ts:12345 addr:0x20514000 size:1015808 type:chunk layer:bmalloc
alloc ts:12345 addr:0x20614000 size:970752 type:free layer:bmalloc
alloc ts:12345 addr:0x20700000 size:1049806 type:large layer:bmalloc

# free:
free ts:12345 addr:0x20614000 layer:bmalloc

# split
split ts:12345 addr:0x20014000 size:1015808 layer:bmalloc

# mod
mod ts:12345 addr:0x20014000 layer:bmalloc type:chunk
`;

export const source2 = `
# memlog started.
alloc ts:8 layer:vm addr:0x200f80000 size:49152 type:rw
alloc ts:8 layer:vm addr:0x200f8c000 size:16384 type:rw
alloc ts:8 layer:vm addr:0x200f94000 size:2097152 type:rw
split ts:8 layer:vm addr:0x200f94000 size:442368
free ts:8 layer:vm addr:0x200f94000
split ts:8 layer:vm addr:0x201000000 size:1048576
free ts:8 layer:vm addr:0x201100000
alloc ts:8 layer:vm addr:0x200f94000 size:16384 type:rw
alloc ts:8 layer:bmalloc addr:0x201000000 size:1048576 type:free
mod ts:8 layer:bmalloc addr:0x201000000 type:large
alloc ts:8 layer:vm addr:0x200f98000 size:16384 type:rw
alloc ts:8 layer:vm addr:0x200f9c000 size:16384 type:rw
mod ts:8 layer:bmalloc addr:0x201000000 type:chunk
alloc ts:11 layer:vm addr:0x201100000 size:2097152 type:rw
split ts:11 layer:vm addr:0x201100000 size:1048576
free ts:11 layer:vm addr:0x201200000
`;

export const samples: RegionMap = {
    0x20014000: { layer: 'bmalloc', type: 'green', start: 0x20014000, size: 5 * M},
    0x20514000: { layer: 'bmalloc', type: 'gray', start: 0x20514000, size: 1 * M - 0x8000},
    0x20614000: { layer: 'bmalloc', type: 'pink', start: 0x20614000, size: M - 0x13000},
    0x20700000: { layer: 'bmalloc', type: 'orange', start: 0x20700000, size: 0x100000 + 1230},
};


