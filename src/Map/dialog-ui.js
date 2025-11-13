import Phaser from 'phaser';
import { DungGeunMo_FONT_NAME } from '../assets/font-keys.js';
import { MAP1_INTRO_TEXT, animateText } from '../utils/text-utils.js';
import { UI_ASSET_KEYS } from '../assets/AssetKeys.js';

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const UI_TEXT_STYLE = Object.freeze({
  fontFamily: DungGeunMo_FONT_NAME,
  color: '#361500',
  fontSize: '50px',
  wordWrap: { width: 0 },
});

export class DialogUi {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {number} */
  #padding;
  /** @type {number} */
  #width;
  /** @type {number} */
  #height;
  /** @type {Phaser.GameObjects.Container} */
  #container;
  /** @type {boolean} */
  #isVisible;
  /** @type {Phaser.GameObjects.Image} */
  #userInputCursor;
  /** @type {Phaser.Tweens.Tween} */
  #userInputCursorTween;
  /** @type {Phaser.GameObjects.Text} */
  #uiText;
  /** @type {boolean} */
  #textAnimationPlaying;
  /** @type {string[]} */
  #messagesToShow;
  

  constructor(scene, width) {
    this.#scene = scene;
    this.#padding = 90;
    this.#width = width - this.#padding;
    this.#height = 340;
    this.#textAnimationPlaying = false;
    this.#messagesToShow = [];
    this._onDialogComplete = null; // 대화 종료 콜백

    const panel = this.#scene.add.image(this.#width, this.#height, UI_ASSET_KEYS.DIALOG_PANEL)
      .setOrigin(0.5, 1.1).setScale(0.8).setDepth(9999);
    this.#container = this.#scene.add.container(0, 0, [panel]).setDepth(9999);
    this.#uiText = this.#scene.add.text(310, 12, MAP1_INTRO_TEXT, {
      ...UI_TEXT_STYLE,
      ...{ wordWrap: { width: this.#width + 550 },
          lineSpacing: 20,
     },
    });
    this.#container.add(this.#uiText); 
    this.#createPlayerInputCursor();
    this.hideDialogModal();

    this.isChoiceOpen = false;
    this._choice = {
      container: this.#scene.add.container(0, 0).setDepth(99999).setVisible(false),
      items: [],
      idx: 0,
      keys: null,
      lines: [],   // Phaser.Text 들
      onCancel: null
    };

    // 컨테이너는 화면 좌표 기준으로 배치
    const cam = this.#scene.cameras.main;
    this._choice.bounds = {  // 대화 박스 안쪽에 렌더하려고 기준을 잡음
      left: 400,
      // 박스 아래쪽이라 가정: 화면 하단에서 160px 위 지점부터 세 줄 정도
      top:  cam.height - 250, 
      lineHeight: 60
    };
  }

  // 내부 렌더 헬퍼: 라인 텍스트에 > 표시 적용
  _renderChoiceLines() {
    const { lines, idx } = this._choice;
    lines.forEach((t, i) => {
      const raw = t.getData('rawLabel'); // 원본 라벨
      t.setText((i === idx ? '▸ ' : '  ') + raw);
      t.setColor(i === idx ? '#361500' : '#8A5F43'); // 선택 시 강조(원하면 스타일 조정)
    });
  }

  // 리스트(예/아니오 등) 선택지 열기
  // options: [{ label: '예', onSelect: fn }, { label: '아니오', onSelect: fn }]
  // prompt: 선택지 위에 한 줄 질문 문구 (대화창으로 띄움)
  showChoiceList({ prompt = '이야기를 들어볼까?', options = [], initialIndex = 0, onCancel = null } = {}) {
    if (!Array.isArray(options) || options.length === 0) return;

    // 1) 질문 문구: 기존 대화창으로 1줄 띄우기
    this.showDialogModal([prompt]);

    // 2) 컨테이너 초기화
    const { container, bounds } = this._choice;
    container.removeAll(true);
    this._choice.items = options;
    this._choice.idx = Math.max(0, Math.min(initialIndex, options.length - 1));
    this._choice.onCancel = typeof onCancel === 'function' ? onCancel : null;
    this._choice.lines = [];

    // 3) 라인 생성 (텍스트 인터랙티브 & 마우스 클릭 지원)
    options.forEach((opt, i) => {
      const y = bounds.top + i * bounds.lineHeight;
      const t = this.#scene.add.text(bounds.left, y, '', {
        ...UI_TEXT_STYLE,
        ...{ wordWrap: { width: this.#width + 700 } },
      }).setOrigin(0, 0.5);
      t.setData('rawLabel', opt.label ?? '');
      t.setInteractive({ useHandCursor: true });
      t.on('pointerover', () => { this._choice.idx = i; this._renderChoiceLines(); });
      t.on('pointerup',   () => { this._selectChoice(i); });
      container.add(t);
      this._choice.lines.push(t);
    });

    // 4) 키보드 핸들러 (↑/↓/Enter/Space/Esc)
    this._choice.keys = this.#scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC
    });

    // 키 이벤트 리스너 (중복 방지 위해 한 번만 바인딩)
    const onDown = (event) => {
      if (!this.isChoiceOpen) return;
      switch (event.keyCode) {
        case Phaser.Input.Keyboard.KeyCodes.UP:
          this._choice.idx = (this._choice.idx - 1 + this._choice.items.length) % this._choice.items.length;
          this._renderChoiceLines();
          break;
        case Phaser.Input.Keyboard.KeyCodes.DOWN:
          this._choice.idx = (this._choice.idx + 1) % this._choice.items.length;
          this._renderChoiceLines();
          break;
        case Phaser.Input.Keyboard.KeyCodes.ENTER:
        case Phaser.Input.Keyboard.KeyCodes.SPACE:
          this._selectChoice(this._choice.idx);
          break;
        case Phaser.Input.Keyboard.KeyCodes.ESC:
          this.hideChoiceList(true);
          break;
      }
    };
    // 저장해두고 hide에서 해제
    this._choice._onKeyDown = onDown;
    this.#scene.input.keyboard.on('keydown', onDown);

    // 5) 보이기 + 초기 렌더
    container.setVisible(true);
    this.isChoiceOpen = true;
    this._renderChoiceLines();
  }

  // 선택 확정
  _selectChoice(i) {
    const item = this._choice.items[i];
    this.hideChoiceList(false);
    if (item && typeof item.onSelect === 'function') {
      item.onSelect();
    }
  }

    

