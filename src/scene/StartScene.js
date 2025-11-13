// ./scenes/StartScene.js
import Phaser from "phaser";
import { SCENE_KEYS } from "./SceneKeys";
import { MAP1_ASSET_KEYS, START_ASSET_KEYS } from "../assets/AssetKeys";
import { DungGeunMo_FONT_NAME } from "../assets/font-keys";

const TEXT_STYLE = {
  fontFamily: DungGeunMo_FONT_NAME,
  color: "#361500",
};

export class StartScene extends Phaser.Scene {
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
  /** @type {Phaser.GameObjects.Rectangle} */
  #popupOverlay;
  /** @type {Phaser.GameObjects.Image} */
  #popupImage;
  /** @type {Phaser.GameObjects.Image} */
  #popupCloseBtn;


  constructor() {
    super({ key: SCENE_KEYS.START_SCENE });
  }


  create() {
    const { width, height } = this.scale;
    
    // 1) 배경 (cover 방식 스케일) - this.#bg로 저장하여 접근 가능하게 함
    this.#bg = this.add.image(0, 0, MAP1_ASSET_KEYS.FIRST_MAP).setOrigin(0).setScale(4);
    this.#coverImage(this.#bg, width, height);
    
    // 2) 흐림/안개(밝은 오버레이) - this.#fog로 저장
    this.#fog = this.add.rectangle(width/2, height/2, width, height, 0xffffff, 0.6);

    // 3) 타이틀 - this.#title로 저장
    this.#title = this.add.image(width / 2, height * 0.38, START_ASSET_KEYS.LOGO).setOrigin(0.5);   
    // 살짝 등장 애니메이션
    this.#title.setScale(0.92);
    this.tweens.add({ targets: this.#title, scale: 1, duration: 350, ease: "back.out" });

    // 4) 버튼 생성 (Start / More ...) - this.#startBtn, this.#moreBtn로 저장
    this.#startBtn = this.#makeImageButton(
        width/2, height*0.55,
        {
          normal: START_ASSET_KEYS.START_BTN,
        },
        () => this.#goGame()
    );
      
    this.#moreBtn = this.#makeImageButton(
        width/2, height*0.65,
        {
          normal: START_ASSET_KEYS.MORE_BTN,
        },
        () => this.#openMore()
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
    this.input.keyboard.on("keydown-ENTER", () => this.#goGame());
    this.input.keyboard.on("keydown-SPACE", () => this.#goGame());
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
      .setScale(0.6);
  
      img.on("pointerover", () => { img.setScale(0.63); });
      img.on("pointerout",  () => { img.setScale(0.6);   });
      img.on("pointerdown", () => { img.setScale(0.57); });
      img.on("pointerup",   () => { img.setScale(0.63); onClick(); });
  
    return img;
  }

  #goGame() {
    // 리스너 해제
    if (this.#onResize) this.scale.off("resize", this.#onResize);
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENE_KEYS.INTRO_SCENE, { intro: true });
    });
  }

  // “More ...”는 추후 옵션/크레딧 서브메뉴로 연결
  #openMore() {
    const { width, height } = this.scale;

    // 1) 화면 어둡게 하는 오버레이 (반투명 검정)
    this.#popupOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0)
      .setDepth(20)
      .setScrollFactor(0)
      .setInteractive(); // 클릭 이벤트 막기 위해
  
    // 2) 팝업 이미지 (적절한 키로 교체)
    this.#popupImage = this.add.image(width / 2, height / 2, START_ASSET_KEYS.MORE_POPUP)
      .setDepth(21)
      .setOrigin(0.5)
      .setScale(0.5);


    // 닫기 버튼
    const btnWidth = 230;
    const btnHeight = 65;
    const centerX = width / 2; // 중앙 X
    const centerY = height - 250; // 중앙 Y

    const btnRect = this.add.graphics();
    btnRect.fillStyle(0xA97D61, 1);

    // 1. Graphics 객체의 위치를 버튼 중앙으로 설정 (Origin 0.5, 0.5를 설정한 효과)
    btnRect.setPosition(centerX, centerY);

    // 2. fillRoundedRect의 좌표는 Graphics의 (0, 0)을 기준으로 다시 계산
    //    새로운 좌상단 X = -btnWidth / 2 = -90
    //    새로운 좌상단 Y = -btnHeight / 2 = -32.5
    btnRect.fillRoundedRect(
      -btnWidth / 2, // -90
      -btnHeight / 2, // -32.5
      btnWidth,
      btnHeight,
      30
    ).setDepth(50);

    // setInteractive와 트윈은 그대로 사용 (위치 보정 완료)
    btnRect.setInteractive(
      new Phaser.Geom.Rectangle(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight), // setPosition으로 원점이 (0,0)으로 이동했으므로 hitArea도 변경
      Phaser.Geom.Rectangle.Contains
    );
    btnRect.input.cursor = 'pointer'; 

    // 텍스트 위치도 Graphics 중앙에 맞춥니다.
    const btnText = this.add.text(centerX, centerY, "닫기", {
      ...TEXT_STYLE,
      fontSize: "30px",
      color: "#ffffff",
    }).setOrigin(0.5, 0.5) // Origin 0.5, 0.5로 설정되어 중앙에 위치
    .setDepth(51);
  
  
    // 닫기 버튼 클릭 시 팝업 및 오버레이 제거
    btnRect.on('pointerup', () => {
      this.tweens.add({
        targets: btnRect,
        scaleX: 0.97,
        scaleY: 0.97,
        duration: 80,
        yoyo: true,
        onComplete: () => {
          this.#popupImage?.destroy();
          this.#popupOverlay?.destroy();
          btnRect.destroy();  // 그래픽 제거
          btnText.destroy(); 
        },
      });
    });
  }
  
}
