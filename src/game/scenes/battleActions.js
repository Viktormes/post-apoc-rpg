export function createBattleActions(k, gameState, enemy, panels, callbacks) {
    let damageReductionNext = 0
    let evadeNextAttack = false

    function playerAttack() {
        if (callbacks.turn !== "player" || callbacks.awaitingEnemy) return

        const baseDamage = k.randi(gameState.playerWeapon.damageMin, gameState.playerWeapon.damageMax)
        callbacks.enemyHP = Math.max(0, callbacks.enemyHP - baseDamage)

        callbacks.screenFlash()
        callbacks.shakeFrame(panels.enemy, 6, 0.12)
        callbacks.showDamage(panels.enemy, baseDamage, [255, 200, 100])

        const msg = `You strike with your ${gameState.playerWeapon.name.toLowerCase()} for ${baseDamage} damage.`
        callbacks.typeMessage(msg, { speed: 0.03 })

        callbacks.turn = "enemy"
        callbacks.awaitingEnemy = true
        k.wait(callbacks.messageDuration(msg, 0.03) + 0.3, () => {
            callbacks.awaitingEnemy = false
            callbacks.updateStats()
            callbacks.enemyTurn()
        })
    }

    function playerDefend() {
        if (callbacks.turn !== "player" || callbacks.awaitingEnemy) return

        damageReductionNext = 4
        const msg = "You brace for impact, reducing incoming damage."
        callbacks.typeMessage(msg, { speed: 0.03 })

        callbacks.turn = "enemy"
        callbacks.awaitingEnemy = true
        k.wait(callbacks.messageDuration(msg, 0.03) + 0.3, () => {
            callbacks.awaitingEnemy = false
            callbacks.updateStats()
            callbacks.enemyTurn()
        })
    }

    function playerFly() {
        if (callbacks.turn !== "player" || callbacks.awaitingEnemy) return

        evadeNextAttack = true
        const msg = "You take to the air, evading the next attack."
        callbacks.typeMessage(msg, { speed: 0.03 })

        callbacks.turn = "enemy"
        callbacks.awaitingEnemy = true
        k.wait(callbacks.messageDuration(msg, 0.03) + 0.3, () => {
            callbacks.awaitingEnemy = false
            callbacks.updateStats()
            callbacks.enemyTurn()
        })
    }

    function playerMedicate() {
        if (callbacks.turn !== "player" || callbacks.awaitingEnemy) return
        if (gameState.playerHP >= gameState.maxHP) {
            callbacks.typeMessage("You're already at full health.")
            return
        }

        const healAmount = 8
        gameState.playerHP = Math.min(gameState.maxHP, gameState.playerHP + healAmount)
        const msg = `You use medicine to restore ${healAmount} HP.`
        callbacks.typeMessage(msg, { speed: 0.03 })

        callbacks.turn = "enemy"
        callbacks.awaitingEnemy = true
        k.wait(callbacks.messageDuration(msg, 0.03) + 0.3, () => {
            callbacks.awaitingEnemy = false
            callbacks.updateStats()
            callbacks.enemyTurn()
        })
    }

    function playerDoubleAttack() {
        if (callbacks.turn !== "player" || callbacks.awaitingEnemy) return
        if (gameState.energy < 4) {
            callbacks.typeMessage("Not enough energy. (Needs 4)")
            return
        }

        gameState.energy -= 4
        const damage1 = k.randi(gameState.playerWeapon.damageMin, gameState.playerWeapon.damageMax)
        const damage2 = k.randi(gameState.playerWeapon.damageMin, gameState.playerWeapon.damageMax)
        const totalDamage = damage1 + damage2
        callbacks.enemyHP = Math.max(0, callbacks.enemyHP - totalDamage)

        callbacks.screenFlash()
        callbacks.shakeFrame(panels.enemy, 8, 0.15)
        callbacks.showDamage(panels.enemy, totalDamage, [255, 220, 100])

        const msg = `You strike twice for ${damage1} and ${damage2} damage!`
        callbacks.typeMessage(msg, { speed: 0.03 })

        callbacks.turn = "enemy"
        callbacks.awaitingEnemy = true
        k.wait(callbacks.messageDuration(msg, 0.03) + 0.3, () => {
            callbacks.awaitingEnemy = false
            callbacks.updateStats()
            callbacks.enemyTurn()
        })
    }

    return {
        playerAttack,
        playerDefend,
        playerFly,
        playerMedicate,
        playerDoubleAttack,
        getDamageReduction: () => damageReductionNext,
        setDamageReduction: (val) => { damageReductionNext = val },
        getEvadeNext: () => evadeNextAttack,
        setEvadeNext: (val) => { evadeNextAttack = val },
    }
}
