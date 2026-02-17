import k from "./game/core/kaplay.js"
import "./game/scenes/overworld.js"
import "./game/scenes/gameOver.js"
import { editorScene } from "./game/scenes/mapEditor"
import {pixelEditorScene} from "./game/pixel/pixelEditorScene.js";

k.scene("editor", () => editorScene(k))
k.scene("pixelEditor", () => {
    pixelEditorScene(k)
})

const START_MODE = "overworld"
k.go(START_MODE)