import Phaser from "phaser";
import { INTRO_ASSET_KEYS } from "../assets/AssetKeys.js";
import { SCENE_KEYS } from "./SceneKeys.js";
import { DialogUi } from "../Map/dialog-ui.js";
import { DATA_MANAGER_STORE_KEYS, dataManager } from "../utils/data-manager.js";

export class IntroScene extends Phaser.Scene {
  /** @type {DialogUi} */
  #dialogUi;
  /** @type {Phaser.Input.Keyboard.Key} */
  #spaceKey;

  constructor() {
    super(SCENE_KEYS.INTRO_SCENE);
  }

  create() {
    // 배경
    this.add.image(1280, 700, INTRO_ASSET_KEYS.INTRO_BACKGROUND)
      .setAlpha(0.9)
      .setScale(0.5);

    // 대화 UI
    this.#dialogUi = new DialogUi(this, 1280);

    // 스페이스 키 등록
    this.#spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // 바구니 이미지 + 모션
    const basket = this.add.image(1280, 800, INTRO_ASSET_KEYS.INTRO_BASKET).setScale(0.5);
    basket.setDepth(10);

    this.tweens.add({
      targets: [basket],
      y: "-=300",
      duration: 4000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1
    });

    const lines = [
      "아가, 너의 삶이 시작되었구나. 삶을 통해 너만의 이야기를 모으거라.",
      "하나의 마을마다 하나의 이야기를 얻을 수 있을 것이다.\n그러며 점차 성장해나가겠지.",
      "시간을 거슬러 갈 수 없듯, 이야기를 하나 모으면 돌이킬 수 없으니\n주의하거라.",
      "좋은 삶이 되었으면 하는구나.\n그럼, 행운을 빈다."
    ];

    const shown = dataManager.store.get(DATA_MANAGER_STORE_KEYS.INTRO_WELCOME_KEY);
    
    if (!shown) {
        // 살짝 딜레이를 주면 페이드인 뒤 자연스럽게 뜸
        this.time.delayedCall(900, () => this.#dialogUi.showDialogModal(lines, {
            onComplete: () => {
            // 대사가 완전히 끝나고 모달이 닫힌 뒤에, 선택지 띄우기
    
            this.time.delayedCall(700, () => {
                this.cameras.main.fadeOut(1500, 0, 0, 0);
                this.cameras.main.once("camerafadeoutcomplete", () => {
                  this.scene.start(SCENE_KEYS.FIRST_MAP);
                });
            });
            
        }
        
    }));
    }
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.#spaceKey)) {
      // 1) 글자 애니메이션 중이면 일단 무시 (혹시 스킵 기능 만들고 싶으면 여기에서 처리)
      if (this.#dialogUi.isAnimationPlaying) {
        return;
      }

      // 2) 더 보여줄 메시지가 있으면 다음 줄
      if (this.#dialogUi.isVisible && this.#dialogUi.moreMessagesToShow) {
        this.#dialogUi.showNextMessage();
        return;
      }

      // 3) 더 이상 메시지가 없고, 아직 열려있으면 닫기 (→ onComplete 실행 → 맵 전환)
      if (this.#dialogUi.isVisible) {
        this.#dialogUi.hideDialogModal();
      }
    }
  }
}
