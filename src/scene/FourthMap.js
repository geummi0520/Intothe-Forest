import { MAP4_ASSET_KEYS, UI_ASSET_KEYS } from "../assets/AssetKeys";
import { DIRECTION } from "../common/direction";
import { TILE_SIZE, TILED_COLLISION_LAYER_ALPHA } from "../config";
import { Player } from "../Map/Characters/Player";
import { DialogUi } from "../Map/dialog-ui.js";
import { Controls } from "../utils/controls";
import { DATA_MANAGER_STORE_KEYS, dataManager } from "../utils/data-manager";
import { getTargetPositionFromGameObject } from "../utils/grid-utils";
import { MAP4_INTRO_TEXT, SAMPLE_TEXT } from "../utils/text-utils";
import { SCENE_KEYS } from "./SceneKeys";
import { NPC } from "../Map/Characters/npc";
import { NONE } from "phaser";

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
  SPRITE_KEY: 'null',      // ← 추가
});


export class FourthMap extends Phaser.Scene {
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

    #interactionCooldown = 0; // [새로 추가] 상호작용 쿨다운 시간

    /** @type {Phaser.Geom.Rectangle[]} */
    #exitAreas = [];             // 출구 영역
    _canExit = false;      // 이 맵에서 아이템 수집 완료했는지
    _isTransitioning = false; // 씬 전환 중인지(중복 방지)

    /** @type {Phaser.Geom.Rectangle[]} */
    #entryAreas = [];             // 출구 영역
    _canEntry = false;      // 이 맵에서 아이템 수집 완료했는지

    constructor(){
      super({
          key: SCENE_KEYS.FOURTH_MAP
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
        console.log(`[${FourthMap.name}:create] invoked`);

        // map json info
        const map = this.make.tilemap({ key: MAP4_ASSET_KEYS.FOM_MAIN_LEVEL });
        const collisionTiles = map.addTilesetImage('collision', MAP4_ASSET_KEYS.FOM_COLLISION);
        if (!collisionTiles){
            console.log(`[${FourthMap.name}:create] collision tileset error`);
            return;
        }
        const collisionLayer = map.createLayer('Collision', collisionTiles, 0, 0);
        if (!collisionLayer){
            console.log(`[${FourthMap.name}:create] collision layer error`);
            return;
        }
        collisionLayer.setOrigin(0).setAlpha(1).setDepth(2).setScale(4);

        this.add.image(0, 0, MAP4_ASSET_KEYS.FOURTH_MAP).setOrigin(0).setScale(4);

        // create npcs
        this.#createNPCs(map);
        this.#createEntryAreas(map);

        // 기본 시작점 (Tiled에서 잡은 SecondMap 입구 근처 좌표로 맞춰줘)
        const defaultSpawnPos = { x: 23 * TILE_SIZE, y: 19 * TILE_SIZE };
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

        this.#controls = new Controls(this);
        this.#dialogUi = new DialogUi(this, 1280);
        this.cameras.main.fadeIn(1000, 0, 0, 0);
        
        const shown = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MAP4_WELCOME_KEY);

        if (this._shouldShowIntro || !shown) {
            // 살짝 딜레이를 주면 페이드인 뒤 자연스럽게 뜸
            this.time.delayedCall(1100, () => this.#dialogUi.showDialogModal(MAP4_INTRO_TEXT));
            dataManager.store.set(DATA_MANAGER_STORE_KEYS.MAP4_WELCOME_KEY, true);
        }    

    }

    /**
   * @param {DOMHighResTimeStamp} time
   * @param {number} delta // ⬅️ delta 인수를 추가합니다.
   * @returns {void}
   */
  update(time, delta) {
    if (this.#interactionCooldown > 0){
      this.#interactionCooldown -= delta;
    }
    if (!this.#controls || !this.#player) {
      // this.#player.update(time);
      return;
    } 

      // 1) 이동만 차단
    const selectedDirection = this.#controls.getDirectionKeyPressedDown();
    if (!this.#dialogUi?.shouldBlockMovement?.() && selectedDirection !== DIRECTION.NONE) {
      this.#player.moveCharacter(selectedDirection);
    }

    if (this.#controls.wasSpaceKeyPressed() && !this.#player.isMoving && this.#interactionCooldown <= 0) { 
      // 쿨다운을 설정하여 연타(Mashing) 방지 (200ms)
      this.#interactionCooldown = 300;
      this.#handlePlayerInteraction();
    }

    // 2) 스페이스는 기존대로 (대화 넘기기/인터랙션)
    if (this.#controls.wasSpaceKeyPressed() && !this.#player.isMoving) {
      this.#handlePlayerInteraction();
    }

    this.#player.update(time);

    this.#npcs.forEach((npc) => {
      npc.update(time);
    });

        // update() 끝부분에 추가 (모달이 없고 플레이어가 안 움직일 때)
    // if (!this.#dialogUi.isVisible && !this.#player.isMoving) {
    //   const TALK_RANGE = TILE_SIZE * 0.75;
    //   const near = this.#npcs.find(n =>
    //     Phaser.Math.Distance.Between(n.sprite.x, n.sprite.y, this.#player.sprite.x, this.#player.sprite.y) <= TALK_RANGE
    //   );
    //   if (near) {
    //     if (near.facePlayer) near.facePlayer(this.#player.direction);
    //     this.#dialogUi.showDialogModal(near.messages?.length ? near.messages : [SAMPLE_TEXT]);
    //   }
    // }

  }

