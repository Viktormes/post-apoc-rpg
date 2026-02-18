import { gameState } from "../core/state.js"
import { createTypewriter, createScreenFlash } from "../ui/textFx.js"
import { pickRandomEnemy } from "../entities/enemy.js"
import { renderPixelSprite } from "../pixel/renderPixelSprite.js"
import playerSprite from "../sprites/player.json"


export function createOverworldBattle(k) {
    let inBattle = false
    const battleUI = []

    const W = () => k.width()
    const H = () => k.height()

    // A scale factor for UI sizing (NOT a fixed base resolution)
    // Uses the smaller screen dimension to keep UI proportional.
    const UI = () => {
        const s = Math.min(W(), H())
        const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

        const margin = clamp(s * 0.03, 12, 28)
        const border = clamp(s * 0.012, 4, 10)

        // Panels
        const msgW = clamp(W() * 0.42, 240, 520)
        const msgH = clamp(H() * 0.18, 72, 140)

        const enemyPanelW = clamp(W() * 0.36, 240, 520)
        const enemyPanelH = clamp(H() * 0.16, 64, 140)

        const playerPanelW = clamp(W() * 0.40, 260, 580)
        const playerPanelH = clamp(H() * 0.18, 70, 160)

        // Bars
        const barW = clamp(enemyPanelW * 0.48, 120, 260)
        const barH = clamp(s * 0.018, 6, 10)
        const barPadY = clamp(s * 0.01, 6, 12)

        // Text sizes
        const msgTextSize = clamp(s * 0.045, 14, 22)
        const smallTextSize = clamp(s * 0.038, 12, 18)
        const labelTextSize = clamp(s * 0.032, 10, 14)

        // Buttons
        const tabW = clamp(W() * 0.12, 84, 140)
        const tabH = clamp(s * 0.055, 22, 34)
        const btnW = clamp(W() * 0.10, 64, 140)
        const btnH = clamp(s * 0.048, 18, 30)
        const btnGap = clamp(s * 0.02, 10, 22)

        // Battle actor positions
        const actorsY = clamp(H() * 0.55, 160, H() - playerPanelH - margin - 40)
        const playerX = clamp(W() * 0.25, 120, W() * 0.40)
        const enemyX = clamp(W() * 0.75, W() * 0.60, W() - 120)

        return {
            s, margin, border,
            msgW, msgH,
            enemyPanelW, enemyPanelH,
            playerPanelW, playerPanelH,
            barW, barH, barPadY,
            msgTextSize, smallTextSize, labelTextSize,
            tabW, tabH,
            btnW, btnH, btnGap,
            actorsY, playerX, enemyX,
        }
    }

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
    // UI BUILD HELPERS
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

    // Frame parts stored so we can resize/reposition them responsively
    function createFrame() {
        const top = addRect(10, 10, 0, 0, [20, 20, 20], 0.85, 902)
        const bottom = addRect(10, 10, 0, 0, [20, 20, 20], 0.85, 902)
        const left = addRect(10, 10, 0, 0, [20, 20, 20], 0.85, 902)
        const right = addRect(10, 10, 0, 0, [20, 20, 20], 0.85, 902)
        return { top, bottom, left, right }
    }

    // Fancy panel returns ALL its parts so we can update sizes/positions on layout()
    function createFancyPanel({
                                  x, y, w, h,
                                  baseColor, glowColor, topColor, accentColor,
                                  cornerTL, cornerTR, cornerBL, cornerBR,
                                  zBase = 904,
                              }) {
        const base = addRect(w, h, x, y, baseColor, 0.92, zBase)
        const glow = addRect(w + 6, h + 6, x - 3, y - 3, glowColor, 0.2, zBase - 1)
        const top = addRect(w, 3, x, y, topColor, 0.9, zBase + 1)
        const bottom = addRect(w, 2, x, y + h - 2, accentColor, 0.8, zBase + 1)
        const left = addRect(3, h, x, y, topColor, 0.7, zBase + 1)
        const right = addRect(3, h, x + w - 3, y, topColor, 0.7, zBase + 1)

        const ctl = addRect(6, 6, x, y, cornerTL, 0.9, zBase + 2)
        const ctr = addRect(6, 6, x + w - 6, y, cornerTR, 0.9, zBase + 2)
        const cbl = addRect(6, 6, x, y + h - 6, cornerBL, 0.8, zBase + 2)
        const cbr = addRect(6, 6, x + w - 6, y + h - 6, cornerBR, 0.8, zBase + 2)

        return {
            panel: base, // used for shake
            parts: { base, glow, top, bottom, left, right, ctl, ctr, cbl, cbr },
        }
    }

    // Bar returns all parts so we can update width/position & keep fill scaling behavior.
    function createBar({
                           x, y,
                           label, labelX, labelY, labelColor,
                           borderColor, borderOpacity,
                           bgColor, fillColor, highlightColor,
                           width = 120,
                           zBase = 905,
                           labelSize = 11,
                           barH = 6,
                       }) {
        const labelObj = label
            ? addUI([
                k.text(label, { size: labelSize, styles: false }),
                k.pos(labelX, labelY),
                k.color(labelColor[0], labelColor[1], labelColor[2]),
                k.fixed(),
                k.z(zBase),
            ])
            : null

        const border = addRect(width + 4, barH + 4, x - 2, y - 2, borderColor, borderOpacity, zBase)
        const bg = addRect(width, barH, x, y, bgColor, 1, zBase)

        const fill = addUI([
            k.rect(width, barH),
            k.pos(x, y),
            k.color(fillColor[0], fillColor[1], fillColor[2]),
            k.scale(1),
            k.fixed(),
            k.z(zBase + 1),
        ])

        const highlight = addRect(width, Math.max(2, Math.floor(barH * 0.35)), x, y, highlightColor, 0.7, zBase + 2)

        return { fill, parts: { labelObj, border, bg, highlight }, meta: { x, y, width, barH } }
    }

    // Small helpers to update rect geometry safely
    function setRectGeom(obj, w, h, x, y) {
        if (typeof obj.width === "number") obj.width = w
        if (typeof obj.height === "number") obj.height = h
        obj.pos.x = x
        obj.pos.y = y
    }

    // =====================================================
    // BATTLE OVERLAY
    // =====================================================

    function startBattleOverlay(enemyTemplate, overworldEnemyEntity, overworldPlayer) {

        if (inBattle) return
        inBattle = true

        const BATTLE_SCALE = 1.25
        const sx = (v) => v * BATTLE_SCALE
        const sy = (v) => v * BATTLE_SCALE

        const previousScale = k.camScale()
        k.setCamScale(1.3)

        overworldPlayer.children.forEach(child => {
            child.opacity = 0
        })
        if (overworldEnemyEntity) overworldEnemyEntity.opacity = 0

        const enemy = enemyTemplate ?? pickRandomEnemy()
        let enemyHP = enemy.maxHP
        let turn = "player"
        let awaitingEnemy = false

        let damageReductionNext = 0
        let evadeNextAttack = false

        // Fullscreen vignette (already responsive)
        const vignette = addUI([
            k.rect(W(), H()),
            k.pos(0, 0),
            k.color(0, 0, 0),
            k.opacity(0.0),
            k.fixed(),
            k.z(900),
        ])

        // Responsive frame (we’ll layout it)
        const frame = createFrame()

        // Message panel rect (top-left)
        const messagePanel = addRect(10, 10, 0, 0, [10, 10, 10], 0.85, 904)

        // Panels
        const enemyPanelWrap = createFancyPanel({
            x: 0, y: 0, w: 10, h: 10,
            baseColor: [16, 20, 36],
            glowColor: [60, 100, 200],
            topColor: [100, 160, 255],
            accentColor: [50, 100, 180],
            cornerTL: [160, 200, 255],
            cornerTR: [160, 200, 255],
            cornerBL: [100, 140, 230],
            cornerBR: [100, 140, 230],
        })

        const playerPanelWrap = createFancyPanel({
            x: 0, y: 0, w: 10, h: 10,
            baseColor: [18, 26, 18],
            glowColor: [80, 160, 80],
            topColor: [140, 220, 140],
            accentColor: [80, 160, 80],
            cornerTL: [180, 255, 180],
            cornerTR: [180, 255, 180],
            cornerBL: [120, 200, 120],
            cornerBR: [120, 200, 120],
        })

        k.tween(0, 0.85, 0.25, (v) => { vignette.opacity = v })

        const whiteFlash = addUI([
            k.rect(W(), H()),
            k.pos(0, 0),
            k.color(255, 255, 255),
            k.opacity(0.8),
            k.fixed(),
            k.z(901),
        ])

        k.tween(0.8, 0, 0.18, (v) => { whiteFlash.opacity = v })
        k.wait(0.18, () => whiteFlash.destroy())

        const { screenFlash } = createScreenFlash(k)

        // Text nodes (we’ll position & size in layout())
        const messageText = addUI([
            k.text("", { size: 16, width: 280, styles: false }),
            k.pos(0, 0),
            k.fixed(),
            k.z(905),
        ])

        const playerText = addUI([
            k.text("", { size: 14, styles: false }),
            k.pos(0, 0),
            k.fixed(),
            k.z(905),
        ])

        const enemyText = addUI([
            k.text("", { size: 14, styles: false }),
            k.pos(0, 0),
            k.fixed(),
            k.z(905),
        ])

        // Bars (we’ll resize/position in layout())
        const enemyHpBar = createBar({
            x: 0, y: 0,
            width: 120,
            barH: 6,
            label: "HP",
            labelX: 0,
            labelY: 0,
            labelColor: [180, 210, 255],
            borderColor: [10, 15, 30],
            borderOpacity: 0.8,
            bgColor: [40, 50, 80],
            fillColor: [100, 140, 255],
            highlightColor: [150, 190, 255],
            labelSize: 11,
        })

        const playerHpBar = createBar({
            x: 0, y: 0,
            width: 120,
            barH: 6,
            label: "HP",
            labelX: 0,
            labelY: 0,
            labelColor: [180, 240, 180],
            borderColor: [10, 25, 10],
            borderOpacity: 0.8,
            bgColor: [40, 60, 40],
            fillColor: [120, 220, 120],
            highlightColor: [160, 240, 160],
            labelSize: 11,
        })

        const playerEnergyBar = createBar({
            x: 0, y: 0,
            width: 120,
            barH: 6,
            label: "EN",
            labelX: 0,
            labelY: 0,
            labelColor: [180, 210, 255],
            borderColor: [10, 15, 30],
            borderOpacity: 0.8,
            bgColor: [40, 50, 70],
            fillColor: [100, 160, 255],
            highlightColor: [140, 190, 255],
            labelSize: 11,
        })

        const enemyHpBarFill = enemyHpBar.fill
        const playerHpBarFill = playerHpBar.fill
        const playerEnergyBarFill = playerEnergyBar.fill

        const typeMessage = createTypewriter(k, messageText)

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
            const u = UI()
            const damageText = addUI([
                k.text(damage.toString(), { size: u.smallTextSize, styles: false }),
                k.pos(panel.pos.x + u.margin * 0.6, panel.pos.y + u.margin * 0.4),
                k.color(color[0], color[1], color[2]),
                k.opacity(1),
                k.fixed(),
                k.z(910),
            ])

            k.tween(damageText.pos.y, damageText.pos.y - u.s * 0.06, 0.5, (v) => { damageText.pos.y = v })
            k.tween(damageText.opacity, 0, 0.5, (v) => { damageText.opacity = v })
            k.wait(0.5, () => damageText.destroy())
        }

        // Battle actors (we’ll place in layout())
        let battlePlayer

        if (playerSprite) {

            const spriteScale = 2 * BATTLE_SCALE

            const sprite = renderPixelSprite(
                k,
                playerSprite,
                spriteScale
            )

            battlePlayer = addUI([
                k.rect(sprite.width, sprite.height),
                k.pos(W() * 0.25, H() * 0.55),
                k.opacity(0),
                k.area(),
                k.body(),
                k.fixed(),
                k.z(99995),
            ])


            sprite.components.forEach(comp => {
                battlePlayer.add(comp)
            })

        } else {

            battlePlayer = addUI([
                k.rect(overworldPlayer.width, overworldPlayer.height),
                k.pos(W() * 0.25, H() * 0.55),
                k.color(
                    overworldPlayer.color.r,
                    overworldPlayer.color.g,
                    overworldPlayer.color.b
                ),
                k.opacity(1),
                k.fixed(),
                k.z(99995),
            ])
        }

        let battleEnemy

        if (enemyTemplate.sprite) {

            const spriteScale =  2 * BATTLE_SCALE

            const sprite = renderPixelSprite(
                k,
                enemyTemplate.sprite,
                spriteScale
            )

            battleEnemy = addUI([
                k.rect(sprite.width, sprite.height),
                k.pos(W() * 0.7, H() * 0.55),
                k.opacity(0),
                k.fixed(),
                k.z(905),
            ])

            sprite.components.forEach(comp => {
                battleEnemy.add(comp)
            })

        } else {

            battleEnemy = addUI([
                k.rect(enemyTemplate.width, enemyTemplate.height),
                k.pos(W() * 0.7, H() * 0.55),
                k.color(...enemyTemplate.color),
                k.opacity(1),
                k.fixed(),
                k.z(905),
            ])
        }

        // =====================================================
        // Responsive layout (runs while in battle)
        // =====================================================
        function layout() {
            const u = UI()

            // Ensure fullscreen rects stay fullscreen
            setRectGeom(vignette, W(), H(), 0, 0)

            // Frame
            setRectGeom(frame.top, W(), u.border, 0, 0)
            setRectGeom(frame.bottom, W(), u.border, 0, H() - u.border)
            setRectGeom(frame.left, u.border, H(), 0, 0)
            setRectGeom(frame.right, u.border, H(), W() - u.border, 0)

            // Message panel (top-left)
            setRectGeom(messagePanel, u.msgW, u.msgH, u.margin, u.margin)

            // Enemy panel (top-right)
            const enemyX = W() - u.margin - u.enemyPanelW
            const enemyY = u.margin
            applyFancyPanelLayout(enemyPanelWrap, enemyX, enemyY, u.enemyPanelW, u.enemyPanelH, u)

            // Player panel (bottom-left)
            const playerX = u.margin
            const playerY = H() - u.margin - u.playerPanelH
            applyFancyPanelLayout(playerPanelWrap, playerX, playerY, u.playerPanelW, u.playerPanelH, u)

            // Text sizing + positions
            if (messageText.textSize) messageText.textSize = u.msgTextSize
            // Most kaplay/kaboom text comps expose "size" as config; fallback: recreate not needed usually.
            // We'll set width & pos:
            messageText.pos.x = u.margin + u.margin * 0.7
            messageText.pos.y = u.margin + u.margin * 0.5
            // Message text width should fit inside message panel:
            messageText.width = u.msgW - u.margin * 1.4

            playerText.pos.x = playerX + u.margin * 0.7
            playerText.pos.y = playerY + u.margin * 0.45

            enemyText.pos.x = enemyX + u.margin * 0.7
            enemyText.pos.y = enemyY + u.margin * 0.45

            // Bars inside panels
            const enemyBarX = enemyX + u.margin * 0.7 + u.labelTextSize * 1.4
            const enemyBarY = enemyY + u.enemyPanelH * 0.55
            applyBarLayout(enemyHpBar, enemyBarX, enemyBarY, u.barW, u.barH, enemyX + u.margin * 0.7, enemyBarY - u.barH * 0.6, u.labelTextSize)

            const playerBarX = playerX + u.margin * 0.7 + u.labelTextSize * 1.4
            const playerHpY = playerY + u.playerPanelH * 0.55
            applyBarLayout(playerHpBar, playerBarX, playerHpY, u.barW, u.barH, playerX + u.margin * 0.7, playerHpY - u.barH * 0.6, u.labelTextSize)

            const playerEnY = playerHpY + u.barH + u.barPadY
            applyBarLayout(playerEnergyBar, playerBarX, playerEnY, u.barW, u.barH, playerX + u.margin * 0.7, playerEnY - u.barH * 0.6, u.labelTextSize)

            // Actors
            const actorY = u.actorsY
            battlePlayer.pos.x = u.playerX
            battlePlayer.pos.y = actorY
            battleEnemy.pos.x = u.enemyX
            battleEnemy.pos.y = actorY
        }

        function applyFancyPanelLayout(wrap, x, y, w, h, u) {
            const { parts } = wrap

            setRectGeom(parts.base, w, h, x, y)
            setRectGeom(parts.glow, w + u.border, h + u.border, x - u.border / 2, y - u.border / 2)

            setRectGeom(parts.top, w, Math.max(2, Math.floor(u.border * 0.4)), x, y)
            setRectGeom(parts.bottom, w, Math.max(2, Math.floor(u.border * 0.35)), x, y + h - Math.max(2, Math.floor(u.border * 0.35)))
            setRectGeom(parts.left, Math.max(2, Math.floor(u.border * 0.4)), h, x, y)
            setRectGeom(parts.right, Math.max(2, Math.floor(u.border * 0.4)), h, x + w - Math.max(2, Math.floor(u.border * 0.4)), y)

            const c = Math.max(4, Math.floor(u.border * 1.1))
            setRectGeom(parts.ctl, c, c, x, y)
            setRectGeom(parts.ctr, c, c, x + w - c, y)
            setRectGeom(parts.cbl, c, c, x, y + h - c)
            setRectGeom(parts.cbr, c, c, x + w - c, y + h - c)
        }

        function applyBarLayout(bar, x, y, w, h, labelX, labelY, labelSize) {
            const { fill, parts } = bar

            // Label
            if (parts.labelObj) {
                parts.labelObj.pos.x = labelX
                parts.labelObj.pos.y = labelY
                // If your kaplay exposes size update, you can set it; if not, it will still look okay.
                // Common: parts.labelObj.textSize = labelSize
                parts.labelObj.textSize = labelSize
            }

            // Border/bg/fill/highlight
            setRectGeom(parts.border, w + 4, h + 4, x - 2, y - 2)
            setRectGeom(parts.bg, w, h, x, y)
            setRectGeom(fill, w, h, x, y)
            setRectGeom(parts.highlight, w, Math.max(2, Math.floor(h * 0.35)), x, y)
        }

        // Keep UI responsive even during resize
        const layoutHandle = k.onUpdate(() => {
            if (!inBattle) return
            layout()
        })

        // Initial layout + initial stats
        layout()
        updateStats()
        typeMessage(`A wild ${enemy.name} appears!`)

        // =====================================================
        // Player actions (UNCHANGED)
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

            const u = UI()
            const startX = battlePlayer.pos.x
            const baseY = battlePlayer.pos.y
            const backX = startX - u.s * 0.05
            const attackX = W() * 0.55

            backOffWithRev(battlePlayer, startX, backX, baseY, 0.08, 2, 1)
            localShake(battlePlayer, 2, 0.08)

            k.wait(0.12, () => {
                k.tween(backX, attackX, 0.1, (v) => {
                    battlePlayer.pos.x = v
                    battlePlayer.pos.y = baseY
                })


                k.wait(0.1, () => {
                    const dmg = k.randi(gameState.playerWeapon.damageMin, gameState.playerWeapon.damageMax)
                    enemyHP = Math.max(0, enemyHP - dmg)

                    if (enemyTemplate.sprite) {

                        const originalColors = []

                        battleEnemy.children.forEach(child => {
                            if (child.color) {
                                originalColors.push(child.color.clone())
                                child.color = k.rgb(255, 60, 60)
                            }
                        })

                        k.wait(0.08, () => {
                            let i = 0
                            battleEnemy.children.forEach(child => {
                                if (child.color) {
                                    child.color = originalColors[i++]
                                }
                            })
                        })

                    } else {

                        const originalColor = battleEnemy.color.clone()
                        battleEnemy.color = k.rgb(255, 60, 60)
                        k.wait(0.08, () => battleEnemy.color = originalColor)

                    }

                    k.shake(10)
                    spawnAttackParticles(battleEnemy.pos.x, battleEnemy.pos.y)
                    applyKnockback(battleEnemy, 20, 1.2)

                    updateStats()
                    screenFlash()
                    shakeFrame(enemyPanelWrap.panel, 6, 0.12)
                    showDamage(enemyPanelWrap.panel, dmg, [255, 200, 100])

                    const msg = `You strike with your ${gameState.playerWeapon.name.toLowerCase()} for ${dmg} damage.`
                    typeMessage(msg, { speed: 0.03 })

                    k.tween(attackX, startX, 0.12, (v) => {
                        battlePlayer.pos.x = v
                        battlePlayer.pos.y = baseY
                    })

                    k.wait(0.25, () => {
                        if (enemyHP <= 0) {
                            win()
                            return
                        }
                        if (endTurn) {
                            turn = "enemy"
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
                onDone: () => { awaitingEnemy = false },
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
                    k.wait(1.0, () => k.go("overworld"))
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

            if (gameState.energy < 2) {
                typeMessage("Not enough energy. (Needs 2)")
                return
            }



            const healAmount = k.randi(4, 8)
            gameState.playerHP = Math.min(gameState.maxHP, gameState.playerHP + healAmount)

            const msg = `You use mend to restore ${healAmount} HP.`
            typeMessage(msg, { speed: 0.03 })

            gameState.energy -= 2
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

            doPlayerHit({
                endTurn: false,
                onDone: () => {
                    if (!inBattle || turn === "end") return
                    doPlayerHit({
                        endTurn: false,
                        onDone: () => {
                            if (!inBattle || turn === "end") return
                            turn = "enemy"
                            awaitingEnemy = false
                            k.wait(0.6, () => enemyTurn())
                        },
                    })
                },
            })
        }

        // =====================================================
        // Button UI + categories (same functionality, responsive positions/sizes)
        // =====================================================

        let activeCategory = "actions"

        const actionsGroup = []
        const skillsGroup = []

        function setGroupVisible(group, visible) {
            group.forEach((elements) => {
                elements.forEach((el) => {
                    el.opacity = visible ? (el._originalOpacity ?? 1) : 0
                    if (el.area) el.area.isActive = visible
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

        function addCategoryTab(label, categoryId, isActive) {
            // create placeholders; layout() will size/pos them
            const tab = addUI([
                k.rect(80, 24),
                k.pos(0, 0),
                k.color(isActive ? 70 : 40, isActive ? 85 : 50, isActive ? 120 : 80),
                k.opacity(0.95),
                k.area(),
                k.fixed(),
                k.z(905),
            ])

            const topLine = addUI([
                k.rect(80, 3),
                k.pos(0, 0),
                k.color(isActive ? 120 : 80, isActive ? 145 : 110, isActive ? 190 : 150),
                k.opacity(0.9),
                k.fixed(),
                k.z(906),
            ])

            const tabText = addUI([
                k.text(label, { size: UI().labelTextSize, styles: false }),
                k.pos(0, 0),
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

            // keep references for layout
            return { tab, topLine, tabText, categoryId }
        }

        function addBattleButton(label, onPress, category = "actions") {
            const elements = []
            const isHidden = category !== activeCategory

            const shadow = addUI([
                k.rect(66, 18),
                k.pos(0, 0),
                k.color(5, 5, 10),
                k.opacity(isHidden ? 0 : 0.7),
                k.fixed(),
                k.z(904),
            ])
            shadow._originalOpacity = 0.7
            elements.push(shadow)

            const base = addUI([
                k.rect(64, 18),
                k.pos(0, 0),
                k.color(15, 20, 30),
                k.opacity(isHidden ? 0 : 0.9),
                k.fixed(),
                k.z(905),
            ])
            base._originalOpacity = 0.9
            elements.push(base)

            const btn = addUI([
                k.rect(64, 18),
                k.pos(0, 0),
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
                k.pos(0, 0),
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
                k.pos(0, 0),
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
                k.text(label, { size: UI().labelTextSize, styles: false }),
                k.pos(0, 0),
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

            // Store category for layout
            elements._category = category
            elements._btn = btn
            elements._btnTop = btnTop
            elements._btnBottom = btnBottom
            elements._btnText = btnText
            elements._shadow = shadow
            elements._base = base

            if (category === "actions") actionsGroup.push(elements)
            else skillsGroup.push(elements)

            return elements
        }

        const actionTab = addCategoryTab("ACTIONS", "actions", true)
        const skillTab = addCategoryTab("SKILLS", "skills", false)

        const btnAttack = addBattleButton("Attack", () => playerAttack(), "actions")
        const btnDefend = addBattleButton("Defend", () => playerDefend(), "actions")
        const btnRun = addBattleButton("Run", () => playerRun(), "actions")

        const btnMend = addBattleButton("Mend", () => playerMedicate(), "skills")
        const btnDouble = addBattleButton("Double Strike", () => playerDoubleAttack(), "skills")

        // Extend layout() to position tabs/buttons responsively
        const oldLayout = layout
        function layoutButtons() {
            const u = UI()

            // Bottom-right area
            const baseY = H() - u.margin - u.btnH * 1.2
            const baseX = W() - u.margin - (u.btnW * 3 + u.btnGap * 2)

            // Tabs above buttons
            const tabY = baseY - u.tabH - u.btnGap * 0.6
            const tabX1 = baseX
            const tabX2 = baseX + u.tabW + u.btnGap * 0.6

            // Tabs sizing/pos
            setRectGeom(actionTab.tab, u.tabW, u.tabH, tabX1, tabY)
            setRectGeom(actionTab.topLine, u.tabW, Math.max(2, Math.floor(u.tabH * 0.12)), tabX1, tabY)
            actionTab.tabText.pos.x = tabX1 + u.tabW * 0.18
            actionTab.tabText.pos.y = tabY + u.tabH * 0.25
            actionTab.tabText.textSize = u.labelTextSize

            setRectGeom(skillTab.tab, u.tabW, u.tabH, tabX2, tabY)
            setRectGeom(skillTab.topLine, u.tabW, Math.max(2, Math.floor(u.tabH * 0.12)), tabX2, tabY)
            skillTab.tabText.pos.x = tabX2 + u.tabW * 0.18
            skillTab.tabText.pos.y = tabY + u.tabH * 0.25
            skillTab.tabText.textSize = u.labelTextSize

            // Buttons row (3 buttons)
            positionButtonGroup(btnAttack, baseX + 0 * (u.btnW + u.btnGap), baseY, u)
            positionButtonGroup(btnDefend, baseX + 1 * (u.btnW + u.btnGap), baseY, u)
            positionButtonGroup(btnRun, baseX + 2 * (u.btnW + u.btnGap), baseY, u)

            // Skills (2 buttons aligned left)
            positionButtonGroup(btnMend, baseX + 0 * (u.btnW + u.btnGap), baseY, u)
            positionButtonGroup(btnDouble, baseX + 1 * (u.btnW + u.btnGap), baseY, u)
        }

        function positionButtonGroup(elements, x, y, u) {
            const shadow = elements._shadow
            const base = elements._base
            const btn = elements._btn
            const top = elements._btnTop
            const bottom = elements._btnBottom
            const text = elements._btnText

            setRectGeom(shadow, u.btnW + 2, u.btnH, x, y + 1)
            setRectGeom(base, u.btnW, u.btnH, x + 1, y + 1)
            setRectGeom(btn, u.btnW, u.btnH, x, y)

            setRectGeom(top, u.btnW, Math.max(3, Math.floor(u.btnH * 0.28)), x, y)
            setRectGeom(bottom, u.btnW, Math.max(3, Math.floor(u.btnH * 0.28)), x, y + u.btnH - Math.max(3, Math.floor(u.btnH * 0.28)))

            text.pos.x = x + u.btnW * 0.12
            text.pos.y = y + u.btnH * 0.28
            text.textSize = u.labelTextSize
        }

        // Hook into the existing onUpdate layout
        const layoutButtonsHandle = k.onUpdate(() => {
            if (!inBattle) return
            layoutButtons()
        })

        // =====================================================
        // Enemy turn (unchanged, but uses responsive attackX already in doPlayerHit)
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

            const startX = battleEnemy.pos.x
            const targetX = W() * 0.45

            k.tween(startX, targetX, 0.1, (v) => { battleEnemy.pos.x = v })

            k.wait(0.1, () => {
                if (playerSprite) {

                    const originalColors = []

                    battlePlayer.children.forEach(child => {
                        if (child.color && typeof child.color.clone === "function") {
                            originalColors.push({
                                child,
                                color: child.color.clone()
                            })
                            child.color = k.rgb(255, 60, 60)
                        }
                    })

                    k.wait(0.1, () => {
                        originalColors.forEach(entry => {
                            entry.child.color = entry.color
                        })
                    })

                } else {

                    const originalColor = battlePlayer.color.clone()
                    battlePlayer.color = k.rgb(255, 60, 60)
                    k.wait(0.1, () => {
                        battlePlayer.color = originalColor
                    })

                }

                k.shake(10)
                spawnAttackParticles(battlePlayer.pos.x, battlePlayer.pos.y)
                applyKnockback(battlePlayer, -1, 10 + damage * 1.5, 0.08)

                gameState.playerHP = Math.max(0, gameState.playerHP - damage)

                updateStats()
                screenFlash()
                shakeFrame(playerPanelWrap.panel, 7, 0.15)
                showDamage(playerPanelWrap.panel, damage, [255, 120, 120])

                k.tween(targetX, startX, 0.1, (v) => { battleEnemy.pos.x = v })

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

            k.tween(1, 0, 1, (v) => {

                battleEnemy.scale = k.vec2(v, v)
            })

            k.wait(2, () => {
                if (overworldEnemyEntity) overworldEnemyEntity.destroy()
                cleanupBattle()
            })
        }

        function lose() {
            typeMessage("You collapse. The wasteland takes another soul.")
            k.wait(2, () => cleanupBattle())
        }

        function cleanupBattle() {
            battlePlayer.destroy()
            battleEnemy.destroy()


            overworldPlayer.children.forEach(child => {
                child.opacity = 1
            })
            if (overworldEnemyEntity && overworldEnemyEntity.exists()) {
                overworldEnemyEntity.opacity = 1
            }

            inBattle = false
            k.setCamScale(previousScale)
            layoutHandle.cancel?.()
            layoutButtonsHandle.cancel?.()
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

                k.wait(0.6, () => particle.destroy())
            }
        }

        function applyKnockback(entity, direction, force = 20, duration = 0.1) {
            const startX = entity.pos.x
            const targetX = startX + direction * force

            k.tween(startX, targetX, duration, (v) => { entity.pos.x = v })
            k.wait(duration, () => {
                k.tween(targetX, startX, duration, (v) => { entity.pos.x = v })
            })
        }

        // Close overlay (unchanged)
        k.onKeyPress("o", () => {
            if (!inBattle) return
            inBattle = false
            clearBattleUI()
        })

        // Ensure correct group visibility at start
        setGroupVisible(actionsGroup, true)
        setGroupVisible(skillsGroup, false)
    }

    return {
        startBattleOverlay,
        isInBattle: () => inBattle,
    }
}
