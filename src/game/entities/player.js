import { gameState } from "../core/state.js"
import { renderPixelSprite } from "../pixel/renderPixelSprite.js"
import playerSprite from "../sprites/player.json"
import swordSprite from "../sprites/sword.json"

export function createPlayer(k, { x = 80, y = 200 } = {}) {

    const spriteScale = 2

    let width = 24
    let height = 28
    let player

    if (playerSprite) {

        const sprite = renderPixelSprite(k, playerSprite, spriteScale)

        width = sprite.width
        height = sprite.height

        player = k.add([
            k.rect(width, height),
            k.pos(x, y),
            k.opacity(0),
            k.area(),
            k.body({ jumpForce: 650 }),
            "player",
        ])

        player.pixelChildren = []

        sprite.components.forEach((comp) => {
            const child = player.add(comp)
            player.pixelChildren.push(child)
            child._baseX = child.pos.x
            child._baseY = child.pos.y
        })

        player.spriteWidth = width
        player.spriteHeight = height
        player.pixelSize = spriteScale

        // Animation
        player.currentFrame = 0
        player.frameTimer = 0
        player.frameSpeed = 0.12
        player.facing = 1

        player.setFrame = function(index) {
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

        player.setFacing = function(dir) {
            if (dir !== 1 && dir !== -1) return
            if (player.facing === dir) return

            const w = player.spriteWidth
            const ps = player.pixelSize

            for (const child of player.pixelChildren) {
                const baseX = child._baseX
                child.pos.x = (dir === 1)
                    ? baseX
                    : (w - ps - baseX)

                child.pos.y = child._baseY
            }

            player.facing = dir
        }

        player.setFrame(0)
        player.setFacing(1)

    } else {

        player = k.add([
            k.rect(width, height),
            k.pos(x, y),
            k.area(),
            k.body({ jumpForce: 650 }),
            k.color(100, 220, 160),
            "player",
        ])
    }


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
        boostMultiplier = 2,
        boostTime = 0.25,
        landingBounce = 120,
        landingBounceCooldown = 0.2,
        inputEnabled = () => true,
    } = opts


    let isSprinting = false
    let inputDirection = 0
    let wasGrounded = false
    let boostTimer = 0
    let bounceCooldown = 0
    let prevVelY = 0
    let airTime = 0


    function startAttack() {
        player.isAttacking = true
        player.attackCooldown = 0.35

        const swingDuration = 0.18
        const direction = player.facing ?? 1


        const centerX = () => player.pos.x + (player.spriteWidth ?? 24) / 2
        const centerY = () => player.pos.y + (player.spriteHeight ?? 28) / 2

        // container
        const sword = k.add([
            k.pos(0, 0),
            k.anchor("center"),
            k.rotate(0),
            k.z(99999),
        ])

        // ✅ mirror the sword sprite itself (so left looks correct)
        sword.scale = k.vec2(direction, 1)

        const rendered = renderPixelSprite(k, swordSprite, 2)
        rendered.components.forEach(comp => sword.add(comp))


        const hitbox = sword.add([
            k.pos(24, 14),          // local position relative to sword center
            k.rect(32, 8),         // long thin blade hitbox
            k.anchor("center"),
            k.area(),
            k.opacity(0),          // set 0.3 to debug
            "playerAttack",
        ])

        // local placement tuning:
        const swordGripOffset = k.vec2(16 * direction, 0) // where the sword sits relative to player center

        let currentT = -70

        sword.onUpdate(() => {
            // sword center follows player
            const p = k.vec2(centerX(), centerY()).add(swordGripOffset)
            sword.pos = p

            // ✅ angle mirrored by direction
            sword.angle = currentT * direction

        })

        hitbox.onCollide("enemy", (enemy) => {
            if (!enemy || enemy.isDestroyed?.()) return
            enemy.takeDamage?.(player.attackPower, direction)
        })

        hitbox.active = false

        k.tween(-70, 70, swingDuration, (t) => {
            currentT = t

            const progress = (t + 70) / 140

            if (progress > 0.2 && progress < 0.8) {
                hitbox.active = true
            } else {
                hitbox.active = false
            }
        })


        k.wait(swingDuration, () => {
            if (sword.exists()) sword.destroy()
            if (hitbox.exists()) hitbox.destroy()
            player.isAttacking = false
        })
    }


    k.onUpdate(() => {
        const grounded = player.isGrounded()
        const justLanded = grounded && !wasGrounded


        if (!grounded) {
            airTime += k.dt()
        }

        if (player.attackCooldown > 0) {
            player.attackCooldown -= k.dt()
        }

        if (isSprinting && player.isGrounded()) {
            player.angle = 5 * player.facing
        } else {
            player.angle = 0
        }

        bounceCooldown = Math.max(0, bounceCooldown - k.dt())

        if (justLanded) {

            boostTimer = boostTime

            const hardLanding = airTime > 0.18

            if (hardLanding) {

                const centerX = player.pos.x + (player.spriteWidth ?? 24) / 2
                const footY = player.pos.y + (player.spriteHeight ?? 28)

                for (let i = 0; i < 6; i++) {

                    const dir = (Math.random() - 0.5) * 140

                    k.add([
                        k.pos(centerX + k.rand(-10, 10), footY - 2),
                        k.rect(6, 3),
                        k.anchor("center"),
                        k.color(220, 220, 220),
                        k.opacity(0.8),
                        k.move(dir, -20),
                        k.lifespan(0.35, { fade: 0.25 }),
                    ])
                }
            }

            // reset air timer
            airTime = 0

            // keep your bounce logic
            const wasFalling = prevVelY > 40
            if (wasFalling && bounceCooldown <= 0 && player.vel) {
                player.vel.y = -landingBounce
                bounceCooldown = landingBounceCooldown
            }
        }

        boostTimer = Math.max(0, boostTimer - k.dt())
        wasGrounded = grounded
        prevVelY = player.vel ? player.vel.y : 0

        // ---------------- Animation ----------------
        if (playerSprite?.frames && playerSprite.frames.length >= 6) {


            const IDLE = 0
            const WALK_START = 1
            const WALK_END = 3
            const JUMP_UP = 4
            const JUMP_FALL = 5

            const grounded = player.isGrounded()
            const moving = inputDirection !== 0 && grounded

            // --- AIR STATE HAS PRIORITY ---
            if (!grounded) {

                // Jumping upward
                if (player.vel.y < -20) {
                    if (player.currentFrame !== JUMP_UP) {
                        player.setFrame(JUMP_UP)
                    }
                }

                // Falling downward
                else if (player.vel.y > 20) {
                    if (player.currentFrame !== JUMP_FALL) {
                        player.setFrame(JUMP_FALL)
                    }
                }

                return
            }

            // --- GROUND STATES ---
            if (moving) {

                player.frameTimer -= k.dt()

                if (player.frameTimer <= 0) {
                    player.frameTimer = isSprinting ? player.frameSpeed * 0.6 : player.frameSpeed

                    if (isSprinting && grounded && Math.random() < 0.8) {

                        const centerX = player.pos.x + player.spriteWidth / 2
                        const footY = player.pos.y + player.spriteHeight

                        const offsetX = -8 * player.facing   // behind foot

                        k.add([
                            k.pos(centerX + offsetX, footY - 2 + k.rand(-1, 1)),
                            k.rect(4, 2),
                            k.move(-40 * player.facing, 0),
                            k.anchor("center"),
                            k.color(200, 200, 200),
                            k.opacity(0.6),
                            k.lifespan(0.25)
                        ])
                    }

                    if (player.currentFrame < WALK_START || player.currentFrame > WALK_END) {
                        player.setFrame(WALK_START)
                    } else {
                        let next = player.currentFrame + 1
                        if (next > WALK_END) next = WALK_START
                        player.setFrame(next)
                    }

                    const bobOffset = (player.currentFrame === 2) ? 1 : 0

                    for (const child of player.pixelChildren) {
                        child.pos.y = child._baseY + bobOffset
                    }
                }

            } else {

                if (player.currentFrame !== IDLE) {
                    player.setFrame(IDLE)
                }
            }
        }

        // ---------------- Flip ----------------
        if (player.setFacing) {
            if (inputDirection === -1) player.setFacing(-1)
            else if (inputDirection === 1) player.setFacing(1)
        }
    })

    // Movement
    k.onKeyDown("a", () => {
        if (!inputEnabled()) return
        inputDirection = -1
        let speed = boostTimer > 0 ? baseSpeed * boostMultiplier : baseSpeed

        if (isSprinting && player.isGrounded()) {
            speed *= 1.6
        }
        player.move(-speed, 0)
    })

    k.onKeyDown("d", () => {
        if (!inputEnabled()) return
        inputDirection = 1
        let speed = boostTimer > 0 ? baseSpeed * boostMultiplier : baseSpeed

        if (isSprinting && player.isGrounded()) {
            speed *= 1.6
        }
        player.move(speed, 0)
    })

    // Attack
    k.onKeyPress("j", () => {
        if (!inputEnabled()) return
        if (player.attackCooldown > 0) return
        if (player.isAttacking) return
        startAttack()
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
}
