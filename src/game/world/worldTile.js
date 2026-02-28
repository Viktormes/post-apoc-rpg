export function spawnWorldTile(k, spriteData, x, y, options = {}) {

    const {
        solid = false,
        scale = 2,
        zIndex = 0,
    } = options

    // --------------------------------------------------
    // Create scaled canvas (NO entity scaling)
    // --------------------------------------------------

    const canvas = document.createElement("canvas")
    canvas.width = spriteData.width * scale
    canvas.height = spriteData.height * scale
    const ctx = canvas.getContext("2d")

    const frame = spriteData.frames[0].pixels
    const palette = spriteData.palette

    for (let py = 0; py < spriteData.height; py++) {
        for (let px = 0; px < spriteData.width; px++) {

            const colorIndex = frame[py][px]
            if (colorIndex === null) continue

            const [r, g, b] = palette[colorIndex]
            ctx.fillStyle = `rgb(${r},${g},${b})`

            // Scale pixels manually
            ctx.fillRect(
                px * scale,
                py * scale,
                scale,
                scale
            )
        }
    }

    const spriteName = `tile_${Math.random()}`
    k.loadSprite(spriteName, canvas)

    // --------------------------------------------------
    // Add tile WITHOUT k.scale()
    // --------------------------------------------------

    const tile = k.add([
        k.sprite(spriteName),
        k.pos(x, y),
        k.z(zIndex),

        ...(solid ? [
            k.area({
                width: canvas.width,
                height: canvas.height,
                offset: k.vec2(0, 0),
            }),
            k.body({ isStatic: true }),
        ] : []),

        "worldTile",
    ])

    // --------------------------------------------------
    // Visibility culling (optional, physics unaffected)
    // --------------------------------------------------

    tile.onUpdate(() => {

        const cam = k.camPos()
        const screenW = k.width()
        const screenH = k.height()
        const margin = 100

        const left = cam.x - screenW / 2 - margin
        const right = cam.x + screenW / 2 + margin
        const top = cam.y - screenH / 2 - margin
        const bottom = cam.y + screenH / 2 + margin

        const tileRight = tile.pos.x + canvas.width
        const tileBottom = tile.pos.y + canvas.height

        const visible =
            tile.pos.x < right &&
            tileRight > left &&
            tile.pos.y < bottom &&
            tileBottom > top

        tile.hidden = !visible
    })

    return tile
}