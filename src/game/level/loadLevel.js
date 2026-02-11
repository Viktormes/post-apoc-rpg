export function loadLevel(k, data) {

    const COLORS = {
        ground: [80, 80, 80],
        platform: [100, 100, 120],
        cave: [70, 70, 90],
    }

    let spawnPoint = null

    for (const b of data) {

        if (b.type === "spawn") {
            spawnPoint = { x: b.x, y: b.y }
            continue
        }

        k.add([
            k.rect(b.w, b.h),
            k.pos(b.x, b.y),
            k.area(),
            k.body({ isStatic: true }),
            k.color(...(COLORS[b.type] ?? COLORS.platform)),
        ])
    }

    return spawnPoint
}
