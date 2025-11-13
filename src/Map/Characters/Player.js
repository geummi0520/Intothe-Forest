import { NONE, RIGHT } from "phaser";
import { CHAR_ASSET_KEYS } from "../../assets/AssetKeys";
import { DIRECTION } from "../../common/direction";
import { exhaustiveGuard } from "../../utils/guard";
import { Character } from "./Character";
import { getTargetPositionFromGameObject } from "../../utils/grid-utils";

/**
 * @typedef {Omit<import("./Character").CharacterConfig, 'idleFrameConfig'>} PlayerConfig
 */

export class Player extends Character {
    /**
     * @param {PlayerConfig} config 
     */
    constructor(config) {
        super({
            ...config,
            assetKey: CHAR_ASSET_KEYS.PLAYER,
            origin: { x:0, y:0.2 },
            idleFrameConfig: {
              DOWN: 0,
              UP: 12,
              NONE: 12,
              LEFT: 4,
              RIGHT: 8,
            }
        });
    }

      /**
       * @param {import("../../common/direction").Direction} direction 
       * @returns {void}
       */

      moveCharacter(direction) {
        super.moveCharacter(direction);

        switch(this._direction) {
          case DIRECTION.DOWN:
          case DIRECTION.LEFT:
          case DIRECTION.RIGHT:
          case DIRECTION.UP:
            if (!this._phaserGameObject.anims.isPlaying ||
              this._phaserGameObject.anims.currentAnim?.key != `PLAYER_${this.direction}`
            ) {
              this._phaserGameObject.play(`PLAYER_${this._direction}`);
            }
            break;
          case DIRECTION.NONE:
            break;
          default:
            exhaustiveGuard(this._direction);
        }
      }
}