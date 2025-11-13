// src/scene/TalePopupScene.js
import Phaser from "phaser";
import { TALE_INFO } from "../../public/assets/data/tale-info.js";
import { DungGeunMo_FONT_NAME } from "../assets/font-keys.js";
import { SCENE_KEYS } from "../scene/SceneKeys.js";
import { ITEM_ASSET_KEYS, UI_ASSET_KEYS } from "../assets/AssetKeys.js";
import { dataManager, DATA_MANAGER_STORE_KEYS } from "../utils/data-manager.js";
import { DialogUi } from "./dialog-ui.js";

const TEXT_STYLE = {
  fontFamily: DungGeunMo_FONT_NAME,
  color: "#361500",
};

export class TalePopupScene extends Phaser.Scene {
  /** @type {DialogUi} */
  #dialogUi;
  
  constructor() {
    super(SCENE_KEYS.TALE_POPUP);
  }

  create(data) {
    const { taleId, mapId, returnSceneKey } = data || {};
    const tale =
    TALE_INFO[mapId].find((t) => t.id === taleId) || {
      title: "미등록 설화",
      mapId: "",
      story: "아직 준비되지 않은 이야기입니다.",
      items: [],
      thumbnail: "",
    };

    this.#dialogUi = new DialogUi(this, 1280);
    const { width, height } = this.scale;
    let selectedItem = null; 
    let itemToCollect = null;

    this.scene.bringToTop();

    // =========== 인벤토리에 아이템 추가 로직
    // 인벤토리 가져오기
    const getInventory = () => {
      return dataManager.store.get(DATA_MANAGER_STORE_KEYS.INVENTORY) || [];
    };

    // 인벤토리 저장
    const setInventory = (items) => {
      dataManager.store.set(DATA_MANAGER_STORE_KEYS.INVENTORY, items);
      console.log("성공적으로 저장완료!");
      console.log(DATA_MANAGER_STORE_KEYS.INVENTORY);
    };

    // 👇 이 설화(= 이 맵)에서 이미 아이템을 얻었는지 체크
    const hasCollectedItemInThisTale = () => {
      const inv = getInventory();
      return inv.some((i) => i.sourceTaleId === tale.mapId);
    };

    // 인벤토리에 아이템 추가 (한 설화당 하나만)
    const addItemToInventory = (item) => {
      if (!item) return false;

      const inv = getInventory();

      // 이 설화에서 이미 하나 먹었으면 막기
      if (hasCollectedItemInThisTale()) {
        return false;
      }

      inv.push({
        id: item.id ?? item.name,  // 아이템 고유 id가 있으면 id, 없으면 name
        name: item.name,
        img: item.img,             // 인벤토리 UI에서 쓸 스프라이트 키
        sourceTaleId: tale.mapId,     // 어떤 설화(=어떤 맵)에서 온 아이템인지
      });

      setInventory(inv);
      return true;

      console.log(`인벤토리에 아이템이 저장되었습니다 ${inv}`);
    };

    // 반투명 배경
    const dim = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.45)
      .setOrigin(0)
      .setInteractive()
      .setDepth(0);

      const panel = this.add
      .image(width / 2, height / 2, UI_ASSET_KEYS.TALE_BOOK)
      .setOrigin(0.5, 0.5)   // 기본값이긴 하지만 명시해 주면 좋음
      .setScale(4)
      .setDepth(1);

    // 스케일이 반영된 실제 크기
    const panelW = panel.displayWidth;
    const panelH = panel.displayHeight;

    // ------------------- 설화 제목
    const titleText = this.add.text(
        width / 2 + 70,
        height / 2 - panelH / 2 + 270,
        tale.title,
        {
        ...TEXT_STYLE,
        fontSize: "46px",
        }
    );
    titleText.setOrigin(0.5, 0.5).setDepth(2);

    const textWidth = titleText.width;
    console.log(textWidth);

    // 설화 썸네일
    if (textWidth > 250){
      const titleImg = this.add.image(width / 2 - textWidth*5/8, height / 2 - panelH / 2 + 270, tale.thumbnail);
      titleImg.setOrigin(0.5, 0.5).setDepth(2).setScale(0.5);
    } else{
      const titleImg = this.add.image(width / 2 - textWidth*3/4, height / 2 - panelH / 2 + 270, tale.thumbnail);
      titleImg.setOrigin(0.5, 0.5).setDepth(2).setScale(0.5);
    }

      // const titleImg = this.add.image(width / 2 - textWidth*3/4, height / 2 - panelH / 2 + 270, tale.thumbnail);
      // titleImg.setOrigin(0.5, 0.5).setDepth(2).setScale(0.5);
  
    // ------------------- 설화 본문
    const bodyText = this.add.text(
        width / 2 - panelW / 2 + 600,
        height / 2 - panelH / 2 + 370,
        tale.story,
        {
        ...TEXT_STYLE,
        fontSize: "29px",
        wordWrap: { width: panelW/2 + 100 },
        lineSpacing: 14,
        }
    );
    bodyText.setOrigin(0, 0).setDepth(2);

