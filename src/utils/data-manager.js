import Phaser from 'phaser';
import { DIRECTION } from '../common/direction.js';
import { TILE_SIZE } from '../config.js';

/**
 * @typedef GlobalState
 * @type {object}
 * @property {object} player
 * @property {object} player.position
 * @property {number} player.position.x
 * @property {number} player.position.y
 * @property {import('../common/direction.js').Direction} player.direction
 */

/** @type {GlobalState} */
const initialState = {
  player: {
    position: {
      x: 18.5 * TILE_SIZE,
      y: 19 * TILE_SIZE,
    },
    direction: DIRECTION.UP,
  },
};

export const DATA_MANAGER_STORE_KEYS = Object.freeze({
  PLAYER_POSITION: 'PLAYER_POSITION',
  PLAYER_DIRECTION: 'PLAYER_DIRECTION',
  INTRO_WELCOME_KEY: 'INTRO_WELCOME_KEY',
  MAP1_WELCOME_KEY: 'MAP1_WELCOME_KEY',
  MAP2_WELCOME_KEY: 'MAP2_WELCOME_KEY',
  MAP3_WELCOME_KEY: 'MAP3_WELCOME_KEY',
  MAP4_WELCOME_KEY: 'MAP4_WELCOME_KEY',
  INVENTORY: "INVENTORY",
});

class DataManager extends Phaser.Events.EventEmitter {
  /** @type {Phaser.Data.DataManager} */
  #store;

  constructor() {
    super();
    this.#store = new Phaser.Data.DataManager(this);
    // initialize state with initial values
    this.#updateDataManger(initialState);
  }

  /** @type {Phaser.Data.DataManager} */
  get store() {
    return this.#store;
  }

  /**
   * @param {GlobalState} data
   * @returns {void}
   */
  #updateDataManger(data) {
    this.#store.set({
      [DATA_MANAGER_STORE_KEYS.PLAYER_POSITION]: data.player.position,
      [DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION]: data.player.direction,
      [DATA_MANAGER_STORE_KEYS.MAP1_WELCOME_KEY]: false,
      [DATA_MANAGER_STORE_KEYS.MAP2_WELCOME_KEY]: false,
      [DATA_MANAGER_STORE_KEYS.MAP3_WELCOME_KEY]: false,
      [DATA_MANAGER_STORE_KEYS.MAP4_WELCOME_KEY]: false,
      [DATA_MANAGER_STORE_KEYS.INVENTORY]: [],
    });
  }

  reset() {
    this.#updateDataManger(initialState);
    this.#store.set(DATA_MANAGER_STORE_KEYS.INVENTORY, []);  // 인벤토리도 초기화
  }
}

export const dataManager = new DataManager();
