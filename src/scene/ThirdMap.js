import { MAP3_ASSET_KEYS, UI_ASSET_KEYS } from "../assets/AssetKeys";
import { DIRECTION } from "../common/direction";
import { TILE_SIZE, TILED_COLLISION_LAYER_ALPHA } from "../config";
import { Player } from "../Map/Characters/Player";
import { DialogUi } from "../Map/dialog-ui.js";
import { Controls } from "../utils/controls";
import { DATA_MANAGER_STORE_KEYS, dataManager } from "../utils/data-manager";
import { getTargetPositionFromGameObject } from "../utils/grid-utils";
import { MAP3_INTRO_TEXT, SAMPLE_TEXT } from "../utils/text-utils";
import { SCENE_KEYS } from "./SceneKeys";
import { NPC } from "../Map/Characters/npc";
import { TALE_INFO } from "../../public/assets/data/tale-info";

/**
 * @typedef TiledObjectProperty
 * @type {object}
 * @property {string} name
 * @property {string} type
 * @property {any} value
 */

const TILED_SIGN_PROPERTY = Object.freeze({
  MESSAGE: 'message',
});

const CUSTOM_TILED_TYPES = Object.freeze({
  NPC: 'npc',
  NPC_PATH: 'npc_path',
});

const TILED_NPC_PROPERTY = Object.freeze({
  IS_SPAWN_POINT: 'is_spawn_point',
  MOVEMENT_PATTERN: 'movement_pattern',
  MESSAGES: 'messages',
  FRAME: 'frame',
  SPRITE_KEY: 'spriteKey',      // ← 추가
});

let lastCollected;


export class ThirdMap extends Phaser.Scene {
    /** @type {Player} */
    #player;
    /** @type {Controls} */
    #controls;
    /** @type {Phaser.Tilemaps.TilemapLayer} */
    #encounterLayer;
    /** @type {Phaser.Tilemaps.ObjectLayer} */
    #signLayer;
    /** @type {DialogUi} */
    #dialogUi;
    /** @type {NPC[]} */
    #npcs;
    /** @type {Phaser.GameObjects.Image[]} */
    #inventoryIcons = []; 

    /** @type {Phaser.Geom.Rectangle[]} */
    #exitAreas = [];             // 출구 영역
    _canExit = false;      // 이 맵에서 아이템 수집 완료했는지
    _isTransitioning = false; // 씬 전환 중인지(중복 방지)

    /** @type {Phaser.Geom.Rectangle[]} */
    #entryAreas = [];             // 출구 영역
    _canEntry = false;      // 이 맵에서 아이템 수집 완료했는지

    constructor(){
      super({
          key: SCENE_KEYS.THIRD_MAP
      })
    }

    _shouldShowIntro = false; // ← 전달받은 값 저장


    // ▶ StartScene → scene.start(..., { intro:true }) 로 받은 데이터
    init(data) {
        this._shouldShowIntro = !!data?.intro;
        this._initialPosition = data?.spawnPosition || null;
        this._initialDirection = data?.spawnDirection || DIRECTION.UP;
    }
    
