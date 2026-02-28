import k from "../core/kaplay.js"
import { gameState } from "../core/state.js"
import { renderPixelSprite } from "../pixel/renderPixelSprite.js"



function createBattlefield(k) {

    const W = k.width()
    const H = k.height()

    // Base bg
    k.add([k.rect(W, H), k.color(8, 8, 12), k.fixed(), k.z(0)])

    // Horizon glow band (retro "gradient" trick with stacked rects)
    k.add([k.rect(W, H * 0.45), k.pos(0, 0), k.color(18, 18, 28), k.fixed(), k.z(1)])
    k.add([k.rect(W, H * 0.25), k.pos(0, H * 0.30), k.color(12, 12, 20), k.fixed(), k.z(1)])

    // Distant skyline / ruins silhouettes (simple blocks)
    for (let i = 0; i < 18; i++) {
        const bw = k.rand(20, 80)
        const bh = k.rand(15, 90)
        const bx = k.rand(-30, W + 30)
        const by = H * 0.38 - bh + k.rand(-6, 6)

        k.add([
            k.rect(bw, bh),
            k.pos(bx, by),
            k.color(6, 6, 10),
            k.fixed(),
            k.z(2),
            k.opacity(k.rand(0.4, 0.8)),
        ])
    }

    // Ground plane (near)
    k.add([
        k.rect(W, H * 0.55),
        k.pos(0, H * 0.45),
        k.color(10, 10, 14),
        k.fixed(),
        k.z(3),
    ])

    // Ground “perspective lines” (retro grid feel)
    for (let i = 0; i < 22; i++) {
        const y = H * 0.48 + i * 10
        const alpha = Math.max(0, 0.18 - i * 0.007)

        k.add([
            k.rect(W, 1),
            k.pos(0, y),
            k.color(20, 20, 30),
            k.opacity(alpha),
            k.fixed(),
            k.z(4),
        ])
    }

    // Vignette (cinematic)
    k.add([
        k.rect(W, H),
        k.color(0, 0, 0),
        k.opacity(0.28),
        k.fixed(),
        k.z(500),
    ])

    // Scanlines (very subtle)
    for (let y = 0; y < H; y += 4) {
        k.add([
            k.rect(W, 1),
            k.pos(0, y),
            k.color(0, 0, 0),
            k.opacity(0.06),
            k.fixed(),
            k.z(600),
        ])
    }

    // Dust motes (subtle moving particles)
    for (let i = 0; i < 40; i++) {
        const p = k.add([
            k.pos(k.rand(0, W), k.rand(H * 0.15, H * 0.55)),
            k.rect(2, 2),
            k.color(200, 200, 220),
            k.opacity(k.rand(0.03, 0.10)),
            k.fixed(),
            k.z(50),
        ])

        const baseX = p.pos.x
        const baseY = p.pos.y
        const sp = k.rand(0.6, 1.6)
        const phase = k.rand(0, 10)

        p.onUpdate(() => {
            p.pos.x = baseX + Math.sin(k.time() * sp + phase) * 14
            p.pos.y = baseY + Math.cos(k.time() * sp + phase) * 6
        })
    }
}


function createEnemyStage(k, enemyType) {
    const W = k.width()
    const H = k.height()

    // Name
    const title = k.add([
        k.text(enemyType.name.toUpperCase(), { size: 30 }),
        k.pos(W / 2, H * 0.18),
        k.anchor("center"),
        k.fixed(),
        k.z(30),
        k.opacity(1),
    ])

    // Spotlight behind enemy
    k.add([
        k.rect(420, 260),
        k.pos(W / 2, H * 0.33),
        k.anchor("center"),
        k.color(28, 28, 44),
        k.opacity(0.85),
        k.fixed(),
        k.z(20),
    ])

    // --- Enemy visual ---
    // Render pixel sprite big for “first-person” feeling
    const battleScale = 6

    let enemyVis
    let visW = 180
    let visH = 140

    if (enemyType.sprite) {
        const sprite = renderPixelSprite(k, enemyType.sprite, battleScale)
        visW = sprite.width
        visH = sprite.height

        // IMPORTANT: renderPixelSprite children assume top-left coordinates,
        // so we position the container by subtracting half width/height.
        enemyVis = k.add([
            k.pos(W / 2 - visW / 2, H * 0.33 - visH / 2),
            k.fixed(),
            k.z(25),

            // invisible base so we can reason about bounds if needed
            k.rect(visW, visH),
            k.opacity(0),
        ])

        sprite.components.forEach((comp) => enemyVis.add(comp))
    } else {
        // Fallback silhouette if no sprite exists
        enemyVis = k.add([
            k.rect(visW, visH),
            k.pos(W / 2 - visW / 2, H * 0.33 - visH / 2),
            k.color(10, 10, 16),
            k.opacity(0.9),
            k.fixed(),
            k.z(25),
        ])
    }

    // Subtle “breathing” idle (cinematic retro)
    const baseY = enemyVis.pos.y
    enemyVis.onUpdate(() => {
        enemyVis.pos.y = baseY + Math.sin(k.time() * 2) * 2
    })

    return { title, enemyVis }
}

