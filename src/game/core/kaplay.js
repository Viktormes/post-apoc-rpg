import kaplay from "kaplay"

const k = kaplay({
    width: window.innerWidth,
    height: window.innerHeight,
    scale: 1,
    clearColor: [0, 0, 0, 1],
})

k.setGravity(2000)

window.addEventListener("resize", () => {
    const w = window.innerWidth
    const h = window.innerHeight

    k.canvas.width = w
    k.canvas.height = h
})

export default k