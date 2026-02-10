export function addOverworldPlatforms(k) {
    // --- Ground ---
    k.add([
        k.rect(2000, 60),
        k.pos(0, 300),
        k.area(),
        k.body({ isStatic: true }),
        k.color(80, 80, 80),
    ])

    k.add([
        k.rect(900, 60),
        k.pos(2800, 300),
        k.area(),
        k.body({ isStatic: true }),
        k.color(80, 80, 80),
    ])

    k.add([
        k.rect(600, 60),
        k.pos(3900, 300),
        k.area(),
        k.body({ isStatic: true }),
        k.color(80, 80, 80),
    ])

    // --- Platforms (early climb) ---
    k.add([
        k.rect(140, 16),
        k.pos(220, 240),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(120, 16),
        k.pos(420, 200),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(160, 16),
        k.pos(650, 160),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(160, 16),
        k.pos(850, 160),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(160, 16),
        k.pos(850, 100),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(130, 16),
        k.pos(1050, 200),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(120, 16),
        k.pos(1200, 250),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    // --- Mid section (gaps + stagger) ---
    k.add([
        k.rect(120, 16),
        k.pos(1500, 230),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(140, 16),
        k.pos(1700, 190),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(100, 16),
        k.pos(1900, 150),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(140, 16),
        k.pos(2050, 210),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(160, 16),
        k.pos(2250, 170),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    // --- Upper route (risk/reward) ---
    k.add([
        k.rect(120, 16),
        k.pos(1650, 110),
        k.area(),
        k.body({ isStatic: true }),
        k.color(110, 110, 135),
    ])

    k.add([
        k.rect(140, 16),
        k.pos(1850, 80),
        k.area(),
        k.body({ isStatic: true }),
        k.color(110, 110, 135),
    ])

    k.add([
        k.rect(120, 16),
        k.pos(2100, 60),
        k.area(),
        k.body({ isStatic: true }),
        k.color(110, 110, 135),
    ])

    // --- Long bridge section ---
    k.add([
        k.rect(260, 16),
        k.pos(2500, 220),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(200, 16),
        k.pos(2800, 180),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(220, 16),
        k.pos(3050, 210),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    // --- Late section (final climb) ---
    k.add([
        k.rect(120, 16),
        k.pos(3350, 190),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(120, 16),
        k.pos(3500, 150),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(120, 16),
        k.pos(3650, 110),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(180, 16),
        k.pos(3800, 170),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    // --- Final ledges ---
    k.add([
        k.rect(140, 16),
        k.pos(4100, 200),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(160, 16),
        k.pos(4300, 160),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])

    k.add([
        k.rect(200, 16),
        k.pos(4550, 120),
        k.area(),
        k.body({ isStatic: true }),
        k.color(100, 100, 120),
    ])
}