k.scene("battle", ({ enemyType, spawnId, returnPos, preemptive }) => {

    const safeEnemy = enemyType ?? { name: "Unknown", maxHP: 1, speed: 1 }
    createBattlefield(k)
    createEnemyStage(k, safeEnemy)
    // --------------------------------------------------
    // BLACK COVER (START FULLY BLACK)
    // --------------------------------------------------

    const fade = k.add([
        k.rect(k.width(), k.height()),
        k.color(0, 0, 0),
        k.opacity(1),
        k.fixed(),
        k.z(100000),
    ])

    // --------------------------------------------------
    // BACKGROUND
    // --------------------------------------------------

    k.add([
        k.rect(k.width(), k.height()),
        k.color(15, 15, 25),
    ])


    // --------------------------------------------------
    // UI PANEL (BOTTOM)
    // --------------------------------------------------

    k.add([
        k.rect(k.width(), 140),
        k.pos(0, k.height() - 140),
        k.color(20, 20, 30),
        k.z(20),
    ])

    let waitingForPlayerInput = false

    const baseY = k.height() - 110
    const spacing = 160

    createBattleButton("ATTACK", 40, baseY, () => {
        playerAttack()
    })

    createBattleButton("SKILL", 40 + spacing, baseY, () => {})
    createBattleButton("ITEM", 40 + spacing * 2, baseY, () => {})
    createBattleButton("FLEE", 40 + spacing * 3, baseY, () => {
        k.go("overworld")
    })

    function createBattleButton(label, x, y, action) {

        const btn = k.add([
            k.rect(140, 40),
            k.pos(x, y),
            k.area(),
            k.color(40, 40, 60),
            k.z(21),
        ])

        k.add([
            k.text(label, { size: 18 }),
            k.pos(x + 70, y + 20),
            k.anchor("center"),
            k.z(22),
        ])

        btn.onHoverUpdate(() => {
            if (waitingForPlayerInput)
                btn.color = k.rgb(60, 60, 90)
        })

        btn.onHoverEnd(() => {
            btn.color = k.rgb(40, 40, 60)
        })

        btn.onClick(() => {
            if (waitingForPlayerInput) {
                action()
            }
        })

        btn.onUpdate(() => {
            btn.opacity = waitingForPlayerInput ? 1 : 0.4
        })

        return btn
    }

    function playerAttack() {

        const dmg = Math.floor(k.rand(4, 9))
        enemyStats.hp -= dmg

        spawnDamageNumber(
            k.width() / 2,
            k.height() * 0.30,
            dmg,
            [255, 100, 100]
        )

        console.log("Player hits for", dmg)

        waitingForPlayerInput = false

        if (enemyStats.hp <= 0) {

            gameState.defeatedEnemies.set(spawnId, true)

            k.wait(1.2, () => {
                gameState.playerHP = Math.max(0, playerStats.hp)

                k.go("overworld", {
                    returnPos: returnPos
                })
            })

            return
        }

        nextTurn()
    }
    // --------------------------------------------------
    // FADE IN EFFECT
    // --------------------------------------------------

    k.tween(1, 0, 0.3, (o) => {
        fade.opacity = o
    })

    // --------------------------------------------------
    // INITIATIVE SYSTEM (VERSION A)
    // --------------------------------------------------

    const playerStats = {
        hp: gameState.playerHP,
        maxHP: gameState.playerHP,
        speed: gameState.speed ?? 5,
    }

    const enemyStats = {
        hp: enemyType.maxHP,
        maxHP: enemyType.maxHP,
        speed: enemyType.speed ?? 1,
        damageMin: enemyType.damageMin ?? 2,
        damageMax: enemyType.damageMax ?? 5,
    }

    createHPBar(
        k.width() / 2 - 150,
        k.height() * 0.22,
        300,
        16,
        () => enemyStats.hp,
        () => enemyStats.maxHP
    )

// Player HP bar (bottom left)
    createHPBar(
        40,
        k.height() - 160,
        300,
        16,
        () => playerStats.hp,
        () => playerStats.maxHP
    )

    let turnOrder = []
    let currentTurn = 0

    function buildInitiative() {

        if (playerStats.speed > enemyStats.speed) {

            turnOrder = ["player", "enemy"]

        } else if (enemyStats.speed > playerStats.speed) {

            turnOrder = ["enemy", "player"]

        } else {
            if (k.rand(0, 1) < 0.5) {
                turnOrder = ["player", "enemy"]
            } else {
                turnOrder = ["enemy", "player"]
            }
        }
    }

    function nextTurn() {
        const actor = turnOrder[currentTurn]

        if (actor === "player") {
            waitingForPlayerInput = true
        } else {
            waitingForPlayerInput = false

            k.wait(0.6, () => {

                const dmg = Math.floor(
                    k.rand(enemyStats.damageMin, enemyStats.damageMax + 1)
                )

                playerStats.hp -= dmg

                spawnDamageNumber(
                    200,
                    k.height() - 190,
                    dmg,
                    [255, 160, 160]
                )

                console.log("Enemy hits for", dmg)

                nextTurn()
            })
        }

        currentTurn = (currentTurn + 1) % turnOrder.length
    }

    function createHPBar(x, y, width, height, getHP, getMaxHP) {

        const bg = k.add([
            k.rect(width, height),
            k.pos(x, y),
            k.color(50, 15, 15),
            k.z(40),
        ])

        const fill = k.add([
            k.rect(width, height),
            k.pos(x, y),
            k.color(220, 50, 50),
            k.z(41),
        ])

        fill.onUpdate(() => {
            const ratio = Math.max(0, getHP() / getMaxHP())
            fill.width = width * ratio
        })

        return { bg, fill }
    }

    function spawnDamageNumber(x, y, amount, color = [255, 120, 120]) {

        const txt = k.add([
            k.text(amount.toString(), { size: 45 }),
            k.pos(x, y),
            k.anchor("center"),
            k.color(...color),
            k.z(1000), // VERY IMPORTANT: force above everything
        ])

        let life = 0
        const duration = 1.2   // stays visible longer

        txt.onUpdate(() => {
            life += k.dt()

            // Float upward gently
            txt.pos.y -= 30 * k.dt()

            // Fade only in last half
            if (life > duration * 0.5) {
                txt.opacity = 1 - ((life - duration * 0.5) / (duration * 0.5))
            }

            if (life >= duration) {
                txt.destroy()
            }
        })
    }

    function startBattle() {

        buildInitiative()

        if (preemptive) {

            k.add([
                k.text("PREEMPTIVE STRIKE!", { size: 28 }),
                k.pos(k.center()),
                k.anchor("center"),
                k.opacity(1),
                k.z(50),
                k.lifespan(1.2),
            ])

            // If player already fastest → double turn
            if (turnOrder[0] === "player") {
                turnOrder.unshift("player")
            } else {
                // Otherwise just force player first
                turnOrder = ["player", ...turnOrder.filter(t => t !== "player")]
            }

            currentTurn = 0

            k.wait(1.0, () => {
                nextTurn()
            })

        } else {
            currentTurn = 0
            nextTurn()
        }
    }

    startBattle()

    // Temporary exit for testing
    k.onKeyPress("space", () => {
        gameState.playerHP = Math.max(0, playerStats.hp)

        k.go("overworld", {
            returnPos: returnPos
        })
    })
})