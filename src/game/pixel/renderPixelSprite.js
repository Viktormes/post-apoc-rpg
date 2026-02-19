export function renderPixelSprite(k, spriteData, pixelSize = 1) {

    const components = []
    const { palette, width, height } = spriteData

    const framePixels =
        spriteData.frames && spriteData.frames.length > 0
            ? spriteData.frames[0].pixels
            : spriteData.pixels

    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {

            const colorIndex = framePixels[py][px]

            const comp = [
                k.rect(pixelSize, pixelSize),
                k.pos(px * pixelSize, py * pixelSize),
                k.opacity(colorIndex === null ? 0 : 1),
            ]

            if (colorIndex !== null) {
                comp.push(k.color(...palette[colorIndex]))
            } else {
                comp.push(k.color(0,0,0))
            }

            components.push(comp)
        }
    }

    return {
        components,
        width: width * pixelSize,
        height: height * pixelSize
    }
}
