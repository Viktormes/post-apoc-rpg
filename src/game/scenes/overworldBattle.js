import { gameState } from "../core/state.js"
import { createTypewriter, glitchText, createScreenFlash } from "../ui/textFx.js"
import { pickRandomEnemy } from "../entities/enemy.js"

export function createOverworldBattle(k) {
    let inBattle = false
    const battleUI = []

    function addUI(components) {
        const obj = k.add(components)
        battleUI.push(obj)
        return obj
    }

    function clearBattleUI() {
        battleUI.forEach((o) => o.destroy())
        battleUI.length = 0
    }

    // =====================================================
    // UI BUILD HELPERS (pure refactor, same functionality)
    // =====================================================

    function addRect(w, h, x, y, rgb, opacity, z) {
        return addUI([
            k.rect(w, h),
            k.pos(x, y),
            k.color(rgb[0], rgb[1], rgb[2]),
            ...(opacity !== undefined ? [k.opacity(opacity)] : []),
            k.fixed(),
            k.z(z),
        ])
    }

    function createFrame() {
        addRect(640, 6, 0, 0, [20, 20, 20], 0.85, 902)
        addRect(640, 6, 0, 354, [20, 20, 20], 0.85, 902)
        addRect(6, 360, 0, 0, [20, 20, 20], 0.85, 902)
        addRect(6, 360, 634, 0, [20, 20, 20], 0.85, 902)
    }

    // Returns the main panel entity (so we can shake it)
    function createFancyPanel({
                                  x,
                                  y,
                                  w,
                                  h,
                                  baseColor,
                                  glowColor,
                                  topColor,
                                  accentColor,
                                  cornerTL,
                                  cornerTR,
                                  cornerBL,
                                  cornerBR,
                                  zBase = 904,
                              }) {
        // Base panel (this is the one we shake)
        const panel = addRect(w, h, x, y, baseColor, 0.92, zBase)

        // Outer glow
        addRect(w + 6, h + 6, x - 3, y - 3, glowColor, 0.2, zBase - 1)

        // Top highlight
        addRect(w, 3, x, y, topColor, 0.9, zBase + 1)

        // Bottom accent
        addRect(w, 2, x, y + h - 2, accentColor, 0.8, zBase + 1)

        // Left accent
        addRect(3, h, x, y, topColor, 0.7, zBase + 1)

        // Right accent
        addRect(3, h, x + w - 3, y, topColor, 0.7, zBase + 1)

        // Corner accents (exactly like you had)
        addRect(6, 6, x, y, cornerTL, 0.9, zBase + 2)
        addRect(6, 6, x + w - 6, y, cornerTR, 0.9, zBase + 2)
        addRect(6, 6, x, y + h - 6, cornerBL, 0.8, zBase + 2)
        addRect(6, 6, x + w - 6, y + h - 6, cornerBR, 0.8, zBase + 2)

        return panel
    }

    function createBar({
                           x,
                           y,
                           label,
                           labelX,
                           labelY,
                           labelColor,
                           borderColor,
                           borderOpacity,
                           bgColor,
                           fillColor,
                           highlightColor,
                           width = 120,
                           zBase = 905,
                       }) {
        // Label
        if (label) {
            addUI([
                k.text(label, { size: 11, styles: false }),
                k.pos(labelX, labelY),
                k.color(labelColor[0], labelColor[1], labelColor[2]),
                k.fixed(),
                k.z(zBase),
            ])
        }

        // Border/outer bg
        addRect(width + 4, 10, x - 2, y - 2, borderColor, borderOpacity, zBase)

        // Inner bg
        addRect(width, 6, x, y, bgColor, 1, zBase)

        // Fill
        const fill = addUI([
            k.rect(width, 6),
            k.pos(x, y),
            k.color(fillColor[0], fillColor[1], fillColor[2]),
            k.scale(1),
            k.fixed(),
            k.z(zBase + 1),
        ])

        // Highlight
        addRect(width, 2, x, y, highlightColor, 0.7, zBase + 2)

        return fill
    }

    // =====================================================
    // BATTLE OVERLAY
    // =====================================================

    function startBattleOverlay(enemyTemplate, overworldEnemyEntity, overworldPlayer) {
        if (inBattle) return
        inBattle = true

        overworldPlayer.opacity = 0
        if (overworldEnemyEntity) {
            overworldEnemyEntity.opacity = 0
        }

        const enemy = enemyTemplate ?? pickRandomEnemy()
        let enemyHP = enemy.maxHP
        let turn = "player"
        let awaitingEnemy = false

        let damageReductionNext = 0
        let evadeNextAttack = false

        // --- Vignette / frame overlay ---
        const vignette = addUI([
            k.rect(640, 360),
            k.pos(0, 0),
            k.color(0, 0, 0),
            k.opacity(0.0),
            k.fixed(),
            k.z(900),
        ])

        createFrame()

        // Message panel (top-left)
        addRect(300, 80, 20, 20, [10, 10, 10], 0.85, 904)

        // Enemy + Player panels (fancy)
        const enemyPanel = createFancyPanel({
            x: 360,
            y: 20,
            w: 260,
            h: 70,
            baseColor: [16, 20, 36],
            glowColor: [60, 100, 200],
            topColor: [100, 160, 255],
            accentColor: [50, 100, 180],
            cornerTL: [160, 200, 255],
            cornerTR: [160, 200, 255],
            cornerBL: [100, 140, 230],
            cornerBR: [100, 140, 230],
        })

        const playerPanel = createFancyPanel({
            x: 20,
            y: 270,
            w: 280,
            h: 70,
            baseColor: [18, 26, 18],
            glowColor: [80, 160, 80],
            topColor: [140, 220, 140],
            accentColor: [80, 160, 80],
            cornerTL: [180, 255, 180],
            cornerTR: [180, 255, 180],
            cornerBL: [120, 200, 120],
            cornerBR: [120, 200, 120],
        })

        k.tween(0, 0.85, 0.25, (v) => {
            vignette.opacity = v
        })

        const whiteFlash = addUI([
            k.rect(640, 360),
            k.pos(0, 0),
            k.color(255, 255, 255),
            k.opacity(0.8),   // stronger than red
            k.fixed(),
            k.z(901),
        ])

// Fade out quickly
        k.tween(0.8, 0, 0.18, v => {
            whiteFlash.opacity = v
        })

        k.wait(0.18, () => {
            whiteFlash.destroy()
        })


        const { screenFlash } = createScreenFlash(k)

        // Text nodes
        const messageText = addUI([
            k.text("", { size: 16, width: 280, styles: false }),
            k.pos(30, 28),
            k.fixed(),
            k.z(905),
        ])

        const playerText = addUI([
            k.text("", { size: 14, styles: false }),
            k.pos(30, 280),
            k.fixed(),
            k.z(905),
        ])

        const enemyText = addUI([
            k.text("", { size: 14, styles: false }),
            k.pos(370, 30),
            k.fixed(),
            k.z(905),
        ])

        // Enemy HP bar
        const enemyHpBarFill = createBar({
            x: 392,
            y: 60,
            width: 120,
            label: "HP",
            labelX: 370,
            labelY: 58,
            labelColor: [180, 210, 255],
            borderColor: [10, 15, 30],
            borderOpacity: 0.8,
            bgColor: [40, 50, 80],
            fillColor: [100, 140, 255],
            highlightColor: [150, 190, 255],
        })

        // Player HP bar
        const playerHpBarFill = createBar({
            x: 52,
            y: 310,
            width: 120,
            label: "HP",
            labelX: 30,
            labelY: 308,
            labelColor: [180, 240, 180],
            borderColor: [10, 25, 10],
            borderOpacity: 0.8,
            bgColor: [40, 60, 40],
            fillColor: [120, 220, 120],
            highlightColor: [160, 240, 160],
        })

        // Player Energy bar
        const playerEnergyBarFill = createBar({
            x: 52,
            y: 324,
            width: 120,
            label: "EN",
            labelX: 30,
            labelY: 322,
            labelColor: [180, 210, 255],
            borderColor: [10, 15, 30],
            borderOpacity: 0.8,
            bgColor: [40, 50, 70],
            fillColor: [100, 160, 255],
            highlightColor: [140, 190, 255],
        })

        const typeMessage = createTypewriter(k, messageText)

        // Helpers / FX (unchanged behavior)

        function messageDuration(text, speed = 0.02, extra = 0.3) {
            return text.length * speed + extra
        }

        function gainEnergy(amount) {
            gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + amount)
            updateStats()
        }

        function updateStats() {
            const playerHpPercent = Math.max(0, gameState.playerHP / gameState.maxHP)
            const enemyHpPercent = Math.max(0, enemyHP / enemy.maxHP)
            const energyPercent = Math.max(0, gameState.energy / gameState.maxEnergy)

            playerHpBarFill.scale.x = playerHpPercent
            enemyHpBarFill.scale.x = enemyHpPercent
            playerEnergyBarFill.scale.x = energyPercent

            playerText.text = `You\nHP ${gameState.playerHP}/${gameState.maxHP}`
            enemyText.text = `${enemy.name}\nHP ${enemyHP}/${enemy.maxHP}`
        }

        function shakeFrame(panel, intensity, duration) {
            const originalPos = k.vec2(panel.pos.x, panel.pos.y)
            let elapsed = 0

            const shake = () => {
                elapsed += k.dt()
                if (elapsed >= duration) {
                    panel.pos = originalPos
                    return
                }

                panel.pos.x = originalPos.x + k.randi(-intensity, intensity)
                panel.pos.y = originalPos.y + k.randi(-intensity, intensity)

                k.wait(0.01, shake)
            }

            shake()
        }

        function showDamage(panel, damage, color) {
            const damageText = addUI([
                k.text(damage.toString(), { size: 16, styles: false }),
                k.pos(panel.pos.x + 100, panel.pos.y + 20),
                k.color(color[0], color[1], color[2]),
                k.opacity(1),
                k.fixed(),
                k.z(910),
            ])

            k.tween(damageText.pos.y, damageText.pos.y - 30, 0.5, (v) => {
                damageText.pos.y = v
            })

            k.tween(damageText.opacity, 0, 0.5, (v) => {
                damageText.opacity = v
            })

            k.wait(0.5, () => {
                damageText.destroy()
            })
        }

        const battlePlayer = addUI([
            k.rect(overworldPlayer.width, overworldPlayer.height),
            k.pos(150, 200),
            k.color(
                overworldPlayer.color.r,
                overworldPlayer.color.g,
                overworldPlayer.color.b
            ),
            k.opacity(1),
            k.fixed(),
            k.z(99995),
        ])


        const battleEnemy = addUI([
            k.rect(enemyTemplate.width, enemyTemplate.height),
            k.pos(450, 200),
            k.color(...enemyTemplate.color),
            k.opacity(1),
            k.fixed(),
            k.z(905),
        ])

        // =====================================================
        // Player actions (unchanged)
        // =====================================================


        function localShake(entity, intensity = 2, duration = 0.08) {
            let elapsed = 0

            const basePos = entity.pos.clone()

            function shakeStep() {
                elapsed += k.dt()
                if (elapsed >= duration) {
                    entity.pos = basePos
                    return
                }

                const offsetX = k.randi(-intensity, intensity)
                const offsetY = k.randi(-intensity, intensity)

                entity.pos = k.vec2(basePos.x + offsetX, basePos.y + offsetY)

                k.wait(0.01, shakeStep)
            }

            shakeStep()
        }

        function backOffWithRev(entity, fromX, toX, baseY, dur = 0.08, shakeX = 2, shakeY = 1) {
            k.tween(fromX, toX, dur, (v) => {
                entity.pos.x = v + k.randi(-shakeX, shakeX)
                entity.pos.y = baseY + k.randi(-shakeY, shakeY)
            })
        }

        function doPlayerHit({ endTurn = true, onDone = () => {} } = {}) {
            if (!inBattle) return
            if (turn !== "player") return

            const startX = battlePlayer.pos.x
            const baseY = battlePlayer.pos.y
            const backX = startX - 20
            const attackX = 350

            // Back off + rev shake (works)
            backOffWithRev(battlePlayer, startX, backX, baseY, 0.08, 2, 1)

            // Small anticipation delay
            k.wait(0.12, () => {

                // Lunge forward
                k.tween(backX, attackX, 0.1, (v) => {
                    battlePlayer.pos.x = v
                    battlePlayer.pos.y = baseY
                    // optional: trail here if you want
                })

                // Impact moment
                k.wait(0.1, () => {
                    const dmg = k.randi(gameState.playerWeapon.damageMin, gameState.playerWeapon.damageMax)
                    enemyHP = Math.max(0, enemyHP - dmg)

                    // Enemy flash
                    const originalColor = battleEnemy.color.clone()
                    battleEnemy.color = k.rgb(255, 60, 60)
                    k.wait(0.08, () => battleEnemy.color = originalColor)

                    // Impact FX (per-hit)
                    k.shake(10)
                    spawnAttackParticles(battleEnemy.pos.x, battleEnemy.pos.y)

                    updateStats()
                    screenFlash()
                    shakeFrame(enemyPanel, 6, 0.12)
                    showDamage(enemyPanel, dmg, [255, 200, 100])

                    const msg = `You strike with your ${gameState.playerWeapon.name.toLowerCase()} for ${dmg} damage.`
                    typeMessage(msg, { speed: 0.03 })

                    // Return
                    k.tween(attackX, startX, 0.12, (v) => {
                        battlePlayer.pos.x = v
                        battlePlayer.pos.y = baseY
                    })

                    // Resolve after return
                    k.wait(0.25, () => {
                        if (enemyHP <= 0) {
                            win()
                            return
                        }

                        if (endTurn) {
                            turn = "enemy"
                            // give a beat before enemy goes (tune this)
                            k.wait(0.6, () => enemyTurn())
                        }

                        onDone()
                    })
                })
            })
        }



        function playerAttack() {
            if (!inBattle) return
            if (turn !== "player" || awaitingEnemy) return

            awaitingEnemy = true
            doPlayerHit({
                endTurn: true,
                onDone: () => {
                    awaitingEnemy = false
                },
            })
        }


        function playerDefend() {
            if (turn !== "player" || awaitingEnemy) return

            damageReductionNext = 4
            const msg = "You brace for impact, reducing incoming damage."
            typeMessage(msg, { speed: 0.03 })

            turn = "enemy"
            awaitingEnemy = true

            k.wait(messageDuration(msg, 0.03) + 0.3, () => {
                awaitingEnemy = false
                updateStats()
                enemyTurn()
            })
        }

        function playerRun() {
            if (turn !== "player" || awaitingEnemy) return

            const escapeChance = 0.4
            const roll = Math.random()

            const attemptMsg = "You try to run away..."
            typeMessage(attemptMsg, { speed: 0.03 })

            turn = "enemy"
            awaitingEnemy = true

            k.wait(messageDuration(attemptMsg, 0.03) + 0.3, () => {
                if (roll < escapeChance) {
                    typeMessage("You escape.")
                    k.wait(1.0, () => {
                        k.go("overworld")
                    })
                    return
                }

                typeMessage("You fail to get away!")
                k.wait(0.6, () => {
                    awaitingEnemy = false
                    updateStats()
                    enemyTurn()
                })
            })
        }

        function playerMedicate() {
            if (turn !== "player" || awaitingEnemy) return
            if (gameState.playerHP >= gameState.maxHP) {
                typeMessage("You're already at full health.")
                return
            }

            const healAmount = 8
            gameState.playerHP = Math.min(gameState.maxHP, gameState.playerHP + healAmount)

            const msg = `You use mend to restore ${healAmount} HP.`
            typeMessage(msg, { speed: 0.03 })

            updateStats()
            turn = "enemy"
            awaitingEnemy = true

            k.wait(messageDuration(msg, 0.03) + 0.3, () => {
                awaitingEnemy = false
                updateStats()
                enemyTurn()
            })
        }

        function playerDoubleAttack() {
            if (!inBattle) return
            if (turn !== "player" || awaitingEnemy) return

            if (gameState.energy < 4) {
                typeMessage("Not enough energy. (Needs 4)")
                return
            }

            gameState.energy -= 4
            updateStats()

            awaitingEnemy = true

            // First hit (no end turn)
            doPlayerHit({
                endTurn: false,
                onDone: () => {

                    // If the first hit killed it, win() already fired
                    if (!inBattle || turn === "end") return

                    // Second hit (still no end turn)
                    doPlayerHit({
                        endTurn: false,
                        onDone: () => {

                            if (!inBattle || turn === "end") return

                            // Now enemy turn
                            turn = "enemy"
                            awaitingEnemy = false
                            k.wait(0.6, () => enemyTurn())
                        },
                    })
                },
            })
        }




        // =====================================================
        // Button UI + categories (UNCHANGED functionality)
        // =====================================================

        let activeCategory = "actions"

        function addCategoryTab(label, categoryId, x, y, isActive) {
            const tab = addUI([
                k.rect(80, 24),
                k.pos(x, y),
                k.color(isActive ? 70 : 40, isActive ? 85 : 50, isActive ? 120 : 80),
                k.opacity(0.95),
                k.area(),
                k.fixed(),
                k.z(905),
            ])

            addUI([
                k.rect(80, 3),
                k.pos(x, y),
                k.color(isActive ? 120 : 80, isActive ? 145 : 110, isActive ? 190 : 150),
                k.opacity(0.9),
                k.fixed(),
                k.z(906),
            ])

            const tabText = addUI([
                k.text(label, { size: 12, styles: false }),
                k.pos(x + 13, y + 6),
                k.color(isActive ? 220 : 150, isActive ? 230 : 170, isActive ? 255 : 200),
                k.fixed(),
                k.z(907),
            ])

            tab.onClick(() => {
                if (!inBattle) return
                if (turn !== "player") return
                if (awaitingEnemy) return
                switchCategory(categoryId)
            })

            return { tab, tabText }
        }

        const actionsGroup = []
        const skillsGroup = []

        const actionTab = addCategoryTab("ACTIONS", "actions", 330, 270, true)
        const skillTab = addCategoryTab("SKILLS", "skills", 418, 270, false)

        function setGroupVisible(group, visible) {
            group.forEach((elements) => {
                elements.forEach((el) => {
                    el.opacity = visible ? (el._originalOpacity ?? 1) : 0
                    if (el.area) {
                        el.area.isActive = visible
                    }
                })
            })
        }

        function switchCategory(categoryId) {
            if (categoryId === activeCategory) return
            activeCategory = categoryId

            if (categoryId === "actions") {
                actionTab.tab.color = k.rgb(70, 85, 120)
                actionTab.tabText.color = k.rgb(220, 230, 255)
                skillTab.tab.color = k.rgb(40, 50, 80)
                skillTab.tabText.color = k.rgb(150, 170, 200)

                setGroupVisible(actionsGroup, true)
                setGroupVisible(skillsGroup, false)
            } else {
                skillTab.tab.color = k.rgb(70, 85, 120)
                skillTab.tabText.color = k.rgb(220, 230, 255)
                actionTab.tab.color = k.rgb(40, 50, 80)
                actionTab.tabText.color = k.rgb(150, 170, 200)

                setGroupVisible(skillsGroup, true)
                setGroupVisible(actionsGroup, false)
            }
        }

        function addBattleButton(label, x, y, onPress, category = "actions") {
            const elements = []
            const isHidden = category !== activeCategory

            const shadow = addUI([
                k.rect(66, 18),
                k.pos(x, y + 1),
                k.color(5, 5, 10),
                k.opacity(isHidden ? 0 : 0.7),
                k.fixed(),
                k.z(904),
            ])
            shadow._originalOpacity = 0.7
            elements.push(shadow)

            const base = addUI([
                k.rect(64, 18),
                k.pos(x + 1, y + 1),
                k.color(15, 20, 30),
                k.opacity(isHidden ? 0 : 0.9),
                k.fixed(),
                k.z(905),
            ])
            base._originalOpacity = 0.9
            elements.push(base)

            const btn = addUI([
                k.rect(64, 18),
                k.pos(x, y),
                k.color(60, 75, 110),
                k.opacity(isHidden ? 0 : 0.95),
                k.area(),
                k.fixed(),
                k.z(906),
            ])
            btn._originalOpacity = 0.95
            elements.push(btn)

            btn._originalColor = k.rgb(60, 75, 110)
            btn._hoverColor = k.rgb(80, 100, 145)

            const btnTop = addUI([
                k.rect(64, 5),
                k.pos(x, y),
                k.color(110, 135, 180),
                k.opacity(isHidden ? 0 : 0.85),
                k.fixed(),
                k.z(907),
            ])
            btnTop._originalOpacity = 0.85
            btnTop._originalColor = k.rgb(110, 135, 180)
            btnTop._hoverColor = k.rgb(140, 175, 220)
            elements.push(btnTop)

            const btnBottom = addUI([
                k.rect(64, 5),
                k.pos(x, y + 13),
                k.color(40, 55, 90),
                k.opacity(isHidden ? 0 : 0.7),
                k.fixed(),
                k.z(907),
            ])
            btnBottom._originalOpacity = 0.7
            btnBottom._originalColor = k.rgb(40, 55, 90)
            btnBottom._hoverColor = k.rgb(60, 80, 130)
            elements.push(btnBottom)

            const btnText = addUI([
                k.text(label, { size: 10, styles: false }),
                k.pos(x + 7, y + 5),
                k.color(220, 230, 255),
                k.opacity(isHidden ? 0 : 1),
                k.fixed(),
                k.z(909),
            ])
            btnText._originalOpacity = 1
            btnText._originalColor = k.rgb(220, 230, 255)
            btnText._hoverColor = k.rgb(255, 255, 255)
            elements.push(btnText)

            btn.onHover(() => {
                if (category !== activeCategory) return
                btn.color = btn._hoverColor
                btnTop.color = btnTop._hoverColor
                btnBottom.color = btnBottom._hoverColor
                btnText.color = btnText._hoverColor
            })

            btn.onHoverEnd(() => {
                if (category !== activeCategory) return
                btn.color = btn._originalColor
                btnTop.color = btnTop._originalColor
                btnBottom.color = btnBottom._originalColor
                btnText.color = btnText._originalColor
            })

            btn.onClick(() => {
                if (category !== activeCategory) return
                if (!inBattle) return
                if (turn !== "player") return
                if (awaitingEnemy) return

                // click press effect
                btn.pos.y += 1
                btnText.pos.y += 1
                btnTop.pos.y += 1
                btnBottom.pos.y += 1

                k.wait(0.08, () => {
                    btn.pos.y -= 1
                    btnText.pos.y -= 1
                    btnTop.pos.y -= 1
                    btnBottom.pos.y -= 1
                    onPress()
                })
            })

            if (category === "actions") actionsGroup.push(elements)
            else skillsGroup.push(elements)

            return elements
        }

        // Buttons (unchanged)
        addBattleButton("Attack", 330, 300, () => playerAttack(), "actions")
        addBattleButton("Defend", 402, 300, () => playerDefend(), "actions")
        addBattleButton("Run", 474, 300, () => playerRun(), "actions")

        addBattleButton("Mend", 330, 300, () => playerMedicate(), "skills")
        addBattleButton("Double Strike", 402, 300, () => playerDoubleAttack(), "skills")

        // =====================================================
        // Enemy turn (unchanged)
        // =====================================================

        function enemyTurn() {
            if (enemyHP <= 0) {
                win()
                return
            }

            const baseDamage = k.randi(enemy.damageMin, enemy.damageMax)
            let damage = baseDamage

            if (evadeNextAttack) {
                damage = 0
                evadeNextAttack = false
            } else if (damageReductionNext > 0) {
                damage = Math.max(0, damage - damageReductionNext)
                damageReductionNext = 0
            }

            // --- Lunge forward ---
            const startX = battleEnemy.pos.x
            const targetX = 250

            k.tween(startX, targetX, 0.1, v => {
                battleEnemy.pos.x = v
            })

            k.wait(0.1, () => {

                // --- Impact moment ---

                // Red flash on player
                const originalColor = battlePlayer.color.clone()
                battlePlayer.color = k.rgb(255, 60, 60)

                k.wait(0.1, () => {
                    battlePlayer.color = originalColor
                })

                // Shake + particles
                k.shake(10)
                spawnAttackParticles(battlePlayer.pos.x, battlePlayer.pos.y)
                applyKnockback(battlePlayer, -1, 10 + damage * 1.5, 0.08)

                // Apply damage
                gameState.playerHP = Math.max(0, gameState.playerHP - damage)

                updateStats()
                screenFlash()
                shakeFrame(playerPanel, 7, 0.15)
                showDamage(playerPanel, damage, [255, 120, 120])

                // --- Lunge back ---
                k.tween(targetX, startX, 0.1, v => {
                    battleEnemy.pos.x = v
                })

                const msg = `The ${enemy.name.toLowerCase()} claws you for ${damage} damage.`
                typeMessage(msg, { speed: 0.03 })

                k.wait(messageDuration(msg, 0.03) + 0.3, () => {

                    if (gameState.playerHP <= 0) {
                        lose()
                        return
                    }

                    turn = "player"
                })
            })
        }


        function win() {
            gainEnergy(2)
            typeMessage(`The ${enemy.name} collapses into the dust.`)


            // 💀 Fade + shrink + rise
            k.tween(1, 0, 2, (v) => {
                battleEnemy.opacity = v
                battleEnemy.scale = k.vec2(v, v)
            })

            k.wait(2, () => {

                if (overworldEnemyEntity) {
                    overworldEnemyEntity.destroy()
                }

                cleanupBattle()
            })
        }

        function lose() {
            typeMessage("You collapse. The wasteland takes another soul.")

            k.wait(2, () => {
                cleanupBattle()
            })
        }
        function cleanupBattle() {

            // Remove battle shapes
            battlePlayer.destroy()
            battleEnemy.destroy()

            // Restore overworld player
            overworldPlayer.opacity = 1

            // Restore enemy if still alive
            if (overworldEnemyEntity && overworldEnemyEntity.exists()) {
                overworldEnemyEntity.opacity = 1
            }

            inBattle = false
            clearBattleUI()
        }

        function spawnAttackParticles(x, y) {

            for (let i = 0; i < 15; i++) {

                const angle = Math.random() * Math.PI * 2
                const speed = k.rand(50, 120)

                const particle = addUI([
                    k.rect(4, 4),
                    k.pos(x + k.rand(-10, 10), y + k.rand(-10, 10)),
                    k.color(255, 120, 120),
                    k.opacity(1),
                    k.fixed(),
                    k.z(910),
                ])

                const vx = Math.cos(angle) * speed
                const vy = Math.sin(angle) * speed

                k.tween(0, 1, 0.6, (t) => {
                    particle.pos.x += vx * k.dt()
                    particle.pos.y += vy * k.dt()
                    particle.opacity = 1 - t
                })

                k.wait(0.6, () => {
                    particle.destroy()
                })
            }
        }

        function applyKnockback(entity, direction, force = 20, duration = 0.1) {
            const startX = entity.pos.x
            const targetX = startX + direction * force

            // Move back
            k.tween(startX, targetX, duration, v => {
                entity.pos.x = v
            })

            // Return
            k.wait(duration, () => {
                k.tween(targetX, startX, duration, v => {
                    entity.pos.x = v
                })
            })
        }


        // Close overlay (unchanged)
        k.onKeyPress("o", () => {
            if (!inBattle) return
            inBattle = false
            clearBattleUI()
        })

        // Start message
        updateStats()
        typeMessage(`A wild ${enemy.name} appears!`)
    }

    return {
        startBattleOverlay,
        isInBattle: () => inBattle,
    }
}