    // ------------------- 설화 아이템 제목
    const itemsTitle = this.add.image(
        width / 2,
        height / 2 + panelH / 2 - 495,
        ITEM_ASSET_KEYS.ITEM_TITLE
    );
    itemsTitle.setOrigin(0.5, 0.5).setDepth(2);

    const itemY = height / 2 + 4 * panel.height / 2 - 120;
    const spacing = 200;

    tale.items.forEach((item, i) => {
      const x = width / 2 + (i - (tale.items.length - 1) / 2) * spacing;

      const box = this.add
        .rectangle(x, height / 2 + panelH / 2 - 430, 120, 120, 0xfff4df)
        .setStrokeStyle(4, 0x8b6b4a)
        .setOrigin(0.5);

      if (this.textures.exists(item.key)) {
        this.add
          .image(x, itemY - 10, item.key)
          .setDisplaySize(80, 80)
          .setOrigin(0.5);
      }

      //------------------- 설화 item asset
      const item_img = this.add.image(x, height / 2 + panelH / 2 - 380, item.img).setOrigin(0.5, 0.5)
      .setScale(4)
      .setDepth(3);
      
      //------------------- 설화 item ui 배경
      const item_tale_ui = this.add.image(x, height / 2 + panelH / 2 - 380, UI_ASSET_KEYS.ITEM_TALE).setOrigin(0.5, 0.5) 
      .setScale(0.5)
      .setDepth(2);

      // ⭐ 1. 아이템 UI에 인터랙티브 설정
      item_tale_ui.setInteractive({ useHandCursor: true }); 
      item_img.setInteractive({ useHandCursor: true }); // 이미지도 클릭 가능하게 설정

      // ⭐ 2. 선택 테두리 이미지 생성 (기본적으로 숨김)
      const border = this.add.image(x, height / 2, UI_ASSET_KEYS.ITEM_SELECTION)
        .setOrigin(0.5, 0.5)
        .setScale(0.5) // UI 배경과 동일한 스케일
        .setDepth(4) // 아이템 위에 표시
        .setVisible(false); // 초기에는 보이지 않도록 설정

      const label = this.add.text(x, height / 2 + panelH / 2 - 280, item.name, {
        ...TEXT_STYLE,
        fontSize: "26px",
      });
      label.setOrigin(0.5, 0.5).setDepth(2);

      // ⭐ 3. 클릭 이벤트 추가 (하나만 선택 가능 로직)
    const selectItem = (currentItem) => {
      // 이전에 선택된 아이템이 있고, 현재 아이템과 다를 경우
      if (selectedItem && selectedItem !== currentItem) {
          selectedItem.border.setVisible(false); // 이전 테두리 숨기기
          selectedItem.isSelected = false;
      }

      // 현재 아이템 선택 상태 토글
      currentItem.isSelected = !currentItem.isSelected;
      currentItem.border.setVisible(currentItem.isSelected);

      // 현재 선택 상태를 전역 변수에 저장
      selectedItem = currentItem.isSelected ? currentItem : null;
      updateCollectButtonState();
    };
    
    // 아이템 데이터를 하나로 묶어 클릭 핸들러에 전달할 객체 생성
    const clickableItem = {
        data: item,     // 실제 아이템 데이터 (name, img 등)
        border: border, // 테두리 객체
        isSelected: false // 선택 상태
    };

    // UI 배경과 이미지 모두 클릭 시 동일하게 동작하도록 설정
    item_tale_ui.on('pointerdown', () => selectItem(clickableItem));
    item_img.on('pointerdown', () => selectItem(clickableItem));


    });

    // 닫기 버튼
    const btnWidth = 180;
    const btnHeight = 65;
    const centerX = width / 2 - 195; // 중앙 X
    const centerY = height / 2 + panelH / 2 - 197.5; // 중앙 Y

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
    ).setDepth(3);

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
    .setDepth(4);

    // 수집버튼
    const getBtnWidth = 335;
    const getBtnHeight = 65;
    const getBtnCenterX = width / 2 + 117.5; // 중앙 X
    const getBtnCenterY = height / 2 + panelH / 2 - 197.5; // 중앙 Y

    const getBtnRect = this.add.graphics();
    getBtnRect.fillStyle(0x361500, 1);

    // 1. Graphics 객체의 위치를 버튼 중앙으로 설정
    getBtnRect.setPosition(getBtnCenterX, getBtnCenterY);

    // 2. fillRoundedRect의 좌표는 Graphics의 (0, 0)을 기준으로 다시 계산
    //    새로운 좌상단 X = -getBtnWidth / 2 = -167.5
    //    새로운 좌상단 Y = -getBtnHeight / 2 = -32.5
    getBtnRect.fillRoundedRect(
      -getBtnWidth / 2, // -167.5
      -getBtnHeight / 2, // -32.5
      getBtnWidth,
      getBtnHeight,
      30
    ).setDepth(3);

    // ⭐ 버튼 상태를 업데이트하는 함수 정의
