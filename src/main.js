import Phaser from "phaser";
import { PreloadScene } from "./scene/PreloadScene";
import { SCENE_KEYS } from "./scene/SceneKeys";
import { FirstMap } from "./scene/FirstMap";
import { StartScene } from "./scene/StartScene";
import { TalePopupScene } from "./Map/tale-ui";
import { SecondMap } from "./scene/SecondMap";
import { ThirdMap } from "./scene/ThirdMap";
import { IntroScene } from "./scene/IntroScene";
import { FourthMap } from "./scene/FourthMap";
import { EndScene } from "./scene/EndScene";

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  pixelArt: true,
  render: {
    antialias: false
  },
  scale: {
    parent: 'game-container',
    width: 2560,
    height: 1408,
    // autoCenter: Phaser.Scale.CENTER_BOTH, // 정중앙에 배치
    mode: Phaser.Scale.FIT, // 현재 디스플레이의 크기에 맞게 조절해줌
    
  },
  scene: [PreloadScene, StartScene, FirstMap, TalePopupScene, SecondMap,ThirdMap, IntroScene, FourthMap, EndScene],
});

// game.scene.add(SCENE_KEYS.PRELOAD_SCENE, PreloadScene);
// game.scene.add(SCENE_KEYS.FIRST_MAP, FirstMap)
// game.scene.start(SCENE_KEYS.PRELOAD_SCENE);