import Phaser from "phaser";
import { SCENE_KEYS } from "./SceneKeys";
import { CHAR_ASSET_KEYS, DATA_ASSET_KEYS, END_ASSET_KEYS, INTRO_ASSET_KEYS, ITEM_ASSET_KEYS, MAP1_ASSET_KEYS, MAP2_ASSET_KEYS, MAP3_ASSET_KEYS, MAP4_ASSET_KEYS, START_ASSET_KEYS, TALE_ASSET_KEYS, UI_ASSET_KEYS } from "../assets/AssetKeys";
import { DataUtils } from "../utils/data-utils";

export class PreloadScene extends Phaser.Scene{
    constructor(){
        super({
            key: SCENE_KEYS.PRELOAD_SCENE,
        });
        console.log(SCENE_KEYS.PRELOAD_SCENE)
    }

    // init 이후에 실행, 먼저 asset 등 실행
    preload(){
      // 맵1-고향맵 assets
      this.load.image(INTRO_ASSET_KEYS.INTRO_BACKGROUND, '/assets/sky_bg.png');
      this.load.image(INTRO_ASSET_KEYS.INTRO_BASKET, '/assets/basket.png');
      
      // 맵1-고향맵 assets
      this.load.image(MAP1_ASSET_KEYS.FIRST_MAP, '/assets/maps/TMap1.png');
      this.load.tilemapTiledJSON(MAP1_ASSET_KEYS.FM_MAIN_LEVEL, '/assets/data/level1.json');
      this.load.image(MAP1_ASSET_KEYS.FM_COLLISION, '/assets/maps/collision.png');
      this.load.image(MAP1_ASSET_KEYS.FM_FOREQROUND, '/assets/maps/foreground1.png');
      this.load.image(MAP1_ASSET_KEYS.FM_ENCOUNTER, '/assets/maps/encounter.png');

      this.load.image(START_ASSET_KEYS.LOGO, '/assets/forest-logo.png');
      this.load.image(START_ASSET_KEYS.START_BTN, '/assets/ui/play_btn.png');
      this.load.image(START_ASSET_KEYS.MORE_BTN, '/assets/ui/more_btn.png');

      // 맵2-광장맵 assets
      this.load.image(MAP2_ASSET_KEYS.SECOND_MAP, '/assets/maps/TMap2.png');
      this.load.tilemapTiledJSON(MAP2_ASSET_KEYS.SM_MAIN_LEVEL, '/assets/data/map2.json');
      this.load.image(MAP2_ASSET_KEYS.SM_COLLISION, '/assets/maps/collision.png');
      this.load.image(MAP2_ASSET_KEYS.SM_FOREQROUND, '/assets/maps/foreground2.png');
      this.load.image(MAP2_ASSET_KEYS.SM_ENCOUNTER, '/assets/maps/encounter.png');
      // 맵3-숲맵 assets
      this.load.image(MAP3_ASSET_KEYS.THIRD_MAP, '/assets/maps/TMap3.png');
      this.load.tilemapTiledJSON(MAP3_ASSET_KEYS.TM_MAIN_LEVEL, '/assets/data/map3.json');
      this.load.image(MAP3_ASSET_KEYS.TM_COLLISION, '/assets/maps/collision.png');
      this.load.image(MAP3_ASSET_KEYS.TM_FOREQROUND, '/assets/maps/foreground3.png');
      this.load.image(MAP3_ASSET_KEYS.TM_ENCOUNTER, '/assets/maps/encounter.png');

      // 맵4-공항맵 assets
      this.load.image(MAP4_ASSET_KEYS.FOURTH_MAP, '/assets/maps/TMap4.png');
      this.load.tilemapTiledJSON(MAP4_ASSET_KEYS.FOM_MAIN_LEVEL, '/assets/data/map4.json');
      this.load.image(MAP4_ASSET_KEYS.FOM_COLLISION, '/assets/maps/collision.png');
      this.load.image(MAP4_ASSET_KEYS.FOM_ENCOUNTER, '/assets/maps/encounter.png');
      this.load.image(MAP4_ASSET_KEYS.TICKET, '/assets/ticket.png');

      // ui
      this.load.image(UI_ASSET_KEYS.DIALOG_PANEL, '/assets/ui/dialog_ui.png');
      this.load.image(UI_ASSET_KEYS.CURSOR, '/assets/ui/Cursor.png');
      this.load.image(UI_ASSET_KEYS.TALE_BOOK, '/assets/ui/map_ui.png');
      this.load.image(UI_ASSET_KEYS.ITEM_INVENTORY, '/assets/ui/item_inventory.png');
      this.load.image(UI_ASSET_KEYS.ITEM_SELECTION, '/assets/ui/item_select_ui.png');
      this.load.image(UI_ASSET_KEYS.ITEM_TALE, '/assets/ui/item_tale_ui.png');
      this.load.image(ITEM_ASSET_KEYS.ITEM_TITLE, '/assets/ui/ItemTitle.png');


      // item asset
      // map1
      this.load.image(ITEM_ASSET_KEYS.GARLIC, '/assets/items/garlic.png');
      this.load.image(ITEM_ASSET_KEYS.SSUK, '/assets/items/ssuk.png');
      this.load.image(ITEM_ASSET_KEYS.CRACKED_EGG, '/assets/items/cracked_egg.png');
      this.load.image(ITEM_ASSET_KEYS.GOLD_EGG, '/assets/items/gold_egg.png');
      this.load.image(ITEM_ASSET_KEYS.ROCK, '/assets/items/rock.png');
      this.load.image(ITEM_ASSET_KEYS.RICE, '/assets/items/rice.png');
      // map2
      this.load.image(ITEM_ASSET_KEYS.STAR, '/assets/items/star.png');
      this.load.image(ITEM_ASSET_KEYS.FEATHER, '/assets/items/feather.png');
      this.load.image(ITEM_ASSET_KEYS.GOLD_DOKKI, '/assets/items/gold-dokki.png');
      this.load.image(ITEM_ASSET_KEYS.SILVER_DOKKI, '/assets/items/silver-dokki.png');
      this.load.image(ITEM_ASSET_KEYS.LOTUS, '/assets/items/lotus.png');
      this.load.image(ITEM_ASSET_KEYS.WAVE, '/assets/items/wave.png');
      // map3
      this.load.image(ITEM_ASSET_KEYS.POTION, '/assets/items/potion.png');
      this.load.image(ITEM_ASSET_KEYS.FLOWER, '/assets/items/flower.png');
      this.load.image(ITEM_ASSET_KEYS.SKELETON, '/assets/items/skeleton.png');
      this.load.image(ITEM_ASSET_KEYS.FIRE, '/assets/items/fire.png');
      this.load.image(ITEM_ASSET_KEYS.ROPE, '/assets/items/rope.png');
      this.load.image(ITEM_ASSET_KEYS.DDUK, '/assets/items/riceCake.png');

      this.load.image(END_ASSET_KEYS.END_LOGO, '/assets/ending_logo.png');
      this.load.image(END_ASSET_KEYS.RESTART_BTN, '/assets/ui/restart.png');

      //설화이미지
      this.load.image(TALE_ASSET_KEYS.DANGGEUM_IMG, '/assets/tale/danggeum_main.png');
      this.load.image(TALE_ASSET_KEYS.PARK_IMG, '/assets/tale/park_main.png');
      this.load.image(TALE_ASSET_KEYS.DANGOON_IMG, '/assets/tale/dangoon_main.png');
      this.load.image(TALE_ASSET_KEYS.GOLDSILVER_IMG, '/assets/tale/goldSilver_main.png');
      this.load.image(TALE_ASSET_KEYS.KYUNOO_IMG, '/assets/tale/kyunoo_main.png');
      this.load.image(TALE_ASSET_KEYS.SHIMCHEONG_IMG, '/assets/tale/shimcheong_main.png');
      this.load.image(TALE_ASSET_KEYS.SUNMOON_IMG, '/assets/tale/sunmoon_main.png');
      this.load.image(TALE_ASSET_KEYS.KANGRIM_IMG, '/assets/tale/kangrim_main.png');
      this.load.image(TALE_ASSET_KEYS.BARI_IMG, '/assets/tale/bari_main.png');

      // 캐릭터 assets
      this.load.spritesheet(CHAR_ASSET_KEYS.PLAYER, '/assets/char/main_char.png', {
        frameWidth: 16,
        frameHeight: 32,
      });
      // npc assets
      this.load.spritesheet(CHAR_ASSET_KEYS.NPC, '/assets/char/spr_anna.png', {
        frameWidth: 16,
        frameHeight: 32,
      });
      // npc assets
      this.load.spritesheet(CHAR_ASSET_KEYS.DANGGEUM, '/assets/char/danggeum.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
      this.load.spritesheet(CHAR_ASSET_KEYS.DANGOON, '/assets/char/dangoon.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
      this.load.spritesheet(CHAR_ASSET_KEYS.BARK, '/assets/char/bark.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
      // m2
      this.load.spritesheet(CHAR_ASSET_KEYS.SHIMCHEONG, '/assets/char/shimcheong.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
      this.load.spritesheet(CHAR_ASSET_KEYS.KYUNOO, '/assets/char/kyunoo.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
      this.load.spritesheet(CHAR_ASSET_KEYS.GOLDSILVER, '/assets/char/goldSilver.png', {
        frameWidth: 32,
        frameHeight: 32,
      });

      this.load.spritesheet(CHAR_ASSET_KEYS.BARI, '/assets/char/bari.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
      this.load.spritesheet(CHAR_ASSET_KEYS.MOON, '/assets/char/moon.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
      this.load.spritesheet(CHAR_ASSET_KEYS.SUN, '/assets/char/sun.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
      this.load.spritesheet(CHAR_ASSET_KEYS.KANGRIM, '/assets/char/kangrim.png', {
        frameWidth: 32,
        frameHeight: 32,
      });

      this.load.json(DATA_ASSET_KEYS.ANIMATIONS, '/assets/data/animations.json');
    }

    // 배경 등 형성하는 부분
    create(){
      console.log(`[${PreloadScene.name}:create] invoked`);
      this.#createAnimations();
      this.scene.start(SCENE_KEYS.START_SCENE);
    }

    #createAnimations(){
      const animations = DataUtils.getAnimations(this);
      animations.forEach((animation) => {
        const frames = animation.frames 
        ? this.anims.generateFrameNumbers(animation.assetKey, {frames: animation.frames})
        : this.anims.generateFrameNumbers(animation.assetKey); 
        this.anims.create({
          key: animation.key,
          frames: frames,
          frameRate: animation.frameRate,
          repeat: animation.repeat,
          delay: animation.delay,
          yoyo: animation.yoyo,
        })
      });
    }
}