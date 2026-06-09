//=============================================================================
// NatsuGacha.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc ブルアカ風ガチャシステム（おぉポイント消費）
 * @author Claude
 *
 * @param costSingle
 * @text 1回引くコスト
 * @default 10
 * @type number
 * @min 1
 *
 * @param costTen
 * @text 10連コスト
 * @default 90
 * @type number
 * @min 1
 *
 * @param rateSSR
 * @text SSR排出率(%)
 * @default 3
 * @type number
 * @decimals 1
 * @min 0.1
 * @max 100
 *
 * @param rateSR
 * @text SR排出率(%)
 * @default 18.5
 * @type number
 * @decimals 1
 *
 * @param pityCount
 * @text ピティ（天井）回数
 * @desc この回数引くとSSR確定
 * @default 200
 * @type number
 * @min 1
 *
 * @command openGacha
 * @text ガチャを開く
 * @desc ガチャ画面を開きます（NatsuClickGameと共有のおぉポイントを使用）
 *
 * @help
 * ============================================================================
 * NatsuGacha - ブルアカ風ガチャ
 * ============================================================================
 * NatsuClickGame.js と併用してください。
 * おぉポイントを $gameSystem.ooPoints として共有します。
 *
 * 使い方:
 * 1. NatsuClickGame.js より後にプラグイン管理に追加
 * 2. イベントのプラグインコマンドから「ガチャを開く」を選択
 *
 * ガチャ結果はキャラ画像が不要でも楽しめるよう
 * テキスト＋エフェクトで演出します。
 * img/pictures/ に以下のファイルを置くと画像表示されます：
 *   gacha_ssr_1.png 〜 gacha_ssr_N.png
 *   gacha_sr_1.png  〜 gacha_sr_N.png
 *   gacha_r_1.png   〜 gacha_r_N.png
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN_NAME  = "NatsuGacha";
    const params       = PluginManager.parameters(PLUGIN_NAME);
    const COST_SINGLE  = parseInt(params.costSingle)  || 10;
    const COST_TEN     = parseInt(params.costTen)     || 90;
    const RATE_SSR     = parseFloat(params.rateSSR)   || 3.0;
    const RATE_SR      = parseFloat(params.rateSR)    || 18.5;
    const PITY_COUNT   = parseInt(params.pityCount)   || 200;

    // ブルアカ風キャラ名プール（画像なしでも機能するダミーデータ）
    const POOL_SSR = [
        { name: "ホシノ",       school: "アビドス",       role: "アタッカー" },
        { name: "シロコ*テラー", school: "アビドス",       role: "スペシャル" },
        { name: "カリン",        school: "ヴァルキューレ",  role: "アタッカー" },
        { name: "ヒエロニムス",  school: "ゲヘナ",         role: "スペシャル" },
        { name: "ナギサ",        school: "トリニティ",      role: "サポート"   },
        { name: "チェリノ",      school: "ゲヘナ",         role: "サポート"   },
        { name: "ツルギ",        school: "山海経",         role: "アタッカー" },
        { name: "アコ",          school: "トリニティ",      role: "サポート"   },
    ];
    const POOL_SR = [
        { name: "ハルナ",    school: "ゲヘナ",        role: "アタッカー" },
        { name: "ムツキ",    school: "アビドス",      role: "アタッカー" },
        { name: "アスナ",    school: "ミレニアム",    role: "アタッカー" },
        { name: "コタマ",    school: "トリニティ",    role: "ヒーラー"   },
        { name: "ヒフミ",    school: "トリニティ",    role: "タンク"     },
        { name: "ノノミ",    school: "アビドス",      role: "サポート"   },
        { name: "セリカ",    school: "アビドス",      role: "アタッカー" },
        { name: "ジュンコ",  school: "ゲヘナ",        role: "サポート"   },
    ];
    const POOL_R = [
        { name: "チナツ",    school: "アビドス",      role: "ヒーラー"   },
        { name: "アカリ",    school: "トリニティ",    role: "サポート"   },
        { name: "マリナ",    school: "ミレニアム",    role: "アタッカー" },
        { name: "フウカ",    school: "山海経",        role: "タンク"     },
        { name: "スミレ",    school: "アビドス",      role: "サポート"   },
        { name: "ナツ",      school: "アビドス",      role: "スペシャル" },
    ];

    // おぉポイントの共有ストレージ（NatsuClickGameと連携）
    function getPoints()    { return $gameSystem._ooPoints || 0; }
    function setPoints(v)   { $gameSystem._ooPoints = Math.max(0, v); }

    PluginManager.registerCommand(PLUGIN_NAME, "openGacha", () => {
        SceneManager.push(Scene_NatsuGacha);
    });

    // -----------------------------------------------------------------------
    // ガチャロジック
    // -----------------------------------------------------------------------
    function rollOne(pityCounter) {
        const roll = Math.random() * 100;
        // ピティ補正：残り20回以内でSSR確率上昇
        const remaining = PITY_COUNT - pityCounter;
        const ssrRate   = remaining <= 20
            ? RATE_SSR + (20 - remaining) * 4
            : RATE_SSR;

        if (roll < ssrRate) {
            return { rarity: "SSR", ...POOL_SSR[Math.floor(Math.random() * POOL_SSR.length)], pityReset: true };
        } else if (roll < ssrRate + RATE_SR) {
            return { rarity: "SR",  ...POOL_SR[Math.floor(Math.random() * POOL_SR.length)],  pityReset: false };
        } else {
            return { rarity: "R",   ...POOL_R[Math.floor(Math.random() * POOL_R.length)],    pityReset: false };
        }
    }

    function rollMulti(n, pityCounter) {
        const results = [];
        let pc = pityCounter;
        for (let i = 0; i < n; i++) {
            pc++;
            const r = rollOne(pc);
            if (r.pityReset || pc >= PITY_COUNT) pc = 0;
            results.push(r);
        }
        return { results, newPity: pc };
    }

    // -----------------------------------------------------------------------
    // Scene_NatsuGacha
    // -----------------------------------------------------------------------
    class Scene_NatsuGacha extends Scene_Base {
        create() {
            super.create();
            this._phase       = "menu";   // menu | rolling | reveal | result
            this._results     = [];
            this._revealIdx   = 0;
            this._revealTimer = 0;
            this._particles   = [];
            this._waitTimer   = 0;
            this._pityCount   = $gameSystem._gachaPity || 0;

            this._createBg();
            this._createMenuUI();
            this._createResultLayer();
            this._createParticleLayer();
            this._createPityBar();
            this._createBackButton();
        }

        // ------------------------------------------------------------------
        _createBg() {
            this._bgBmp = new Bitmap(Graphics.width, Graphics.height);
            this._bgBmp.fillAll("#0a0818");
            this._bgSp  = new Sprite(this._bgBmp);
            this.addChild(this._bgSp);

            // 背景グリッド装飾
            const deco = new Bitmap(Graphics.width, Graphics.height);
            for (let x = 0; x < Graphics.width; x += 60) {
                deco.fillRect(x, 0, 1, Graphics.height, "#1a1040");
            }
            for (let y = 0; y < Graphics.height; y += 60) {
                deco.fillRect(0, y, Graphics.width, 1, "#1a1040");
            }
            this.addChild(new Sprite(deco));

            // タイトル帯（BA風）
            const titleBmp = new Bitmap(Graphics.width, 64);
            titleBmp.paintOpacity = 200;
            titleBmp.fillRect(0, 0, Graphics.width, 64, "#7ab8d8");
            titleBmp.paintOpacity = 120;
            titleBmp.fillRect(0, 0, Math.floor(Graphics.width / 3), 64, "#c8e8f8");
            titleBmp.fillRect(Graphics.width - Math.floor(Graphics.width / 3), 0, Math.floor(Graphics.width / 3), 64, "#c8e8f8");
            titleBmp.paintOpacity = 60;
            for (let i = 0; i < 8; i++) {
                titleBmp.fillRect(Math.floor(Graphics.width * 0.6) + i * 30, 0, 14, 64, "#ffffff");
            }
            titleBmp.paintOpacity = 200;
            titleBmp.fillRect(0, 0, Graphics.width, 2, "#ffffff");
            titleBmp.fillRect(0, 62, Graphics.width, 2, "#ffffff");
            titleBmp.paintOpacity = 255;
            titleBmp.fontSize = 28;
            titleBmp.textColor = "#1a3a5c";
            titleBmp.fontBold  = true;
            titleBmp.drawText("総力戦支援ガチャ", 0, 12, Graphics.width, 40, "center");
            titleBmp.fontBold = false;
            this.addChild(new Sprite(titleBmp));
        }

        // ------------------------------------------------------------------
        _createMenuUI() {
            const gw = Graphics.width;
            const gh = Graphics.height;

            // ポイント表示
            this._ptBmp = new Bitmap(gw, 40);
            this._ptSp  = new Sprite(this._ptBmp);
            this._ptSp.x = 0;
            this._ptSp.y = 72;
            this.addChild(this._ptSp);
            this._redrawPoints();

            // 1回ボタン
            this._btn1Bmp = new Bitmap(220, 60);
            this._btn1Sp  = new Sprite(this._btn1Bmp);
            this._btn1Sp.x = gw / 2 - 230;
            this._btn1Sp.y = gh - 130;
            this.addChild(this._btn1Sp);

            // 10連ボタン
            this._btn10Bmp = new Bitmap(220, 60);
            this._btn10Sp  = new Sprite(this._btn10Bmp);
            this._btn10Sp.x = gw / 2 + 10;
            this._btn10Sp.y = gh - 130;
            this.addChild(this._btn10Sp);

            this._redrawButtons();
        }

        _redrawPoints() {
            const bmp = this._ptBmp;
            bmp.clear();
            bmp.fontSize = 22;
            bmp.textColor = "#ffe080";
            bmp.drawText(`おぉPt: ${getPoints()}`, 0, 4, bmp.width, 32, "center");
        }

        _redrawButtons() {
            const pts  = getPoints();
            const can1  = pts >= COST_SINGLE;
            const can10 = pts >= COST_TEN;

            // 1回ボタン
            const b1 = this._btn1Bmp;
            b1.clear();
            b1.fillRect(0, 0, 220, 60, can1 ? "#4422aa" : "#221133");
            b1.fillRect(0, 0, 220, 3,  can1 ? "#aa88ff" : "#443355");
            b1.fillRect(0, 57, 220, 3, can1 ? "#aa88ff" : "#443355");
            b1.fontSize = 20;
            b1.textColor = can1 ? "#ffffff" : "#665577";
            b1.drawText("1回引く", 0, 4, 220, 28, "center");
            b1.fontSize = 16;
            b1.textColor = can1 ? "#ffdd88" : "#554466";
            b1.drawText(`${COST_SINGLE} おぉPt`, 0, 34, 220, 22, "center");

            // 10連ボタン
            const b10 = this._btn10Bmp;
            b10.clear();
            b10.fillRect(0, 0, 220, 60, can10 ? "#aa4400" : "#221100");
            b10.fillRect(0, 0, 220, 3,  can10 ? "#ffaa44" : "#443322");
            b10.fillRect(0, 57, 220, 3, can10 ? "#ffaa44" : "#443322");
            b10.fontSize = 20;
            b10.textColor = can10 ? "#ffffff" : "#665544";
            b10.drawText("10連引く", 0, 4, 220, 28, "center");
            b10.fontSize = 16;
            b10.textColor = can10 ? "#ffdd88" : "#554433";
            b10.drawText(`${COST_TEN} おぉPt`, 0, 34, 220, 22, "center");
        }

        // ------------------------------------------------------------------
        _createResultLayer() {
            this._resultLayer = new Sprite();
            this._resultLayer.x = 0;
            this._resultLayer.y = 0;
            this._resultLayer.opacity = 0;
            this.addChild(this._resultLayer);
        }

        _createParticleLayer() {
            this._particleBmp = new Bitmap(Graphics.width, Graphics.height);
            this._particleSp  = new Sprite(this._particleBmp);
            this.addChild(this._particleSp);
        }

        _createPityBar() {
            this._pityBmp = new Bitmap(400, 36);
            this._pitySp  = new Sprite(this._pityBmp);
            this._pitySp.x = Graphics.width / 2 - 200;
            this._pitySp.y = 118;
            this.addChild(this._pitySp);
            this._redrawPity();
        }

        _redrawPity() {
            const bmp  = this._pityBmp;
            bmp.clear();
            const pct  = this._pityCount / PITY_COUNT;
            const barW = 360;

            bmp.fontSize = 14;
            bmp.textColor = "#aaaacc";
            bmp.drawText(`天井: ${this._pityCount} / ${PITY_COUNT}`, 0, 0, 400, 20, "center");

            // バー背景
            bmp.fillRect(20, 20, barW, 10, "#221133");
            // バー
            const fillW = Math.round(barW * pct);
            if (fillW > 0) {
                const col = pct > 0.8 ? "#ff4444" : pct > 0.5 ? "#ffaa44" : "#8844ff";
                bmp.fillRect(20, 20, fillW, 10, col);
            }
        }

        _createBackButton() {
            const bmp = new Bitmap(140, 44);
            bmp.fillRect(0, 0, 140, 44, "#1a0830");
            bmp.fillRect(0, 0, 140, 2,  "#6644aa");
            bmp.fontSize = 18;
            bmp.textColor = "#ccaaff";
            bmp.drawText("← 戻る", 0, 0, 140, 44, "center");
            this._backSp  = new Sprite(bmp);
            this._backSp.x = 10;
            this._backSp.y = Graphics.height - 54;
            this.addChild(this._backSp);
        }

        // ------------------------------------------------------------------
        // 演出：カード1枚をリビールする
        // ------------------------------------------------------------------
        _buildResultCards(results) {
            // 既存カードを削除
            while (this._resultLayer.children.length) {
                this._resultLayer.removeChildAt(0);
            }

            const count  = results.length;
            const cardW  = count === 1 ? 260 : 120;
            const cardH  = count === 1 ? 320 : 160;
            const cols   = count === 1 ? 1 : 5;
            const rows   = count === 1 ? 1 : 2;
            const gapX   = count === 1 ? 0 : 14;
            const gapY   = count === 1 ? 0 : 14;
            const totalW = cols * cardW + (cols - 1) * gapX;
            const totalH = rows * cardH + (rows - 1) * gapY;
            const startX = (Graphics.width  - totalW) / 2;
            const startY = (Graphics.height - totalH) / 2;

            this._cards = [];
            for (let i = 0; i < count; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const x   = startX + col * (cardW + gapX);
                const y   = startY + row * (cardH + gapY);
                const res = results[i];

                const card = this._makeCard(res, cardW, cardH);
                card.x = x;
                card.y = y;
                card.opacity = 0;
                card._targetOpacity = 255;
                card._revealed = false;
                this._resultLayer.addChild(card);
                this._cards.push(card);
            }
        }

        _makeCard(res, w, h) {
            const container = new Sprite();

            const bmp = new Bitmap(w, h);

            // レアリティ別背景色
            const colors = {
                SSR: { bg: "#1a0800", border: "#ffcc00", glow: "#ffaa00", text: "#ffdd44" },
                SR:  { bg: "#000820", border: "#aaaaff", glow: "#6688ff", text: "#ccddff" },
                R:   { bg: "#0a0a10", border: "#446688", glow: "#334466", text: "#8899aa" },
            };
            const c = colors[res.rarity];

            // 背景
            bmp.fillRect(0, 0, w, h, c.bg);

            // ボーダー
            bmp.fillRect(0, 0, w, 3, c.border);
            bmp.fillRect(0, h - 3, w, 3, c.border);
            bmp.fillRect(0, 0, 3, h, c.border);
            bmp.fillRect(w - 3, 0, 3, h, c.border);

            // レアリティ表示
            bmp.fontSize = h > 200 ? 22 : 14;
            bmp.textColor = c.text;
            bmp.fontBold  = true;
            bmp.drawText(res.rarity, 0, 6, w, h > 200 ? 30 : 20, "center");
            bmp.fontBold = false;

            // キャラ名
            bmp.fontSize = h > 200 ? 28 : 16;
            bmp.textColor = "#ffffff";
            bmp.drawText(res.name, 0, h > 200 ? 80 : 36, w, h > 200 ? 40 : 24, "center");

            // 学校名
            bmp.fontSize = h > 200 ? 18 : 11;
            bmp.textColor = "#aabbcc";
            bmp.drawText(res.school, 0, h > 200 ? 130 : 64, w, h > 200 ? 26 : 18, "center");

            // ロール
            bmp.fontSize = h > 200 ? 16 : 10;
            bmp.textColor = c.text;
            bmp.drawText(res.role, 0, h > 200 ? 160 : 84, w, h > 200 ? 22 : 16, "center");

            container.addChild(new Sprite(bmp));
            container._rarity = res.rarity;
            return container;
        }

        // SSR用きらきらパーティクル
        _spawnSSRParticles(x, y) {
            for (let i = 0; i < 30; i++) {
                const bmp = new Bitmap(8, 8);
                bmp.fillRect(0, 0, 8, 8, "#ffcc44");
                const sp = new Sprite(bmp);
                sp.anchor.set(0.5, 0.5);
                sp.x = x;
                sp.y = y;
                const angle = (Math.random() * Math.PI * 2);
                const speed = Math.random() * 6 + 2;
                sp._vx   = Math.cos(angle) * speed;
                sp._vy   = Math.sin(angle) * speed;
                sp._life = 60 + Math.floor(Math.random() * 40);
                sp.opacity = 255;
                this._particleSp.addChild ? null : null;
                this.addChild(sp);
                this._particles.push(sp);
            }
        }

        // SR用パーティクル
        _spawnSRParticles(x, y) {
            for (let i = 0; i < 15; i++) {
                const bmp = new Bitmap(6, 6);
                bmp.fillRect(0, 0, 6, 6, "#aaaaff");
                const sp = new Sprite(bmp);
                sp.anchor.set(0.5, 0.5);
                sp.x = x + (Math.random() - 0.5) * 60;
                sp.y = y + (Math.random() - 0.5) * 60;
                sp._vx   = (Math.random() - 0.5) * 4;
                sp._vy   = -(Math.random() * 3 + 1);
                sp._life = 40;
                sp.opacity = 255;
                this.addChild(sp);
                this._particles.push(sp);
            }
        }

        // ------------------------------------------------------------------
        // update / terminate / isBusy
        // ------------------------------------------------------------------
        update() {
            if (this._leaving) return;
            // super.update()はWindowLayer等を前提とするためスキップし必要分だけ呼ぶ
            this.updateChildren();
            this._updateInput();
            this._updateReveal();
            this._updateParticles();
        }

        // MZコアのterminateはWindowLayerを前提とするのでオーバーライド
        terminate() {
            // 何もしない（スプライトはGCに任せる）
        }

        // フェード中フラグ（isBusy=falseで即遷移）
        isBusy() {
            return false;
        }

        _updateInput() {
            if (!TouchInput.isTriggered()) return;
            const tx = TouchInput.x;
            const ty = TouchInput.y;

            // 戻るボタン
            if (tx >= 10 && tx <= 150 &&
                ty >= Graphics.height - 54 && ty <= Graphics.height - 10) {
                this._leaving = true;
                if (typeof Scene_NatsuGame !== "undefined") {
                    SceneManager._stack = [];
                    SceneManager.goto(Scene_NatsuGame);
                } else {
                    SceneManager.goto(Scene_Map);
                }
                return;
            }

            if (this._phase === "menu") {
                // 1回引く
                const b1x = this._btn1Sp.x, b1y = this._btn1Sp.y;
                if (tx >= b1x && tx <= b1x + 220 && ty >= b1y && ty <= b1y + 60) {
                    if (getPoints() >= COST_SINGLE) this._startGacha(1);
                    return;
                }
                // 10連
                const b10x = this._btn10Sp.x, b10y = this._btn10Sp.y;
                if (tx >= b10x && tx <= b10x + 220 && ty >= b10y && ty <= b10y + 60) {
                    if (getPoints() >= COST_TEN) this._startGacha(10);
                    return;
                }
            }

            if (this._phase === "result") {
                // タップでメニューに戻る
                this._returnToMenu();
            }
        }

        _startGacha(n) {
            const cost = n === 1 ? COST_SINGLE : COST_TEN;
            setPoints(getPoints() - cost);

            const { results, newPity } = rollMulti(n, this._pityCount);
            this._pityCount = newPity;
            $gameSystem._gachaPity = this._pityCount;

            this._results   = results;
            this._revealIdx = 0;
            this._phase     = "reveal";

            this._resultLayer.opacity = 255;
            this._buildResultCards(results);
            this._redrawPoints();
            this._redrawPity();

            // メニューボタンを非表示
            this._btn1Sp.opacity  = 0;
            this._btn10Sp.opacity = 0;
            this._ptSp.opacity    = 0;

            // 1枚ずつ表示（タイマーベース）
            this._revealTimer = 0;
        }

        _updateReveal() {
            if (this._phase !== "reveal") return;
            this._revealTimer--;
            if (this._revealTimer > 0) return;

            if (this._revealIdx < this._cards.length) {
                const card = this._cards[this._revealIdx];
                card.opacity = 255;
                card._revealed = true;

                // レアリティ別パーティクル
                const cx = card.x + card.children[0].bitmap.width  / 2;
                const cy = card.y + card.children[0].bitmap.height / 2;
                if (card._rarity === "SSR") {
                    this._spawnSSRParticles(cx, cy);
                    SoundManager.playOk();
                    this._revealTimer = 40;
                } else if (card._rarity === "SR") {
                    this._spawnSRParticles(cx, cy);
                    SoundManager.playCursor();
                    this._revealTimer = 20;
                } else {
                    SoundManager.playCursor();
                    this._revealTimer = 8;
                }
                this._revealIdx++;
            } else {
                // 全部開いた
                this._phase = "result";

                // 「タップで戻る」表示
                if (!this._tapHintSp) {
                    const bmp = new Bitmap(400, 32);
                    bmp.fontSize = 18;
                    bmp.textColor = "#aaaacc";
                    bmp.drawText("タップしてメニューへ戻る", 0, 4, 400, 24, "center");
                    this._tapHintSp = new Sprite(bmp);
                    this._tapHintSp.x = Graphics.width / 2 - 200;
                    this._tapHintSp.y = Graphics.height - 56;
                    this.addChild(this._tapHintSp);
                }
                this._tapHintSp.opacity = 255;
            }
        }

        _returnToMenu() {
            this._phase = "menu";
            this._resultLayer.opacity = 0;
            if (this._tapHintSp) this._tapHintSp.opacity = 0;
            this._btn1Sp.opacity  = 255;
            this._btn10Sp.opacity = 255;
            this._ptSp.opacity    = 255;
            this._redrawButtons();
            this._redrawPoints();
        }

        _updateParticles() {
            for (let i = this._particles.length - 1; i >= 0; i--) {
                const sp = this._particles[i];
                sp._life--;
                sp.x += sp._vx;
                sp.y += sp._vy;
                sp._vy += 0.12;
                sp.opacity = Math.round((sp._life / 80) * 255);
                if (sp._life <= 0) {
                    this.removeChild(sp);
                    this._particles.splice(i, 1);
                }
            }
        }
    }

    window.Scene_NatsuGacha = Scene_NatsuGacha;

    // -----------------------------------------------------------------------
    // NatsuClickGame との連携：おぉポイントを $gameSystem 経由で共有
    // Scene_NatsuGame の _onNatsuClick と _tryPurchase にフック
    // -----------------------------------------------------------------------
    const _Scene_NatsuGame_create = Scene_NatsuGame && Scene_NatsuGame.prototype
        ? Scene_NatsuGame.prototype.create
        : null;

    if (typeof Scene_NatsuGame !== "undefined") {
        // create 時に $gameSystem からポイントを復元
        const origCreate = Scene_NatsuGame.prototype.create;
        Scene_NatsuGame.prototype.create = function() {
            origCreate.call(this);
            // 既存の保存値があれば復元
            if ($gameSystem._ooPoints !== undefined) {
                this._ooPoints = $gameSystem._ooPoints;
            }
        };

        // クリック時にポイントを同期
        const origClick = Scene_NatsuGame.prototype._onNatsuClick;
        Scene_NatsuGame.prototype._onNatsuClick = function(tx, ty) {
            origClick.call(this, tx, ty);
            $gameSystem._ooPoints = this._ooPoints;
        };

        // 購入時にも同期
        const origPurchase = Scene_NatsuGame.prototype._tryPurchase;
        Scene_NatsuGame.prototype._tryPurchase = function(i) {
            origPurchase.call(this, i);
            $gameSystem._ooPoints = this._ooPoints;
        };
    }

})();
