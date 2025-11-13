import Phaser from 'phaser';
/**
 * @typedef BattleMonsterConfig
 * @type {Object}
 * @property {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
 * @property {number} [scaleHealthBarBackgroundImageByY=1] scales the health bar background vertically by the specified value, defaults to 1
 * @property {boolean} [skipBattleAnimations=false] used to skip all animations tied to the monster during battle
 */

/**
 * @typedef Coordinate
 * @type {Object}
 * @property {number} x the position of this coordinate
 * @property {number} y the position of this coordinate
 */


/**
 * @typedef Animation
 * @type {object}
 * @property {string} key
 * @property {number[]} frames
 * @property {number} frameRate
 * @property {number} repeat
 * @property {number} delay
 * @property {boolean} yoyo
 * @property {string} assetKey
 */