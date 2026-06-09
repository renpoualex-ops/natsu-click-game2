//=============================================================================
// Keke_TitleSkip - タイトルスキップ
// バージョン: 1.0.9
//=============================================================================
// Copyright (c) 2023 ケケー
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @target MZ
 * @plugindesc タイトル画面を飛ばし高速プレイ
 * @author ケケー
 * @url https://kekeelabo.com
 *
 * @help
 * 【1.0.9】
 * ◎タイトル画面を飛ばし、ニューゲームかロード画面へ直行か、自動ロードする
 * 　その他プレイ高速化のための各種機能付き
 * ◎『ページキーでニューゲーム』機能
 * 　ページキー(QW)押しっぱでタイトルスキップをやめタイトル表示できる
 * ◎『ロード画面からニューゲーム』機能
 * 　ロード画面にニューゲーム用のスロットを追加できる
 * ◎『フェード時間調節』機能
 * 　タイトル周りの各種フェードイン/アウト時間を調整できる
 *
 * ● 利用規約 ●
 * MITライセンスのもと、自由に使ってくれて大丈夫です
 * 
 * 
 * 
 * ◎ Skip title screen and go straight to new game, load screen, or autoload
 *   With various other functions for speeding up play
 * ◎ "Page key (qw) and new game" function
 *   You can stop the title skip by pressing the page key (QW)
 *   and display the title
 * ◎ "New game from loading screen" function
 *   You can add slots for new games to the loading screen
 * ◎ "Fade time adjustment" function
 *   You can adjust various fade-in/out times around the title
 * 
 * ● Terms of Use ●
 * Feel free to use it under the MIT license.
 *
 *
 *
 * @param タイトルスキップ
 * @desc タイトルをスキップするか
 * @type boolean
 * @default true
 * 
 * @param スキップ先
 * @desc タイトルスキップ時、ニューゲームするかロード画面に飛ばす
 * @type select
 * @option ニューゲーム
 * @option ロード画面
 * @default ニューゲーム
 * 
 * @param 自動ロード
 * @desc　タイトルスキップ時、セーブファイルを自動でロードする。1 なら ファイル1 をロード。0 ならオートセーブをロート。空欄なら自動ロードしない
 * @default 
 * 
 * @param 初回のみスキップ
 * @desc 起動直後のみタイトルをスキップする。「タイトルに戻る」の後は普通にタイトルを表示
 * @type boolean
 * @default 
 * 
 * @param ページキーでタイトル
 * @desc ページキー(QW)押しっ放しでタイトルスキップを止めてタイトル表示する
 * @type boolean
 * @default true
 *
 * @param ロード画面
 * 
 * @param タイトルに戻さない
 * @parent ロード画面
 * @desc ロード画面からキャンセルでタイトルに戻れないようにする
 * @type boolean
 * @default false
 * 
 * @param ロード画面でニューゲーム
 * @parent ロード画面
 * @desc ロード画面の一番上のスロットをニューゲーム用スロットにする
 * @type boolean
 * @default true
 * 
 * @param ロード画面にタイトル画像
 * @parent ロード画面
 * @desc ロード画面の背景にタイトル画像を描画する
 * @type boolean
 * @default true
 * 
 * @param ロード不透明度
 * @parent ロード画面
 * @desc ロード画面のウインドウの不透明度
 * @default 128
 * 
 * @param フェード時間
 * 
 * @param タイトル
 * @parent フェード時間
 * @desc タイトル画面でのフェードイン/アウト時間。5 なら 5フレームかけてフェード。空欄ならデフォルトのまま
 * @default 8
 * 
 * @param ロード
 * @parent フェード時間
 * @desc ロード画面でのアウト時間。5 なら 5フレームかけてフェード。空欄ならデフォルトのまま
 * @default 6
 * 
 * @param ニューゲーム後
 * @parent フェード時間
 * @desc ニューゲーム後のフェードイン時間。5 なら 5フレームかけてフェード。空欄ならデフォルトのまま
 * @default 12
 * 
 * @param ロード後
 * @parent フェード時間
 * @desc ロード後のフェードイン時間。5 なら 5フレームかけてフェード。空欄ならデフォルトのまま
 * @default 8
 * 
 * @param ゲーム終了
 * @parent フェード時間
 * @desc ゲーム終了時のフェードアウト時間。5 なら 5フレームかけてフェード。空欄ならデフォルトのまま
 * @default 0
 */
 
 
 
