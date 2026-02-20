import { blockTypes } from "./blockTypes.js"
import { spawnWorldTile } from "../world/worldTile.js"

import { tileSprites } from "../world/tileRegistry.js"


export function loadLevel(k, data) {

    let spawnPoint = null
    const enemySpawns = []

    for (const b of data) {

        // -------------------------
        // SPAWN
        // -------------------------

        if (b.type === "spawn") {
            spawnPoint = { x: b.x, y: b.y }
            continue
        }

        // -------------------------
        // ENEMY
        // -------------------------

        if (b.type === "enemy") {
            enemySpawns.push(b)
            continue
        }

        // -------------------------
        // TILE (NEW)
        // -------------------------

        if (b.type === "tile") {

            const spriteData = tileSprites[b.sprite]
            if (!spriteData) continue

            spawnWorldTile(
                k,
                spriteData,
                b.x,
                b.y,
                {
                    solid: b.solid ?? false,
                    scale: 2,
                    zIndex: -10,
                }
            )

            continue
        }

        // -------------------------
        // NORMAL RECT BLOCKS
        // -------------------------

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