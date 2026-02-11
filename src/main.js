import k from "./game/core/kaplay.js"
import "./game/scenes/overworld.js"
import "./game/scenes/gameOver.js"
import { editorScene } from "./game/scenes/mapEditor"

k.scene("editor", () => editorScene(k))

const START_MODE = "overworld"
k.go(START_MODE)