export function createTypewriter(k, messageText) {
    let typeToken = 0

    return function typeMessage(fullText, opts = {}) {
        const { speed = 0.02, start = "" } = opts

        typeToken++
        const myToken = typeToken

        messageText.text = start
        let i = 0

        const step = () => {
            if (myToken !== typeToken) return
            if (i >= fullText.length) return

            messageText.text += fullText[i]
            i++

            k.wait(speed, step)
        }

        step()
    }
}

export function glitchText(k, entity, duration = 0.25) {
    const original = entity.text
    const symbols = "!@#$%^&*()_+-=<>?/\\[]{}~"

    let t = duration

    const tick = () => {
        t -= 0.03
        if (t <= 0) {
            entity.text = original
            return
        }

        const arr = original.split("")
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] !== " " && Math.random() < 0.12) {
                arr[i] = symbols[Math.floor(Math.random() * symbols.length)]
            }
        }
        entity.text = arr.join("")

        k.wait(0.03, tick)
    }

    tick()
}

export function createScreenFlash(k) {
    const flash = k.add([
        k.rect(640, 360),
        k.pos(0, 0),
        k.color(255, 255, 255),
        k.opacity(0),
        k.fixed(),
        k.z(9999),
    ])

    let flashT = 0

    k.onUpdate(() => {
        if (flashT > 0) {
            flashT -= k.dt()
            const a = Math.max(0, flashT / 0.12)
            flash.opacity = a * 0.55
        }
    })

    function screenFlash() {
        flashT = 0.12
        flash.opacity = 0.55
    }

    return { screenFlash }
}