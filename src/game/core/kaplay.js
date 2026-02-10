import kaplay from "kaplay"

const k = kaplay({
    width: 640,
    height: 360,
    scale: 2,
    clearColor: [0, 0, 0, 1],
})

k.setGravity(1600)

export default k