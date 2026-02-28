import { gameState } from "../core/state.js"
import { renderPixelSprite } from "../pixel/renderPixelSprite.js"
import playerSprite from "../sprites/player.json"
import swordSprite from "../sprites/sword.json"

export function createPlayer(k, { x = 80, y = 200 } = {}) {

    const spriteScale = 2

    // Visual sprite size (your pixel sprite)
    let visW = 24
    let visH = 28

    if (playerSprite) {
        visW = playerSprite.width * spriteScale
        visH = playerSprite.height * spriteScale
    }

    // Grid-aligned collider (48px tiles → 32px body)
    const colW = 24
    const colH = visH - 4

    // --------------------------------------------------
    // PHYSICS BODY (INVISIBLE)
    // --------------------------------------------------
    const player = k.add([
        k.pos(x, y),

        // Render component must match collider exactly
        k.rect(colW, colH),
        k.opacity(0),

        k.area(),
        k.body({ jumpForce: 650 }),
        k.z(1000),
        "player",
    ])

    // --------------------------------------------------
    // VISUALS (SEPARATE OBJECT THAT FOLLOWS PHYSICS)
    // --------------------------------------------------
    const visual = k.add([
        k.pos(player.pos.x, player.pos.y),
        k.scale(1, 1),
        k.z(1001),
        "playerVisual",
    ])

    player.visual = visual

    // Follow physics body
    player.onUpdate(() => {
        visual.pos.x = player.pos.x - (visW - colW) / 2
        visual.pos.y = player.pos.y
    })


    // --------------------------------------------------
    // PIXEL SPRITE CHILDREN ON VISUAL (NOT ON PHYSICS BODY)
    // --------------------------------------------------
    player.pixelChildren = []
    player.spriteWidth = visW
    player.spriteHeight = visH
    player.pixelSize = spriteScale

    // Animation state
    player.currentFrame = 0
    player.frameTimer = 0
    player.frameSpeed = 0.12
    player.facing = 1

    if (playerSprite) {
        const sprite = renderPixelSprite(k, playerSprite, spriteScale)
        sprite.components.forEach((comp) => {
            const child = visual.add(comp)
            player.pixelChildren.push(child)
            child._baseX = child.pos.x
            child._baseY = child.pos.y
        })

        player.setFrame = function (index) {
            const frames = playerSprite.frames
            if (!frames || frames.length === 0) return

            const frame = frames[index].pixels
            let i = 0

            for (let py = 0; py < playerSprite.height; py++) {
                for (let px = 0; px < playerSprite.width; px++) {
                    const child = player.pixelChildren[i++]
                    if (!child) continue

                    const colorIndex = frame[py][px]
                    if (colorIndex === null) {
                        child.opacity = 0
                    } else {
                        child.opacity = 1
                        child.color = k.rgb(...playerSprite.palette[colorIndex])
                    }
                }
            }

            player.currentFrame = index
        }

        player.setFacing = function (dir) {
            if (dir !== 1 && dir !== -1) return
            if (player.facing === dir) return

            const w = player.spriteWidth
            const ps = player.pixelSize

            for (const child of player.pixelChildren) {
                const baseX = child._baseX
                child.pos.x = (dir === 1)
                    ? baseX
                    : (w - baseX - ps)

                child.pos.y = child._baseY
            }

            player.facing = dir
        }

        player.setFrame(0)
        player.setFacing(1)
    }

    player.onCollide((obj, col) => {
        if (col.isLeft() || col.isRight()) {
            player.vel.x = 0
        }
    })

    // Attack properties
    player.isAttacking = false
    player.attackCooldown = 0
    player.attackDuration = 0.18
    player.attackPower = 5
    player.weapon = gameState.playerWeapon

    return player
}

export function attachPlayerJumpControls(k, player, opts = {}) {
    const {
        jumpCutMultiplier = 0.5,
        inputEnabled = () => true,
    } = opts

    k.onKeyPress("space", () => {
        if (!inputEnabled()) return
        if (!player.isGrounded()) return

        player.jump()

        k.shake(0.2)

        // ----------------------------------
        // ✨ Jump Puff Effect
        // ----------------------------------

        const centerX = player.pos.x + (player.spriteWidth ?? 24) / 2
        const footY = player.pos.y + (player.spriteHeight ?? 28)

        for (let i = 0; i < 4; i++) {

            const dir = (Math.random() - 0.5) * 80

            k.add([
                k.pos(centerX + k.rand(-6, 6), footY - 2),
                k.rect(6, 3),
                k.anchor("center"),
                k.color(230, 230, 230),
                k.opacity(0.7),
                k.move(dir, -40),
                k.lifespan(0.25, { fade: 0.2 }),
            ])
        }
    })

    k.onKeyRelease("space", () => {
        if (player.vel && player.vel.y < 0) {
            player.vel.y *= jumpCutMultiplier
        }
    })
}

