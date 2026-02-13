export function editorScene(k) {

    let spawnEntity = null
    let spawnPreview = null
    let enemyPreview = null
    let currentEnemyType = "ghoul"
    const ENEMY_ORDER = ["ghoul", "orc", "golem"]


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
        enemy: [200, 50, 50],
    }


    // ---------- Camera ----------
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
    k.onKeyPress("5", () => setTool("enemy"))

    function setTool(type) {
        currentType = type
        updateEditorUI()

        if (spawnPreview) {
            spawnPreview.destroy()
            spawnPreview = null
        }
        if (enemyPreview) {
            enemyPreview.destroy()
            enemyPreview = null
        }

        if (type === "spawn") {
            spawnPreview = k.add([
                k.rect(16, 16),
                k.pos(0, 0),
                k.color(...COLORS.spawn),
                k.opacity(0.5),
                k.z(2000),
            ])
        }

        if (type === "enemy") {
            enemyPreview = k.add([
                k.rect(24, 24),
                k.pos(0, 0),
                k.color(...COLORS.enemy),
                k.opacity(0.5),
                k.z(2000),
            ])
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

        const enemyColors = {
            ghoul: [160, 200, 160],
            orc: [120, 180, 80],
            golem: [120, 120, 140],
        }

        if (currentType === "enemy") {

            const worldPos = k.toWorld(k.mousePos())

            const block = {
                x: worldPos.x,
                y: worldPos.y,
                w: 24,
                h: 24,
                type: "enemy",
                enemyId: currentEnemyType,
            }

            blocks.push(block)
            localStorage.setItem("autosave_level", JSON.stringify(blocks))

            k.add([
                k.rect(24, 24),
                k.pos(block.x, block.y),
                k.color(...enemyColors[currentEnemyType]),
                k.z(1000),
                "editorEnemy",
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
        const hits = [
            ...k.get("editorBlock"),
            ...k.get("editorEnemy"),
        ].filter(e =>
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

    k.onKeyPress("q", () => {
        if (currentType !== "enemy") return

        const currentIndex = ENEMY_ORDER.indexOf(currentEnemyType)
        const nextIndex = (currentIndex + 1) % ENEMY_ORDER.length
        currentEnemyType = ENEMY_ORDER[nextIndex]

        const enemyColors = {
            ghoul: [160, 200, 160],
            orc: [120, 180, 80],
            golem: [120, 120, 140],
        }

        if (enemyPreview) {
            enemyPreview.color = k.rgb(...enemyColors[currentEnemyType])
        }

        updateEditorUI()   // 👈 important
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

    const panelWidth = k.width() * 0.20
    const marginX = k.width() * 0.02
    const marginY = k.height() * 0.02

    const titleSize = Math.max(16, k.height() * 0.03)
    const bodySize = Math.max(13, k.height() * 0.022)

// Temporary text to measure height
    const tempText = k.add([
        k.text("", {
            size: bodySize,
            styles: false,
            width: panelWidth * 0.85,
        }),
        k.pos(0, 0),
        k.opacity(0),
    ])

    function buildEditorText() {
        return (
            "TOOLS\n" +
            "1 Ground\n" +
            "2 Platform\n" +
            "3 Cave\n" +
            "4 Spawn\n" +
            "5 Enemy\n\n" +
            `Current Tool: ${currentType.toUpperCase()}\n\n` +
            `Enemy Type: ${currentEnemyType.toUpperCase()}\n\n` +
            "Q  Cycle Enemy\n" +
            "WASD Move Camera\n" +
            "P  Play Test\n" +
            "E  Export"
        )
    }

    tempText.text = buildEditorText()

// Calculate dynamic height
    const dynamicHeight =
        tempText.height + (k.height() * 0.15)

    tempText.destroy()

// Panel background
    k.add([
        k.rect(panelWidth, dynamicHeight),
        k.pos(marginX, marginY),
        k.color(15, 20, 30),
        k.opacity(0.85),
        k.fixed(),
        k.z(999),
    ])

// Accent bar
    k.add([
        k.rect(panelWidth, 4),
        k.pos(marginX, marginY),
        k.color(80, 120, 200),
        k.fixed(),
        k.z(1000),
    ])

// Title
    k.add([
        k.text("MAP EDITOR", { size: titleSize, styles: false }),
        k.pos(
            marginX + panelWidth * 0.05,
            marginY + k.height() * 0.04
        ),
        k.color(200, 220, 255),
        k.fixed(),
        k.z(1001),
    ])

// Dynamic text body
    const uiBody = k.add([
        k.text(buildEditorText(), {
            size: bodySize,
            styles: false,
            width: panelWidth * 0.85,
        }),
        k.pos(
            marginX + panelWidth * 0.05,
            marginY + k.height() * 0.10
        ),
        k.fixed(),
        k.z(1001),
    ])

    function updateEditorUI() {
        uiBody.text = buildEditorText()
    }
}