export function editorScene(k) {

    let spawnEntity = null
    let spawnPreview = null

    // --- Reset Camera ---
    k.setCamPos(k.width() / 2, k.height() / 2)
    k.setCamScale(1)

    // ---------- State ----------
    const blocks = []
    let currentType = "platform"
    let startPos = null
    let preview = null

    // ---------- Styling ----------
    const COLORS = {
        ground: [80, 80, 80],
        platform: [100, 100, 120],
        cave: [70, 70, 90],
        spawn: [0, 255, 0],
    }

    // ---------- Camera ----------
    let camX = k.width() / 2
    let camY = k.height() / 2
    const CAM_SPEED = 400

    k.onUpdate(() => {
        const dt = k.dt()

        if (spawnPreview && currentType === "spawn") {
            const worldPos = k.toWorld(k.mousePos())
            spawnPreview.pos = worldPos
        }

        if (!startPos) {
            if (k.isKeyDown("a")) camX -= CAM_SPEED * dt
            if (k.isKeyDown("d")) camX += CAM_SPEED * dt
            if (k.isKeyDown("w")) camY -= CAM_SPEED * dt
            if (k.isKeyDown("s")) camY += CAM_SPEED * dt
        }

        k.setCamPos(camX, camY)
    })

    // ---------- Restore Autosave ----------
    const saved = localStorage.getItem("autosave_level")
    if (saved) {
        const parsed = JSON.parse(saved)
        blocks.push(...parsed)

        for (const b of parsed) {

            if (b.type === "spawn") {

                spawnEntity = k.add([
                    k.rect(16, 16),
                    k.pos(b.x, b.y),
                    k.color(...COLORS.spawn),
                    k.z(1000),
                    "editorSpawn",
                ])
            } else {
                k.add([
                    k.rect(b.w, b.h),
                    k.pos(b.x, b.y),
                    k.area(),
                    k.body({ isStatic: true }),
                    k.color(...COLORS[b.type]),
                    "editorBlock",
                ])
            }
        }
    }

    function removeSpawnPreview() {
        if (spawnPreview) {
            spawnPreview.destroy()
            spawnPreview = null
        }
    }

    // ---------- Block Type Selection ----------
    k.onKeyPress("1", () => setTool("ground"))
    k.onKeyPress("2", () => setTool("platform"))
    k.onKeyPress("3", () => setTool("cave"))
    k.onKeyPress("4", () => setTool("spawn"))

    function setTool(type) {
        currentType = type

        if (type === "spawn") {
            if (!spawnPreview) {
                spawnPreview = k.add([
                    k.rect(16, 16),
                    k.pos(0, 0),
                    k.color(...COLORS.spawn),
                    k.opacity(0.5),
                    k.z(2000),
                ])
            }
        } else {
            if (spawnPreview) {
                spawnPreview.destroy()
                spawnPreview = null
            }
        }
    }

    // ---------- Mouse Press ----------
    k.onMousePress("left", () => {

        const worldPos = k.toWorld(k.mousePos())

        // ---- Spawn Tool (Click Only) ----
        if (currentType === "spawn") {

            const worldPos = k.toWorld(k.mousePos())

            // Remove old spawn from data
            for (let i = blocks.length - 1; i >= 0; i--) {
                if (blocks[i].type === "spawn") {
                    blocks.splice(i, 1)
                }
            }

            // Remove old spawn entity visually
            if (spawnEntity) {
                spawnEntity.destroy()
                spawnEntity = null
            }

            const block = {
                x: worldPos.x,
                y: worldPos.y,
                w: 16,
                h: 16,
                type: "spawn",
            }

            blocks.push(block)
            localStorage.setItem("autosave_level", JSON.stringify(blocks))

            spawnEntity = k.add([
                k.rect(16, 16),
                k.pos(block.x, block.y),
                k.color(...COLORS.spawn),
                k.z(1000),
                "editorSpawn",
            ])

            return
        }
        // ---- Normal Block Drawing ----
        startPos = worldPos

        preview = k.add([
            k.rect(1, 1),
            k.pos(startPos),
            k.color(...COLORS[currentType]),
            k.opacity(0.4),
        ])
    })

    // ---------- Mouse Move ----------
    k.onMouseMove(() => {
        if (!startPos || !preview) return

        const worldPos = k.toWorld(k.mousePos())

        // Move spawn preview if active
        if (currentType === "spawn" && spawnPreview) {
            spawnPreview.pos = worldPos
        }


        if (!startPos || !preview) return


        const m = k.toWorld(k.mousePos())
        const x = Math.min(startPos.x, m.x)
        const y = Math.min(startPos.y, m.y)
        const w = Math.abs(m.x - startPos.x)
        const h = Math.abs(m.y - startPos.y)

        preview.pos = k.vec2(x, y)
        preview.width = w
        preview.height = h
    })

    // ---------- Mouse Release ----------
    k.onMouseRelease("left", () => {
        if (!preview) return

        const block = {
            x: preview.pos.x,
            y: preview.pos.y,
            w: preview.width,
            h: preview.height,
            type: currentType,
        }

        blocks.push(block)
        localStorage.setItem("autosave_level", JSON.stringify(blocks))

        k.add([
            k.rect(block.w, block.h),
            k.pos(block.x, block.y),
            k.area(),
            k.body({ isStatic: true }),
            k.color(...COLORS[currentType]),
            "editorBlock",
        ])

        preview.destroy()
        preview = null
        startPos = null
    })


    k.onMousePress("right", () => {

        const worldPos = k.toWorld(k.mousePos())

        // Find topmost block under cursor
        const hits = k.get("editorBlock").filter(e =>
            worldPos.x >= e.pos.x &&
            worldPos.x <= e.pos.x + e.width &&
            worldPos.y >= e.pos.y &&
            worldPos.y <= e.pos.y + e.height
        )

        if (hits.length > 0) {
            const target = hits[hits.length - 1]

            // Remove from blocks array
            for (let i = blocks.length - 1; i >= 0; i--) {
                const b = blocks[i]
                if (
                    b.x === target.pos.x &&
                    b.y === target.pos.y &&
                    b.w === target.width &&
                    b.h === target.height
                ) {
                    blocks.splice(i, 1)
                    break
                }
            }

            target.destroy()
            localStorage.setItem("autosave_level", JSON.stringify(blocks))
            return
        }

        // Check spawn separately
        if (spawnEntity) {
            if (
                worldPos.x >= spawnEntity.pos.x &&
                worldPos.x <= spawnEntity.pos.x + 16 &&
                worldPos.y >= spawnEntity.pos.y &&
                worldPos.y <= spawnEntity.pos.y + 16
            ) {
                spawnEntity.destroy()
                spawnEntity = null

                for (let i = blocks.length - 1; i >= 0; i--) {
                    if (blocks[i].type === "spawn") {
                        blocks.splice(i, 1)
                    }
                }

                localStorage.setItem("autosave_level", JSON.stringify(blocks))
            }
        }
    })

    // ---------- Export ----------
    k.onKeyPress("e", () => {
        downloadJSON(blocks, "level1.json")
    })

    // ---------- Scene Switching ----------
    k.onKeyPress("p", () => {
        window.__LEVEL_DATA__ = blocks
        k.go("overworld")
    })

    k.onKeyPress("8", () => {
        k.go("overworld")
    })

    // ---------- Download Helper ----------
    function downloadJSON(data, filename = "level1.json") {
        const blob = new Blob(
            [JSON.stringify(data, null, 2)],
            { type: "application/json" }
        )

        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        a.click()

        URL.revokeObjectURL(url)
    }

    // ---------- UI ----------
    k.add([
        k.text(
            "LEVEL EDITOR\n" +
            "1 Ground | 2 Platform | 3 Cave | 4 Spawn\n" +
            "Drag = draw blocks\n" +
            "Click = place spawn\n" +
            "WASD = move camera\n" +
            "P = play test | E = export",
            { size: 14, styles: false }
        ),
        k.pos(20, 20),
        k.fixed(),
    ])
}