    // 배경 등 형성하는 부분
    create(){
        console.log(`[${ThirdMap.name}:create] invoked`);

        // map json info
        const map = this.make.tilemap({ key: MAP3_ASSET_KEYS.TM_MAIN_LEVEL });
        const collisionTiles = map.addTilesetImage('collision', MAP3_ASSET_KEYS.TM_COLLISION);
        if (!collisionTiles){
            console.log(`[${ThirdMap.name}:create] collision tileset error`);
            return;
        }
        const collisionLayer = map.createLayer('Collision', collisionTiles, 0, 0);
        if (!collisionLayer){
            console.log(`[${ThirdMap.name}:create] collision layer error`);
            return;
        }
        collisionLayer.setAlpha(TILED_COLLISION_LAYER_ALPHA).setDepth(2).setScale(4);

        // console.log('Collision Layer successfully loaded at X:', collisionLayer.x, 'Y:', collisionLayer.y);
        // create interactive layer

        // this.#signLayer = map.getObjectLayer('SIGNS');
        // if (!this.#signLayer) {
        //   console.log(`[${FirstMap.name}:create] encountered error while creating sign layer using data from tiled`);
        //   return;
        // }

        // create collision layer for encounters
        // const encounterTiles = map.addTilesetImage('encounter', MAP1_ASSET_KEYS.FM_ENCOUNTER);
        // if (!encounterTiles) {
        //   console.log(`[${FirstMap.name}:create] encountered error while creating encounter tiles from tiled`);
        //   return;
        // }
        // this.#encounterLayer = map.createLayer('NPC', encounterTiles, 0, 0);
        // if (!this.#encounterLayer) {
        //   console.log(`[${FirstMap.name}:create] encountered error while creating encounter layer using data from tiled`);
        //   return;
        // }
        // this.#encounterLayer.setAlpha(TILED_COLLISION_LAYER_ALPHA).setDepth(2).setScale(4);


        this.add.image(0, 0, MAP3_ASSET_KEYS.THIRD_MAP).setOrigin(0).setScale(4);

        // create npcs
        this.#createNPCs(map);
        this.#createExitAreas(map);
        this.#createEntryAreas(map);

        // 기본 시작점 (Tiled에서 잡은 SecondMap 입구 근처 좌표로 맞춰줘)
        const defaultSpawnPos = { x: 18 * TILE_SIZE, y: 20 * TILE_SIZE };
        const spawnPos = this._initialPosition || defaultSpawnPos;
        const spawnDir = this._initialDirection || DIRECTION.DOWN;

        // 전역 스토어도 새 맵 기준으로 덮어쓰기
        dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, spawnPos);
        dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION, spawnDir);

        // create player and have camera focus on the player
        this.#player = new Player({
        scene: this,
        position: spawnPos,
        direction: spawnDir,
        collisionLayer: collisionLayer,
        spriteGridMovementFinishedCallback: () => {
            this.#handlePlayerMovementUpdate();
        },
        });


        this.add.image(0,0,MAP3_ASSET_KEYS.TM_FOREQROUND).setOrigin(1).setScale(4);
        this.add.image(0,0,UI_ASSET_KEYS.ITEM_INVENTORY).setOrigin(0).setScale(0.5);

        // 🔽 여기부터 추가
        const inv = dataManager.store.get(DATA_MANAGER_STORE_KEYS.INVENTORY) || [];
        // 이 맵의 taleId가 1이니까, sourceTaleId === 1인 애가 이 마을 아이템
        const MAP3_TALE_ID = 2;
        const alreadyCollected = inv.find(i => i.sourceTaleId === MAP3_TALE_ID);

        if (alreadyCollected) {
          lastCollected = alreadyCollected;
          this._canExit = true;
        }

        // 인벤토리 UI 그리기 (이미 모은 아이템들 전부)
        this.#renderInventoryUI();
        // 🔼 여기까지

        this.#controls = new Controls(this);
        this.#dialogUi = new DialogUi(this, 1280);
        this.cameras.main.fadeIn(1000, 0, 0, 0);
        
        const shown = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MAP3_WELCOME_KEY);

        if (this._shouldShowIntro || !shown) {
            // 살짝 딜레이를 주면 페이드인 뒤 자연스럽게 뜸
            this.time.delayedCall(1100, () => this.#dialogUi.showDialogModal(MAP3_INTRO_TEXT));
            dataManager.store.set(DATA_MANAGER_STORE_KEYS.MAP3_WELCOME_KEY, true);
        }

        this.events.on('resume', (sys, data) => {
          lastCollected = data?.collectedItem;
          if (!lastCollected) return;
          // console.log(`${lastCollected.name} 수집햇나????`) 

          this._canExit = true;
        
          this.time.delayedCall(300, () => {
            // console.log(`${lastCollected.name} 수집햇더요 ㅎ`)
            this.#dialogUi.showDialogModal([`설화를 통해 ${lastCollected.name}에 대해 배웠다! 그럼 다음 마을로 가볼까?`]);
            console.log(lastCollected);
            console.log(lastCollected. name);
            this.add.image(2392,519,lastCollected.img).setOrigin(0).setScale(4);
          });
        });

    }

    /**
   * @param {DOMHighResTimeStamp} time
   * @returns {void}
   */
  update(time) {
    if (!this.#controls || !this.#player) {
      // this.#player.update(time);
      return;
    } 

      // 1) 이동만 차단
    const selectedDirection = this.#controls.getDirectionKeyPressedDown();
    if (!this.#dialogUi?.shouldBlockMovement?.() && selectedDirection !== DIRECTION.NONE) {
      this.#player.moveCharacter(selectedDirection);
    }

    // 2) 스페이스는 기존대로 (대화 넘기기/인터랙션)
    if (this.#controls.wasSpaceKeyPressed() && !this.#player.isMoving) {
      this.#handlePlayerInteraction();
    }

    this.#player.update(time);

    this.#npcs.forEach((npc) => {
      npc.update(time);
    });
  }

  #handlePlayerInteraction() {

    // get players current direction and check 1 tile over in that direction to see if there is an object that can be interacted with
    const { x, y } = this.#player.sprite;
    console.log(x,y);
    const targetPosition = getTargetPositionFromGameObject({ x, y }, this.#player.direction);

    if (this.#dialogUi.isAnimationPlaying) {
      console.log("스페이스바눌림");
      this.#dialogUi.showFullTextImmediately();
      return;
    }

    if (this.#dialogUi.isVisible && !this.#dialogUi.moreMessagesToShow) {
      this.#dialogUi.hideDialogModal();
      return;
    }

    if (this.#dialogUi.isVisible && this.#dialogUi.moreMessagesToShow) {
      this.#dialogUi.showNextMessage();
      return;
    }

    // 4. 애니메이션이 완료되었고, 다음 메시지가 남아있을 때: 다음 메시지 로드
    if (this.#dialogUi.moreMessagesToShow) {
      this.#dialogUi.showNextMessage();
      return;
  }

    const EPS = TILE_SIZE * 1.2; // 앞칸 허용 반경 (원하면 0.5~1.0 사이로 조정)
    const nearbyNpc = this.#npcs.find((npc) =>
      Phaser.Math.Distance.Between(npc.sprite.x, npc.sprite.y, targetPosition.x, targetPosition.y) <= EPS
    );

    console.log('target', targetPosition);
        this.#npcs.forEach((n, i) => {
          console.log(`npc[${i}]`, n.sprite.x, n.sprite.y);
        });

    if (nearbyNpc) {
      console.log('talking to npc')
      if (nearbyNpc.facePlayer) nearbyNpc.facePlayer(this.#player.direction);

      if (lastCollected){
        this.#dialogUi.showDialogModal(['마을당 이야기는 하나만 수집할 수 있단다.\n아쉬워도 다음 단계로 가봐야지!']);
      } else{
        this.#dialogUi.showDialogModal(nearbyNpc.messages, {
          onComplete: () => {
            // 대사가 완전히 끝나고 모달이 닫힌 뒤에, 선택지 띄우기
            const npcMsgs = (Array.isArray(nearbyNpc.messages) && nearbyNpc.messages.length)
              ? nearbyNpc.messages
              : [SAMPLE_TEXT];
      
            this.#dialogUi.showChoiceList({
              prompt: '이야기를 들어볼까?',  // 이미 대사를 했으니 추가 질문 문구 없이 바로 리스트만
              options: [
                {
                  label: '예',
                  onSelect: () => {
                    const npcTale = this.#getNpcTaleData(nearbyNpc);
                    this.#dialogUi.hideDialogModal();
                    this.scene.pause(SCENE_KEYS.THIRD_MAP);
    
                    // 팝업 Scene 실행 (필요한 정보만 전달)
                    this.scene.launch(SCENE_KEYS.TALE_POPUP, {
                      mapId: 2,
                      taleId: npcTale.id,
                      returnSceneKey: SCENE_KEYS.THIRD_MAP,
                    });
                  }
                },
                {
                  label: '아니오',
                  onSelect: () => {
                    this.#dialogUi.showDialogModal(['아쉽네요.. 기회가 된다면 다음에 들려드릴게요!']);
                  }
                }
              ],
            });
          }
        });
      }

    

      return;

      // nearbyNpc.facePlayer(this.#player.direction);
      // nearbyNpc.isTalkingToPlayer = true;
      // this.#npcPlayerIsInteractingWith = nearbyNpc;
      // this.#dialogUi.showDialogModal(nearbyNpc.messages);
      // return;
    }


    /////// sign 체크
    if (!this.#signLayer || !Array.isArray(this.#signLayer.objects)) {
      // sign 레이어 자체가 없으면 그냥 아무 일도 하지 않고 반환
      // console.warn('Sign object layer is not defined or has no objects');
      return;
    }

    const nearbySign = this.#signLayer.objects.find((object) => {
      if (object.x == null || object.y == null) {
        return false;
      }

      return object.x === targetPosition.x && object.y - TILE_SIZE === targetPosition.y;
    });

    if (nearbySign) {
      /** @type {TiledObjectProperty[]} */
      const props = nearbySign.properties;
      /** @type {string} */
      const msg = props.find((prop) => prop.name === 'message')?.value;

      const usePlaceholderText = this.#player.direction !== DIRECTION.UP;
      let textToShow = SAMPLE_TEXT;
      if (!usePlaceholderText) {
        textToShow = msg || SAMPLE_TEXT;
      }
      this.#dialogUi.showDialogModal([textToShow]);
      return;
    }


  }

  #getNpcTaleData(npc) {
    // 1️⃣ NPC가 #npcs 배열 중 몇 번째인지 찾기
    const npcIndex = this.#npcs.indexOf(npc);
  
    // 2️⃣ 해당 index의 설화 데이터 가져오기
    const taleData = TALE_INFO[2][npcIndex];
    console.log(`TALE_INFO에 ${npcIndex}번째 데이터가 있다.`);

    if (npcIndex < 0 || !TALE_INFO[2][npcIndex]) return null;
  
    // 3️⃣ 안전 처리
    if (!taleData) {
      console.warn(`TALE_INFO에 ${npcIndex}번째 데이터가 없습니다.`);
      return {
        id: "unknown",
        title: "미등록 설화",
        story: "이 NPC는 아직 이야기가 준비되지 않았어요.",
        items: [],
      };
    }
  
    return taleData;
  }
  
  
  

  /**
   * @returns {void}
   */
  #handlePlayerMovementUpdate() {
    // update player position on global data store
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, {
      x: this.#player.sprite.x,
      y: this.#player.sprite.y,
    });
    // update player direction on global data store
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION, this.#player.direction);

    // if (!this.#encounterLayer) {
    //   return;
    // }

    // ✅ 1) 출구 체크는 항상 수행
    this.#checkExit();
    this.#checkEntry();

    // const tile = this.#encounterLayer.getTileAtWorldXY(
    //     this.#player.sprite.x,
    //     this.#player.sprite.y,
    //     true,          // nonNull
    //   );
    
    //   if (!tile) return;   

    //   const isInEncounterZone =
    //   this.#encounterLayer.getTileAtWorldXY(this.#player.sprite.x, this.#player.sprite.y, true).index !== -1;

    // if (!isInEncounterZone) {
    //   return;
    // }
  }

  #isPlayerInputLocked() {
    return this.#dialogUi.isVisible;
  }

  /**
   * @param {Phaser.Tilemaps.Tilemap} map
   * @returns {void}
   */
  #createNPCs(map) {
    this.#npcs = [];

    const allObjectLayerNames = map.getObjectLayerNames();
    console.log("DEBUG: All Tiled Object Layers found:", allObjectLayerNames);

    // 'NPC'를 포함하는 모든 Object Layer 이름을 가져옵니다.
    const npcLayers = allObjectLayerNames.filter((layerName) => layerName.includes('NPC')); 

    // 2. 'NPC' 필터링 후 남은 레이어 확인
    console.log("DEBUG: Matching NPC Object Layers:", npcLayers);

    npcLayers.forEach((layerName) => {
      const layer = map.getObjectLayer(layerName);

      // 3. 현재 레이어에 포함된 총 객체 수 확인
      console.log(`DEBUG: Processing layer "${layerName}". Total objects in layer: ${layer.objects.length}`);
            
      const layerProps = Array.isArray(layer.properties) ? layer.properties : [];
      const getLayerProp = (name) => layerProps.find(p => p.name === name)?.value;

      const npcObjects = layer.objects.filter((obj) => {
        const type = obj.type ?? '';
        return type === CUSTOM_TILED_TYPES.NPC || type === '';
      });

      npcObjects.forEach((npcObject) => {
        
        if (npcObject.x === undefined || npcObject.y === undefined) {
            console.error(`NPC object missing position data: ${npcObject.name}`);
            return;
        }

        const props = Array.isArray(npcObject.properties) ? npcObject.properties : [];
        const getObjProp = (name) => props.find(p => p.name === name)?.value;

        const npcFrame = getObjProp(TILED_NPC_PROPERTY.FRAME) ?? getLayerProp(TILED_NPC_PROPERTY.FRAME) ?? '0';
        const rawMsg  = (getObjProp(TILED_NPC_PROPERTY.MESSAGES) ?? getLayerProp(TILED_NPC_PROPERTY.MESSAGES) ?? '').toString();
        const npcSpriteKey = getObjProp(TILED_NPC_PROPERTY.SPRITE_KEY) ?? getLayerProp(TILED_NPC_PROPERTY.SPRITE_KEY) ?? null;
        null; // 없으면 NPC 쪽에서 기본값 씀

        // // Tiled 속성에서 'frame' 값을 가져옵니다.
        // /** @type {string} */
        // const npcFrame =
        //   /** @type {TiledObjectProperty[]} */ (props).find(
        //     (property) => property.name === TILED_NPC_PROPERTY.FRAME
        //   )?.value || '0';

        // /** @type {string} */
        // const npcMessagesString =
        //   /** @type {TiledObjectProperty[]} */ (props).find(
        //     (property) => property.name === TILED_NPC_PROPERTY.MESSAGES
        //   )?.value || '';

        let npcMessages = [];
        if (rawMsg.includes('::')) npcMessages = rawMsg.split('::');
        else if (/\n\s*\n/.test(rawMsg)) npcMessages = rawMsg.split(/\n\s*\n/);
        else if (rawMsg.trim()) npcMessages = [rawMsg];
        npcMessages = npcMessages.map(s => s.trim()).filter(Boolean);

        const MAP_SCALE = 4;
        const SRC_TILE = TILE_SIZE / MAP_SCALE;

        const posX = npcObject.x * MAP_SCALE + 16;
        const posY = (npcObject.y - SRC_TILE) * MAP_SCALE + 8;

        // Tiled Object Layer의 y 좌표는 객체의 바닥을 기준으로 하므로, TILE_SIZE만큼 빼서 중앙 위치로 조정합니다.
        const npc = new NPC({
            scene: this,
            position: { x: posX, y: posY },
            direction: DIRECTION.DOWN,
            frame: parseInt(npcFrame, 10)|| 0,
            messages: npcMessages,
            assetKey: npcSpriteKey,  // ← 추가!
        });

        if (npc.sprite) {
          npc.sprite.setDepth(0);
      } else {
          // NPC 클래스 내부에서 Sprite가 즉시 생성되지 않았을 경우를 대비한 경고
          console.warn(`NPC instance for ${npcObject.name} does not have a 'sprite' property. Check NPC class implementation.`);
      }

        this.#npcs.push(npc);
        console.log(`Created NPC at x:${npcObject.x}, y:${npcObject.y - TILE_SIZE} with frame ${npc}`);
    });
});

