import { blockTypes } from "../level/blockTypes.js"
import { enemyTypes } from "../entities/enemy.js"
import { renderPixelSprite } from "../pixel/renderPixelSprite.js"
import { tileSprites } from "../world/tileRegistry.js"

export function editorScene(k) {

    const TILE_ORDER = Object.keys(tileSprites)
    let currentTileIndex = 0
    let currentTile = TILE_ORDER[currentTileIndex]

    let spawnEntity = null
    let spawnPreview = null
    let enemyPreview = null
    let tilePreview = null
    let currentEnemyType = "ghoul"
    const ENEMY_ORDER = ["ghoul", "orc", "golem"]

    k.setCamPos(k.width() / 2, k.height() / 2)
    k.setCamScale(1)

    const blocks = []
    let currentType = "platform"
    let startPos = null
    let preview = null

    let camX = k.width() / 2
    let camY = k.height() / 2
    const CAM_SPEED = 400

    k.onUpdate(() => {
        const dt = k.dt()

        if (spawnPreview && currentType === "spawn") {
            spawnPreview.pos = k.toWorld(k.mousePos())
        }
        if (enemyPreview && currentType === "enemy") {
            enemyPreview.pos = k.toWorld(k.mousePos())
        }

        if (tilePreview && currentType === "tile") {

            const worldPos = k.toWorld(k.mousePos())

            const TILE_SIZE = 24 * 2

            const snappedX = Math.floor(worldPos.x / TILE_SIZE) * TILE_SIZE
            const snappedY = Math.floor(worldPos.y / TILE_SIZE) * TILE_SIZE

            tilePreview.pos = k.vec2(snappedX, snappedY)
        }

        if (!startPos) {
            if (k.isKeyDown("a")) camX -= CAM_SPEED * dt
            if (k.isKeyDown("d")) camX += CAM_SPEED * dt
            if (k.isKeyDown("w")) camY -= CAM_SPEED * dt
            if (k.isKeyDown("s")) camY += CAM_SPEED * dt
        }

        k.setCamPos(camX, camY)
    })

    // ---------------- AUTOSAVE ----------------
    let autosaveTimer = null

    function scheduleAutosave() {
        clearTimeout(autosaveTimer)
        autosaveTimer = setTimeout(() => {
            localStorage.setItem("autosave_level", JSON.stringify(blocks))
        }, 300)
    }

    // ---------------- RESTORE ----------------
    const saved = localStorage.getItem("autosave_level")
    if (saved) {
        const parsed = JSON.parse(saved)
        blocks.push(...parsed)

        for (const b of parsed) {

            if (b.type === "spawn") {

                spawnEntity = k.add([
                    k.rect(16, 16),
                    k.pos(b.x, b.y),
                    k.color(...blockTypes.spawn.color),
                    k.z(1000),
                    "editorSpawn",
                ])
                spawnEntity.editorData = b

            } else if (b.type === "enemy") {

                const entity = k.add([
                    k.rect(b.w, b.h),
                    k.pos(b.x, b.y),
                    k.color(...enemyTypes[b.enemyId].color),
                    k.z(1000),
                    "editorEnemy",
                ])
                entity.editorData = b

            } else if (b.type === "tile") {

                const spriteData = tileSprites[b.sprite]
                if (!spriteData) continue

                const sprite = renderPixelSprite(k, spriteData, 2)

                const tile = k.add([
                    k.rect(sprite.width, sprite.height),
                    k.pos(b.x, b.y),
                    k.opacity(0),
                    k.z(0),
                    "editorTile",
                ])

                sprite.components.forEach(comp => tile.add(comp))
                tile.editorData = b

            } else {

                const entity = k.add([
                    k.rect(b.w, b.h),
                    k.pos(b.x, b.y),
                    k.color(...blockTypes[b.type].color),
                    "editorBlock",
                ])
                entity.editorData = b
            }
        }
    }

    // ---------------- TOOL KEYS ----------------
    k.onKeyPress("4", () => setTool("spawn"))
    k.onKeyPress("5", () => setTool("enemy"))
    k.onKeyPress("6", () => setTool("tile"))

    function setTool(type) {
        currentType = type
        updateEditorUI()

        if (spawnPreview) spawnPreview.destroy()
        if (enemyPreview) enemyPreview.destroy()

        spawnPreview = null
        enemyPreview = null

        if (type === "spawn") {
            spawnPreview = k.add([
                k.rect(16, 16),
                k.pos(0, 0),
                k.color(...blockTypes.spawn.color),
                k.opacity(0.5),
                k.z(2000),
            ])
        }

        if (tilePreview) {
            tilePreview.destroy()
            tilePreview = null
        }

        if (type === "tile") {

            updateTilePreview()
        }

        if (type === "enemy") {
            enemyPreview = k.add([
                k.rect(24, 24),
                k.pos(0, 0),
                k.color(...enemyTypes[currentEnemyType].color),
                k.opacity(0.5),
                k.z(2000),
            ])
        }
    }

    // ---------------- LEFT CLICK ----------------
    k.onMousePress("left", () => {

        const worldPos = k.toWorld(k.mousePos())

        // ---- TILE ----
        if (currentType === "tile") {

            const TILE_SIZE = 24 * 2

            const snappedX = Math.floor(worldPos.x / TILE_SIZE) * TILE_SIZE
            const snappedY = Math.floor(worldPos.y / TILE_SIZE) * TILE_SIZE

            const block = {
                id: crypto.randomUUID(),
                type: "tile",
                sprite: currentTile,
                x: snappedX,
                y: snappedY,
                solid: true,
            }

            blocks.push(block)
            scheduleAutosave()

            const spriteData = tileSprites[currentTile]
            if (!spriteData) return

            const sprite = renderPixelSprite(k, spriteData, 2)

            const tile = k.add([
                k.rect(sprite.width, sprite.height),
                k.pos(snappedX, snappedY),
                k.opacity(0),
                "editorTile",
            ])

            sprite.components.forEach(comp => tile.add(comp))
            tile.editorData = block

            return
        }

        // ---- SPAWN ----
        if (currentType === "spawn") {

            blocks.splice(
                blocks.findIndex(b => b.type === "spawn"),
                1
            )

            if (spawnEntity) spawnEntity.destroy()

            const block = {
                id: crypto.randomUUID(),
                x: worldPos.x,
                y: worldPos.y,
                w: 16,
                h: 16,
                type: "spawn",
            }

            blocks.push(block)
            scheduleAutosave()

            spawnEntity = k.add([
                k.rect(16, 16),
                k.pos(block.x, block.y),
                k.color(...blockTypes.spawn.color),
                k.z(1000),
                "editorSpawn",
            ])

            spawnEntity.editorData = block
            return
        }

        // ---- ENEMY ----
        if (currentType === "enemy") {

            const block = {
                id: crypto.randomUUID(),
                x: worldPos.x,
                y: worldPos.y,
                w: 24,
                h: 24,
                type: "enemy",
                enemyId: currentEnemyType,
            }

            blocks.push(block)
            scheduleAutosave()

            const entity = k.add([
                k.rect(24, 24),
                k.pos(block.x, block.y),
                k.color(...enemyTypes[currentEnemyType].color),
                "editorEnemy",
            ])

            entity.editorData = block
            return
        }

        // ---- RECTANGLE DRAW ----
        startPos = worldPos

        preview = k.add([
            k.rect(1, 1),
            k.pos(startPos),
            k.color(...blockTypes[currentType].color),
            k.opacity(0.4),
        ])
    })

    // ---------------- RECT FINALIZE ----------------
    k.onMouseRelease("left", () => {
        if (!preview) return

        const block = {
            id: crypto.randomUUID(),
            x: preview.pos.x,
            y: preview.pos.y,
            w: preview.width,
            h: preview.height,
            type: currentType,
        }

        blocks.push(block)
        scheduleAutosave()

        const entity = k.add([
            k.rect(block.w, block.h),
            k.pos(block.x, block.y),
            k.color(...blockTypes[currentType].color),
            "editorBlock",
        ])

        entity.editorData = block

        preview.destroy()
        preview = null
        startPos = null
    })

    // ---------------- DELETE ----------------
    k.onMousePress("right", () => {

        const worldPos = k.toWorld(k.mousePos())

        const target = k.get().reverse().find(e =>
            (e.is("editorBlock") ||
                e.is("editorEnemy") ||
                e.is("editorTile") ||
                e.is("editorSpawn")) &&
            worldPos.x >= e.pos.x &&
            worldPos.x <= e.pos.x + e.width &&
            worldPos.y >= e.pos.y &&
            worldPos.y <= e.pos.y + e.height
        )

        if (!target || !target.editorData) return

        blocks.splice(
            blocks.findIndex(b => b.id === target.editorData.id),
            1
        )

        target.destroy()
        scheduleAutosave()
    })

    // ---------------- EXPORT / PLAY ----------------
    k.onKeyPress("e", () => downloadJSON(blocks, "level1.json"))
    k.onKeyPress("p", () => {
        window.__LEVEL_DATA__ = blocks
        k.go("overworld")
    })
    k.onKeyPress("r", () => {

        if (currentType !== "tile") return

        currentTileIndex = (currentTileIndex + 1) % TILE_ORDER.length
        currentTile = TILE_ORDER[currentTileIndex]

        updateTilePreview()
        updateEditorUI()
    })

    function updateTilePreview() {

        if (tilePreview) {
            tilePreview.destroy()
            tilePreview = null
        }

        if (currentType !== "tile") return

        const spriteData = tileSprites[currentTile]
        if (!spriteData) return

        const sprite = renderPixelSprite(k, spriteData, 2)

        tilePreview = k.add([
            k.rect(sprite.width, sprite.height),
            k.pos(0, 0),
            k.opacity(0),
            k.z(2000),
        ])

        sprite.components.forEach(comp => {
            const child = tilePreview.add(comp)
            child.opacity = 0.5
        })
    }
    k.onKeyPress("8", () => k.go("overworld"))

    k.onKeyPress("delete", clearMap)

    function downloadJSON(data, filename = "level1.json") {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
    }

    function clearMap() {

        // Clear data
        blocks.length = 0

        // Destroy all editor entities
        ;[
            ...k.get("editorBlock"),
            ...k.get("editorEnemy"),
            ...k.get("editorTile"),
            ...k.get("editorSpawn"),
        ].forEach(e => e.destroy())

        spawnEntity = null
        spawnPreview = null
        enemyPreview = null

        // Clear autosave
        localStorage.removeItem("autosave_level")

        console.log("Map cleared")
    }

    // --------------- UI (unchanged) ---------------
    const panelWidth = k.width() * 0.20
    const marginX = k.width() * 0.02
    const marginY = k.height() * 0.02

    const titleSize = Math.max(16, k.height() * 0.03)
    const bodySize = Math.max(13, k.height() * 0.022)

    function buildEditorText() {
        return (
            "TOOLS\n" +
            "4 Spawn\n" +
            "5 Enemy\n" +
            "6 Tile\n\n" +
            `Current Tile: ${currentTile}\n\n` +
            `Current Tool: ${currentType.toUpperCase()}\n\n` +
            `Enemy Type: ${currentEnemyType.toUpperCase()}\n\n` +
            "Q  Cycle Enemy\n" +
            "WASD Move Camera\n" +
            "P  Play Test\n" +
            "DELETE delete map\n\n" +
            "E  Export"
        )
    }

    const uiBody = k.add([
        k.text(buildEditorText(), {
            size: bodySize,
            styles: false,
            width: panelWidth * 0.85,
        }),
        k.pos(marginX + panelWidth * 0.05, marginY + k.height() * 0.10),
        k.fixed(),
        k.z(1001),
    ])



    function updateEditorUI() {
        uiBody.text = buildEditorText()
    }
}