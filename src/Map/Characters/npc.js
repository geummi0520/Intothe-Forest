import { Character } from './Character';
import { CHAR_ASSET_KEYS } from '../../assets/AssetKeys';
import { DIRECTION } from '../../common/direction.js';
import { exhaustiveGuard } from '../../utils/guard.js';

/**
 * @typedef {Omit<import('./Character').CharacterConfig, 'idleFrameConfig'> & {
*   frame: number,
*   messages: string[]
* }} NPCConfig
*/

export class NPC extends Character {
  /** @type {string[]} */
  #messages;
  /** @type {boolean} */
  #talkingToPlayer;
  /** @type {Phaser.Time.TimerEvent | null} */
  #blinkTimer = null;
  /** @type {boolean} */
  #eyeOpen = true;

  /**
   * @param {NPCConfig} config
   */
  constructor(config) {
    const assetKey = config.assetKey ?? null; // ← 없으면 기본 NPC로

    super({
      ...config,
      assetKey,
      origin: { x: 0.5, y: 0.5 },
      idleFrameConfig: {
        DOWN: config.frame,
        UP: config.frame + 12,
        NONE: config.frame,
        LEFT: config.frame + 4,
        RIGHT: config.frame + 8,
      },
    });

    this.#messages = config.messages;
    this.#talkingToPlayer = false;
    this.startBlinking();
  }

  /** @type {string[]} */
  get messages() {
    return [...this.#messages];
  }

  // /** @type {boolean} */
  // get isTalkingToPlayer() {
  //   return this.#talkingToPlayer;
  // }

  // /**
  //  * @param {boolean} val
  //  */
  //   set isTalkingToPlayer(val) {
  //     this.#talkingToPlayer = val;
  // }

  startBlinking() {
    if (!this._phaserGameObject || !this._idleFrameConfig) return;

    // 기존에 이미 타이머가 있다면 제거
    if (this.#blinkTimer) {
      this.#blinkTimer.remove(false);
      this.#blinkTimer = null;
    }

    // 1초마다 눈 깜빡임 토글
    this.#blinkTimer = this._phaserGameObject.scene.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        this.#eyeOpen = !this.#eyeOpen;

        // 기본 방향 DOWN 기준으로 눈 뜬/감은 프레임 토글 구현 (필요하면 방향에 맞게 확장 가능)
        const baseFrame = this._idleFrameConfig.DOWN;
        const blinkFrame = baseFrame + 1; // 감은 눈 프레임이 baseFrame + 1 이라고 가정할 때

        this._phaserGameObject.setFrame(this.#eyeOpen ? baseFrame : blinkFrame);
      },
    });
  }

  stopBlinking() {
    if (this.#blinkTimer) {
      this.#blinkTimer.remove(false);
      this.#blinkTimer = null;
    }
  }

  /**
   * @param {import('../../common/direction.js').Direction} playerDirection
   * @returns {void}
   */
  facePlayer(playerDirection) {
    switch (playerDirection) {
      case DIRECTION.DOWN:
        this._phaserGameObject.setFrame(this._idleFrameConfig.UP).setFlipX(false);
        break;
      case DIRECTION.LEFT:
        this._phaserGameObject.setFrame(this._idleFrameConfig.RIGHT).setFlipX(false);
        break;
      case DIRECTION.RIGHT:
        this._phaserGameObject.setFrame(this._idleFrameConfig.LEFT).setFlipX(false);
        break;
      case DIRECTION.UP:
        this._phaserGameObject.setFrame(this._idleFrameConfig.DOWN).setFlipX(false);
        break;
      case DIRECTION.NONE:
        break;
      default:
        exhaustiveGuard(playerDirection);
    }
  }
}
