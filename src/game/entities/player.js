import {gameState} from "../core/state.js";
import { renderPixelSprite } from "../pixel/renderPixelSprite.js"
import playerSprite from "../sprites/player.json"


export function createPlayer(k, { x = 80, y = 200 } = {}) {

    const spriteScale = 2

    let width = 24
    let height = 28

    let player

    if (playerSprite) {

        const sprite = renderPixelSprite(
            k,
            playerSprite,
            spriteScale
        )

        width = sprite.width
        height = sprite.height

        player = k.add([
            k.rect(width, height),
            k.pos(x, y),
            k.color(0, 0, 0),
            k.opacity(0),
            k.area(),
            k.body({ jumpForce: 650 }),
            "player",
        ])

        sprite.components.forEach(comp => {
            player.add(comp)
        })

    } else {

        player = k.add([
            k.rect(width, height),
            k.pos(x, y),
            k.opacity(0),
            k.area(),
            k.body({ jumpForce: 650 }),
            "player",
        ])
    }

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

export function attachPlayerMovement(k, player, opts = {}) {
    const {
        baseSpeed = 180,
        boostMultiplier = 2,
        boostTime = 0.25,
        landingBounce = 120,
        landingBounceCooldown = 0.2,
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
        const playerEffectColor = [100, 220, 160]

        bounceCooldown = Math.max(0, bounceCooldown - k.dt())

        if (justLanded) {
            boostTimer = boostTime

            const wasFalling = prevVelY > 40
            if (wasFalling && bounceCooldown <= 0 && player.vel) {
                player.vel.y = -landingBounce
                bounceCooldown = landingBounceCooldown

            }
        }

        boostTimer = Math.max(0, boostTimer - k.dt())
        wasGrounded = grounded
        prevVelY = player.vel ? player.vel.y : 0

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