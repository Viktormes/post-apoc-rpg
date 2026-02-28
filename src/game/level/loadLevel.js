import { spawnWorldTile } from "../world/worldTile.js"
import { tileSprites } from "../world/tileRegistry.js"

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

        if (b.type === "tile") {
            const spriteData = tileSprites[b.sprite]
            if (!spriteData) continue

            spawnWorldTile(k, spriteData, b.x, b.y, {
                solid: b.solid ?? false,
                scale: 2,
                zIndex: -10,
                spriteKey: b.sprite,
            })
        }
    }

    return { spawn: spawnPoint, enemySpawns }
}