  #handlePlayerInteraction() {

    // get players current direction and check 1 tile over in that direction to see if there is an object that can be interacted with
    const { x, y } = this.#player.sprite;
    console.log(x,y);
    const targetPosition = getTargetPositionFromGameObject({ x, y }, this.#player.direction);

    // 1. 타이핑 애니메이션 중일 때: 건너뛰기
    if (this.#dialogUi.isAnimationPlaying) {
      this.#dialogUi.showFullTextImmediately();
      return;
    }

    // 2. 애니메이션 완료, 다음 메시지가 없고, 모달이 보일 때: 모달 닫기
    if (this.#dialogUi.isVisible && !this.#dialogUi.moreMessagesToShow) {
      this.#dialogUi.hideDialogModal();
      return;
    }

    // 3. 애니메이션 완료, 다음 메시지가 있을 때: 다음 메시지 출력
    if (this.#dialogUi.isVisible && this.#dialogUi.moreMessagesToShow) {
      this.#dialogUi.showNextMessage();
      return;
    }

    // // 4. 애니메이션이 완료되었고, 다음 메시지가 남아있을 때: 다음 메시지 로드
    // if (!this.#dialogUi.isAnimationPlaying && this.#dialogUi.moreMessagesToShow) {
    //   this.#dialogUi.showNextMessage();
    //   return;
    // }

    this.#checkEntry();

    const EPS = TILE_SIZE * 1.5; // 앞칸 허용 반경 (원하면 0.5~1.0 사이로 조정)
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

        this.#dialogUi.showDialogModal(nearbyNpc.messages, {
          onComplete: () => {
            // 대사가 완전히 끝나고 모달이 닫힌 뒤에, 선택지 띄우기
            const npcMsgs = (Array.isArray(nearbyNpc.messages) && nearbyNpc.messages.length)
              ? nearbyNpc.messages
              : [SAMPLE_TEXT];
      
            this.#dialogUi.showChoiceList({
              prompt: '즐거운 여정 되셨나요?',  // 이미 대사를 했으니 추가 질문 문구 없이 바로 리스트만
              options: [
                {
                  label: '예',
                  onSelect: () => {
                    this.time.delayedCall(100, () => {
                      this.#dialogUi.showDialogModal(['즐거운 삶이기도 하셨나요?', '탑승권 준비해드리겠습니다. 다음 여정도 즐거운 삶 되시길 바랍니다.'], {
                          onComplete: () => {
                              this._showTicketSequence();
                          }
                      });
                    });
                  }
                },
                {
                  label: '아니오',
                  onSelect: () => {
                    this.time.delayedCall(100, () => {
                      this.#dialogUi.showDialogModal(['즐거운 삶이기도 하셨나요?', '탑승권 준비해드리겠습니다. 다음 여정도 즐거운 삶 되시길 바랍니다.'], {
                          onComplete: () => {
                              this._showTicketSequence();
                          }
                      });
                    });
                  }
                }
              ],
            
            });
          }
        });

      return;
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
            assetKey: null,  // ← 추가!
        });
        if (npc._phaserGameObject) {
          npc._phaserGameObject.setVisible(false); // 해당 맵에서만 숨김 처리
        }

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


  #goToNextMap() {
    this._isTransitioning = true;

    this.cameras.main.fadeOut(800, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
        // SecondMap에서 시작할 위치 (월드 좌표 기준)
        const spawnPosition = {
          x: 26.5 * TILE_SIZE, // 예시: 타일 32,1짜리 위치 같은 식으로 맞춰줘
          y: 20 * TILE_SIZE,
        };
    
        this.scene.start(SCENE_KEYS.END_SCENE, {
          intro: true,
          spawnPosition,
          spawnDirection: DIRECTION.UP, // 혹은 LEFT/UP/RIGHT
        });
      });
  }

  // _showTicketSequence() {
  //   // 오버레이
  //   const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)
  //     .setOrigin(0)
  //     .setScrollFactor(0)
  //     .setDepth(1);
  
  //   const startX = 100;
  //   const startY = this.cameras.main.height - 100;
  //   const centerX = this.cameras.main.centerX;
  //   const centerY = this.cameras.main.centerY;
  
  //   // 1. 컨테이너 생성, 시작 위치에 둠
  //   const groupContainer = this.add.container(startX, startY).setDepth(1000).setAlpha(0.2).setScale(0.3);
  
  //   // 2. 티켓 이미지 추가 (컨테이너 내부 좌표 0,0 기준)
  //   const ticketImage = this.add.image(0, 0, MAP4_ASSET_KEYS.TICKET).setOrigin(0.5);
  //   groupContainer.add(ticketImage);
  
  //   // 3. 인벤토리 아이템 3개 추가 (컨테이너 내 좌표 기준으로 티켓 위쪽 등 위치 조정)
  //   const inventory = this.#getInventory();
  //   const spacing = 20;
  //   inventory.forEach((item, idx) => {
  //     if (!item.img) return;

  //     const icon = this.add
  //       .image(startX, startY+ spacing * idx, item.img)
  //       .setOrigin(0.5)
  //       .setRotation(Phaser.Math.DegToRad(6))
  //       .setScale(4);
  //       groupContainer.add(icon);
  //   });
  
  //   // 4. 그룹 컨테이너를 중앙으로 트윈 애니메이션 (함께 이동+확대+불투명)
  //   this.tweens.add({
  //     targets: groupContainer,
  //     x: centerX,
  //     y: centerY,
  //     scale: 1,
  //     alpha: 1,
  //     duration: 750,
  //     ease: 'Back.Out',
  //     onComplete: () => {
        
  //       // 도착 후 대사 보여주고 씬 전환 등 처리
  //       this.time.delayedCall(100, () => this.#dialogUi.showDialogModal([
  //         '항공권을 받았다!',
  //         '이번 여정을 마무리하고 다음 여정으로 가볼까?'
  //       ], {
  //         onComplete: () => {
  //           overlay.destroy();
  //           groupContainer.destroy();
  //           this.#goToNextMap();
  //         }
  //       }));
  //     }
  //   });
  // }  
  
  _showTicketSequence() {
    // 1. 오버레이 추가
    const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(999);
    
    // 2. 티켓 이미지: 화면 왼쪽 하단에서 아주 작고 투명하게 시작
    const startX = 100;
    const startY = this.cameras.main.height - 100;
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    const ticketImage = this.add.image(startX, startY, MAP4_ASSET_KEYS.TICKET)
      .setOrigin(0.5)
      .setScale(0.3)
      .setAlpha(0.2)
      .setDepth(1000);

    this.time.delayedCall(300, () => this.#renderItems() );
  
    // 3. 트윈 애니메이션: 티켓이 중앙으로 이동하며 커지고 불투명
    this.tweens.add({
      targets: ticketImage,
      x: centerX,
      y: centerY,
      scale: 1,
      alpha: 1,
      duration: 600,      // 빠르거나 느리게 조절 가능
      ease: 'Back.Out',   // 팡! 하고 튀어나오는 느낌
      onComplete: () => {
        // 도착 후 대사 보여주고 씬 전환 등 처리
        this.time.delayedCall(400, () => this.#dialogUi.showDialogModal([
          '항공권을 받았다!',
          '이번 여정을 마무리하고 다음 여정으로 가볼까?'
        ], {
          onComplete: () => {
            this.#goToNextMap();
          }
        }));
      }
    });
  }
  

  // 인벤토리 읽기
  #getInventory() {
    return dataManager.store.get(DATA_MANAGER_STORE_KEYS.INVENTORY) || [];
  }

  // // 인벤토리 UI 그리기
  // #renderItems() {
  //   // 기존 아이콘들 싹 제거
  //   this.#inventoryIcons.forEach(icon => icon.destroy());
  //   this.#inventoryIcons = [];

  //   const inventory = this.#getInventory();
  //   console.log(inventory);
  //   if (!inventory.length) return;

  //   // 아이콘 시작 위치 + 간격 (숫자는 지금 쓰고 있던 좌표 기준으로 대충 맞춰둔 값)
  //   const startX = 1740;
  //   const startY = 416;
  //   const spacingX = 10;
  //   const spacingY = 75;

  //   inventory.forEach((item, idx) => {
  //     if (!item.img) return;

  //     const icon = this.add
  //       .image(startX + spacingX * idx, startY+ spacingY * idx, item.img)
  //       .setOrigin(0)
  //       .setRotation(Phaser.Math.DegToRad(-6))
  //       .setDepth(1001)
  //       .setScale(4);

  //     this.#inventoryIcons.push(icon);
  //   });
  // }

  // 인벤토리 UI 그리기 (서서히 나타나는 효과 추가)
#renderItems() {
  // 기존 아이콘들 싹 제거
  this.#inventoryIcons.forEach(icon => icon.destroy());
  this.#inventoryIcons = [];

  const inventory = this.#getInventory();
  console.log(inventory);
  if (!inventory.length) return;

  // 아이콘 시작 위치 + 간격
  const startX = 1740;
  const startY = 396;
  const spacingX = 10;
  const spacingY = 75;

  inventory.forEach((item, idx) => {
    if (!item.img) return;

    const icon = this.add
      .image(startX + spacingX * idx, startY + spacingY * idx, item.img)
      .setOrigin(0)
      .setRotation(Phaser.Math.DegToRad(-6))
      .setDepth(1001)
      .setScale(4)
      .setAlpha(0);     // 초기엔 투명한 상태로 시작

    this.#inventoryIcons.push(icon);

    // 투명도 0 → 1 서서히 페이드인 애니메이션 추가
    this.tweens.add({
      targets: icon,
      alpha: 1,
      duration: 600,
      ease: 'Linear',
      delay: 230 * idx,
    });
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