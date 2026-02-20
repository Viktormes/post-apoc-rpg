export function spawnWorldTile(k, spriteData, x, y, options = {}) {

    const {
        solid = false,
        scale = 2,
        zIndex = 0,
    } = options

    // Create offscreen canvas
    const canvas = document.createElement("canvas")
    canvas.width = spriteData.width
    canvas.height = spriteData.height
    const ctx = canvas.getContext("2d")

    const frame = spriteData.frames[0].pixels
    const palette = spriteData.palette

    for (let py = 0; py < spriteData.height; py++) {
        for (let px = 0; px < spriteData.width; px++) {

            const colorIndex = frame[py][px]
            if (colorIndex === null) continue

            const [r, g, b] = palette[colorIndex]
            ctx.fillStyle = `rgb(${r},${g},${b})`
            ctx.fillRect(px, py, 1, 1)
        }
    }

    const spriteName = `tile_${Math.random()}`
    k.loadSprite(spriteName, canvas)

    const tile = k.add([
        k.sprite(spriteName),
        k.pos(x, y),
        k.scale(scale),
        k.z(zIndex),
        ...(solid ? [k.area(), k.body({ isStatic: true })] : []),
        "worldTile",
    ])

    tile.onUpdate(() => {

        const cam = k.camPos()
        const screenW = k.width()
        const screenH = k.height()

        const margin = 100

        const left = cam.x - screenW / 2 - margin
        const right = cam.x + screenW / 2 + margin
        const top = cam.y - screenH / 2 - margin
        const bottom = cam.y + screenH / 2 + margin

        const tileRight = tile.pos.x + tile.width * tile.scale.x
        const tileBottom = tile.pos.y + tile.height * tile.scale.y

        const visible =
            tile.pos.x < right &&
            tileRight > left &&
            tile.pos.y < bottom &&
            tileBottom > top

        tile.hidden = !visible
    })

    return tile

}