if (this.#npcs.length === 0) {
    console.warn("No NPCs were created. Check Tiled map Object Layers and object 'type' property.");
}

    //   /** @type {string} */
    //   const npcFrame =
    //     /** @type {TiledObjectProperty[]} */ (npcObject.properties).find(
    //       (property) => property.name === TILED_NPC_PROPERTY.FRAME
    //     )?.value || '0';

    //   // In Tiled, the x value is how far the object starts from the left, and the y is the bottom of tiled object that is being added
    //   const npc = new NPC({
    //     scene: this,
    //     position: { x: npcObject.x, y: npcObject.y - TILE_SIZE },
    //     direction: DIRECTION.DOWN,
    //     frame: parseInt(npcFrame, 10),
    //   });
    //   this.#npcs.push(npc);

  }

  /**
   * EXIT 오브젝트 레이어의 모든 object를 출구 영역으로 사용
   * @param {Phaser.Tilemaps.Tilemap} map
   */
  #createExitAreas(map) {
    const exitLayer = map.getObjectLayer('exit');
    if (!exitLayer) {
      console.warn('[ThirdMap] EXIT object layer 없음');
      return;
    }

    const MAP_SCALE = 4;

    // EXIT 레이어에 있는 모든 object를 순회
    exitLayer.objects.forEach((obj) => {
      if (obj.x == null || obj.y == null) return;

      // Tiled에서 tile object(gid가 있는 애들)는
      // x = 왼쪽, y = "바닥" 기준 + height 값 있음
      const width = obj.width || 16;
      const height = obj.height || 16;

      const worldX = obj.x * MAP_SCALE;
      const worldY = (obj.y - height) * MAP_SCALE;  // 바닥 기준이니까 height만큼 위로
      const worldW = width * MAP_SCALE;
      const worldH = height * MAP_SCALE;

      const rect = new Phaser.Geom.Rectangle(worldX, worldY, worldW, worldH);
      this.#exitAreas.push(rect);
    });

    if (this.#exitAreas.length === 0) {
      console.warn('[Third] EXIT 오브젝트가 하나도 없음');
    }

    // 디버그용: 출구 영역 시각화하고 싶으면 주석 풀기
    // const g = this.add.graphics().setDepth(1000);
    // g.lineStyle(2, 0xff0000);
    // this.#exitAreas.forEach(r => g.strokeRectShape(r));
  }

  #checkExit() {
    if (!this.#exitAreas.length || !this.#player) return;
  
    const { x, y } = this.#player.sprite;
  
    // 플레이어가 어느 출구 영역 안에라도 들어가면 true
    const isInExit = this.#exitAreas.some(rect =>
      Phaser.Geom.Rectangle.Contains(rect, x, y)
    );
  
    if (!isInExit) return;
    if (this._isTransitioning) return;
  
    // 아직 아이템을 안 먹었다면, 나가지 못하게 막고 안내만
    if (!this._canExit) {
      this.#dialogUi.showDialogModal([
        '아직 떠날 때가 아닌 것 같다.'
      ]);
      return;
    }
  
    // ✅ 아이템도 있고, 출구 타일 위에 있으면 다음 맵으로 전환
    this.#goToNextMap();
  }
  

  #goToNextMap() {
    this._isTransitioning = true;

    this.cameras.main.fadeOut(800, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
        // SecondMap에서 시작할 위치 (월드 좌표 기준)
        const spawnPosition = {
          x: 23 * TILE_SIZE, // 예시: 타일 32,1짜리 위치 같은 식으로 맞춰줘
          y: 19 * TILE_SIZE,
        };
    
        this.scene.start(SCENE_KEYS.FOURTH_MAP, {
          intro: true,
          spawnPosition,
          spawnDirection: DIRECTION.UP, // 혹은 LEFT/UP/RIGHT
        });
      });
  }

  // 인벤토리 읽기
  #getInventory() {
    return dataManager.store.get(DATA_MANAGER_STORE_KEYS.INVENTORY) || [];
  }

  // 인벤토리 UI 그리기
  #renderInventoryUI() {
    // 기존 아이콘들 싹 제거
    this.#inventoryIcons.forEach(icon => icon.destroy());
    this.#inventoryIcons = [];

    const inventory = this.#getInventory();
    console.log(inventory);
    if (!inventory.length) return;

    // 아이콘 시작 위치 + 간격 (숫자는 지금 쓰고 있던 좌표 기준으로 대충 맞춰둔 값)
    const startX = 2392;
    const startY = 127;
    const spacing = 196;

    inventory.forEach((item, idx) => {
      if (!item.img) return;

      const icon = this.add
        .image(startX, startY+ spacing * idx, item.img)
        .setOrigin(0)
        .setScale(4);

      this.#inventoryIcons.push(icon);
    });
  }

  
  /**
   * EXIT 오브젝트 레이어의 모든 object를 출구 영역으로 사용
   * @param {Phaser.Tilemaps.Tilemap} map
   */
  #createEntryAreas(map) {
    const entryLayer = map.getObjectLayer('entry');
    if (!entryLayer) {
      console.warn('[FirstMap] ENTRY object layer 없음');
      return;
    }

    const MAP_SCALE = 4;

    // EXIT 레이어에 있는 모든 object를 순회
    entryLayer.objects.forEach((obj) => {
      if (obj.x == null || obj.y == null) return;

      // Tiled에서 tile object(gid가 있는 애들)는
      // x = 왼쪽, y = "바닥" 기준 + height 값 있음
      const width = obj.width || 16;
      const height = obj.height || 16;

      const worldX = obj.x * MAP_SCALE;
      const worldY = (obj.y - height) * MAP_SCALE;  // 바닥 기준이니까 height만큼 위로
      const worldW = width * MAP_SCALE;
      const worldH = height * MAP_SCALE;

      const rect = new Phaser.Geom.Rectangle(worldX, worldY, worldW, worldH);
      this.#entryAreas.push(rect);
    });

    if (this.#entryAreas.length === 0) {
      console.warn('[First] ENTRY 오브젝트가 하나도 없음');
    }

    // 디버그용: 출구 영역 시각화하고 싶으면 주석 풀기
    // const g = this.add.graphics().setDepth(1000);
    // g.lineStyle(2, 0xff0000);
    // this.#exitAreas.forEach(r => g.strokeRectShape(r));
  }

  #checkEntry() {
    if (!this.#entryAreas.length || !this.#player) return;
  
    const { x, y } = this.#player.sprite;
  
    // 플레이어가 어느 출구 영역 안에라도 들어가면 true
    const isInEntry = this.#entryAreas.some(rect =>
      Phaser.Geom.Rectangle.Contains(rect, x, y)
    );
  
    if (!isInEntry) return;
    if (this._isTransitioning) return;
    
    this.#dialogUi.showDialogModal([
      '한 번 떠나온 곳으로는 다시 돌아갈 수 없어요.'
    ]);
    return;
  }

};