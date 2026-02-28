import k from "../core/kaplay.js"

k.scene("battleTransition", (data) => {
    console.log("ENTER battleTransition", data)

    k.add([
        k.rect(k.width(), k.height()),
        k.color(0, 0, 0),
        k.opacity(1),
        k.fixed(),
        k.z(99999),
    ])

    k.wait(0.12, () => {
        console.log("GO battle now")
        k.go("battle", data)
    })
})