import { renderPixelSprite } from "../pixel/renderPixelSprite.js"
import ghoulSprite from "../sprites/ghoul.json"

export function createEnemyTemplate({
                                        id,
                                        name,
                                        maxHP,
                                        damageMin,
                                        damageMax,
                                        shape = "rect",
                                        width = 24,
                                        height = 24,
                                        color = [200, 50, 50],
                                        sprite = null
                                    }) {
    return {
        id,
        name,
        maxHP,
        damageMin,
        damageMax,
        shape,
        width,
        height,
        color,
        sprite,
    }
}

export const enemyTypes = {
    ghoul: createEnemyTemplate({
        id: "ghoul",
        name: "Ghoul",
        maxHP: 18,
        damageMin: 3,
        damageMax: 6,
        sprite: ghoulSprite,
        width: ghoulSprite.width,
        height: ghoulSprite.height,
    }),

    orc: createEnemyTemplate({
        id: "orc",
        name: "Orc",
        maxHP: 14,
        damageMin: 4,
        damageMax: 7,
        shape: "rect",
        width: 28,
        height: 28,
        color: [120, 180, 80],
    }),

    golem: createEnemyTemplate({
        id: "golem",
        name: "Golem",
        maxHP: 22,
        damageMin: 2,
        damageMax: 5,
        shape: "rect",
        width: 32,
        height: 32,
        color: [120, 120, 140],
    }),
}

export function spawnOverworldEnemy(k, template, x, y) {

    let enemy

    // ---------------------------------
    // Create visual
    // ---------------------------------

    if (template.sprite) {

        const spriteScale = 2
        const sprite = renderPixelSprite(k, template.sprite, spriteScale)

        enemy = k.add([
            k.rect(sprite.width, sprite.height),
            k.pos(x, y),
            k.opacity(0),
            k.area(),
            k.body(),
            "enemy",
            "overworldEnemy"
        ])

        enemy.pixelChildren = []

        sprite.components.forEach(comp => {
            const child = enemy.add(comp)
            enemy.pixelChildren.push(child)
        })

        enemy.hitWidth = sprite.width
        enemy.hitHeight = sprite.height

    } else {

        enemy = k.add([
            k.rect(template.width, template.height),
            k.pos(x, y),
            k.area(),
            k.body(),
            k.color(...template.color),
            "enemy",
            "overworldEnemy"
        ])

        enemy.hitWidth = template.width
        enemy.hitHeight = template.height
    }

    // ---------------------------------
    // Stats
    // ---------------------------------

    enemy.hp = template.maxHP
    enemy.hitRecently = false

    // ---------------------------------
    // Friction / damping
    // ---------------------------------

    enemy.onUpdate(() => {
        if (!enemy.vel) return

        enemy.vel.x *= 0.85

        if (Math.abs(enemy.vel.x) < 5) {
            enemy.vel.x = 0
        }
    })

    // ---------------------------------
    // Flash effect
    // ---------------------------------

    function flash() {

        if (enemy.pixelChildren) {

            const originalColors = []

            enemy.pixelChildren.forEach(child => {
                originalColors.push(child.color.clone())
                child.color = k.rgb(255, 255, 255)
            })

            k.wait(0.08, () => {
                if (!enemy.exists()) return
                enemy.pixelChildren.forEach((child, i) => {
                    child.color = originalColors[i]
                })
            })

        } else {

            const original = enemy.color.clone()
            enemy.color = k.rgb(255, 255, 255)

            k.wait(0.08, () => {
                if (!enemy.exists()) return
                enemy.color = original
            })
        }
    }

    // ---------------------------------
    // Impact particles
    // ---------------------------------

    function spawnHitParticles(direction) {

        const centerX = enemy.pos.x + enemy.hitWidth / 2
        const centerY = enemy.pos.y + enemy.hitHeight / 2

        const count = 18

        for (let i = 0; i < count; i++) {

            // Emit forward + slight upward bias
            const baseAngle = direction === 1 ? 0 : Math.PI
            const spread = Math.PI * 0.9
            const angle = baseAngle + k.rand(-spread / 2, spread / 2)

            const speed = k.rand(3000, 7000)

            const vx = Math.cos(angle) * speed
            const vy = Math.sin(angle) * speed - k.rand(100, 200)

            const size = k.rand(0.8, 1.5)

            const drop = k.add([
                k.pos(
                    centerX + k.rand(-4, 4),
                    centerY + k.rand(-4, 4)
                ),
                k.circle(size, size * 1.1), // slightly stretched droplet
                k.color(
                    k.rand(140, 190),  // dark red variation
                    0,
                    0
                ),
                k.opacity(1),
                k.lifespan(0.5),
            ])

            drop.vel = k.vec2(vx, vy)

            drop.onUpdate(() => {
                drop.move(drop.vel.x * k.dt(), drop.vel.y * k.dt())

                // gravity
                drop.vel.y += 1200 * k.dt()

                // air drag
                drop.vel.x *= 0.97

                // slight rotation for organic look
                drop.angle += 10 * direction
            })
        }
    }


    function tinyScreenShake(direction) {

        const duration = 0.02
        const strength = 0.2

        const originalCam = k.camPos().clone()

        let timer = duration

        const shake = k.onUpdate(() => {

            timer -= k.dt()

            if (timer <= 0) {
                k.setCamPos(originalCam)
                shake.cancel()
                return
            }

            const offsetX = k.rand(-strength, strength) + direction * 2
            const offsetY = k.rand(-strength, strength)

            k.setCamPos(originalCam.add(k.vec2(offsetX, offsetY)))
        })
    }
    // ---------------------------------
    // Knockback
    // ---------------------------------

    function applyKnockback(direction, force = 260) {
        if (!enemy.vel) return
        enemy.vel.x = direction * force
        enemy.vel.y = -60
    }

    // ---------------------------------
    // Damage logic
    // ---------------------------------

    enemy.takeDamage = function(amount, direction) {

        if (this.hitRecently) return
        this.hitRecently = true

        this.hp -= amount

        flash()
        tinyScreenShake(direction)
        spawnHitParticles(direction)
        applyKnockback(direction)

        k.wait(0.25, () => {
            if (!this.exists()) return
            this.hitRecently = false
        })

        if (this.hp <= 0) {
            this.destroy()
        }
    }

    enemy.active = true

    enemy.onUpdate(() => {

        const player = k.get("player")[0]
        if (!player) return

        const distance = Math.abs(player.pos.x - enemy.pos.x)
        const ACTIVE_RANGE = 800

        if (distance > ACTIVE_RANGE && enemy.active) {

            enemy.hidden = true
            enemy.vel.x = 0
            enemy.vel.y = 0
            enemy.active = false

        } else if (distance <= ACTIVE_RANGE && !enemy.active) {

            enemy.hidden = false
            enemy.active = true
        }
    })

    return enemy
}