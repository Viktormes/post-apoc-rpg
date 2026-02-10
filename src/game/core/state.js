import { weapons } from "../entities/weapons.js"

export const gameState = {
    playerHP: 30,
    maxHP: 30,
    playerWeapon: weapons.ironSword,
    inventory: [],
    flags: {},
    energy: 6,
    maxEnergy: 10,
}