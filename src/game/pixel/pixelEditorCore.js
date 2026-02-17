export function createPixelEditor(palette) {

    const WIDTH = 24
    const HEIGHT = 24

    const pixels = Array.from({ length: HEIGHT }, () =>
        Array.from({ length: WIDTH }, () => null)
    )

    let currentColorIndex = 1

    function setColor(index) {
        currentColorIndex = index
    }

    function draw(x, y) {
        if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return
        pixels[y][x] = currentColorIndex
    }

    function erase(x, y) {
        if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return
        pixels[y][x] = null
    }

    function clear() {
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                pixels[y][x] = null
            }
        }
    }

    function serialize() {
        return JSON.stringify({
            width: WIDTH,
            height: HEIGHT,
            palette,
            pixels,
        })
    }

    return {
        WIDTH,
        HEIGHT,
        palette,
        pixels,
        setColor,
        draw,
        erase,
        clear,
        serialize,
    }
}
