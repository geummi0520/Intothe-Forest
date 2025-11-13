import { DATA_ASSET_KEYS } from "../assets/AssetKeys.js";
import Phaser from "phaser";

export class DataUtils {
  /**
   * 
   * @param {Phaser.Scene} scene
   * @returns {import("../types/typedef.js").Animation[]} 
   */
  static getAnimations(scene){
    /** @type {import("../types/typedef.js").Animation[]}  */
    const data = scene.cache.json.get(DATA_ASSET_KEYS.ANIMATIONS);
    return data;
  }
}
