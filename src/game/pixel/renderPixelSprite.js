export function renderPixelSprite(k, spriteData, pixelSize = 1) {

    const components = []

    const { pixels, palette, width, height } = spriteData

    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {

            const colorIndex = pixels[py][px]
            if (colorIndex === null) continue

            components.push([
                k.rect(pixelSize, pixelSize),
                k.pos(px * pixelSize, py * pixelSize),
                k.color(...palette[colorIndex]),
            ])
        }
    }

    return {
        components,
        width: width * pixelSize,
        height: height * pixelSize
    }
}
