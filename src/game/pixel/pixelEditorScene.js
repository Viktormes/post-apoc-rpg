import { createPixelEditor } from "./pixelEditorCore.js"

export function pixelEditorScene(k) {

    const palette = [
        [0, 0, 0],
        [255, 255, 255],
        [200, 80, 80],
        [80, 200, 80],
        [80, 80, 200],
        [180, 180, 80],
    ]

    const editor = createPixelEditor(palette)

    const GRID = editor.WIDTH
    const PIXEL_SIZE = Math.floor(k.height() * 0.025)

    const offsetX = Math.floor((k.width() - GRID * PIXEL_SIZE) / 2)
    const offsetY = Math.floor(k.height() * 0.20)

    let isDrawing = false
    let eraserMode = false
    let showGrid = true
    let selectedColorIndex = 1

    const gridVisual = []
    const paletteUI = []

    // Background
    k.add([
        k.rect(k.width(), k.height()),
        k.pos(0, 0),
        k.color(20, 25, 35),
    ])

    // ------------------------
    // TOOL HEADER
    // ------------------------

    const toolText = k.add([
        k.text("", { size: 18 }),
        k.pos(20, 20),
        k.fixed(),
    ])

    const activeColorPreview = k.add([
        k.rect(40, 40),
        k.pos(20, 50),
        k.color(...palette[selectedColorIndex]),
        k.fixed(),
    ])

    function updateToolText() {
        if (eraserMode) {
            toolText.text = "Tool: Eraser (X)"
            activeColorPreview.color = k.rgb(60, 60, 60)
        } else {
            toolText.text = "Tool: Brush"
            activeColorPreview.color = k.rgb(...palette[selectedColorIndex])
        }
    }

    updateToolText()

    // ------------------------
    // HELP PANEL
    // ------------------------

    const panelWidth = 320

    k.add([
        k.rect(panelWidth, 210),
        k.pos(20, 110),
        k.color(15, 20, 30),
        k.opacity(0.92),
        k.fixed(),
        k.z(1000),
    ])

    k.add([
        k.text(
            `PIXEL EDITOR

Mouse      Paint / Drag
X          Eraser
C          Clear canvas
G          Toggle grid
E          Export JSON
8          Back to game`,
            { size: 14, width: panelWidth - 20 }
        ),
        k.pos(30, 130),
        k.fixed(),
        k.z(1001),
    ])

    // ------------------------
    // GRID
    // ------------------------

    for (let y = 0; y < GRID; y++) {
        gridVisual[y] = []
        for (let x = 0; x < GRID; x++) {

            const cell = k.add([
                k.rect(PIXEL_SIZE - 1, PIXEL_SIZE - 1),
                k.pos(offsetX + x * PIXEL_SIZE, offsetY + y * PIXEL_SIZE),
                k.color(40, 40, 50),
                k.area(),
            ])

            cell.onClick(() => paint(x, y))

            gridVisual[y][x] = cell
        }
    }

    function paint(x, y) {
        if (eraserMode) editor.erase(x, y)
        else editor.draw(x, y)
        updatePixel(x, y)
    }

    function updatePixel(x, y) {
        const value = editor.pixels[y][x]
        gridVisual[y][x].color =
            value === null
                ? k.rgb(40, 40, 50)
                : k.rgb(...palette[value])
    }

    // ------------------------
    // FAST DRAG PAINTING
    // ------------------------

    k.onMousePress(() => {
        isDrawing = true
        handlePaintFromMouse()
    })

    k.onMouseRelease(() => {
        isDrawing = false
    })

    k.onMouseMove(() => {
        if (isDrawing) handlePaintFromMouse()
    })

    function handlePaintFromMouse() {

        const mouse = k.mousePos()

        const x = Math.floor((mouse.x - offsetX) / PIXEL_SIZE)
        const y = Math.floor((mouse.y - offsetY) / PIXEL_SIZE)

        if (x < 0 || y < 0 || x >= GRID || y >= GRID) return

        paint(x, y)
    }

    // ------------------------
    // PALETTE
    // ------------------------

    const paletteOffsetY = offsetY - PIXEL_SIZE * 3

    palette.forEach((col, i) => {

        const border = k.add([
            k.rect(PIXEL_SIZE * 1.5, PIXEL_SIZE * 1.5),
            k.pos(offsetX + i * (PIXEL_SIZE * 1.8) - 5, paletteOffsetY - 5),
            k.color(255, 255, 0),
            k.opacity(0),
        ])

        const swatch = k.add([
            k.rect(PIXEL_SIZE * 1.2, PIXEL_SIZE * 1.2),
            k.pos(offsetX + i * (PIXEL_SIZE * 1.8), paletteOffsetY),
            k.color(...col),
            k.area(),
        ])

        swatch.onClick(() => {
            editor.setColor(i)
            selectedColorIndex = i
            eraserMode = false
            updatePaletteHighlight()
            updateToolText()
        })

        paletteUI.push({ border, swatch })
    })

    function updatePaletteHighlight() {
        paletteUI.forEach((item, i) => {
            if (i === selectedColorIndex && !eraserMode) {
                item.border.opacity = 1
                item.swatch.scale = k.vec2(1.15, 1.15)
            } else {
                item.border.opacity = 0
                item.swatch.scale = k.vec2(1, 1)
            }
        })
    }

    updatePaletteHighlight()

    // ------------------------
    // CONTROLS
    // ------------------------

    k.onKeyPress("x", () => {
        eraserMode = true
        updateToolText()
        updatePaletteHighlight()
    })

    k.onKeyPress("c", () => {
        editor.clear()
        for (let y = 0; y < GRID; y++)
            for (let x = 0; x < GRID; x++)
                updatePixel(x, y)
    })

    k.onKeyPress("g", () => {
        showGrid = !showGrid
        for (let y = 0; y < GRID; y++) {
            for (let x = 0; x < GRID; x++) {
                gridVisual[y][x].width = PIXEL_SIZE - (showGrid ? 1 : 0)
                gridVisual[y][x].height = PIXEL_SIZE - (showGrid ? 1 : 0)
            }
        }
    })

    k.onKeyPress("e", () => {

        const blob = new Blob(
            [editor.serialize()],
            { type: "application/json" }
        )

        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "sprite_24x24.json"
        a.click()
        URL.revokeObjectURL(url)

        const msg = k.add([
            k.text("Exported!", { size: 22 }),
            k.pos(k.width() / 2, 50),
            k.anchor("center"),
            k.color(0, 255, 120),
            k.fixed(),
        ])

        k.tween(1, 0, 1.5, v => msg.opacity = v)
        k.wait(1.5, () => msg.destroy())
    })

    k.onKeyPress("8", () => k.go("overworld"))
}
