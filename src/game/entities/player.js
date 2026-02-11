import {gameState} from "../core/state.js";

export function createPlayer(k, { x = 80, y = 200 } = {}) {
    const player = k.add([
        k.rect(24, 28),
        k.pos(x, y),
        k.area(),
        k.body({
            jumpForce: 520,
        }),
        k.color(10, 20, 30),
    ])

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
        if (player.isGrounded()) {
            player.jump()
        }
    })

    k.onKeyRelease("space", () => {
        if (player.vel && player.vel.y < 0) {
            player.vel.y *= jumpCutMultiplier
        }
    })
}

// ... existing code ...

export function attachPlayerMovement(k, player, opts = {}) {
    const {
        baseSpeed = 180,
        boostMultiplier = 1.35,
        boostTime = 0.25,
        landingBounce = 120,
        landingBounceCooldown = 0.2,
        trailInterval = 0.04,
        trailLifetime = 0.25,
        landingPuffRadius = 10,
        landingPuffLifetime = 0.2,
        inputEnabled = () => true,
    } = opts

    let wasGrounded = false
    let boostTimer = 0
    let bounceCooldown = 0
    let prevVelY = 0
    let trailTimer = 0

    k.onUpdate(() => {
        const grounded = player.isGrounded()
        const justLanded = grounded && !wasGrounded

        bounceCooldown = Math.max(0, bounceCooldown - k.dt())

        if (justLanded) {
            boostTimer = boostTime

            const wasFalling = prevVelY > 40
            if (wasFalling && bounceCooldown <= 0 && player.vel) {
                player.vel.y = -landingBounce
                bounceCooldown = landingBounceCooldown

                const puff = k.add([
                    k.circle(landingPuffRadius),
                    k.pos(player.pos.x + 12, player.pos.y + 30),
                    k.color(10, 20, 30),
                    k.opacity(0.6),
                    k.scale(1),
                    k.z(player.z ? player.z - 1 : 0),
                ])

                k.tween(1, 1.8, landingPuffLifetime, (v) => {
                    puff.scale = k.vec2(v, v * 0.5)
                })
                k.tween(puff.opacity, 0, landingPuffLifetime, (v) => {
                    puff.opacity = v
                })
                k.wait(landingPuffLifetime, () => {
                    puff.destroy()
                })
            }
        }

        boostTimer = Math.max(0, boostTimer - k.dt())
        wasGrounded = grounded
        prevVelY = player.vel ? player.vel.y : 0

        // --- Trail effect while boosting ---
        if (boostTimer > 0) {
            trailTimer -= k.dt()
            if (trailTimer <= 0) {
                trailTimer = trailInterval
                const trail = k.add([
                    k.rect(24, 28),
                    k.pos(player.pos.x, player.pos.y),
                    k.color(10, 20, 30),
                    k.opacity(0.6),
                    k.z(player.z ? player.z - 1 : 0),
                ])
                k.tween(trail.opacity, 0, trailLifetime, (v) => {
                    trail.opacity = v
                })
                k.wait(trailLifetime, () => {
                    trail.destroy()
                })
            }
        } else {
            trailTimer = 0
        }
    })

    k.onKeyDown("a", () => {
        if (!inputEnabled()) return
        const speed = boostTimer > 0 ? baseSpeed * boostMultiplier : baseSpeed
        player.move(-speed, 0)
    })

    k.onKeyDown("d", () => {
        if (!inputEnabled()) return
        const speed = boostTimer > 0 ? baseSpeed * boostMultiplier : baseSpeed
        player.move(speed, 0)
    })
}