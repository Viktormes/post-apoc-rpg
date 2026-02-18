import {createPixelEditor} from "./pixelEditorCore.js"

export function pixelEditorScene(k) {

    const palette = [
        [0, 0, 0],
        [34, 32, 52],
        [69, 40, 60],
        [102, 57, 49],
        [143, 86, 59],
        [223, 113, 38],
        [217, 160, 102],
        [238, 195, 154],

        [251, 242, 54],
        [153, 229, 80],
        [106, 190, 48],
        [55, 148, 110],
        [75, 105, 47],
        [82, 75, 36],

        [50, 60, 57],
        [63, 63, 116],
        [48, 96, 130],
        [91, 110, 225],
        [99, 155, 255],
        [95, 205, 228],

        [203, 219, 252],
        [255, 255, 255],
        [155, 173, 183],
        [132, 126, 135],

        [105, 106, 106],
        [89, 86, 82],
        [118, 66, 138],
        [172, 50, 50],
        [217, 87, 99],
        [215, 123, 186],
        [143, 151, 74],
        [138, 111, 48],
    ]

    const editor = createPixelEditor(palette)

    const GRID = editor.WIDTH
    const PIXEL_SIZE = Math.floor(k.height() * 0.025)

    const offsetX = Math.floor((k.width() - GRID * PIXEL_SIZE) / 2)
    const offsetY = Math.floor(k.height() * 0.20)
    const undoStack = []
    const redoStack = []

    let currentStroke = null


    let lastPaintX = null
    let lastPaintY = null
    let isDrawing = false
    let eraserMode = false
    let showGrid = true
    let selectedColorIndex = 1
    let previousColorIndex = selectedColorIndex

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
            toolText.text = "Tool: Eraser"
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

Mouse(L)  Brush / Drag
Mouse(R)  Eraser / Drag 
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

            gridVisual[y][x] = k.add([
                k.rect(PIXEL_SIZE - 1, PIXEL_SIZE - 1),
                k.pos(offsetX + x * PIXEL_SIZE, offsetY + y * PIXEL_SIZE),
                k.color(40, 40, 50),
            ])
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

    let activeMouseButton = null

    k.onMousePress((btn) => {
        isDrawing = true
        activeMouseButton = btn
        currentStroke = []
        paintFromMouse()
    })

    k.onMouseRelease(() => {
        isDrawing = false
        lastPaintX = null
        lastPaintY = null
        activeMouseButton = null

        if (currentStroke && currentStroke.length > 0) {
            undoStack.push(currentStroke)
            redoStack.length = 0
        }

        currentStroke = null
    })

    k.onMouseMove(() => {
        if (isDrawing) paintFromMouse()
    })

    function paintFromMouse() {

        const mouse = k.mousePos()

        const x = Math.floor((mouse.x - offsetX) / PIXEL_SIZE)
        const y = Math.floor((mouse.y - offsetY) / PIXEL_SIZE)

        if (x < 0 || y < 0 || x >= GRID || y >= GRID) return

        if (lastPaintX === null) {
            applyPaint(x, y)
            lastPaintX = x
            lastPaintY = y
            return
        }

        drawLine(lastPaintX, lastPaintY, x, y)

        lastPaintX = x
        lastPaintY = y
    }

    function drawLine(x0, y0, x1, y1) {

        const dx = Math.abs(x1 - x0)
        const dy = Math.abs(y1 - y0)

        const sx = x0 < x1 ? 1 : -1
        const sy = y0 < y1 ? 1 : -1

        let err = dx - dy

        while (true) {

            applyPaint(x0, y0)

            if (x0 === x1 && y0 === y1) break

            const e2 = 2 * err

            if (e2 > -dy) {
                err -= dy
                x0 += sx
            }

            if (e2 < dx) {
                err += dx
                y0 += sy
            }
        }
    }

    function applyPaint(x, y) {

        const previous = editor.pixels[y][x]

        if (activeMouseButton === "right") {
            editor.erase(x, y)
        } else {
            editor.draw(x, y)
        }

        const current = editor.pixels[y][x]

        if (previous !== current && currentStroke) {

            currentStroke.push({
                x,
                y,
                previous,
                current
            })
        }

        updatePixel(x, y)
    }

    function undo() {

        if (undoStack.length === 0) return

        const stroke = undoStack.pop()

        for (const action of stroke) {
            editor.pixels[action.y][action.x] = action.previous
            updatePixel(action.x, action.y)
        }

        redoStack.push(stroke)
    }

    function redo() {

        if (redoStack.length === 0) return

        const stroke = redoStack.pop()

        for (const action of stroke) {
            editor.pixels[action.y][action.x] = action.current
            updatePixel(action.x, action.y)
        }

        undoStack.push(stroke)
    }

    // ------------------------
    // PALETTE
    // ------------------------

    const paletteColumns = 8
    const paletteSpacing = PIXEL_SIZE * 1.6
    const paletteRows = Math.ceil(palette.length / paletteColumns)
    const paletteHeight = paletteRows * paletteSpacing
    const paletteOffsetY = offsetY - paletteHeight - 20

    palette.forEach((col, i) => {

        const row = Math.floor(i / paletteColumns)
        const colIndex = i % paletteColumns

        const px = offsetX + colIndex * paletteSpacing
        const py = paletteOffsetY + row * paletteSpacing

        const border = k.add([
            k.rect(PIXEL_SIZE * 1.5, PIXEL_SIZE * 1.5),
            k.pos(px - 5, py - 5),
            k.color(255, 255, 0),
            k.opacity(0),
        ])

        const swatch = k.add([
            k.rect(PIXEL_SIZE * 1.2, PIXEL_SIZE * 1.2),
            k.pos(px, py),
            k.color(...col),
            k.area(),
        ])

        swatch.onClick(() => {
            previousColorIndex = i
            selectedColorIndex = i
            eraserMode = false
            editor.setColor(i)
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

    k.onKeyPress("c", () => {
        editor.clear()
        for (let y = 0; y < GRID; y++)
            for (let x = 0; x < GRID; x++)
                updatePixel(x, y)
    })

    k.onKeyPress("g", () => {
        showGrid = !showGrid
        for (let y = 0; y < GRID; y++)
            for (let x = 0; x < GRID; x++) {
                gridVisual[y][x].width = PIXEL_SIZE - (showGrid ? 1 : 0)
                gridVisual[y][x].height = PIXEL_SIZE - (showGrid ? 1 : 0)
            }
    })

    k.onKeyPress("z", () => {
        if (k.isKeyDown("control")) undo()
    })

    k.onKeyPress("y", () => {
        if (k.isKeyDown("control")) redo()
    })

    k.onKeyPress("e", async () => {

        try {

            const fileHandle = await window["showSaveFilePicker"]({
                suggestedName: "sprite_24x24.json",
                types: [{
                    description: "JSON Files",
                    accept: { "application/json": [".json"] }
                }]
            })

            const writable = await fileHandle.createWritable()
            await writable.write(editor.serialize())
            await writable.close()

            showExportMessage("Saved!")

        } catch (err) {
            // User cancelled or browser unsupported
            console.log("Save cancelled or not supported.")
        }
    })

    function showExportMessage(text) {

        const msg = k.add([
            k.text(text, { size: 22 }),
            k.pos(k.width() / 2, 50),
            k.anchor("center"),
            k.color(0, 255, 120),
            k.fixed(),
        ])

        k.tween(1, 0, 1.5, v => msg.opacity = v)
        k.wait(1.5, () => msg.destroy())
    }


    k.onKeyPress("8", () => k.go("overworld"))
}
