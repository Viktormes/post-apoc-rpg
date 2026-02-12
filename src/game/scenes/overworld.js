import k from "../core/kaplay.js"
import { attachPlayerJumpControls, attachPlayerMovement, createPlayer } from "../entities/player.js"
import { addOverworldPlatforms } from "./overworldPlatforms.js"
import { createOverworldBattle } from "./overworldBattle.js"
import { loadLevel } from "../level/loadLevel.js"
import {gameState} from "../core/state.js";

import level1 from "../levels/level1.json"
import {enemyTypes, spawnOverworldEnemy} from "../entities/enemy.js";

console.log("Imported level1:", level1)


k.scene("overworld", () => {




    // --- Background ---
    k.add([
        k.rect(640, 360),
        k.pos(0, 0),
        k.color(120, 180, 255),
        k.fixed(),
        k.z(-100),
    ])

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
        k.color(130, 170, 200),
        k.z(-70),
        k.fixed(),
    ])

    // --- Camera Anchor ---
    const cameraAnchor = k.add([ k.pos(0, 0) ])

    // --- Load Level (ONLY ONCE) ---
    const levelData = window.__LEVEL_DATA__ ?? level1
    window.__LEVEL_DATA__ = null  // clear runtime level after use

    const spawn = loadLevel(k, levelData)

    const spawnPos = spawn
        ? k.vec2(spawn.x, spawn.y)
        : k.vec2(80, 200)

    // --- Player ---
    const player = createPlayer(k, spawnPos.clone())

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

    spawnOverworldEnemy(
        k,
        enemyTypes.ghoul,
        spawnPos.x + 200,
        spawnPos.y - -90,
        (enemyTemplate, enemyEntity) => {
            battle.startBattleOverlay(enemyTemplate, enemyEntity, player)
        }
    )

    // --- Follow + Respawn Logic ---
    k.onUpdate(() => {

        const maxCameraY = 180
        cameraAnchor.pos.x = player.pos.x + 120
        cameraAnchor.pos.y = Math.min(player.pos.y, maxCameraY)

        k.setCamPos(cameraAnchor.pos)

        const camX = cameraAnchor.pos.x
        farLayer.pos.x = -camX * 0.1
        midLayer.pos.x = -camX * 0.2
        nearLayer.pos.x = -camX * 0.35

        // --- Fall / Respawn ---
        const fallY = 380
        const fallDamage = 5

        if (player.pos.y > fallY) {

            gameState.playerHP = Math.max(0, gameState.playerHP - fallDamage)

            player.pos = spawnPos.clone()

            if (player.vel) {
                player.vel.x = 0
                player.vel.y = 0
            }

            // reset camera immediately
            cameraAnchor.pos.x = spawnPos.x + 120
            cameraAnchor.pos.y = Math.min(spawnPos.y, maxCameraY)
        }
    })

    // --- UI ---
    k.add([
        k.text("A/D move · Space jump · B battle · 9 editor", {
            size: 14,
            styles: false,
        }),
        k.pos(20, 20),
        k.fixed(),
    ])

    k.onKeyPress("9", () => {
        k.go("editor")
    })
})
