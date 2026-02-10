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

    function startBattleOverlay() {
        if (inBattle) return
        inBattle = true

        const enemy = pickRandomEnemy()
        let enemyHP = enemy.maxHP
        let turn = "player"
        let awaitingEnemy = false

        // --- Vignette / frame overlay ---
        addUI([
            k.rect(640, 360),
            k.pos(0, 0),
            k.color(0, 0, 0),
            k.opacity(0.0),
            k.fixed(),
            k.z(900),
        ])
        const vignette = battleUI[battleUI.length - 1]

        // Frame
        addUI([k.rect(640, 6), k.pos(0, 0), k.color(20, 20, 20), k.opacity(0.85), k.fixed(), k.z(902)])
        addUI([k.rect(640, 6), k.pos(0, 354), k.color(20, 20, 20), k.opacity(0.85), k.fixed(), k.z(902)])
        addUI([k.rect(6, 360), k.pos(0, 0), k.color(20, 20, 20), k.opacity(0.85), k.fixed(), k.z(902)])
        addUI([k.rect(6, 360), k.pos(634, 0), k.color(20, 20, 20), k.opacity(0.85), k.fixed(), k.z(902)])

        // UI Panels (message top-left, enemy top-right, player bottom-left)
        addUI([k.rect(300, 80), k.pos(20, 20), k.color(10, 10, 10), k.opacity(0.85), k.fixed(), k.z(904)])

            // --- Enemy frame (more stylish) ---
            const enemyPanel = addUI([
                k.rect(260, 70),
                k.pos(360, 20),
                k.color(16, 20, 36),  // Darker blue-tinted background
                k.opacity(0.92),
                k.fixed(),
                k.z(904),
            ])
            
            // Outer glow effect
            addUI([
                k.rect(266, 76),
                k.pos(357, 17),
                k.color(60, 100, 200),
                k.opacity(0.2),
                k.fixed(),
                k.z(903),
            ])
            
            // Top highlight
            addUI([
                k.rect(260, 3),
                k.pos(360, 20),
                k.color(100, 160, 255),  // Brighter blue
                k.opacity(0.9),
                k.fixed(),
                k.z(905),
            ])
            
            // Bottom accent
            addUI([
                k.rect(260, 2),
                k.pos(360, 88),
                k.color(50, 100, 180),  // Mid-tone blue
                k.opacity(0.8),
                k.fixed(),
                k.z(905),
            ])
            
            // Left accent
            addUI([
                k.rect(3, 70),
                k.pos(360, 20),
                k.color(100, 160, 255),  // Brighter blue
                k.opacity(0.7),
                k.fixed(),
                k.z(905),
            ])
            
            // Right accent
            addUI([
                k.rect(3, 70),
                k.pos(617, 20),
                k.color(100, 160, 255),  // Brighter blue
                k.opacity(0.7),
                k.fixed(),
                k.z(905),
            ])
            
            // Corner accents
            addUI([k.rect(6, 6), k.pos(360, 20), k.color(160, 200, 255), k.opacity(0.9), k.fixed(), k.z(906)])
            addUI([k.rect(6, 6), k.pos(614, 20), k.color(160, 200, 255), k.opacity(0.9), k.fixed(), k.z(906)])
            addUI([k.rect(6, 6), k.pos(360, 84), k.color(100, 140, 230), k.opacity(0.8), k.fixed(), k.z(906)])
            addUI([k.rect(6, 6), k.pos(614, 84), k.color(100, 140, 230), k.opacity(0.8), k.fixed(), k.z(906)])

            // --- Player frame (more stylish) ---
            const playerPanel = addUI([
                k.rect(280, 70),
                k.pos(20, 270),
                k.color(18, 26, 18),  // Darker green-tinted background
                k.opacity(0.92),
                k.fixed(),
                k.z(904),
            ])
            
            // Outer glow effect
            addUI([
                k.rect(286, 76),
                k.pos(17, 267),
                k.color(80, 160, 80),
                k.opacity(0.2),
                k.fixed(),
                k.z(903),
            ])
            
            // Top highlight
            addUI([
                k.rect(280, 3),
                k.pos(20, 270),
                k.color(140, 220, 140),  // Brighter green
                k.opacity(0.9),
                k.fixed(),
                k.z(905),
            ])
            
            // Bottom accent
            addUI([
                k.rect(280, 2),
                k.pos(20, 338),
                k.color(80, 160, 80),  // Mid-tone green
                k.opacity(0.8),
                k.fixed(),
                k.z(905),
            ])
            
            // Left accent
            addUI([
                k.rect(3, 70),
                k.pos(20, 270),
                k.color(140, 220, 140),  // Brighter green
                k.opacity(0.7),
                k.fixed(),
                k.z(905),
            ])
            
            // Right accent
            addUI([
                k.rect(3, 70),
                k.pos(297, 270),
                k.color(140, 220, 140),  // Brighter green
                k.opacity(0.7),
                k.fixed(),
                k.z(905),
            ])
            
            // Corner accents
            addUI([k.rect(6, 6), k.pos(20, 270), k.color(180, 255, 180), k.opacity(0.9), k.fixed(), k.z(906)])
            addUI([k.rect(6, 6), k.pos(294, 270), k.color(180, 255, 180), k.opacity(0.9), k.fixed(), k.z(906)])
            addUI([k.rect(6, 6), k.pos(20, 334), k.color(120, 200, 120), k.opacity(0.8), k.fixed(), k.z(906)])
            addUI([k.rect(6, 6), k.pos(294, 334), k.color(120, 200, 120), k.opacity(0.8), k.fixed(), k.z(906)])

        k.tween(0, 0.35, 0.25, (v) => {
            vignette.opacity = v
        })

        const { screenFlash } = createScreenFlash(k)

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

        const enemyHpLabel = addUI([
            k.text("HP", { size: 11, styles: false }),
            k.pos(370, 58),
            k.color(180, 210, 255),  // Brighter blue text
            k.fixed(),
            k.z(905),
        ])

        // HP bar background with border effect
        addUI([
            k.rect(124, 10),
            k.pos(390, 58),
            k.color(10, 15, 30),
            k.opacity(0.8),
            k.fixed(),
            k.z(905),
        ])

        const enemyHpBarBg = addUI([
            k.rect(120, 6),
            k.pos(392, 60),
            k.color(40, 50, 80),  // Darker blue background
            k.fixed(),
            k.z(905),
        ])

        const enemyHpBarFill = addUI([
            k.rect(120, 6),
            k.pos(392, 60),
            k.color(100, 140, 255),
            k.scale(1),
            k.fixed(),
            k.z(906),
        ])
        
        // HP bar highlight
        addUI([
            k.rect(120, 2),
            k.pos(392, 60),
            k.color(150, 190, 255),  // Light highlight on top of bar
            k.opacity(0.7),
            k.fixed(),
            k.z(907),
        ])

        const playerHpLabel = addUI([
            k.text("HP", { size: 11, styles: false }),
            k.pos(30, 308),
            k.color(180, 240, 180),
            k.fixed(),
            k.z(905),
        ])

        // HP bar background with border effect
        addUI([
            k.rect(124, 10),
            k.pos(50, 308),
            k.color(10, 25, 10),
            k.opacity(0.8),
            k.fixed(),
            k.z(905),
        ])

        const playerHpBarBg = addUI([
            k.rect(120, 6),
            k.pos(52, 310),
            k.color(40, 60, 40),  // Darker green background
            k.fixed(),
            k.z(905),
        ])

        const playerHpBarFill = addUI([
            k.rect(120, 6),
            k.pos(52, 310),
            k.color(120, 220, 120),
            k.scale(1),
            k.fixed(),
            k.z(906),
        ])
        
        // HP bar highlight
        addUI([
            k.rect(120, 2),
            k.pos(52, 310),
            k.color(160, 240, 160),  // Light highlight on top of bar
            k.opacity(0.7),
            k.fixed(),
            k.z(907),
        ])

        const playerEnergyLabel = addUI([
            k.text("EN", { size: 11, styles: false }),
            k.pos(30, 322),
            k.color(180, 210, 255),  // Brighter blue text
            k.fixed(),
            k.z(905),
        ])

        // Energy bar background with border effect
        addUI([
            k.rect(124, 10),
            k.pos(50, 322),
            k.color(10, 15, 30),
            k.opacity(0.8),
            k.fixed(),
            k.z(905),
        ])

        const playerEnergyBarBg = addUI([
            k.rect(120, 6),
            k.pos(52, 324),
            k.color(40, 50, 70),  // Darker blue background
            k.fixed(),
            k.z(905),
        ])

        const playerEnergyBarFill = addUI([
            k.rect(120, 6),
            k.pos(52, 324),
            k.color(100, 160, 255),
            k.scale(1),
            k.fixed(),
            k.z(906),
        ])
        
        // Energy bar highlight
        addUI([
            k.rect(120, 2),
            k.pos(52, 324),
            k.color(140, 190, 255),  // Light highlight on top of bar
            k.opacity(0.7),
            k.fixed(),
            k.z(907),
        ])

        const typeMessage = createTypewriter(k, messageText)

        updateStats()
        typeMessage(`A wild ${enemy.name} appears!`)

        function playerAttack() {
            if (turn !== "player" || awaitingEnemy) return

            const baseDamage = k.randi(gameState.playerWeapon.damageMin, gameState.playerWeapon.damageMax)
            enemyHP = Math.max(0, enemyHP - baseDamage)

            updateStats()
            screenFlash()
            shakeFrame(enemyPanel, 6, 0.12)
            showDamage(enemyPanel, baseDamage, [255, 200, 100])

            const msg = `You strike with your ${gameState.playerWeapon.name.toLowerCase()} for ${baseDamage} damage.`
            typeMessage(msg, { speed: 0.03 })

            turn = "enemy"
            awaitingEnemy = true
            k.wait(messageDuration(msg, 0.03) + 0.3, () => {
                awaitingEnemy = false
                updateStats()
                enemyTurn()
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

            const escapeChance = 0.4 // 40% chance to escape
            const roll = Math.random()

            const attemptMsg = "You try to run away..."
            typeMessage(attemptMsg, { speed: 0.03 })

            turn = "enemy"
            awaitingEnemy = true

            k.wait(messageDuration(attemptMsg, 0.03) + 0.3, () => {

                // ✅ SUCCESS
                if (roll < escapeChance) {
                    typeMessage("You escape.")
                    k.wait(1.0, () => {
                        k.go("overworld")
                    })
                    return
                }

                // ❌ FAILURE
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
            if (turn !== "player" || awaitingEnemy) return
            if (gameState.energy < 4) {
                typeMessage("Not enough energy. (Needs 4)")
                return
            }

            gameState.energy -= 4
            const damage1 = k.randi(gameState.playerWeapon.damageMin, gameState.playerWeapon.damageMax)
            const damage2 = k.randi(gameState.playerWeapon.damageMin, gameState.playerWeapon.damageMax)
            const totalDamage = damage1 + damage2
            enemyHP = Math.max(0, enemyHP - totalDamage)


            updateStats()
            screenFlash()
            shakeFrame(enemyPanel, 8, 0.15)
            showDamage(enemyPanel, totalDamage, [255, 220, 100])

            const msg = `You strike twice for ${damage1} and ${damage2} damage!`
            typeMessage(msg, { speed: 0.03 })

            turn = "enemy"
            awaitingEnemy = true
            k.wait(messageDuration(msg, 0.03) + 0.3, () => {
                awaitingEnemy = false
                updateStats()
                enemyTurn()
            })
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


        function messageDuration(text, speed = 0.02, extra = 0.3) {
            return text.length * speed + extra
        }

        let damageReductionNext = 0
        let evadeNextAttack = false

            // Create button category sections
            let activeCategory = "actions" // Default active category
            
            // Category tabs
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

                // Tab top highlight
                addUI([
                    k.rect(80, 3),
                    k.pos(x, y),
                    k.color(isActive ? 120 : 80, isActive ? 145 : 110, isActive ? 190 : 150),
                    k.opacity(0.9),
                    k.fixed(),
                    k.z(906),
                ])

                // Tab text
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

                    // Switch active category
                    switchCategory(categoryId)
                })

                return { tab, tabText }
            }

            // Action and skill button groups
            const actionsGroup = []
            const skillsGroup = []

            // Create category tabs
            const actionTab = addCategoryTab("ACTIONS", "actions", 330, 270, true)
            const skillTab = addCategoryTab("SKILLS", "skills", 418, 270, false)

            function switchCategory(categoryId) {
                if (categoryId === activeCategory) return

                activeCategory = categoryId

                // Update tab appearances
                if (categoryId === "actions") {
                    // Update tab visuals
                    actionTab.tab.color = k.rgb(70, 85, 120)
                    actionTab.tabText.color = k.rgb(220, 230, 255)
                    skillTab.tab.color = k.rgb(40, 50, 80)
                    skillTab.tabText.color = k.rgb(150, 170, 200)

                    // Show/hide buttons
                    actionsGroup.forEach(obj => {
                        obj.forEach(el => {
                            el.opacity = el._originalOpacity || 1
                        })
                    })

                    skillsGroup.forEach(obj => {
                        obj.forEach(el => {
                            el.opacity = 0
                            if (el.area) {
                                el.area.isActive = false
                            }
                        })
                    })

                } else { // Skills tab
                    skillTab.tab.color = k.rgb(70, 85, 120)
                    skillTab.tabText.color = k.rgb(220, 230, 255)
                    actionTab.tab.color = k.rgb(40, 50, 80)
                    actionTab.tabText.color = k.rgb(150, 170, 200)

                    // Show/hide buttons
                    skillsGroup.forEach(obj => {
                        obj.forEach(el => {
                            el.opacity = el._originalOpacity || 1
                            if (el.area) {
                                el.area.isActive = true
                            }
                        })
                    })

                    actionsGroup.forEach(obj => {
                        obj.forEach(el => {
                            el.opacity = 0
                            if (el.area) {
                                el.area.isActive = false
                            }
                        })
                    })
                }
            }

            function addBattleButton(label, x, y, onPress, category = "actions") {
                const elements = []

                // Whether this button should be initially hidden
                const isHidden = category !== activeCategory

                // Button shadow/outline
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

                // Button base
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
                    k.color(60, 75, 110),  // Blueish base
                    k.opacity(isHidden ? 0 : 0.95),
                    k.area(),
                    k.fixed(),
                    k.z(906),
                ])
                btn._originalOpacity = 0.95
                elements.push(btn)

                // Store original colors for hover effect
                btn._originalColor = k.rgb(60, 75, 110)
                btn._hoverColor = k.rgb(80, 100, 145)

                // Top gradient highlight
                const btnTop = addUI([
                    k.rect(64, 5),
                    k.pos(x, y),
                    k.color(110, 135, 180),  // Lighter top
                    k.opacity(isHidden ? 0 : 0.85),
                    k.fixed(),
                    k.z(907),
                ])
                btnTop._originalOpacity = 0.85
                btnTop._originalColor = k.rgb(110, 135, 180)
                btnTop._hoverColor = k.rgb(140, 175, 220)
                elements.push(btnTop)

                // Bottom gradient shadow
                const btnBottom = addUI([
                    k.rect(64, 5),
                    k.pos(x, y + 13),
                    k.color(40, 55, 90),  // Darker bottom
                    k.opacity(isHidden ? 0 : 0.7),
                    k.fixed(),
                    k.z(907),
                ])
                btnBottom._originalOpacity = 0.7
                btnBottom._originalColor = k.rgb(40, 55, 90)
                btnBottom._hoverColor = k.rgb(60, 80, 130)
                elements.push(btnBottom)

                // Button text
                const btnText = addUI([
                    k.text(label, { size: 10, styles: false }),
                    k.pos(x + 7, y + 5),
                    k.color(220, 230, 255),  // Bright text
                    k.opacity(isHidden ? 0 : 1),
                    k.fixed(),
                    k.z(909),
                ])
                btnText._originalOpacity = 1
                btnText._originalColor = k.rgb(220, 230, 255)
                btnText._hoverColor = k.rgb(255, 255, 255)
                elements.push(btnText)

                // Hover effects
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

                    // Click effect
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

                // Add to the appropriate group
                if (category === "actions") {
                    actionsGroup.push(elements)
                } else {
                    skillsGroup.push(elements)
                }

                return elements
            }

            // Add action buttons
            addBattleButton("Attack", 330, 300, function() { 
                playerAttack() 
            }, "actions")
            
            addBattleButton("Defend", 402, 300, function() { 
                playerDefend() 
            }, "actions")
            
            addBattleButton("Run", 474, 300, function() {
                playerRun()
            }, "actions")
            
            // Add skill buttons (same positions as actions)
            addBattleButton("Mend", 330, 300, function() {
                playerMedicate() 
            }, "skills")
            
            addBattleButton("Double Strike", 402, 300, function() {
                playerDoubleAttack() 
            }, "skills")

        k.onKeyPress("a", () => {
            playerAttack()
        })

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

            k.wait(0.2, () => {
                gameState.playerHP = Math.max(0, gameState.playerHP - damage)

                updateStats()
                screenFlash()
                shakeFrame(playerPanel, 7, 0.15)
                showDamage(playerPanel, damage, [255, 120, 120])

                const msg = `The ${enemy.name.toLowerCase()} claws you for ${damage} damage.`
                typeMessage(msg, { speed: 0.03 })

                k.wait(msg.length * 0.02 + 0.05, () => {
                    glitchText(k, messageText, 0.25)
                })

                if (gameState.playerHP <= 0) {
                    k.wait(0.8, () => {
                        k.go("gameOver")
                    })
                    return
                }

                turn = "player"
                gainEnergy(1)
                updateStats()
            })
        }

        function win() {
            gainEnergy(2)
            typeMessage(`The ${enemy.name} collapses into the dust.`)
            playerText.text = "Victory!\nPress O to return."
            turn = "end"
        }

        function lose() {
            typeMessage("You collapse. The wasteland takes another soul.")
            playerText.text = "Defeat...\nPress O to return."
            turn = "end"
        }

        k.onKeyPress("o", () => {
            if (!inBattle) return
            inBattle = false
            clearBattleUI()
        })
    }

    return {
        startBattleOverlay,
        isInBattle: () => inBattle,
    }
}