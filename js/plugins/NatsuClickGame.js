//=============================================================================
// NatsuClickGame.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc ナツをクリックするたびに「おぉ」と喋って大きくなるゲーム
 * @author Claude
 *
 * @param baseGrowthRate
 * @text 基本成長率
 * @desc クリックごとの基本拡大率（例: 1.02 = 2%ずつ）
 * @default 1.005
 * @type number
 * @decimals 3
 * @min 1.001
 * @max 1.5
 *
 * @param imageName
 * @text キャラクター画像ファイル名
 * @desc img/pictures/ フォルダに入れた画像ファイル名（拡張子不要）
 * @default natsu
 * @type string
 *
 * @param soundName
 * @text 効果音ファイル名
 * @desc audio/se/ フォルダに入れた効果音ファイル名（拡張子不要）。空欄でデフォルト音
 * @default
 * @type string
 *
 * @param stage0bg
 * @text 背景画像1（アビドス）
 * @desc img/parallaxes/ のファイル名（拡張子不要）。空欄でカラー背景
 * @default
 * @type string
 *
 * @param stage1bg
 * @text 背景画像2（ゲヘナ）
 * @default
 * @type string
 *
 * @param stage2bg
 * @text 背景画像3（トリニティ）
 * @default
 * @type string
 *
 * @param stage3bg
 * @text 背景画像4（ミレニアム）
 * @default
 * @type string
 *
 * @param stage4bg
 * @text 背景画像5（ヴァルキューレ）
 * @default
 * @type string
 *
 * @param stage5bg
 * @text 背景画像6（アリウス）
 * @default
 * @type string
 *
 * @param stage6bg
 * @text 背景画像7（シャーレ）
 * @default
 * @type string
 *
 * @param stage7bg
 * @text 背景画像8（キヴォトス上空）
 * @default
 * @type string
 *
 * @param stage8bg
 * @text 背景画像9（月軌道）
 * @default
 * @type string
 *
 * @param stage9bg
 * @text 背景画像10（太陽系の果て）
 * @default
 * @type string
 *
 * @param stage10bg
 * @text 背景画像11（銀河系中枢）
 * @default
 * @type string
 *
 * @param stage11bg
 * @text 背景画像12（宇宙の果て）
 * @default
 * @type string
 *
 * @param stage12bg
 * @text 背景画像13（キヴォトスの外側）
 * @default
 * @type string
 *
 * @command startNatsuGame
 * @text ナツクリックゲーム開始
 * @desc ナツクリックゲームを起動します
 *
 * @help
 * ============================================================================
 * ナツクリックゲーム
 * ============================================================================
 * - クリックでおぉポイントが溜まる
 * - 右側のショップでパワーを購入 → 即適用
 * - 画面いっぱいになると光って画像サイズリセット（表示サイズは継続）
 * - クリック数・サイズに応じて背景とロケーションが変化
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN_NAME      = "NatsuClickGame";
    const params           = PluginManager.parameters(PLUGIN_NAME);
    const BASE_GROWTH_RATE = parseFloat(params.baseGrowthRate) || 1.005;
    const IMAGE_NAME       = params.imageName || "natsu";
    const SOUND_NAME       = params.soundName || "";
    // 各ステージの背景画像（img/parallaxes/）。空文字ならカラー背景
    const STAGE_BG_IMAGES  = [
        params.stage0bg  || "",
        params.stage1bg  || "",
        params.stage2bg  || "",
        params.stage3bg  || "",
        params.stage4bg  || "",
        params.stage5bg  || "",
        params.stage6bg  || "",
        params.stage7bg  || "",
        params.stage8bg  || "",
        params.stage9bg  || "",
        params.stage10bg || "",
        params.stage11bg || "",
        params.stage12bg || "",
    ];

    // ショップ
    // ptMult: クリック1回あたりのポイント取得倍率
    const POWERS = [
        { id: 0, label: "ちょっとおぉ",     ptMult: 2,    cost: 30,     desc: "Pt x2"    },
        { id: 1, label: "そこそこおぉ",     ptMult: 3,    cost: 120,    desc: "Pt x3"    },
        { id: 2, label: "なかなかおぉ",     ptMult: 5,    cost: 400,    desc: "Pt x5"    },
        { id: 3, label: "かなりおぉ",       ptMult: 8,    cost: 1200,   desc: "Pt x8"    },
        { id: 4, label: "すごいおぉ",       ptMult: 12,   cost: 3500,   desc: "Pt x12"   },
        { id: 5, label: "ヤバいおぉ",       ptMult: 20,   cost: 9000,   desc: "Pt x20"   },
        { id: 6, label: "先生のおぉ",       ptMult: 35,   cost: 22000,  desc: "Pt x35"   },
        { id: 7, label: "キヴォトスおぉ",   ptMult: 60,   cost: 55000,  desc: "Pt x60"   },
        { id: 8, label: "UEおぉ",           ptMult: 100,  cost: 130000, desc: "Pt x100"  },
        { id: 9, label: "∞おぉ",            ptMult: 200,  cost: 350000, desc: "Pt x200"  },
    ];

    // 比較テキスト（60段階）
    const SIZE_LABELS = [
        { threshold:     1.0,  text: "子猫くらい" },
        { threshold:     1.2,  text: "ぬいぐるみくらい" },
        { threshold:     1.5,  text: "柴犬くらい" },
        { threshold:     2.0,  text: "大型犬くらい" },
        { threshold:     2.8,  text: "小学生くらい" },
        { threshold:     3.5,  text: "ノノミくらい" },
        { threshold:     4.5,  text: "ホシノサクサクくらい" },
        { threshold:     6.0,  text: "ヒフミくらい" },
        { threshold:     8.0,  text: "部室のドアくらい" },
        { threshold:    11.0,  text: "ゲヘナの制服棚くらい" },
        { threshold:    15.0,  text: "アビドスの廃校舎の壁くらい" },
        { threshold:    20.0,  text: "電柱くらい" },
        { threshold:    28.0,  text: "バス停の屋根くらい" },
        { threshold:    38.0,  text: "大型トラックくらい" },
        { threshold:    52.0,  text: "シャーレの仮設基地くらい" },
        { threshold:    70.0,  text: "トリニティの礼拝堂くらい" },
        { threshold:    95.0,  text: "ゲヘナ学園の正門くらい" },
        { threshold:   130.0,  text: "ミレニアムのサーバー棟くらい" },
        { threshold:   180.0,  text: "アリウス分校くらい" },
        { threshold:   250.0,  text: "観覧車くらい" },
        { threshold:   340.0,  text: "ヴァルキューレ警察署くらい" },
        { threshold:   460.0,  text: "東京タワーくらい" },
        { threshold:   620.0,  text: "スカイツリーくらい" },
        { threshold:   850.0,  text: "キヴォトスの城壁くらい" },
        { threshold:  1150.0,  text: "赤坂総合コンシェルジュくらい" },
        { threshold:  1600.0,  text: "富士山くらい" },
        { threshold:  2200.0,  text: "エベレストくらい" },
        { threshold:  3000.0,  text: "アルプス山脈くらい" },
        { threshold:  4500.0,  text: "日本列島くらい" },
        { threshold:  6500.0,  text: "先生の管轄エリアくらい" },
        { threshold:  9000.0,  text: "グレートバリアリーフくらい" },
        { threshold: 13000.0,  text: "アフリカ大陸くらい" },
        { threshold: 18000.0,  text: "月までの距離くらい" },
        { threshold: 25000.0,  text: "地球くらい" },
        { threshold: 38000.0,  text: "木星くらい" },
        { threshold: 55000.0,  text: "土星の環くらい" },
        { threshold: 80000.0,  text: "太陽くらい" },
        { threshold: 130000.0, text: "太陽〜地球の距離（1AU）くらい" },
        { threshold: 250000.0, text: "シリウスくらい" },
        { threshold: 500000.0, text: "北極星くらい" },
        { threshold:  1.5e6,   text: "ベテルギウスくらい" },
        { threshold:  4.0e6,   text: "極超巨星VY大犬座くらい" },
        { threshold:  1.2e7,   text: "太陽系くらい" },
        { threshold:  4.0e7,   text: "オールトの雲くらい" },
        { threshold:  1.2e8,   text: "最近接恒星間距離くらい" },
        { threshold:  4.0e8,   text: "プレアデス星団くらい" },
        { threshold:  1.2e9,   text: "銀河系の厚みくらい" },
        { threshold:  4.0e9,   text: "銀河系の直径くらい" },
        { threshold:  1.2e10,  text: "大マゼラン雲くらい" },
        { threshold:  4.0e10,  text: "アンドロメダまでの距離くらい" },
        { threshold:  1.2e11,  text: "局所銀河群くらい" },
        { threshold:  4.0e11,  text: "おとめ座超銀河団くらい" },
        { threshold:  1.2e12,  text: "ラニアケア超銀河団くらい" },
        { threshold:  4.0e12,  text: "観測可能な宇宙くらい" },
        { threshold:  1.2e13,  text: "UEが支配する空間くらい" },
        { threshold:  4.0e13,  text: "キヴォトスの神々すら知らない大きさ" },
        { threshold:  1.2e14,  text: "多元宇宙くらい" },
        { threshold:  4.0e14,  text: "時間の外側くらい" },
        { threshold:  1.2e15,  text: "存在の概念そのものくらい" },
        { threshold:  4.0e15,  text: "ナツの「おぉ」の重みくらい" },
        { threshold:  1.0e16,  text: "もはや測定不可能" },
    ];


    // -----------------------------------------------------------------------
    // 背景ステージ定義
    // クリック数(clicks)またはサイズ倍率(scale)の閾値で切り替え
    // colorTop/colorBot: グラデーション上下色（fillRectで2分割で近似）
    // location: 場所名テキスト
    // -----------------------------------------------------------------------
    const STAGES = [
        {
            clicks: 0,     scale: 1,
            colorTop: "#1a1a2e", colorBot: "#16213e",
            starColor: "#ffffff", starCount: 30,
            location: "アビドス高校",
        },
        {
            clicks: 100,   scale: 10,
            colorTop: "#2d1b00", colorBot: "#1a0f00",
            starColor: "#ffcc66", starCount: 20,
            location: "ゲヘナ学園",
        },
        {
            clicks: 300,   scale: 50,
            colorTop: "#001a33", colorBot: "#000d1a",
            starColor: "#88ccff", starCount: 35,
            location: "トリニティ総合学園",
        },
        {
            clicks: 600,   scale: 200,
            colorTop: "#0a001a", colorBot: "#050010",
            starColor: "#cc88ff", starCount: 40,
            location: "ミレニアムサイエンススクール",
        },
        {
            clicks: 1000,  scale: 800,
            colorTop: "#001a10", colorBot: "#000d08",
            starColor: "#66ffaa", starCount: 25,
            location: "ヴァルキューレ警察学校",
        },
        {
            clicks: 1500,  scale: 3000,
            colorTop: "#1a0010", colorBot: "#0d0008",
            starColor: "#ff88cc", starCount: 45,
            location: "アリウス分校",
        },
        {
            clicks: 2500,  scale: 15000,
            colorTop: "#0a0a00", colorBot: "#050500",
            starColor: "#ffff88", starCount: 60,
            location: "シャーレ（対策委員会本部）",
        },
        {
            clicks: 4000,  scale: 80000,
            colorTop: "#000022", colorBot: "#000011",
            starColor: "#aaaaff", starCount: 80,
            location: "キヴォトス上空",
        },
        {
            clicks: 6000,  scale: 5e5,
            colorTop: "#000000", colorBot: "#020008",
            starColor: "#ffffff", starCount: 100,
            location: "月軌道付近",
        },
        {
            clicks: 9000,  scale: 1e7,
            colorTop: "#000005", colorBot: "#000000",
            starColor: "#ffddaa", starCount: 120,
            location: "太陽系の果て",
        },
        {
            clicks: 13000, scale: 1e10,
            colorTop: "#000000", colorBot: "#000000",
            starColor: "#ccccff", starCount: 150,
            location: "銀河系中枢",
        },
        {
            clicks: 18000, scale: 1e13,
            colorTop: "#000000", colorBot: "#030000",
            starColor: "#ff9944", starCount: 80,
            location: "観測可能な宇宙の果て",
        },
        {
            clicks: 25000, scale: 1e16,
            colorTop: "#050000", colorBot: "#000000",
            starColor: "#ff4444", starCount: 40,
            location: "キヴォトスの外側",
        },
    ];

    // レイアウト定数
    const SHOP_W   = 200;
    const STATUS_H = 56;
    const ITEM_H   = 46;
    const GAME_W   = () => Graphics.width - SHOP_W;
    const GAME_H   = () => Graphics.height - STATUS_H;

    PluginManager.registerCommand(PLUGIN_NAME, "startNatsuGame", () => {
        SceneManager.push(Scene_NatsuGame);
    });

    // -----------------------------------------------------------------------
    class Scene_NatsuGame extends Scene_Base {
        create() {
            super.create();
            // $gameSystemから状態を復元（ガチャ画面から戻ってきた場合など）
            const _sv = $gameSystem._natsuSave || {};
            this._scale        = _sv.scale       || 1.0;
            this._renderScale  = 1.0;  // 画像読み込み後に再設定
            this._baseScale    = 1.0;
            this._clickCount   = _sv.clickCount  || 0;
            this._ooPoints     = _sv.ooPoints    || 0;
            this._multiplier   = _sv.multiplier  || 1;
            this._bubbles      = [];
            this._flashFrame   = 0;
            this._resetting    = false;
            this._bounceFrame  = 0;
            this._purchasedIds = new Set(_sv.purchasedIds || []);
            this._stageIndex   = _sv.stageIndex  || 0;
            this._stageAnim    = 0;
            this._locationFrame = 0;
            this._volDragging   = null;

            this._createBackground();
            this._createFlashLayer();
            this._createNatsu();
            this._createLocationBanner();
            this._createStatusBar();
            this._createShopPanel();
            this._createVolumePanel();
            this._createReturnButton();
        }

        // ガチャ画面から戻ってきた時に状態を反映
        start() {
            super.start();
            // ステージを復元（背景を即時適用）
            if (this._stageIndex > 0) {
                this._applyStage(this._stageIndex, true);
            }
            this._redrawStatus();
            for (let j = 0; j < POWERS.length; j++) this._redrawShopItem(j);
        }

        // ------------------------------------------------------------------
        // 背景
        // ------------------------------------------------------------------
        _createBackground() {
            // ベース背景（2段fillRect でグラデ近似）
            this._bgTop = new Sprite(new Bitmap(Graphics.width, Graphics.height));
            this._bgBot = new Sprite(new Bitmap(Graphics.width, Graphics.height));
            this.addChild(this._bgTop);
            this.addChild(this._bgBot);

            // 星
            this._stars = [];
            this._starCanvas = new Sprite(new Bitmap(Graphics.width, Graphics.height));
            this.addChild(this._starCanvas);

            // 右パネル背景
            const panelBmp = new Bitmap(SHOP_W, Graphics.height);
            panelBmp.fillRect(0, 0, SHOP_W, Graphics.height, "#0d0820");
            panelBmp.fillRect(0, 0, 2, Graphics.height, "#6644aa");
            this._shopBg = new Sprite(panelBmp);
            this._shopBg.x = GAME_W();
            this.addChild(this._shopBg);

            this._applyStage(0, true);
        }

        _applyStage(idx, instant) {
            const s    = STAGES[idx];
            const gw   = Graphics.width;
            const gh   = Graphics.height;
            const half = Math.floor(gh / 2);
            const bgImg = STAGE_BG_IMAGES[idx] || "";

            if (bgImg) {
                // 背景画像あり：bgTopをフルサイズ画像スプライトとして使用
                this._bgTop.bitmap.clear();
                this._bgBot.bitmap.clear();
                this._bgBot.y = 0;
                const bmp = ImageManager.loadParallax(bgImg);
                bmp.addLoadListener(() => {
                    // 画面サイズにストレッチ描画
                    this._bgTop.bitmap = new Bitmap(gw, gh);
                    this._bgTop.bitmap.blt(bmp, 0, 0, bmp.width, bmp.height, 0, 0, gw, gh);
                });
            } else {
                // カラー背景
                this._bgTop.bitmap.clear();
                this._bgTop.bitmap.fillRect(0, 0, gw, half, s.colorTop);
                this._bgBot.bitmap.clear();
                this._bgBot.bitmap.fillRect(0, 0, gw, gh - half, s.colorBot);
                this._bgBot.y = half;
            }

            // 星を再生成
            this._stars = [];
            for (let i = 0; i < s.starCount; i++) {
                this._stars.push({
                    x:     Math.random() * GAME_W(),
                    y:     Math.random() * GAME_H(),
                    r:     Math.random() * 2 + 0.5,
                    alpha: Math.random(),
                    speed: Math.random() * 0.02 + 0.005,
                    color: s.starColor,
                });
            }

            if (!instant) {
                this._locationFrame = 180; // 3秒表示
                this._redrawLocationBanner(s);
            }
        }

        _checkStageChange() {
            let newIdx = 0;
            for (let i = 0; i < STAGES.length; i++) {
                const s = STAGES[i];
                if (this._clickCount >= s.clicks || this._scale >= s.scale) {
                    newIdx = i;
                }
            }
            if (newIdx !== this._stageIndex) {
                this._stageIndex = newIdx;
                this._applyStage(newIdx, false);
            }
        }

        // ------------------------------------------------------------------
        // フラッシュ
        // ------------------------------------------------------------------
        _createFlashLayer() {
            this._flashSprite = new Sprite(new Bitmap(Graphics.width, Graphics.height));
            this._flashSprite.opacity = 0;
        }

        // ------------------------------------------------------------------
        // ロケーションバナー（画面中央に一時表示）
        // ------------------------------------------------------------------
        _createLocationBanner() {
            this._locBmp = new Bitmap(GAME_W(), 70);
            this._locSp  = new Sprite(this._locBmp);
            this._locSp.x = 0;
            this._locSp.y = GAME_H() / 2 - 35;
            this._locSp.opacity = 0;
            // ナツの後ろに来るよう先に追加（ナツaddChild後に上書きされる）
        }

        _redrawLocationBanner(stage) {
            const bmp = this._locBmp;
            const w   = bmp.width;
            const h   = 70;
            bmp.clear();

            // ブルーアーカイブ風：水色〜白の半透明グラデーション帯
            // 左端・右端を薄く、中央を少し濃くするため3分割で近似
            const thirds = Math.floor(w / 3);

            bmp.paintOpacity = 0;
            bmp.fillRect(0, 0, w, h, "#000000");
            bmp.paintOpacity = 255;

            // メインの帯（中央寄り・水色）
            bmp.paintOpacity = 200;
            bmp.fillRect(0, 0, w, h, "#aad4e8");
            bmp.paintOpacity = 255;

            // 左端フェード（白でオーバーレイ）
            bmp.paintOpacity = 120;
            bmp.fillRect(0, 0, thirds, h, "#ddeeff");
            bmp.paintOpacity = 255;

            // 右端フェード
            bmp.paintOpacity = 120;
            bmp.fillRect(w - thirds, 0, thirds, h, "#ddeeff");
            bmp.paintOpacity = 255;

            // 斜めラインの装飾（BA特有の菱形ライン風を直線で近似）
            bmp.paintOpacity = 60;
            for (let i = 0; i < 6; i++) {
                const lx = Math.floor(w * 0.55) + i * 28;
                bmp.fillRect(lx, 0, 12, h, "#ffffff");
            }
            bmp.paintOpacity = 255;

            // 上下の細いボーダーライン（白）
            bmp.paintOpacity = 180;
            bmp.fillRect(0, 0, w, 2, "#ffffff");
            bmp.fillRect(0, h - 2, w, 2, "#ffffff");
            bmp.paintOpacity = 255;

            // 場所名テキスト（濃紺・中央寄り）
            bmp.fontSize = 24;
            bmp.textColor = "#1a3a5c";
            bmp.fontBold = true;
            bmp.drawText(stage.location, 0, 16, w, 38, "center");
            bmp.fontBold = false;
        }

        // ------------------------------------------------------------------
        // ナツ
        // ------------------------------------------------------------------
        _createNatsu() {
            this._natsuSprite = new Sprite();
            this._natsuSprite.bitmap = ImageManager.loadPicture(IMAGE_NAME);
            this._natsuSprite.bitmap.addLoadListener(() => {
                const bh = this._natsuSprite.bitmap.height;
                this._baseScale   = (GAME_H() * 0.40) / bh;
                this._renderScale = this._baseScale;

                this._natsuSprite.anchor.set(0.5, 0.5);
                this._natsuSprite.x = GAME_W() / 2;
                this._natsuSprite.y = GAME_H() / 2;
                this._natsuSprite.scale.set(this._renderScale);

                // ナツ→バナー→フラッシュの順（バナーがナツの前面に出る）
                this.addChild(this._natsuSprite);
                this.addChild(this._locSp);
                this.addChild(this._flashSprite);
            });
        }

        // ------------------------------------------------------------------
        // ステータスバー（下部固定）
        // ------------------------------------------------------------------
        _createStatusBar() {
            const w = GAME_W();
            this._statusBarBg = new Sprite(new Bitmap(w, STATUS_H));
            this._statusBarBg.bitmap.fillRect(0, 0, w, STATUS_H, "#000000");
            this._statusBarBg.bitmap.fillRect(0, 0, w, 2, "#6644aa");
            this._statusBarBg.x = 0;
            this._statusBarBg.y = Graphics.height - STATUS_H;
            this._statusBarBg.opacity = 210;

            this._statusBmp = new Bitmap(w, STATUS_H);
            this._statusSp  = new Sprite(this._statusBmp);
            this._statusSp.x = 0;
            this._statusSp.y = Graphics.height - STATUS_H;

            this.addChild(this._statusBarBg);
            this.addChild(this._statusSp);
            this._redrawStatus();

        }


        _formatScale(s) {
            if (s < 1e4)  return Math.round(s).toLocaleString();
            if (s < 1e8)  return (s / 1e4).toFixed(1) + "万";
            if (s < 1e12) return (s / 1e8).toFixed(2) + "億";
            if (s < 1e16) return (s / 1e12).toFixed(2) + "兆";
            return s.toExponential(2);
        }

        _getSizeLabel() {
            let label = SIZE_LABELS[0].text;
            for (const e of SIZE_LABELS) {
                if (this._scale >= e.threshold) label = e.text;
            }
            return label;
        }

        _redrawStatus() {
            const bmp = this._statusBmp;
            const w   = bmp.width;
            bmp.clear();

            bmp.fontSize = 17;
            bmp.textColor = "#ffe4f0";
            bmp.drawText(`クリック: ${this._clickCount}`, 8, 2, 160, 24, "left");

            bmp.textColor = "#ffe080";
            bmp.drawText(`おぉPt: ${this._ooPoints}`, 170, 2, 160, 24, "left");

            bmp.textColor = "#ff80c0";
            bmp.drawText(`Pt取得 x${this._multiplier}`, 340, 2, 140, 24, "left");

            bmp.fontSize = 16;
            bmp.textColor = "#c9b8ff";
            bmp.drawText(`サイズ: ${this._formatScale(this._scale)}%`, 8, 28, 180, 24, "left");

            bmp.textColor = "#ffdd88";
            bmp.drawText(`▶ ${this._getSizeLabel()}`, 196, 28, w - 200, 24, "left");

        }

        // ------------------------------------------------------------------
        // ショップパネル（右固定）
        // ------------------------------------------------------------------
        _createShopPanel() {
            const x  = GAME_W() + 2;
            const pw = SHOP_W - 2;

            const hdrBmp = new Bitmap(pw, 36);
            hdrBmp.fontSize = 15;
            hdrBmp.textColor = "#ddc0ff";
            hdrBmp.drawText("🛒 パワーショップ", 0, 4, pw, 28, "center");
            const hdrSp = new Sprite(hdrBmp);
            hdrSp.x = x;
            hdrSp.y = 4;
            this.addChild(hdrSp);

            this._shopItemSprites = [];
            for (let i = 0; i < POWERS.length; i++) {
                const bmp = new Bitmap(pw, ITEM_H);
                const sp  = new Sprite(bmp);
                sp.x = x;
                sp.y = 42 + i * (ITEM_H + 2);
                sp._pwrIndex = i;
                this.addChild(sp);
                this._shopItemSprites.push(sp);
                this._redrawShopItem(i);
            }
        }

        _redrawShopItem(i) {
            const pw  = POWERS[i];
            const sp  = this._shopItemSprites[i];
            const bmp = sp.bitmap;
            const own = this._purchasedIds.has(pw.id);
            const can = !own && this._ooPoints >= pw.cost;
            const w   = bmp.width;

            bmp.clear();
            bmp.fillRect(0, 0, w, ITEM_H, own ? "#1e1030" : (can ? "#2d1055" : "#160a28"));
            bmp.fillRect(0, 0, 3, ITEM_H, own ? "#446644" : (can ? "#aa66ff" : "#443355"));

            bmp.fontSize = 13;
            bmp.textColor = own ? "#778866" : (can ? "#eeddff" : "#554466");
            bmp.drawText(pw.label, 6, 2, w - 8, 20, "left");

            bmp.fontSize = 15;
            bmp.textColor = own ? "#556655" : (can ? "#cc88ff" : "#443355");
            bmp.drawText(pw.desc, 6, 22, 60, 20, "left");

            if (own) {
                bmp.fontSize = 13;
                bmp.textColor = "#44aa66";
                bmp.drawText("✓ 購入済", 70, 22, w - 76, 20, "right");
            } else {
                bmp.fontSize = 12;
                bmp.textColor = can ? "#ffdd44" : "#886644";
                bmp.drawText(`${pw.cost}pt`, 70, 22, 55, 20, "left");
                if (can) {
                    bmp.fillRect(w - 50, 6, 46, ITEM_H - 12, "#5522aa");
                    bmp.fontSize = 13;
                    bmp.textColor = "#ffffff";
                    bmp.drawText("購入", w - 50, 8, 46, ITEM_H - 16, "center");
                }
            }
        }

        // ------------------------------------------------------------------
        // 音量パネル（右パネル下部）
        // ------------------------------------------------------------------
        _createVolumePanel() {
            const x  = GAME_W() + 2;
            const pw = SHOP_W - 2;
            // ショップアイテム10個 × (ITEM_H+2) + ヘッダー42px の下
            const panelY = 42 + POWERS.length * (ITEM_H + 2) + 8;

            // パネル背景
            const panelH = 55;
            const bgBmp  = new Bitmap(pw, panelH);
            bgBmp.fillRect(0, 0, pw, 2, "#6644aa");
            bgBmp.fillRect(0, 0, pw, panelH, "#0a0618");
            bgBmp.fillRect(0, 0, pw, 2, "#6644aa");
            this._volPanelSp = new Sprite(bgBmp);
            this._volPanelSp.x = x;
            this._volPanelSp.y = panelY;
            this.addChild(this._volPanelSp);

            // ヘッダー
            const hdrBmp = new Bitmap(pw, 24);
            hdrBmp.fontSize = 13;
            hdrBmp.textColor = "#ddc0ff";
            hdrBmp.drawText("🔊 音量", 0, 2, pw, 20, "center");
            const hdrSp = new Sprite(hdrBmp);
            hdrSp.x = x;
            hdrSp.y = panelY + 4;
            this.addChild(hdrSp);

            // スライダー1本：SE のみ
            this._volSliders = [];
            const labels  = ["音量"];
            const getVols = [
                () => AudioManager.seVolume,
            ];
            const setVols = [
                v => { AudioManager.seVolume = v; ConfigManager.seVolume = v; ConfigManager.save(); },
            ];

            for (let i = 0; i < 1; i++) {
                const sy = panelY + 28 + i * 34;
                // ラベル
                const lblBmp = new Bitmap(34, 20);
                lblBmp.fontSize = 12;
                lblBmp.textColor = "#aaaacc";
                lblBmp.drawText(labels[i], 0, 0, 34, 20, "left");
                const lblSp = new Sprite(lblBmp);
                lblSp.x = x + 4;
                lblSp.y = sy + 2;
                this.addChild(lblSp);

                // スライダートラック
                const trackW = pw - 50;
                const trackBmp = new Bitmap(trackW, 8);
                trackBmp.fillRect(0, 2, trackW, 4, "#2a1a40");
                const trackSp = new Sprite(trackBmp);
                trackSp.x = x + 38;
                trackSp.y = sy + 8;
                this.addChild(trackSp);

                // フィルバー（音量に応じて幅が変わる）
                const fillBmp = new Bitmap(trackW, 8);
                const fillSp  = new Sprite(fillBmp);
                fillSp.x = x + 38;
                fillSp.y = sy + 8;
                this.addChild(fillSp);

                // ノブ
                const knobBmp = new Bitmap(14, 14);
                knobBmp.fillRect(0, 0, 14, 14, "#aa66ff");
                knobBmp.fillRect(2, 2, 10, 10, "#cc99ff");
                const knobSp = new Sprite(knobBmp);
                knobSp.anchor.set(0.5, 0.5);
                knobSp.y = sy + 12;
                this.addChild(knobSp);

                // 数値表示
                const valBmp = new Bitmap(28, 20);
                const valSp  = new Sprite(valBmp);
                valSp.x = x + pw - 28;
                valSp.y = sy + 2;
                this.addChild(valSp);

                const slider = {
                    trackX: x + 38, trackY: sy + 8, trackW,
                    fillSp, knobSp, valSp,
                    getVol: getVols[i], setVol: setVols[i],
                    index: i,
                };
                this._volSliders.push(slider);
                this._redrawSlider(slider);
            }
        }

        _redrawSlider(slider) {
            const vol    = slider.getVol();   // 0〜100
            const ratio  = vol / 100;
            const trackW = slider.trackW;

            // フィル
            const fillBmp = slider.fillSp.bitmap;
            fillBmp.clear();
            const fw = Math.max(1, Math.round(trackW * ratio));
            fillBmp.fillRect(0, 2, fw, 4, "#8844ff");

            // ノブ位置
            slider.knobSp.x = slider.trackX + Math.round(trackW * ratio);

            // 数値
            const valBmp = slider.valSp.bitmap;
            valBmp.clear();
            valBmp.fontSize = 11;
            valBmp.textColor = "#ccaaff";
            valBmp.drawText(String(vol), 0, 0, 28, 20, "right");
        }

        _hitTestSlider(tx, ty) {
            for (const sl of this._volSliders) {
                if (tx >= sl.trackX - 10 && tx <= sl.trackX + sl.trackW + 10 &&
                    ty >= sl.trackY - 10 && ty <= sl.trackY + 18) {
                    return sl;
                }
            }
            return null;
        }

        _applySliderDrag(sl, tx) {
            const ratio = Math.max(0, Math.min(1, (tx - sl.trackX) / sl.trackW));
            const vol   = Math.round(ratio * 100);
            sl.setVol(vol);
            this._redrawSlider(sl);
        }

        // ------------------------------------------------------------------
        // 戻るボタン（削除済み）
        // ------------------------------------------------------------------
        _createReturnButton() {
            // タイトルへボタンは使用しない
        }

        // ------------------------------------------------------------------
        // エフェクト類
        // ------------------------------------------------------------------
        _spawnBubble(x, y) {
            const bmp = new Bitmap(140, 58);
            bmp.fillRect(4, 4, 132, 40, "#fff0f8");
            bmp.strokeRect(4, 4, 132, 40, "#ff9ac0");
            bmp.fillRect(52, 42, 18, 10, "#fff0f8");
            bmp.fontSize = 20;
            bmp.textColor = "#cc2060";
            bmp.drawText("おぉ", 4, 4, 132, 40, "center");
            const sp = new Sprite(bmp);
            sp.anchor.set(0.5, 1);
            sp.x = x + (Math.random() - 0.5) * 50;
            sp.y = Math.min(y - 10, GAME_H() - 10);
            sp._life = 80;
            this.addChild(sp);
            this._bubbles.push(sp);
        }

        _playSound() {
            if (SOUND_NAME) {
                AudioManager.playSe({ name: SOUND_NAME, volume: 90, pitch: 100, pan: 0 });
            } else {
                SoundManager.playCursor();
            }
        }

        _spawnHearts(cx, cy) {
            for (let i = 0; i < 5; i++) {
                const bmp = new Bitmap(28, 28);
                bmp.fontSize = 20;
                bmp.drawText("♥", 0, 0, 28, 28, "center");
                const sp = new Sprite(bmp);
                sp.anchor.set(0.5, 0.5);
                sp.x = cx + (Math.random() - 0.5) * 70;
                sp.y = cy + (Math.random() - 0.5) * 70;
                sp._vx   = (Math.random() - 0.5) * 4;
                sp._vy   = -(Math.random() * 3 + 1);
                sp._life = 50;
                sp.opacity = 255;
                this.addChild(sp);
                this._bubbles.push(sp);
            }
        }

        _startFlash() {
            this._flashSprite.bitmap.fillAll("#ffffff");
            this._flashFrame = 50;
            this._resetting  = true;
        }

        // 画面いっぱい判定：最大サイズをかなり大きく（画面の20倍相当）
        _isFullScreen() {
            if (!this._natsuSprite || !this._natsuSprite.bitmap.isReady()) return false;
            const bw = this._natsuSprite.bitmap.width  * this._renderScale;
            const bh = this._natsuSprite.bitmap.height * this._renderScale;
            // ゲームエリアの3倍以上になったらリセット（見た目上は大きくはみ出す）
            return bw >= GAME_W() * 3 || bh >= GAME_H() * 3;
        }

        // ------------------------------------------------------------------
        // update
        // ------------------------------------------------------------------
        update() {
            // super.update()はWindowLayerを前提とするためスキップ
            this.updateChildren();
            this._handleInput();
            this._updateBubbles();
            this._updateStars();
            this._updateFlash();
            this._updateLocationBanner();
            this._animateNatsu();
        }

        terminate() {
            // スプライトはGCに任せる
        }

        isBusy() {
            return false;
        }

        _handleInput() {
            if (this._resetting) return;

            // スライダードラッグ処理（move/release）
            if (this._volDragging) {
                if (TouchInput.isPressed()) {
                    this._applySliderDrag(this._volDragging, TouchInput.x);
                } else {
                    this._volDragging = null;
                }
                return;
            }

            if (!TouchInput.isTriggered()) return;

            const tx = TouchInput.x;
            const ty = TouchInput.y;

            // ガチャボタン判定
            // ショップ＆音量スライダー（右パネル全体）
            if (tx >= GAME_W()) {
                // ショップアイテム
                for (let i = 0; i < this._shopItemSprites.length; i++) {
                    const sp = this._shopItemSprites[i];
                    if (ty >= sp.y && ty <= sp.y + ITEM_H) {
                        this._tryPurchase(i);
                        return;
                    }
                }
                // 音量スライダー
                if (this._volSliders) {
                    const sl = this._hitTestSlider(tx, ty);
                    if (sl) {
                        this._volDragging = sl;
                        this._applySliderDrag(sl, tx);
                        return;
                    }
                }
                return;
            }

            // ステータスバー除外
            if (ty >= Graphics.height - STATUS_H) return;

            // ナツクリック
            if (this._natsuSprite && this._natsuSprite.bitmap.isReady()) {
                const sp   = this._natsuSprite;
                const bw   = sp.bitmap.width  * this._renderScale;
                const bh   = sp.bitmap.height * this._renderScale;
                const left = sp.x - bw / 2;
                const top  = sp.y - bh / 2;
                if (tx >= left && tx <= left + bw && ty >= top && ty <= top + bh) {
                    this._onNatsuClick(tx, ty);
                }
            }
        }

        _tryPurchase(i) {
            const pw = POWERS[i];
            if (this._purchasedIds.has(pw.id)) return;
            if (this._ooPoints < pw.cost) return;

            this._ooPoints -= pw.cost;
            this._purchasedIds.add(pw.id);

            let maxMult = 1;
            for (const id of this._purchasedIds) {
                maxMult = Math.max(maxMult, POWERS[id].ptMult);
            }
            this._multiplier = maxMult;

            for (let j = 0; j < POWERS.length; j++) this._redrawShopItem(j);
            this._redrawStatus();
            this._saveState();
            SoundManager.playOk();
        }

        _saveState() {
            $gameSystem._natsuSave = {
                scale:        this._scale,
                clickCount:   this._clickCount,
                ooPoints:     this._ooPoints,
                multiplier:   this._multiplier,
                stageIndex:   this._stageIndex,
                purchasedIds: Array.from(this._purchasedIds),
            };
            $gameSystem._ooPoints = this._ooPoints;
        }

        _onNatsuClick(tx, ty) {
            this._clickCount++;
            this._ooPoints += this._multiplier;  // ptMultを加算に反映

            const effectiveRate = Math.pow(BASE_GROWTH_RATE, 1);  // 成長率は常に基本値
            this._scale       *= effectiveRate;
            this._renderScale *= effectiveRate;
            this._natsuSprite.scale.set(this._renderScale);

            this._checkStageChange();
            this._redrawStatus();
            for (let j = 0; j < POWERS.length; j++) this._redrawShopItem(j);
            this._saveState();

            this._spawnBubble(
                this._natsuSprite.x,
                this._natsuSprite.y - this._natsuSprite.bitmap.height * this._renderScale * 0.45
            );
            this._spawnHearts(tx, ty);
            this._playSound();
            this._bounceFrame = 12;

            if (this._isFullScreen()) this._startFlash();
        }

        _updateFlash() {
            if (this._flashFrame <= 0) return;
            this._flashFrame--;
            if (this._flashFrame > 25) {
                this._flashSprite.opacity = Math.round(((50 - this._flashFrame) / 25) * 230);
            } else {
                this._flashSprite.opacity = Math.round((this._flashFrame / 25) * 230);
            }
            if (this._flashFrame === 0) {
                this._renderScale = this._baseScale;
                this._natsuSprite.scale.set(this._renderScale);
                this._resetting = false;
                this._flashSprite.opacity = 0;
            }
        }

        _updateLocationBanner() {
            if (this._locationFrame <= 0) return;
            this._locationFrame--;

            // フェードイン（最初の20f）/ 表示（中間）/ フェードアウト（最後の40f）
            if (this._locationFrame > 160) {
                this._locSp.opacity = Math.round(((180 - this._locationFrame) / 20) * 255);
            } else if (this._locationFrame > 40) {
                this._locSp.opacity = 255;
            } else {
                this._locSp.opacity = Math.round((this._locationFrame / 40) * 255);
            }
            if (this._locationFrame === 0) this._locSp.opacity = 0;
        }

        _updateBubbles() {
            for (let i = this._bubbles.length - 1; i >= 0; i--) {
                const sp = this._bubbles[i];
                sp._life--;
                if (sp._vx !== undefined) {
                    sp.x += sp._vx;
                    sp.y += sp._vy;
                    sp._vy += 0.1;
                    sp.opacity = Math.round((sp._life / 50) * 255);
                } else {
                    sp.y -= 0.6;
                    if (sp._life < 30) sp.opacity = Math.round((sp._life / 30) * 255);
                }
                if (sp._life <= 0) {
                    this.removeChild(sp);
                    this._bubbles.splice(i, 1);
                }
            }
        }

        _updateStars() {
            const bmp = this._starCanvas.bitmap;
            bmp.clear();
            for (const star of this._stars) {
                star.alpha += star.speed;
                if (star.alpha > 1) {
                    star.alpha = 0;
                    star.x = Math.random() * GAME_W();
                    star.y = Math.random() * GAME_H();
                }
                const a = Math.abs(Math.sin(star.alpha * Math.PI));
                bmp.paintOpacity = Math.round(a * 180);
                bmp.fillRect(star.x, star.y, star.r * 2, star.r * 2, star.color || "#ffffff");
            }
            bmp.paintOpacity = 255;
        }


                _animateNatsu() {
            if (!this._natsuSprite || this._resetting) return;
            if (this._bounceFrame > 0) {
                this._bounceFrame--;
                const ratio = this._bounceFrame / 12;
                const bump  = 1 + Math.sin(ratio * Math.PI) * 0.08;
                this._natsuSprite.scale.set(this._renderScale * bump);
            } else {
                const breath = 1 + Math.sin(Graphics.frameCount * 0.04) * 0.012;
                this._natsuSprite.scale.set(this._renderScale * breath);
            }
        }
    }

    window.Scene_NatsuGame = Scene_NatsuGame;

})();
