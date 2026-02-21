import { blockTypes } from "./blockTypes.js"
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
            continue
        }

        // ✅ Legacy / rect collider
        const w = Number(b.w ?? 0)
        const h = Number(b.h ?? 0)

        const block = k.add([
            k.rect(w, h),
            k.pos(b.x, b.y),
            k.area(),
            k.body({ isStatic: true }),
            k.opacity(0),          // invisible by default (what makes this so annoying)
            "editorBlock",
        ])

        // ✅ attach debug overlay to the block so we can toggle it
        block._debugCollider = block.add([
            k.rect(w, h),
            k.pos(0, 0),
            k.color(0, 255, 0),
            k.opacity(0.18),
            k.z(999999),
        ])
        block._debugCollider.hidden = true
    }

    return { spawn: spawnPoint, enemySpawns }
}