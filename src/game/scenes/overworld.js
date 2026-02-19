import k from "../core/kaplay.js"
import { attachPlayerJumpControls, attachPlayerMovement, createPlayer } from "../entities/player.js"
import { loadLevel } from "../level/loadLevel.js"
import { gameState } from "../core/state.js"

import level1 from "../levels/level1.json"
import { enemyTypes, spawnOverworldEnemy } from "../entities/enemy.js"

k.scene("overworld", () => {

    const screenW = k.width()
    const screenH = k.height()
    const sectionHeight = screenH / 3

    // --- Sky ---
    k.add([
        k.rect(screenW, screenH),
        k.pos(0, 0),
        k.color(120, 180, 255),
        k.fixed(),
        k.z(-100),
    ])

    // --- Infinite Parallax Layer Factory ---
    function createParallaxLayer(color, y, z) {

        const layer1 = k.add([
            k.rect(screenW, sectionHeight),
            k.pos(0, y),
            k.color(...color),
            k.fixed(),
            k.z(z),
        ])

        const layer2 = k.add([
            k.rect(screenW, sectionHeight),
            k.pos(screenW, y),
            k.color(...color),
            k.fixed(),
            k.z(z),
        ])

        return { layer1, layer2 }
    }

    const far = createParallaxLayer([90, 130, 170], 0, -90)
    const mid = createParallaxLayer([110, 150, 190], sectionHeight, -80)
    const near = createParallaxLayer([130, 170, 200], sectionHeight * 2, -70)

    // --- Camera Anchor ---
    const cameraAnchor = k.add([k.pos(0, 0)])

    k.setCamScale(1.4)

    // --- Load Level ---
    const levelData = window.__LEVEL_DATA__ ?? level1
    window.__LEVEL_DATA__ = null

    const { spawn, enemySpawns } = loadLevel(k, levelData)

    const spawnPos = spawn
        ? k.vec2(spawn.x, spawn.y)
        : k.vec2(80, 200)

    // --- Player ---
    const player = createPlayer(k, spawnPos.clone())
    player.opacity = 0

    attachPlayerJumpControls(k, player, {
        jumpCutMultiplier: 0.5,
        inputEnabled: () => true,
    })

    attachPlayerMovement(k, player, {
        baseSpeed: 180,
        boostMultiplier: 1.35,
        boostTime: 0.25,
        landingBounce: 120,
        inputEnabled: () => true,
    })

    enemySpawns.forEach(spawnData => {
        spawnOverworldEnemy(
            k,
            enemyTypes[spawnData.enemyId],
            spawnData.x,
            spawnData.y,
        )
    })

    // --- Infinite Parallax Update ---
    function updateLayer(layerObj, speed) {

        const camX = cameraAnchor.pos.x
        const offset = (-camX * speed) % screenW

        layerObj.layer1.pos.x = offset
        layerObj.layer2.pos.x = offset + screenW

        if (layerObj.layer1.pos.x <= -screenW) {
            layerObj.layer1.pos.x += screenW * 2
        }

        if (layerObj.layer2.pos.x <= -screenW) {
            layerObj.layer2.pos.x += screenW * 2
        }
    }

    // --- Follow + Respawn Logic ---
    k.onUpdate(() => {

        const maxCameraY = screenH * 0.5

        cameraAnchor.pos.x = player.pos.x + 120
        cameraAnchor.pos.y = Math.min(player.pos.y, maxCameraY)

        k.setCamPos(cameraAnchor.pos)

        // Parallax
        updateLayer(far, 0.1)
        updateLayer(mid, 0.2)
        updateLayer(near, 0.35)

        // --- Fall / Respawn ---
        const fallY = screenH + 20
        const fallDamage = 5

        if (player.pos.y > fallY) {

            gameState.playerHP = Math.max(0, gameState.playerHP - fallDamage)

            player.pos = spawnPos.clone()

            if (player.vel) {
                player.vel.x = 0
                player.vel.y = 0
            }

            cameraAnchor.pos.x = spawnPos.x + 120
            cameraAnchor.pos.y = Math.min(spawnPos.y, maxCameraY)
        }
    })

    // --- UI ---
    k.add([
        k.text("A/D move · Space jump · 9 editor · 0 pixel editor", {
            size: 14,
            styles: false,
        }),
        k.pos(20, 20),
        k.fixed(),
    ])

    k.onKeyPress("9", () => {
        k.go("editor")
    })

    k.onKeyPress("0", () => {
        k.go("pixelEditor")
    })
})
