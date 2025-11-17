// ./scenes/StartScene.js
import Phaser from "phaser";
import { SCENE_KEYS } from "./SceneKeys";
import { END_ASSET_KEYS, INTRO_ASSET_KEYS } from "../assets/AssetKeys";
import { dataManager } from "../utils/data-manager";

export class EndScene extends Phaser.Scene {
  /** @type {Phaser.GameObjects.Image} */
  #bg;
  /** @type {Phaser.GameObjects.Rectangle} */
  #fog;
  /** @type {Phaser.GameObjects.Image} */
  #title;
  /** @type {Phaser.GameObjects.Image} */
  #startBtn;
  /** @type {Phaser.GameObjects.Image} */
  #moreBtn;
  constructor() {
    super({ key: SCENE_KEYS.END_SCENE });
  }


  create() {
    const { width, height } = this.scale;
    
    // 1) 배경 (cover 방식 스케일) - this.#bg로 저장하여 접근 가능하게 함
    this.#bg = this.add.image(0, 0, INTRO_ASSET_KEYS.INTRO_BACKGROUND).setOrigin(0).setScale(0.5);
    this.#coverImage(this.#bg, width, height);
    
    // 2) 흐림/안개(밝은 오버레이) - this.#fog로 저장
    this.#fog = this.add.rectangle(width/2, height/2, width, height, 0xffffff, 0.5);

    // 3) 타이틀 - this.#title로 저장
    this.#title = this.add.image(width / 2, height * 0.42, END_ASSET_KEYS.END_LOGO).setOrigin(0.5);   
    // 살짝 등장 애니메이션
    this.#title.setScale(0.92);
    this.tweens.add({ targets: this.#title, scale: 1, duration: 350, ease: "back.out" });

    // 4) 버튼 생성 (Start / More ...) - this.#startBtn, this.#moreBtn로 저장
    this.#startBtn = this.#makeImageButton(
        width/2, height*0.60,
        {
          normal: END_ASSET_KEYS.RESTART_BTN,
        },
        () => this.#goStart()
    );
    
    // --- 리사이즈 리스너 설정: 하나의 전용 메서드(#onResize)로 통일 ---
    // this를 컨텍스트로 지정하여 클래스 내부 속성(this.#bg, this.#fog)에 안전하게 접근합니다.
    this.scale.on("resize", this.#onResize, this);

    // 씬 종료 시 리스너 해제
    // this.#onResize 리스너만 정확히 해제합니다.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.scale.off("resize", this.#onResize, this);
    });
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
        this.scale.off("resize", this.#onResize, this);
    });
      
    // 키보드 조작(Enter/Space 시작)
    this.input.keyboard.on("keydown-ENTER", () => this.#goStart());
    this.input.keyboard.on("keydown-SPACE", () => this.#goStart());
  }
  
  /**
   * 게임 리사이즈 시 UI 위치를 조정합니다.
   * @param {Phaser.Structs.Size} gameSize 
   * @returns {void}
   */
  #onResize(gameSize) {
    // 씬이 종료되어 객체가 파괴되었는지 안전하게 확인합니다.
    if (!this.#bg || !this.#fog || !this.#startBtn || !this.#moreBtn) {
        return;
    }

    const { width, height } = gameSize;
    
    this.#bg.setPosition(0, 0);
    this.#coverImage(this.#bg, width, height);
    
    // fog의 위치와 크기 업데이트
    this.#fog.setPosition(width/2, height/2).setSize(width, height);
    
    // UI 요소 위치 업데이트
    this.#title.setPosition(width/2, height*0.38).setOrigin(0.5);
    this.#startBtn.setPosition(width/2, height*0.55);
    this.#moreBtn.setPosition(width/2, height*0.65);
  }

  // 배경 이미지를 화면 비율에 맞춰 'cover'로 채우기
  #coverImage(img, viewW, viewH) {
    const scaleX = viewW / img.width;
    const scaleY = viewH / img.height;
    const scale  = Math.max(scaleX, scaleY);
    img.setScale(scale).setScrollFactor(0);
  }

  #makeImageButton(x, y, keys, onClick) {
    // keys: { normal, hover, down }
    const img = this.add.image(x, y, keys.normal)
      .setOrigin(0.5)
      .setScrollFactor(0)       // 화면 고정 UI라면
      .setDepth(10)
      .setInteractive({ useHandCursor: true })
      .setScale(0.8);
  
      img.on("pointerover", () => { img.setScale(0.83); });
      img.on("pointerout",  () => { img.setScale(0.8);   });
      img.on("pointerdown", () => { img.setScale(0.77); });
      img.on("pointerup",   () => { img.setScale(0.83); onClick(); });
  
    return img;
  }

  #goStart() {
    // 리스너 해제
    if (this.#onResize) this.scale.off("resize", this.#onResize);
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      dataManager.reset();
      this.scene.start(SCENE_KEYS.START_SCENE, { intro: true });
    });
  }
}