const updateCollectButtonState = () => {
  // 활성화 상태 (아이템이 선택되었을 때)
  const isEnabled = selectedItem !== null; 

  // 1. 색상 변경
  const color = isEnabled ? 0x361500 : 0xE4D7CF; // 활성화: 진한 갈색, 비활성화: 회색
    // 3. 텍스트 색상 변경 (선택 사항: 텍스트도 회색으로 만들 수 있습니다.)
  getBtnText.setColor(isEnabled ? '#ffffff' : '#B8B8B8'); 
  
  // 버튼의 이전 색상을 지우고 새 색상으로 다시 그립니다.
  getBtnRect.clear(); 
  getBtnRect.fillStyle(color, 1);
  getBtnRect.fillRoundedRect(
      -getBtnWidth / 2, 
      -getBtnHeight / 2, 
      getBtnWidth, 
      getBtnHeight, 
      30
  );

  

  // 2. 인터랙티브 상태 변경
  if (isEnabled) {
    // 활성화: hitArea와 hitAreaCallback을 명시적으로 설정
    getBtnRect.setInteractive(
        new Phaser.Geom.Rectangle(-getBtnWidth / 2, -getBtnHeight / 2, getBtnWidth, getBtnHeight),
        Phaser.Geom.Rectangle.Contains
    );
    getBtnRect.input.cursor = 'pointer'; // 커서 설정
    
} else {
    // 비활성화: setInteractive(false)를 호출하여 모든 입력 비활성화
    getBtnRect.setInteractive(false);
    getBtnRect.input.cursor = 'cursor';
}
  

};


    getBtnRect.setInteractive(
      new Phaser.Geom.Rectangle(-getBtnWidth / 2, -getBtnHeight / 2, getBtnWidth, getBtnHeight),
      Phaser.Geom.Rectangle.Contains
    );
    getBtnRect.input.cursor = 'pointer'; 

    // 텍스트 위치도 Graphics 중앙에 맞춥니다.
    const getBtnText = this.add.text(getBtnCenterX, getBtnCenterY, "아이템 수집하기", {
      ...TEXT_STYLE,
      fontSize: "30px",
      color: "#ffffff",
    }).setOrigin(0.5, 0.5)
    .setDepth(4);

    const close = () => {
        this.scene.stop(SCENE_KEYS.TALE_POPUP);
        if (returnSceneKey) {
          this.scene.resume(returnSceneKey, { collectedItem: itemToCollect });
        }
    };
        
        // dim 클릭 시: 패널 밖을 눌렀을 때만 닫기
    dim.on("pointerdown", (pointer) => {
        const { x, y } = pointer;
        
        const left   = panel.x - panel.displayWidth  / 2;
        const right  = panel.x + panel.displayWidth  / 2;
        const top    = panel.y - panel.displayHeight / 2;
        const bottom = panel.y + panel.displayHeight / 2;
        
        const isInsidePanel =
            x >= left && x <= right && y >= top && y <= bottom;
        
        if (!isInsidePanel) {
            close();
        }
    });

    btnRect.on("pointerdown", () => {
      this.tweens.add({
        targets: btnRect,
        scaleX: 0.97,
        scaleY: 0.97,
        duration: 80,
        yoyo: true,
        onComplete: close,
      });
    });

    getBtnRect.on("pointerdown", () => {
      this.tweens.add({
        targets: getBtnRect,
        scaleX: 0.97,
        scaleY: 0.97,
        duration: 80,
        yoyo: true,
      });

      if (!selectedItem) return;

      itemToCollect = selectedItem.data;

      const success = addItemToInventory(itemToCollect);
    
      if (success) {
        close();
      }
    });

    this.input.keyboard.once("keydown-ESC", close);
    // =============== 아이템 수집 버튼 비활성화
    updateCollectButtonState();
  }
}

// // --- 아이템 수집 및 닫기 함수 ---
// const collectAndClose = () => {
//   // 선택된 아이템이 없으면 아무것도 하지 않고 함수 종료 (또는 경고 메시지 표시 가능)
//   if (!selectedItem) {
//       console.warn("수집할 아이템을 선택해주세요.");
//       return; 
//   }

//   console.log(selectedItem.data);
//   // 메인 씬(returnSceneKey)의 이벤트를 통해 선택된 아이템 1개를 전달
//   // 이전에 tale.items (배열)를 전달했으나, 이제 selectedItem.data (단일 객체)를 전달합니다.
//   if (returnSceneKey) {
//       this.scene.get(returnSceneKey).events.emit('collect-item', selectedItem.data); // 'collect-item'으로 이벤트명 변경 (단수)
//   }
//   // 팝업 닫기
//   close();
// };