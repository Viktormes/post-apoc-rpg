import { blockTypes } from "./blockTypes.js"
export function loadLevel(k, data) {

    let spawnPoint = null
    const enemySpawns = []

    for (const b of data) {

        if (b.type === "spawn") {
            spawnPoint = { x: b.x, y: b.y }
            continue
        }

        if (b.type === "enemy") {
            enemySpawns.push(b)
            continue
        }

        // normal blocks
        k.add([
            k.rect(b.w, b.h),
            k.pos(b.x, b.y),
            k.area(),
            k.body({ isStatic: true }),
            k.color(...blockTypes[b.type].color),
            "editorBlock",
        ])
    }

    return { spawn: spawnPoint, enemySpawns }
}