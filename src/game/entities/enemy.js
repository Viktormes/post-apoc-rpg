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
                                    }) {
    return {
        id,
        name,
        maxHP,
        damageMin,
        damageMax,

        // Overworld visual data
        shape,
        width,
        height,
        color,
    }
}


export const enemyTypes = {
    ghoul: createEnemyTemplate({
        id: "ghoul",
        name: "Ghoul",
        maxHP: 18,
        damageMin: 3,
        damageMax: 6,
        shape: "rect",
        width: 24,
        height: 24,
        color: [160, 200, 160],
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

export function pickRandomEnemy() {
    const list = Object.values(enemyTypes)
    return list[Math.floor(Math.random() * list.length)]
}

export function spawnOverworldEnemy(k, template, x, y, onBattle) {

    let visual

    if (template.shape === "rect") {
        visual = k.rect(template.width, template.height)
    } else if (template.shape === "circle") {
        visual = k.circle(template.width / 2)
    }

    const enemy = k.add([
        visual,
        k.pos(x, y),
        k.area(),
        k.body(),
        k.color(...template.color),
        "overworldEnemy",
        {
            template, // store battle data
        }
    ])

    enemy.onCollide("player", () => {
        enemy.area.isActive = false
        onBattle(template, enemy)
    })

    return enemy
}