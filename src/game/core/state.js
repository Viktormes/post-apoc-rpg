import { weapons } from "../entities/weapons.js"

export const gameState = {
    playerHP: 15,
    maxHP: 30,
    playerWeapon: weapons.copperSword,
    inventory: [],
    flags: {},
    energy: 6,
    maxEnergy: 10,
}