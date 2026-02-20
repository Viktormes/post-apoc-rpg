import k from "../core/kaplay.js"
import { attachPlayerJumpControls, attachPlayerMovement, createPlayer } from "../entities/player.js"
import { loadLevel } from "../level/loadLevel.js"
import { gameState } from "../core/state.js"

import level1 from "../levels/level1.json"
import { enemyTypes, spawnOverworldEnemy } from "../entities/enemy.js"

k.scene("overworld", () => {

    const screenW = k.width()
    const screenH = k.height()
    const sectionHeight = screenH / 5

    // --------------------------------------------------
    // SKY BASE
    // --------------------------------------------------

    k.add([
        k.rect(screenW, screenH),
        k.pos(0, 0),
        k.color(255, 200, 120),
        k.fixed(),
        k.z(-200),
    ])

    // --------------------------------------------------
    // PARALLAX LAYER FACTORY
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 5 ORANGE/YELLOW LAYERS
    // --------------------------------------------------

    const layer1 = createParallaxLayer([180, 60, 20], 0, -100)
    const layer2 = createParallaxLayer([210, 90, 30], sectionHeight, -90)
    const layer3 = createParallaxLayer([230, 120, 40], sectionHeight * 2, -80)
    const layer4 = createParallaxLayer([250, 150, 60], sectionHeight * 3, -70)
    const layer5 = createParallaxLayer([255, 180, 90], sectionHeight * 4, -60)

    // --------------------------------------------------
    // CAMERA
    // --------------------------------------------------

    const cameraAnchor = k.add([k.pos(0, 0)])
    k.setCamScale(1.4)

    const levelData = window.__LEVEL_DATA__ ?? level1
    window.__LEVEL_DATA__ = null

    const { spawn, enemySpawns } = loadLevel(k, levelData)

    const spawnPos = spawn
        ? k.vec2(spawn.x, spawn.y)
        : k.vec2(80, 200)

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

    // --------------------------------------------------
    // PARALLAX UPDATE
    // --------------------------------------------------

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

    k.onUpdate(() => {

        const maxCameraY = screenH * 0.5

        cameraAnchor.pos.x = player.pos.x + 120
        cameraAnchor.pos.y = Math.min(player.pos.y, maxCameraY)

        k.setCamPos(cameraAnchor.pos)

        updateLayer(layer1, 0.05)
        updateLayer(layer2, 0.1)
        updateLayer(layer3, 0.2)
        updateLayer(layer4, 0.35)
        updateLayer(layer5, 0.5)

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

    // --------------------------------------------------
    // UI + EDITOR KEYS (RESTORED)
    // --------------------------------------------------

    k.add([
        k.text("A/D move · Space jump · 9 editor · 0 pixel editor", {
            size: 14,
            styles: false,
        }),
        k.pos(20, 20),
        k.fixed(),
    ])


    const hpBarWidth = 180
    const hpBarHeight = 16

// Frame / background
    k.add([
        k.rect(hpBarWidth + 4, hpBarHeight + 4),
        k.pos(18, 44), // slightly below text
        k.color(0, 0, 0),
        k.fixed(),
        k.z(1000),
    ])

// Inner background
    k.add([
        k.rect(hpBarWidth, hpBarHeight),
        k.pos(20, 46),
        k.color(60, 30, 30),
        k.fixed(),
        k.z(1001),
    ])

// HP fill
    const hpFill = k.add([
        k.rect(hpBarWidth, hpBarHeight),
        k.pos(20, 46),
        k.color(220, 40, 40),
        k.fixed(),
        k.z(1002),
    ])

// Optional numeric text
    const hpText = k.add([
        k.text("", { size: 12 }),
        k.pos(24, 48),
        k.fixed(),
        k.z(1003),
    ])

// Update HP bar
    k.onUpdate(() => {

        const ratio = Math.max(0, gameState.playerHP) / gameState.maxHP

        hpFill.width = hpBarWidth * ratio

        hpText.text = `${Math.ceil(gameState.playerHP)} / ${gameState.maxHP}`

        if (ratio > 0.6) {
            hpFill.color = k.rgb(220, 40, 40)
        } else if (ratio > 0.3) {
            hpFill.color = k.rgb(240, 140, 30)
        } else {
            hpFill.color = k.rgb(255, 20, 20)
        }
    })
    k.onKeyPress("9", () => {
        k.go("editor")
    })

    k.onKeyPress("0", () => {
        k.go("pixelEditor")
    })
})