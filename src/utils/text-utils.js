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
  const chars = Array.from(text);
  const length = chars.length;
  let i = 0;

  target.text = ''; // 초기화

  const timedEvent = scene.time.addEvent({
    callback: () => {
      // 2. 안전한 문자 배열(chars)에서 문자를 가져와 추가
      if (i < length) {
          target.text += chars[i];
          ++i;
      }
      
      // 3. 마지막 문자 출력 후 콜백 호출
      if (i === length && config?.callback) {
        // 콜백은 반복이 끝난 후 한 번만 호출되도록 변경
        timedEvent.destroy(); // 이벤트 중지 및 파괴
        config.callback();
      }
    },
    // repeat: length - 1, // 'repeat' 대신 콜백 내에서 `i`와 `length`를 비교하여 처리하는 것이 더 명확합니다.
    loop: true, // 무한 반복으로 설정 후, 콜백에서 `destroy()`로 중지
    delay: config?.delay || 25,
  });
  
  return timedEvent;
}

export const MAP1_INTRO_TEXT = ["고향처럼 정겨운 느낌의 마을이다.", "마을을 돌아다니며 뭐가 있는지 확인해보자!"];
export const MAP2_INTRO_TEXT = ["우와 넓은 공원이네!", "산책하기 좋을 것 같아."];
export const MAP3_INTRO_TEXT = ["울창한 숲이네.", "무언가 숨겨져 있을 것 같아!"];
export const MAP4_INTRO_TEXT = ["..뭐지? 공항이다.", "카운터에 있는 직원에게 말을 걸어볼까?"];
export const SAMPLE_TEXT = '대화할 마음이 없어 보인다.';