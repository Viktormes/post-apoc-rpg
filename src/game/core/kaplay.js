import kaplay from "kaplay"

const k = kaplay({
    width: window.innerWidth,
    height: window.innerHeight,
    clearColor: [0, 0, 0, 1],
})

k.setGravity(1600)

window.addEventListener("resize", () => {
    const w = window.innerWidth
    const h = window.innerHeight

    k.canvas.width = w
    k.canvas.height = h
})

export default k