// 닫기 (isCancel=true면 onCancel 콜백 실행)
hideChoiceList(isCancel = false) {
  if (!this.isChoiceOpen) return;
  this._choice.container.setVisible(false);
  this.isChoiceOpen = false;

  // 키 리스너 해제
  if (this._choice._onKeyDown) {
    this.#scene.input.keyboard.off('keydown', this._choice._onKeyDown);
    this._choice._onKeyDown = null;
  }
  // onCancel
  if (isCancel && typeof this._choice.onCancel === 'function') {
    this._choice.onCancel();
  }
}

// 선택지/애니메이션 중에는 입력을 막고 싶을 때 외부에서 체크 가능
shouldBlockInput() {
  return this.isChoiceOpen || this.isAnimationPlaying;
}


/** @type {boolean} */
get isVisible() {
  return this.#isVisible;
}

  /** @type {boolean} */
  get isAnimationPlaying() {
    return this.#textAnimationPlaying;
  }

  /** @type {boolean} */
  get moreMessagesToShow() {
    return this.#messagesToShow.length > 0;
  }

    // UI 박스가 보이면 화살표 이동만 막고 싶을 때
  shouldBlockMovement() {
    return this.isChoiceOpen || this.isVisible || this.isAnimationPlaying;
  }

  // (참고) 모든 입력을 막고 싶다면 필요 시 이렇게도 쓸 수 있음
  shouldBlockAllInput() {
    return this.isChoiceOpen || this.isAnimationPlaying;
  }

  showDialogModal(messages, opts = {}) {
    this._onDialogComplete = typeof opts.onComplete === 'function' ? opts.onComplete : null;
    this.#messagesToShow = [...messages];

    const { x, bottom } = this.#scene.cameras.main.worldView;
    const startX = x + this.#padding;
    const startY = bottom - this.#height - this.#padding / 4;

    this.#container.setPosition(startX, startY);
    this.#userInputCursorTween.restart();
    this.#container.setAlpha(1);
    this.#isVisible = true;

    this.showNextMessage();   
  }

  /**
   * @returns {void}
   */
  showNextMessage() {
    if (this.#messagesToShow.length === 0) {
      return;
    }

    this.#uiText.setText('').setAlpha(1);

    animateText(this.#scene, this.#uiText, this.#messagesToShow.shift(), {
      delay: 50,
      callback: () => {
        this.#textAnimationPlaying = false;
      },
    });
    this.#textAnimationPlaying = true;
  }

    /**
   * @returns {void}
   */
  hideDialogModal() {
    this.#container.setAlpha(0);
    // this.#userInputCursorTween.pause();
    this.#isVisible = false;
    const cb = this._onDialogComplete;
    this._onDialogComplete = null;
    if (cb) cb(); 
  }

  /**
   * @returns {void}
   */
  #createPlayerInputCursor() {
    const y = this.#height-160;
    this.#userInputCursor = this.#scene.add.image(this.#width+850, y, UI_ASSET_KEYS.CURSOR);
    this.#userInputCursor.setScale(5);

    this.#userInputCursorTween = this.#scene.add.tween({
      delay: 0,
      duration: 800,
      repeat: -1,
      y: {
        from: y,
        start: y,
        to: y + 6,
      },
      targets: this.#userInputCursor,
    });
    this.#userInputCursorTween.pause();
    this.#container.add(this.#userInputCursor);
  }


}