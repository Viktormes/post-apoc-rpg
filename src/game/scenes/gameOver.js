import k from "../core/kaplay.js"
import { gameState } from "../core/state.js"

k.scene("gameOver", () => {
    k.add([
        k.rect(640, 360),
        k.pos(0, 0),
        k.color(0, 0, 0),
        k.fixed(),
        k.z(-100),
    ])

    k.add([
        k.text("GAME OVER", { size: 36, styles: false }),
        k.pos(320, 140),
        k.anchor("center"),
        k.color(255, 80, 80),
    ])

    k.add([
        k.text("Press R to restart", { size: 16, styles: false }),
        k.pos(320, 200),
        k.anchor("center"),
        k.color(220, 220, 220),
    ])

    k.onKeyPress("r", () => {
        gameState.playerHP = gameState.maxHP
        k.go("overworld")
    })
})