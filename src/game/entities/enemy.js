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

function applyKnockback(entity, direction, force = 250) {
    if (!entity.vel) return
    entity.vel.x = direction * force
    entity.vel.y = -80
}

function flashEnemy(k, enemy) {
    if (!enemy.pixelChildren) return

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
}

export function spawnOverworldEnemy(k, template, x, y) {

    let enemy

    if (template.sprite) {

        const spriteScale = 2

        const sprite = renderPixelSprite(
            k,
            template.sprite,
            spriteScale
        )

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
    }

    // -----------------------------
    // HP
    // -----------------------------

    enemy.hp = template.maxHP
    enemy.hitRecently = false

    // -----------------------------
    // Add knockback damping
    // -----------------------------

    enemy.onUpdate(() => {
        if (!enemy.vel) return

        // horizontal friction
        enemy.vel.x *= 0.85

        // stop micro sliding
        if (Math.abs(enemy.vel.x) < 5) {
            enemy.vel.x = 0
        }
    })

    // -----------------------------
    // Flash that works for BOTH types
    // -----------------------------

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

    function applyKnockback(direction, force = 260) {
        if (!enemy.vel) return
        enemy.vel.x = direction * force
        enemy.vel.y = -60
    }

    enemy.takeDamage = function(amount, direction) {

        if (this.hitRecently) return
        this.hitRecently = true

        this.hp -= amount

        flash()
        applyKnockback(direction)

        k.wait(0.25, () => {
            if (!this.exists()) return
            this.hitRecently = false
        })

        if (this.hp <= 0) {
            this.destroy()
        }
    }

    return enemy
}
