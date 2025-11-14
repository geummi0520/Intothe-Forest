import Phaser from "phaser";
import { SCENE_KEYS } from "../scene/SceneKeys";
/**
 * @typedef AnimateTextConfig
 * @type {object}
 * @property {() => void} [callback]
 * @property {number} [delay=25]
 */

/**
 *
 * @param {Phaser.Scene} scene the Phaser 3 Scene the time event will be added to
 * @param {Phaser.GameObjects.Text} target the Phaser 3 Text Game Object that will be animated
 * @param {string} text the text to display on the target game object
 * @param {AnimateTextConfig} [config]
 * @returns {Phaser.Time.TimerEvent}
 */
export function animateText(scene, target, text, config) {
  const length = text.length;
  let i = 0;
  target.text = ''; // 초기화
  const timedEvent = scene.time.addEvent({
    callback: () => {
      target.text += text[i];
      ++i;
      if (i === length && config?.callback) {
        config.callback();
      }
    },
    repeat: length - 1,
    delay: config?.delay || 25,
  });
  return timedEvent;
}

export const MAP1_INTRO_TEXT = ["고향처럼 정겨운 느낌의 마을이다.", "마을을 돌아다니며 뭐가 있는지 확인해보자!"];
export const MAP2_INTRO_TEXT = ["우와 넓은 공원이네!", "산책하기 좋을 것 같아."];
export const MAP3_INTRO_TEXT = ["울창한 숲이네.", "무언가 숨겨져 있을 것 같아!"];
export const MAP4_INTRO_TEXT = ["..뭐지? 공항이다.", "저기 직원에게 말을 걸어볼까?"];
export const SAMPLE_TEXT = '대화할 마음이 없어 보인다.';