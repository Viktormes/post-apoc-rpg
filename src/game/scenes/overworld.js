import k from "../core/kaplay.js"
import { attachPlayerJumpControls, attachPlayerMovement, createPlayer } from "../entities/player.js"
import { addOverworldPlatforms } from "./overworldPlatforms.js"
import { createOverworldBattle } from "./overworldBattle.js"

k.scene("overworld", () => {


    k.add([
        k.rect(640, 360),
        k.pos(0, 0),
        k.color(120, 180, 255),
        k.fixed(),
        k.z(-100),
    ])

    // --- Parallax background ---
    const farLayer = k.add([
        k.rect(2000, 120),
        k.pos(0, 0),
        k.color(90, 130, 170),
        k.z(-90),
        k.fixed(),
    ])

    const midLayer = k.add([
        k.rect(2000, 120),
        k.pos(0, 120),
        k.color(110, 150, 190),
        k.z(-80),
        k.fixed(),
    ])

    const nearLayer = k.add([
        k.rect(2000, 120),
        k.pos(0, 240),
        k.color(130, 170, 210),
        k.z(-70),
        k.fixed(),
    ])

    // --- Camera anchor ---
    const cameraAnchor = k.add([
        k.pos(0, 0),
    ])

    k.onUpdate(() => {
        k.setCamPos(cameraAnchor.pos)
    })

    // --- Ground ---
    addOverworldPlatforms(k)


    // --- Player ---
    const player = createPlayer(k, { x: 80, y: 200 })

    const battle = createOverworldBattle(k)

    attachPlayerJumpControls(k, player, {
        jumpCutMultiplier: 0.5,
        inputEnabled: () => !battle.isInBattle(),
    })

    attachPlayerMovement(k, player, {
        baseSpeed: 180,
        boostMultiplier: 1.35,
        boostTime: 0.25,
        landingBounce: 120,
        inputEnabled: () => !battle.isInBattle(),
    })

    // --- Follow player ---
    k.onUpdate(() => {
        const maxCameraY = 180
        cameraAnchor.pos.x = player.pos.x + 120
        cameraAnchor.pos.y = Math.min(player.pos.y, maxCameraY)

        k.setCamPos(cameraAnchor.pos)

        const camX = cameraAnchor.pos.x
        farLayer.pos.x = -camX * 0.1
        midLayer.pos.x = -camX * 0.2
        nearLayer.pos.x = -camX * 0.35

        const fallY = 380
        const respawnPos = k.vec2(80, 200)
        const fallDamage = 5
        if (player.pos.y > fallY) {
            gameState.playerHP = Math.max(0, gameState.playerHP - fallDamage)
            player.pos = respawnPos
            if (player.vel) {
                player.vel.x = 0
                player.vel.y = 0
            }
        }
    })

    // --- UI ---
    k.add([
        k.text("A/D move · Space jump · B battle", {
            size: 14,
            styles: false,
        }),
        k.pos(20, 20),
        k.fixed(),
    ])

    k.onKeyPress("b", () => {
        battle.startBattleOverlay()
    })
})