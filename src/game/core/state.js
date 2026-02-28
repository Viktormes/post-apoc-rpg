import { weapons } from "../entities/weapons.js"

export const gameState = {
    playerHP: 30,
    maxHP: 30,
    speed: 5,
    playerWeapon: weapons.ironSword,
    inventory: [],
    flags: {},
    energy: 6,
    maxEnergy: 10,
    defeatedEnemies: new Map(),
    activeLevel: null,
}