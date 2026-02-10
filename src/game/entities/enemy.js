export function createEnemyTemplate({ id, name, maxHP, damageMin, damageMax }) {
    return {
        id,
        name,
        maxHP,
        damageMin,
        damageMax,
    }
}

export const enemyTypes = {
    ghoul: createEnemyTemplate({
        id: "ghoul",
        name: "Ghoul",
        maxHP: 18,
        damageMin: 3,
        damageMax: 6,
    }),
    orc: createEnemyTemplate({
        id: "orc",
        name: "Orc",
        maxHP: 14,
        damageMin: 4,
        damageMax: 7,
    }),
    golem: createEnemyTemplate({
        id: "golem",
        name: "Golem",
        maxHP: 22,
        damageMin: 2,
        damageMax: 5,
    }),
}

export function pickRandomEnemy() {
    const list = Object.values(enemyTypes)
    return list[Math.floor(Math.random() * list.length)]
}