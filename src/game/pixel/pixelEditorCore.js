export function createPixelEditor(palette) {

    const WIDTH = 24
    const HEIGHT = 24

    function createEmptyGrid() {
        return Array.from({ length: HEIGHT }, () =>
            Array.from({ length: WIDTH }, () => null)
        )
    }

    // --- Frames system ---
    const frames = [
        { pixels: createEmptyGrid() }
    ]

    let currentFrame = 0
    let currentColorIndex = 1

    function getPixels() {
        return frames[currentFrame].pixels
    }

    function setColor(index) {
        currentColorIndex = index
    }

    function draw(x, y) {
        if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return
        getPixels()[y][x] = currentColorIndex
    }

    function erase(x, y) {
        if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return
        getPixels()[y][x] = null
    }

    function clear() {
        const pixels = getPixels()
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                pixels[y][x] = null
            }
        }
    }

    function addFrame() {
        frames.push({ pixels: createEmptyGrid() })
        currentFrame = frames.length - 1
    }

    function nextFrame() {
        currentFrame = (currentFrame + 1) % frames.length
    }

    function previousFrame() {
        currentFrame =
            (currentFrame - 1 + frames.length) % frames.length
    }

    function serialize() {
        return JSON.stringify({
            width: WIDTH,
            height: HEIGHT,
            palette,
            frames
        })
    }

    function load(data) {
        const parsed = typeof data === "string"
            ? JSON.parse(data)
            : data

        frames.length = 0

        if (parsed.frames) {
            parsed.frames.forEach(frame => {
                frames.push({ pixels: frame.pixels })
            })
        } else if (parsed.pixels) {
            // Backward compatibility
            frames.push({ pixels: parsed.pixels })
        }

        currentFrame = 0
    }

    function duplicateFrame() {

        const source = frames[currentFrame].pixels

        // Deep copy 2D array
        const copy = source.map(row => [...row])

        frames.splice(currentFrame + 1, 0, { pixels: copy })

        currentFrame++
    }

    return {
        WIDTH,
        HEIGHT,
        palette,
        frames,
        getPixels,
        setColor,
        draw,
        erase,
        clear,
        addFrame,
        duplicateFrame,
        nextFrame,
        previousFrame,
        serialize,
        load,
        get currentFrame() {
            return currentFrame
        }
    }
}