export function attachPlayerMovement(k, player, opts = {}) {
    const {
        baseSpeed = 180,
        boostMultiplier = 1.35,
        boostTime = 0.25,
        inputEnabled = () => true,
    } = opts

    let inputDirection = 0
    let isSprinting = false
    let boostTimer = 0

    // ------------------------------
    // INPUT
    // ------------------------------

    k.onKeyDown("a", () => {
        if (!inputEnabled()) return
        inputDirection = -1
    })

    k.onKeyDown("d", () => {
        if (!inputEnabled()) return
        inputDirection = 1
    })

    k.onKeyRelease("a", () => {
        if (inputDirection === -1) inputDirection = 0
    })

    k.onKeyRelease("d", () => {
        if (inputDirection === 1) inputDirection = 0
    })

    k.onKeyDown("shift", () => {
        isSprinting = true
    })

    k.onKeyRelease("shift", () => {
        isSprinting = false
    })

    // ------------------------------
    // ATTACK
    // ------------------------------

    function startAttack() {
        player.isAttacking = true
        player.attackCooldown = 0.35

        const swingDuration = 0.18
        const direction = player.facing ?? 1

        const centerX = () => player.pos.x + (player.spriteWidth ?? 24) / 2
        const centerY = () => player.pos.y + (player.spriteHeight ?? 28) / 2

        const sword = k.add([
            k.pos(0, 0),
            k.anchor("center"),
            k.rotate(0),
            k.z(99999),
        ])

        sword.scale = k.vec2(direction, 1)

        const rendered = renderPixelSprite(k, swordSprite, 2)
        rendered.components.forEach(comp => sword.add(comp))

        const hitbox = sword.add([
            k.pos(24, 14),
            k.rect(32, 8),
            k.anchor("center"),
            k.area(),
            k.opacity(0),
            "playerAttack",
        ])

        const swordGripOffset = k.vec2(16 * direction, 0)

        let currentT = -70

        sword.onUpdate(() => {
            sword.pos = k.vec2(centerX(), centerY()).add(swordGripOffset)
            sword.angle = currentT * direction
        })

        hitbox.onCollide("enemy", (enemy) => {
            if (!enemy || enemy.isDestroyed?.()) return


            const flash = k.add([
                k.rect(k.width(), k.height()),
                k.color(255, 255, 255),
                k.opacity(1),
                k.fixed(),
                k.z(999999),
            ])

            k.tween(1, 0, 0.15, (o) => {
                flash.opacity = o
            })

            k.wait(0.15, () => {
                k.go("battleTransition", {
                    enemyType: enemy.enemyType,
                    spawnId: enemy.spawnId,
                    returnPos: player.pos.clone(),
                    preemptive: true,
                })
            })

        })

        hitbox.active = false

        k.tween(-70, 70, swingDuration, (t) => {
            currentT = t
            const progress = (t + 70) / 140
            hitbox.active = progress > 0.2 && progress < 0.8
        })

        k.wait(swingDuration, () => {
            if (sword.exists()) sword.destroy()
            if (hitbox.exists()) hitbox.destroy()
            player.isAttacking = false
        })
    }

    k.onKeyPress("j", () => {
        if (!inputEnabled()) return
        if (player.attackCooldown > 0) return
        if (player.isAttacking) return
        startAttack()
    })

    // ------------------------------
    // UPDATE LOOP
    // ------------------------------

    k.onUpdate(() => {

        if (player.attackCooldown > 0) {
            player.attackCooldown -= k.dt()
        }

        // Horizontal velocity-based movement
        let speed = baseSpeed

        if (boostTimer > 0) {
            speed *= boostMultiplier
        }

        if (isSprinting && player.isGrounded()) {
            speed *= 1.6
        }

        const accel = 3000
        const friction = 4000
        const maxSpeed = speed

        if (inputDirection !== 0) {
            player.vel.x += inputDirection * accel * k.dt()
        } else {
            // Apply friction
            if (player.vel.x > 0) {
                player.vel.x = Math.max(0, player.vel.x - friction * k.dt())
            } else if (player.vel.x < 0) {
                player.vel.x = Math.min(0, player.vel.x + friction * k.dt())
            }
        }

// Clamp velocity
        player.vel.x = Math.max(-maxSpeed, Math.min(maxSpeed, player.vel.x))

        boostTimer = Math.max(0, boostTimer - k.dt())

        // Flip
        if (player.setFacing) {
            if (inputDirection === -1) player.setFacing(-1)
            if (inputDirection === 1) player.setFacing(1)
        }

        // ---------------- Animation ----------------

        if (playerSprite?.frames && playerSprite.frames.length >= 6) {

            const IDLE = 0
            const WALK_START = 1
            const WALK_END = 3
            const JUMP_UP = 4
            const JUMP_FALL = 5

            const grounded = player.isGrounded()
            const moving = inputDirection !== 0 && grounded

            if (!grounded) {
                if (player.vel.y < -20) player.setFrame(JUMP_UP)
                else if (player.vel.y > 20) player.setFrame(JUMP_FALL)
                return
            }

            if (moving) {

                player.frameTimer -= k.dt()

                if (player.frameTimer <= 0) {
                    player.frameTimer = player.frameSpeed

                    if (player.currentFrame < WALK_START || player.currentFrame > WALK_END) {
                        player.setFrame(WALK_START)
                    } else {
                        let next = player.currentFrame + 1
                        if (next > WALK_END) next = WALK_START
                        player.setFrame(next)
                    }
                }

            } else {
                player.setFrame(IDLE)
            }
            player.pos.x = Math.round(player.pos.x)
        }

    })
}