(() => {
    //- プラグイン名
    const pluginName = document.currentScript.src.match(/^.*\/(.*).js$/)[1];
    
    

    //==================================================
    //--  パラメータ受け取り
    //==================================================
    
    //- 真偽化
    function toBoolean(str) {
        if (!str) { return false; }
        const str2 = str.toString().toLowerCase();
        if (str2 == "true" || str2 == "on") { return true; }
        if (str2 == "false" || str2 == "off") { return false; }
        return Number(str);
    };

    let parameters = PluginManager.parameters(pluginName);
    
    const keke_titleSkip = toBoolean(parameters["タイトルスキップ"]);
    const keke_skipTo = parameters["スキップ先"];
    const keke_autoLoad = parameters["自動ロード"];
    const keke_skipFirstOnly = toBoolean(parameters["初回のみスキップ"]);
    const keke_titlePressing = toBoolean(parameters["ページキーでタイトル"]);

    //- ロード画面
    const keke_noBackTitle = toBoolean(parameters["タイトルに戻さない"]);
    const keke_newGameSlot = toBoolean(parameters["ロード画面でニューゲーム"]);
    const keke_titleOnLoad = toBoolean(parameters["ロード画面にタイトル画像"]);
    const keke_loadOpacity = Number(parameters["ロード不透明度"]);

    // フェード時間
    const keke_titleFadeTime = parameters["タイトル"] ? Math.round(Number(parameters["タイトル"]) / 2) || 1 : "";
    const keke_loadFadeTime = parameters["ロード"] ? Math.round(Number(parameters["ロード"]) / 2) || 1 : "";
    const keke_newGameAfterFadeTime = parameters["ニューゲーム後"] ? Number(parameters["ニューゲーム後"]) || 1 : "";
    const keke_loadAfterFadeTime = parameters["ロード後"] ? Number(parameters["ロード後"]) || 1 : "";
    const keke_gameEndFadeTime = parameters["ゲーム終了"] ? Math.round(Number(parameters["ゲーム終了"]) / 2) || 1 : "";

    parameters = null;
    
    
    
    //==================================================
    //--  タイトルスキップ
    //==================================================

    //- タイトルスキップ処理(コア追加)
    const _SceneManager_goto = SceneManager.goto;
    SceneManager.goto = function(sceneClass) {
        _SceneManager_goto.apply(this, arguments);
        // タイトルを飛ばすか判定
        if (checkTitleSkip(this, sceneClass)) {
            // 自動ロード判定
            if (checkAutoLoad(this)) {
                // 自動でのセーブファイル読み込み
                loadSaveFileAuto(this);
            // ニューゲームへ
            } else if (keke_skipTo == "ニューゲーム") {
                processNewGame(this);
            // ロード画面へ
            } else if (keke_skipTo == "ロード画面") {
                this._nextScene = new Scene_Load;
                if (!this._loadWentKe) {
                    // タイトルBGMを鳴らす
                    const sceneTitle = new Scene_Title;
                    sceneTitle.playTitleMusic();
                }
                // シーンタイトルを履歴に追加
                this._stack.push(Scene_Title);
                // ロード直行済みフラグをオン
                this._loadWentKe = true;
                // スキップ済みフラグのオン
                flagOnSkiped(this);
            }
        }
    };


    //- タイトルスキップ判定
    function checkTitleSkip(sm, sceneClass) {
        if (!keke_titleSkip) { return false; }
        if (sceneClass != Scene_Title) { return false; }
        if (sm._skipedTitleKe) { return false; }
        if (isForceTitle(sm, sm._scene)) { return false; }
        if (keke_skipTo == "ロード画面" && sm._loadWentKe && !keke_noBackTitle) { return false; }
        return true;
    };


    //- 自動ロード判定
    function checkAutoLoad(sm) {
        if (sm._skipedTitleKe) { return false; }
        return keke_autoLoad != "";
    };


    //- ニューゲームの処理
    function processNewGame(sm) {
        sm._nextScene = new Scene_Map;
        $dataMap = null;  // ニューゲーム時にオートセーブされるのを防ぐ
        // ニューゲーム処理
        DataManager.setupNewGame();
        // スキップ済みフラグのオン
        flagOnSkiped(sm);
    };


    //- 強制タイトルか
    function isForceTitle(sm, scene) {
        if (sm._forceTitledKe) { return true; }
        if (!keke_titlePressing) { return false; }
        // 強制タイトル時の処理
        if (Input.isPressed("pageup") || Input.isPressed("pagedown")) {
            DataManager.setupNewGame();
            // 強制タイトル済みフラグをオン
            sm._forceTitledKe = true;
            return true;
        }
        return false;
    };


    //- スキップ済みフラグのオン
    function flagOnSkiped(sm) {
        if (keke_skipFirstOnly) {
            sm._skipedTitleKe = true;
        }
    };


    //- マップ開始時に各種フラグを解除(コア追加)
    const _Scene_Map_initialize = Scene_Map.prototype.initialize;
    Scene_Map.prototype.initialize = function() {
        _Scene_Map_initialize.apply(this);
        const sm = SceneManager;
        sm._forceTitledKe = false;
        sm._loadWentKe = false;
    };
    

    
    //==================================================
    //--  自動ロード
    //==================================================

    // 自動ロード中フラグ
    let inAutoLoad = false;

    //- 自動でのセーブファイル読み込み
    function loadSaveFileAuto(sm) {
        // オートセーブファイル
        if (keke_skipTo.includes("オート") && $gameSystem.isAutosaveEnabled()) {
            // ロードの実行
            doLoad(sm, 0);
            return;
        }
        // 通常ファイル
        const saveFileId = Number(keke_autoLoad);
        if (saveFileId) {
            // ロードの実行
            doLoad(sm, saveFileId);
        }
        // スキップ済みフラグのオン
        flagOnSkiped(sm);
    };


    //- ロードの実行
    function doLoad(sm, saveFileId) {
        const scene = new Scene_Load();
        // ファイルがなければニューゲーム
        if (!isExistSaveFile(saveFileId)) { 
            processNewGame(sm);
            return;
        }
        // 自動ロード中フラグをオン
        inAutoLoad = true;
        // ロード実行
        scene.executeLoad(saveFileId);
    };


    //- セーブファイルがあるか
    function isExistSaveFile(saveFileId) {
        return DataManager.savefileInfo(saveFileId);
    };


    //- ロード成功時の処理を追加(コア追加)
    const _Scene_Load_onLoadSuccess = Scene_Load.prototype.onLoadSuccess;
    Scene_Load.prototype.onLoadSuccess = function() {
        _Scene_Load_onLoadSuccess.apply(this);
        if (inAutoLoad) {
            // ロード成功時の処理
            if (this._loadSuccess) {
                // 不要なトランスファーをクリア
                $gamePlayer.clearTransferInfo();
                // ロード後の処理
                $gameSystem.onAfterLoad();
            }
            // 自動ロード中フラグを解除
            inAutoLoad = false;
        }
        // ロード後フラグをオン
        loadAfter = true;
    };


    //- フェードイン条件に前がシーンブートとゲームエンドを追加
    const _Scene_Map_needsFadeIn = Scene_Map.prototype.needsFadeIn;
    Scene_Map.prototype.needsFadeIn = function() {
        return _Scene_Map_needsFadeIn.apply(this) || SceneManager.isPreviousScene(Scene_Boot)  || SceneManager.isPreviousScene(Scene_GameEnd);
    };
    

    //- 音楽のクリア
    /*function clearAudio() {
        AudioManager.stopBgm();
        AudioManager.stopBgs();
        AudioManager.stopMe();
    };*/
    

    //==================================================
    //--  ロード画面でニューゲーム
    //==================================================

    //- ニューゲームスロットの追加(コア追加)
    const _Window_SavefileList_drawItem = Window_SavefileList.prototype.drawItem;
    Window_SavefileList.prototype.drawItem = function(index) {
        if (validNewGameSlot() && index == 0) {
            const rect = this.itemRectWithPadding(index);
            this.resetTextColor();
            this.changePaintOpacity(true);
            this.drawText(TextManager.newGame, rect.x, rect.y, 180);
        } else {
            _Window_SavefileList_drawItem.call(this, index);
        }
    };


    //- ニューゲームスロットとしての動作(コア追加)
    const _Scene_Load_onSavefileOk = Scene_Load.prototype.onSavefileOk;
    Scene_Load.prototype.onSavefileOk = function() {
        const savefileId = this.savefileId();
        if (keke_newGameSlot && savefileId == null) {
            SoundManager.playLoad();
            DataManager.setupNewGame();
            SceneManager.goto(Scene_Map);
            this.fadeOutAll();
        } else {
            _Scene_Load_onSavefileOk.apply(this);
        }
    };


    //- スロット数の変更(コア追加)
    const _Window_SavefileList_maxItems = Window_SavefileList.prototype.maxItems;
    Window_SavefileList.prototype.maxItems = function() {
        let result = _Window_SavefileList_maxItems.apply(this);
        if (validNewGameSlot()) {
            result += 1;
        }
        return result;
    };


    //- ウインドウ・セーブファイルリスト/インデックス → セーブファイルID(処理追加)
    const _Window_SavefileList_indexToSavefileId = Window_SavefileList.prototype.indexToSavefileId;
    Window_SavefileList.prototype.indexToSavefileId = function(index) {
        let savefileId = _Window_SavefileList_indexToSavefileId.apply(this, arguments);

        if (validNewGameSlot()) {
            if (index == 0) {
                return null;
            } else if (index > 0) {
                savefileId--;
            }
        }
        return savefileId;
    };

    //- ウインドウ・セーブファイルリスト/セーブファイルID → インデックス(処理追加)
    const _Window_SavefileList_savefileIdToIndex = Window_SavefileList.prototype.savefileIdToIndex;
    Window_SavefileList.prototype.savefileIdToIndex = function(savefileId) {
        let index = _Window_SavefileList_savefileIdToIndex.apply(this, arguments);

        if (validNewGameSlot()) {
            if (savefileId >= 0) {
                index++;
            }
        }
        return index;
    };


    //- ニューゲームスロット有効か
    function validNewGameSlot() {
        const isLoad = SceneManager._scene.constructor.name == "Scene_Load";
        return keke_newGameSlot && isLoad;
    };


    //==================================================
    //--  ロード画面にタイトル画像
    //==================================================

    //- シーンロード・背景の形成(コア追加)
    Scene_Load.prototype.createBackground = function() {
        Scene_File.prototype.createBackground.call(this);
        // ロード画面の背景の形成
        createLoadBack(this);
    };

    
    //- ロード画面の背景の形成
    function createLoadBack(scene) {
        if (!keke_titleOnLoad) { return; }
        // ロード画面の遠景の形成
        createLoadBackground(scene);
        // ロード画面の近景の形成
        createLoadForeground(scene);
    };


    //- ロード画面の遠景の形成
    function createLoadBackground(scene) {
        scene._backSprite1 = new Sprite(
            ImageManager.loadTitle1($dataSystem.title1Name)
        );
        scene._backSprite2 = new Sprite(
            ImageManager.loadTitle2($dataSystem.title2Name)
        );
        scene.addChild(scene._backSprite1);
        scene.addChild(scene._backSprite2);
        // 画像を画面に合わせる
        adjustImageToScreen(scene._backSprite1);
        adjustImageToScreen(scene._backSprite2);
    };


    //- ロード画面の近景の形成
    function createLoadForeground(scene) {
        scene._gameTitleSprite = new Sprite(new Bitmap(Graphics.width, Graphics.height)
        );
        scene.addChild(scene._gameTitleSprite);
        // 画像を画面に合わせる
        adjustImageToScreen(scene._gameTitleSprite);
    };


    //- 画像を画面に合わせる
    function adjustImageToScreen(sprite) {
        if (!sprite) { return; }
        const bitmap = sprite.bitmap;
        if (!bitmap) { return; }
        bitmap.addLoadListener(() => {
            screenRate = Graphics.width / Graphics.height;
            bitmapRate = bitmap.width / bitmap.height;
            // 画面の方が横長の場合は横に合わせる
            if (screenRate >= screenRate) {
                sprite.scale.x = Graphics.width / bitmap.width;
                sprite.scale.y = sprite.scale.x;
            // 画像の方が横長の場合は縦に合わせる
            } else {
                sprite.scale.y = Graphics.height / bitmap.height;
                sprite.scale.x = sprite.scale.y;
            }
        });
    };


    //==================================================
    //--  ロード不透明度
    //==================================================

    //- ファイルウインドウの不透明度
    const _Window_SavefileList_initialize = Window_SavefileList.prototype.initialize;
    Window_SavefileList.prototype.initialize = function(rect) {
        _Window_SavefileList_initialize.apply(this, arguments);
        if (SceneManager._scene.constructor.name == "Scene_Load") {
            this.opacity = keke_loadOpacity;
        }
    };

    Window_SavefileList.prototype.drawBackgroundRect = function(rect) {
        const isLoad = SceneManager._scene.constructor.name == "Scene_Load";
        if (isLoad) {
            const opaRate = keke_loadOpacity / 255;
            this.contentsBack.context.globalAlpha = opaRate;

        }
        Window_Selectable.prototype.drawBackgroundRect.call(this, rect);
        if (isLoad) {
            this.contentsBack.context.globalAlpha = 1;

        }
    };


    //- ヘルプウインドウの不透明度
    const _Window_Help_initialize = Window_Help.prototype.initialize;
    Window_Help.prototype.initialize = function(rect) {
        _Window_Help_initialize.apply(this, arguments);
        if (SceneManager._scene.constructor.name == "Scene_Load") {
            this.opacity = keke_loadOpacity;
        }
    };



    //==================================================
    //--  フェード時間
    //==================================================

    // ニューゲームフラグ
    let newGameAfter = false;
    // ロード後フラグ
    let loadAfter = false;


    //- タイトル画面のフェード時間(コア追加)
    Scene_Title.prototype.fadeSpeed = function() {
        if (keke_titleFadeTime) { return keke_titleFadeTime; }
        return Scene_Base.prototype.fadeSpeed.call(this);
    };


    //- ロード画面のフェード時間(コア追加)
    Scene_Load.prototype.fadeSpeed = function() {
        if (keke_loadFadeTime) { return keke_loadFadeTime; }
        return Scene_Base.prototype.fadeSpeed.call(this);
    };


    //- ゲーム終了のフェード時間(コア追加)
    Scene_GameEnd.prototype.fadeSpeed = function() {
        if (keke_gameEndFadeTime) { return keke_gameEndFadeTime; }
        return Scene_Base.prototype.fadeSpeed.call(this);
    };

    //- マップのフェード時間(コア追加)
    Scene_Map.prototype.fadeSpeed = function() {
        // ニューゲーム後
        if (newGameAfter) {
            newGameAfter = false;
            if (keke_newGameAfterFadeTime) { return keke_newGameAfterFadeTime; }
        }
        // ロード後
        if (loadAfter) {
            loadAfter = false;
            if (keke_loadAfterFadeTime) { return keke_loadAfterFadeTime; }
        }
        return Scene_Base.prototype.fadeSpeed.call(this);
    };


    //- ニューゲーム時にニューゲーム後フラグをオン
    const _Scene_Title_commandNewGame = Scene_Title.prototype.commandNewGame;
    Scene_Title.prototype.commandNewGame = function() {
        _Scene_Title_commandNewGame.apply(this);
        newGameAfter = true;
    };

})();