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
