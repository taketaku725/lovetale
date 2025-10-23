// main.js — 全章拡張・葵セリフ大量追加・5章&5エンド・UI/セーブ一式 完全版
document.addEventListener("DOMContentLoaded", () => {
  const SLOT_COUNT = 3;

  // ======== 状態 ========
  let playerName = "あなた";
  let current = "ch1_intro_1";
  let typing = false;
  let skipTyping = false;

  // 感情パラメータ & 物語フラグ
  let affection = 0; // 好感
  let trust = 0;     // 信頼
  let misstep = 0;   // 失点（高いほど悪影響）
  const flags = {
    rooftopShared: false,
    walkedTogether: false,
    heldHands: false,
    festivalHelp: false,
    rehearsalSerious: false,
    jealousyEvent: false,
    confessionTried: false,
    promiseUnderSakura: false
  };

  // ======== 要素参照 ========
  const titleScreen = document.getElementById("titleScreen");
  const nameScreen  = document.getElementById("nameScreen");
  const gameArea    = document.getElementById("game");
  const startBtn    = document.getElementById("startButton");
  const continueBtn = document.getElementById("continueButton");
  const nameBtn     = document.getElementById("nameConfirmButton");
  const nameInput   = document.getElementById("playerNameInput");
  const nameBox  = document.getElementById("name");
  const textBox  = document.getElementById("text");
  const choiceBox= document.getElementById("choices");
  const charImg  = document.getElementById("char");

  // ======== 通知（alert廃止） ========
  const notifyBox = document.createElement("div");
  notifyBox.id = "notifyBox";
  document.body.appendChild(notifyBox);
  function notify(msg) {
    const note = document.createElement("div");
    note.textContent = msg;
    note.className = "notifyMsg";
    notifyBox.appendChild(note);
    setTimeout(() => note.classList.add("fadeout"), 2000);
    setTimeout(() => note.remove(), 2800);
  }

  // ======== メニュー/スロットUI（HTML注入） ========
  const menuHTML = `
    <button id="menuButton">≡</button>
    <div id="menuOverlay" style="display:none;">
      <div id="menuBox">
        <h2>メニュー</h2>
        <button id="saveButton">セーブ</button>
        <button id="loadButton">ロード</button>
        <button id="backToTitle">タイトルに戻る</button>
        <button id="closeMenu">閉じる</button>
      </div>
    </div>
    <div id="slotOverlay" style="display:none;"></div>`;
  document.body.insertAdjacentHTML("beforeend", menuHTML);

  const menuBtn = document.getElementById("menuButton");
  const menuOverlay = document.getElementById("menuOverlay");
  const saveButton = document.getElementById("saveButton");
  const loadButton = document.getElementById("loadButton");
  const backToTitle = document.getElementById("backToTitle");
  const closeMenuBtn = document.getElementById("closeMenu");
  const slotOverlay = document.getElementById("slotOverlay");

  // タイトルではメニュー非表示
  menuBtn.style.display = "none";

  // ======== ヘルパ ========
  const BG = f => f ? `url('img/${f}')` : null;
  const replaceVars = t => (t || "").replace(/{playerName}/g, playerName);

  // モノローグ演出（CSSの .mono クラスを使う前提）
  function setMono(isMono) {
    if (isMono) {
      textBox.classList.add("mono");
      nameBox.textContent = ""; // モノローグは名前無し
    } else {
      textBox.classList.remove("mono");
    }
  }

  let typingTimer = null; // ← グローバル変数として追加

  function typeText(text, cb) {
    // 前回のタイマーをキャンセル
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }

    typing = true;
    skipTyping = false;
    textBox.textContent = "";
    let i = 0;

    const tick = () => {
      if (skipTyping) {
        textBox.textContent = text;
        typing = false;
        typingTimer = null;
        if (cb) cb();
        return;
      }

      if (i < text.length) {
        textBox.textContent += text[i++];
        typingTimer = setTimeout(tick, 18);
      } else {
        typing = false;
        typingTimer = null;
        if (cb) cb();
      }
    };

    tick();
  }


  function applySceneView(scene) {
    if (scene.bg) gameArea.style.backgroundImage = BG(scene.bg);
    charImg.style.display = scene.hideChar ? "none" : "";
  }

  // ======== 5エンド判定 ========
  function checkEndingKey() {
    if (
      affection >= 16 &&
      trust >= 12 &&
      misstep <= 3 &&
      flags.festivalHelp &&
      flags.rehearsalSerious &&
      (flags.heldHands || flags.walkedTogether) &&
      flags.promiseUnderSakura
    ) return "end_true";

    if (affection >= 13 && trust >= 9 && misstep <= 5) return "end_normal_2";
    if (affection >= 10 && trust >= 6) return "end_normal_1";
    if (affection + trust < 12) return "end_bad_2";
    return "end_bad_1";
  }

  // ======== 物語データ（全章拡張） ========
  // 背景: ch1=classroom.png, ch2=rooftop.png, ch3=park.png, ch4=festival.png, ch5=night.png
  const scenes = {
    // =========================================================
    // Chapter 1: 出会い（朝の教室） — 会話たっぷり、葵多め
    // =========================================================
    ch1_intro_1: { name: "葵", bg: "classroom.png",
      text: "「おはよう、{playerName}くん。…今日も、走って来たでしょ？」", next: "ch1_intro_2" },
    ch1_intro_2: { name: "葵",
      text: "「髪、ほら…ちょっと跳ねてる。…えいっ」", next: "ch1_intro_3" },
    ch1_intro_3: { name: "", mono:true,
      text: "（指先が触れる。朝の空気よりも、少しだけ熱い）", next: "ch1_intro_4" },
    ch1_intro_4: { name: "葵",
      text: "「…うん、直った。わたし、こういうの気になっちゃうんだ」", next: "ch1_choice_1" },

    ch1_choice_1: { name: "葵",
      text: "「今日は、どんな一日にしたい？」", choices: [
        { text: "「静かに、でも楽しく」", next: "ch1_after_choice1_a", trust:+1 },
        { text: "「騒がしく、思い出作り」", next: "ch1_after_choice1_b", affection:+1 },
        { text: "「…まずは朝ごはん」", next: "ch1_after_choice1_c", misstep:+1 }
      ]},

    ch1_after_choice1_a: { name: "葵",
      text: "「静かなの、分かるな。…でも、一緒に笑う時間も欲しいね」", next: "ch1_merge_1" },
    ch1_after_choice1_b: { name: "葵",
      text: "「ふふ、{playerName}くんらしい。…巻き込まれてあげてもいいよ？」", next: "ch1_merge_1" },
    ch1_after_choice1_c: { name: "葵",
      text: "「…お腹空いてるの？じゃあ、次はちゃんと食べよ？」", next: "ch1_merge_1" },

    ch1_merge_1: { name: "", mono:true,
      text: "（彼女の声は、よく晴れた朝みたいにきれいだった）", next: "ch1_after_1" },

    ch1_after_1: { name: "葵",
      text: "「席、どこが落ち着く？ わたしは窓際が好き。光がやわらかいから」", next: "ch1_choice_2" },

    ch1_choice_2: { name: "葵", text: "「{playerName}くんは？」", choices: [
      { text: "「窓際で」", next: "ch1_after_choice2_a", trust:+1 },
      { text: "「葵の近く」", next: "ch1_after_choice2_b", affection:+2, misstep:+1 },
      { text: "「黒板がよく見えるとこ」", next: "ch1_after_choice2_c", trust:+1 }
    ]},

    ch1_after_choice2_a: { name: "葵",
      text: "「じゃあ、朝の光を分け合おう。…眩しかったら、わたしの影に隠れていいよ？」", next: "ch1_merge_2" },
    ch1_after_choice2_b: { name: "葵",
      text: "「…素直すぎ。…でも、嫌いじゃないよ」", next: "ch1_merge_2" },
    ch1_after_choice2_c: { name: "葵",
      text: "「真面目。そういうところ、好きだな」", next: "ch1_merge_2" },

    ch1_merge_2: { name: "", mono:true,
      text: "（チャイムが遠くに響いて、最初のページがめくられていく）", next: "ch1_after_2" },

    ch1_after_2: { name: "葵",
      text: "「放課後、少しだけ話せる？ 話したいこと、あるの」", next: "ch1_choice_3" },

    ch1_choice_3: { name: "葵", text: "「…だめ、かな？」", choices: [
      { text: "「もちろん」", next: "ch1_after_choice3_a", affection:+2, trust:+1 },
      { text: "「用事が終わったら」", next: "ch1_after_choice3_b", trust:+1 },
      { text: "「今日は難しいかも」", next: "ch1_after_choice3_c", misstep:+1 }
    ]},

    ch1_after_choice3_a: { name: "葵",
      text: "「やった。じゃあ…屋上で待ってるね」", next: "ch1_to_ch2" },
    ch1_after_choice3_b: { name: "葵",
      text: "「うん。待つのは得意。…風、好きだから」", next: "ch1_to_ch2" },
    ch1_after_choice3_c: { name: "葵",
      text: "「そうなんだ。じゃあ…また、ね」", next: "ch1_to_ch2" },

    ch1_to_ch2: { name: "", mono:true,
      text: "（机に残る体温。いつもより、今日が長く感じる）", next: "ch2_intro_1" },

    // =========================================================
    // Chapter 2: 屋上（昼） — 弁当共有、告白の下地を温める
    // =========================================================
    ch2_intro_1: { name: "", bg: "rooftop.png", mono:true,
      text: "（昼休み。街のざわめきが、風に混ざって届く）", next: "ch2_intro_2" },
    ch2_intro_2: { name: "葵",
      text: "「来た。…{playerName}くん、こっち」", next: "ch2_intro_3" },
    ch2_intro_3: { name: "葵",
      text: "「今日ね、お弁当ちょっと多めなんだ。…半分こ、しない？」", next: "ch2_choice_1" },

    ch2_choice_1: { name: "葵", text: "「好き嫌い、ある？」", choices: [
      { text: "「ない。なんでも好き」", next: "ch2_after_choice1_a", affection:+2, trust:+1, setFlag:"rooftopShared" },
      { text: "「ちょっとだけ…」",     next: "ch2_after_choice1_b", affection:+1 },
      { text: "「今日は…いいかな」",   next: "ch2_after_choice1_c", misstep:+1 }
    ]},

    ch2_after_choice1_a: { name: "葵",
      text: "「よかった。じゃあ、はい。…それ、わたしの得意なやつ」", next: "ch2_merge_1" },
    ch2_after_choice1_b: { name: "葵",
      text: "「じゃあ、おかずから。唐揚げ、ひとつどうぞ」", next: "ch2_merge_1" },
    ch2_after_choice1_c: { name: "葵",
      text: "「…そっか。わかった。じゃあ、感想だけ聞かせてね？」", next: "ch2_merge_1" },

    ch2_merge_1: { name: "", mono:true,
      text: "（口に広がる味と、沈黙のあいだの小さな笑み。それだけで充分だった）", next: "ch2_after_1" },

    ch2_after_1: { name: "葵",
      text: "「こうして上から見てると、校庭がミニチュアみたい。…不思議と、悩みって小さく見えるね」", next: "ch2_choice_2" },

    ch2_choice_2: { name: "葵", text: "「{playerName}くんは、こういう時間…好き？」", choices: [
      { text: "「落ち着く」", next: "ch2_after_choice2_a", trust:+1 },
      { text: "「葵がいるから好き」", next: "ch2_after_choice2_b", affection:+2 },
      { text: "「正直、少し眠い」", next: "ch2_after_choice2_c", misstep:+1 }
    ]},

    ch2_after_choice2_a: { name: "葵",
      text: "「うん、分かる。…風の音って、頼りになるよね」", next: "ch2_merge_2" },
    ch2_after_choice2_b: { name: "葵",
      text: "「……ねぇ、そういうの、ずるい」", next: "ch2_merge_2" },
    ch2_after_choice2_c: { name: "葵",
      text: "「じゃあ、眠くならない話する。…わたし、昔ここで…」", next: "ch2_merge_2" },

    ch2_merge_2: { name: "", mono:true,
      text: "（彼女は何でもない話をくれる。日常の隙間が、丁寧に満たされていく）", next: "ch2_after_2" },

    ch2_after_2: { name: "葵",
      text: "「最後の一口、どうぞ。…受け取って？」", next: "ch2_choice_3" },

    ch2_choice_3: { name: "葵", text: "「…だめ？」", choices: [
      { text: "素直に受け取る", next: "ch2_after_choice3_a", affection:+2, trust:+1 },
      { text: "照れて断る",     next: "ch2_after_choice3_b", affection:+1, misstep:+1 },
      { text: "冗談で『倍返し』", next: "ch2_after_choice3_c", affection:+1 }
    ]},

    ch2_after_choice3_a: { name: "葵",
      text: "「……えへへ」", next: "ch2_merge_3" },
    ch2_after_choice3_b: { name: "葵",
      text: "「そっか。…じゃあ、これはわたしが責任もって」", next: "ch2_merge_3" },
    ch2_after_choice3_c: { name: "葵",
      text: "「倍返し、覚えたからね？」", next: "ch2_merge_3" },

    ch2_merge_3: { name: "", mono:true,
      text: "（昼休みが終わる。風に混じって、名残惜しさが落ちていく）", next: "ch3_intro_1" },

    // =========================================================
    // Chapter 3: 帰り道（夕暮れ） — 距離感の変化、手をつなぐかどうか
    // =========================================================
    ch3_intro_1: { name: "", bg: "park.png", mono:true,
      text: "（放課後。並木道に、橙色のひかりが落ちる）", next: "ch3_intro_2" },
    ch3_intro_2: { name: "葵",
      text: "「ねぇ、少し回り道して帰らない？ …この時間、好きなんだ」", next: "ch3_choice_1" },

    ch3_choice_1: { name: "葵", text: "「どうかな？」", choices: [
      { text: "「一緒に歩こう」", next: "ch3_after_choice1_a", affection:+2, setFlag:"walkedTogether" },
      { text: "「今日は用事がある」", next: "ch3_after_choice1_b", trust:+1 },
      { text: "「写真、撮っていい？」", next: "ch3_after_choice1_c", affection:+1 }
    ]},

    ch3_after_choice1_a: { name: "葵",
      text: "「やった。…じゃあ、ゆっくりね」", next: "ch3_merge_1" },
    ch3_after_choice1_b: { name: "葵",
      text: "「うん。頑張って。…また、こういう時間作ろ？」", next: "ch3_merge_1" },
    ch3_after_choice1_c: { name: "葵",
      text: "「うん、いいよ。わたしも、君の好きな景色を知りたい」", next: "ch3_merge_1" },

    ch3_merge_1: { name: "", mono:true,
      text: "（歩幅が合う。呼吸が合う。話題は、取り零した光を拾うみたいに続いた）", next: "ch3_after_1" },

    ch3_after_1: { name: "葵",
      text: "「…手、つないでもいい？」", next: "ch3_choice_2" },

    ch3_choice_2: { name: "葵", text: "「恥ずかしい？」", choices: [
      { text: "つなぐ", next: "ch3_after_choice2_a", affection:+2, trust:+1, setFlag:"heldHands" },
      { text: "恥ずかしくて断る", next: "ch3_after_choice2_b", misstep:+1 },
      { text: "指先だけ触れる", next: "ch3_after_choice2_c", affection:+1 }
    ]},

    ch3_after_choice2_a: { name: "葵",
      text: "「…あったかい」", next: "ch3_merge_2" },
    ch3_after_choice2_b: { name: "葵",
      text: "「ううん、無理しなくていい。…歩こう」", next: "ch3_merge_2" },
    ch3_after_choice2_c: { name: "葵",
      text: "「それも、いいね」", next: "ch3_merge_2" },

    ch3_merge_2: { name: "", mono:true,
      text: "（花びらが、二人の間に落ちる。境界線みたいに、でも境界じゃない）", next: "ch3_after_2" },

    ch3_after_2: { name: "葵",
      text: "「桜、好き？」", next: "ch3_choice_3" },

    ch3_choice_3: { name: "葵", text: "「わたしは…好き。毎年、同じで、少し違うから」", choices: [
      { text: "「大好き」", next: "ch3_after_choice3_a", affection:+2 },
      { text: "「花粉が…でも好き」", next: "ch3_after_choice3_b", affection:+1, trust:+1 },
      { text: "「どっちでも」", next: "ch3_after_choice3_c", misstep:+1 }
    ]},

    ch3_after_choice3_a: { name: "葵",
      text: "「うん。…来年も、一緒に見たいね」", next: "ch3_merge_3" },
    ch3_after_choice3_b: { name: "葵",
      text: "「優しい答え。…そういうところ、好き」", next: "ch3_merge_3" },
    ch3_after_choice3_c: { name: "葵",
      text: "「…そっか。じゃあ、好きになってもらえるよう頑張るね」", next: "ch3_merge_3" },

    ch3_merge_3: { name: "", mono:true,
      text: "（影が伸びる。隣に伸びる影が、重なる）", next: "ch4_intro_1" },

    // =========================================================
    // Chapter 4: 文化祭 — 支え合いと揺らぎ、嫉妬イベントも
    // =========================================================
    ch4_intro_1: { name: "", bg: "festival.png", mono:true,
      text: "（文化祭の日。色とりどりのざわめきが、空に浮かんでいた）", next: "ch4_intro_2" },
    ch4_intro_2: { name: "葵",
      text: "「来てくれて、ありがとう。…ね、手伝ってほしいことがあって」", next: "ch4_choice_1" },

    ch4_choice_1: { name: "葵", text: "「無理のない範囲で、でいいから」", choices: [
      { text: "「任せて！」", next: "ch4_after_choice1_a", trust:+2, setFlag:"festivalHelp" },
      { text: "「裏方なら」", next: "ch4_after_choice1_b", trust:+1, setFlag:"festivalHelp" },
      { text: "「今日は客として楽しむ」", next: "ch4_after_choice1_c", misstep:+1 }
    ]},

    ch4_after_choice1_a: { name: "葵",
      text: "「心強い。…じゃあ、舞台の準備からいこう」", next: "ch4_merge_1" },
    ch4_after_choice1_b: { name: "葵",
      text: "「助かる。縁の下の力持ち、かっこいいよ」", next: "ch4_merge_1" },
    ch4_after_choice1_c: { name: "葵",
      text: "「…うん。楽しんで。…わたし、ちょっと頑張ってくる」", next: "ch4_merge_1" },

    ch4_merge_1: { name: "", mono:true,
      text: "（教室の空気は熱を帯び、机も椅子も、舞台の一部になっていく）", next: "ch4_after_1" },

    ch4_after_1: { name: "葵",
      text: "「練習、真面目にやってみよう。…手、貸して？」", next: "ch4_choice_2" },

    ch4_choice_2: { name: "葵", text: "「恥ずかしいけど、君が相手なら…大丈夫」", choices: [
      { text: "本気で台詞を伝える", next: "ch4_after_choice2_a", affection:+2, trust:+1, setFlag:"rehearsalSerious" },
      { text: "照れて冗談っぽく", next: "ch4_after_choice2_b", affection:+1 },
      { text: "棒読みで茶化す", next: "ch4_after_choice2_c", misstep:+1 }
    ]},

    ch4_after_choice2_a: { name: "葵",
      text: "「……ね、ずるい。そんな目で見ないで」", next: "ch4_merge_2" },
    ch4_after_choice2_b: { name: "葵",
      text: "「ふふ、雰囲気壊れた。…でも、楽になった」", next: "ch4_merge_2" },
    ch4_after_choice2_c: { name: "葵",
      text: "「…もう、練習にならないよ」", next: "ch4_merge_2" },

    ch4_merge_2: { name: "", mono:true,
      text: "（舞台袖で、小さくハイタッチ。手のひらが、幕間の灯りみたいに温かい）", next: "ch4_after_2" },

    ch4_after_2: { name: "葵",
      text: "「終わったら、屋台回らない？…それとも、展示とか見る？」", next: "ch4_choice_3" },

    ch4_choice_3: { name: "葵", text: "「どれも捨てがたい…選んで？」", choices: [
      { text: "「一緒に回ろう」", next: "ch4_after_choice3_a", affection:+2 },
      { text: "「写真部の展示」", next: "ch4_after_choice3_b", trust:+1 },
      { text: "「食べ歩き全制覇」", next: "ch4_after_choice3_c", affection:+1 }
    ]},

    ch4_after_choice3_a: { name: "葵",
      text: "「うん。…君が選ぶなら、どこでも好きになる」", next: "ch4_merge_3" },
    ch4_after_choice3_b: { name: "葵",
      text: "「静かなの、落ち着くね。…写真って、時間の魔法だと思う」", next: "ch4_merge_3" },
    ch4_after_choice3_c: { name: "葵",
      text: "「食いしん坊。…でもそういう日も、いい」", next: "ch4_merge_3" },

    ch4_merge_3: { name: "", mono:true,
      text: "（賑わいのなかで、二人だけの会話は小さな島みたいに保たれていた）", next: "ch4_after_3" },

    ch4_after_3: { name: "", mono:true,
      text: "（そこへ、別クラスの男子が声をかけてきた）", next: "ch4_choice_4" },

    ch4_choice_4: { name: "葵", text: "「ごめん、少しだけ話してくるね」", choices: [
      { text: "待つ（信じて任せる）", next: "ch4_after_choice4_a", trust:+2 },
      { text: "距離を保って見守る", next: "ch4_after_choice4_b", trust:+1 },
      { text: "割って入る", next: "ch4_after_choice4_c", misstep:+2, setFlag:"jealousyEvent" }
    ]},

    ch4_after_choice4_a: { name: "葵",
      text: "「待っててくれて、ありがとう。…君ならそうすると思ってた」", next: "ch4_merge_4" },
    ch4_after_choice4_b: { name: "葵",
      text: "「気づいてたよ。…優しい距離感、好き」", next: "ch4_merge_4" },
    ch4_after_choice4_c: { name: "葵",
      text: "「…心配させたね。ごめん。…でも、嬉しかった」", next: "ch4_merge_4" },

    ch4_merge_4: { name: "", mono:true,
      text: "（夕方の色が濃くなる。喧騒が遠のいて、言葉だけが残った）", next: "ch5_intro_1" },

    // =========================================================
    // Chapter 5: 夜桜 — 告白と約束、春の終わりの選択
    // =========================================================
    ch5_intro_1: { name: "", bg: "night.png", mono:true,
      text: "（夜。ほの白い月明かりが、桜を内側から灯す）", next: "ch5_intro_2" },
    ch5_intro_2: { name: "葵",
      text: "「…今日、楽しかったね。人混みも、うるさくなかった」", next: "ch5_intro_3" },
    ch5_intro_3: { name: "葵",
      text: "「たぶん、隣に君がいたから。…ね、少し歩こう？」", next: "ch5_choice_1" },

    ch5_choice_1: { name: "葵", text: "「どの瞬間が、一番好きだった？」", choices: [
      { text: "「葵と手をつないだとき」", next: "ch5_after_choice1_a", affection:+2 },
      { text: "「劇の練習で目が合ったとき」", next: "ch5_after_choice1_b", trust:+1 },
      { text: "「全部」", next: "ch5_after_choice1_c", affection:+1, trust:+1 }
    ]},

    ch5_after_choice1_a: { name: "葵",
      text: "「…ずるい。…でも、同じ」", next: "ch5_merge_1" },
    ch5_after_choice1_b: { name: "葵",
      text: "「覚えてる。…あれ、平気そうな顔して、心臓バクバクだった」", next: "ch5_merge_1" },
    ch5_after_choice1_c: { name: "葵",
      text: "「全部、か。…欲張りだね。…いいよ」", next: "ch5_merge_1" },

    ch5_merge_1: { name: "", mono:true,
      text: "（吐く息が白くはないのに、ふたりの言葉には温度があった）", next: "ch5_after_1" },

    ch5_after_1: { name: "葵",
      text: "「{playerName}くんは、わたしのこと…どう思ってる？」", next: "ch5_choice_2" },

    ch5_choice_2: { name: "葵", text: "「正直に、でいいよ」", choices: [
      { text: "「大切に思ってる」", next: "ch5_after_choice2_a", affection:+2, trust:+1 },
      { text: "「言葉にするのは苦手だけど…」", next: "ch5_after_choice2_b", trust:+1 },
      { text: "「今は、まだ分からない」", next: "ch5_after_choice2_c", misstep:+1 }
    ]},

    ch5_after_choice2_a: { name: "葵",
      text: "「……うん。今、ちゃんと届いた」", next: "ch5_merge_2" },
    ch5_after_choice2_b: { name: "葵",
      text: "「苦手でも、好き。…君の言葉は嘘をつかないから」", next: "ch5_merge_2" },
    ch5_after_choice2_c: { name: "葵",
      text: "「…分かった。待つことも、好きだよ」", next: "ch5_merge_2" },

    ch5_merge_2: { name: "", mono:true,
      text: "（夜風が、枝を鳴らす。視線がぶつかって、逸れて、戻る）", next: "ch5_after_2" },

    ch5_after_2: { name: "葵",
      text: "「…じゃあ、わたしから言ってもいい？」", next: "ch5_choice_3" },

    ch5_choice_3: { name: "葵", text: "「本当の気持ち、聞いてくれる？」", choices: [
      { text: "「待って、こっちから言わせて」", next: "ch5_after_choice3_a", affection:+2, setFlag:"confessionTried" },
      { text: "「うん、聞かせて」", next: "ch5_after_choice3_b", trust:+1 },
      { text: "「桜、きれいだね」", next: "ch5_after_choice3_c", misstep:+1 }
    ]},

    ch5_after_choice3_a: { name: "", mono:true,
      text: "（喉が乾く。言葉を掬いとって、月に投げるみたいに）", next: "ch5_merge_3" },
    ch5_after_choice3_b: { name: "葵",
      text: "「…わたし、{playerName}くんのことが――」", next: "ch5_merge_3" },
    ch5_after_choice3_c: { name: "葵",
      text: "「…そうだね。きれい」", next: "ch5_merge_3" },

    ch5_merge_3: { name: "", mono:true,
      text: "（どちらの言葉も、もう戻れない場所へ届いていく）", next: "ch5_after_3" },

    ch5_after_3: { name: "葵",
      text: "「この春が終わっても、一緒にいてくれる？」", next: "ch5_choice_4" },

    ch5_choice_4: { name: "葵", text: "「約束…しても、いい？」", choices: [
      { text: "「約束する」", next: "ch5_after_choice4_a", affection:+2, trust:+2, setFlag:"promiseUnderSakura" },
      { text: "「努力する」", next: "ch5_after_choice4_b", trust:+1 },
      { text: "「…ごめん」", next: "ch5_after_choice4_c", misstep:+2 }
    ]},

    ch5_after_choice4_a: { name: "葵",
      text: "「…ありがとう。…ううん、ありがとう以上」", next: "ch5_merge_4" },
    ch5_after_choice4_b: { name: "葵",
      text: "「努力、好き。…わたしたち、そういうの得意だよね」", next: "ch5_merge_4" },
    ch5_after_choice4_c: { name: "葵",
      text: "「…そっか。…うん、聞けてよかった」", next: "ch5_merge_4" },

    ch5_merge_4: { name: "", mono:true,
      text: "（風が二人の間を通り抜けて、距離をそっと近づける）", next: "ENDING_RESOLVE" },

    // =========================================================
    // Endings（5種）
    // =========================================================
    end_true:     { name: "葵", hideChar:true, text: "トゥルーエンド：夜桜の約束", next: "showEndingResult" },
    end_normal_2: { name: "葵", hideChar:true, text: "ノーマルエンド（良）：続く春の足音", next: "showEndingResult" },
    end_normal_1: { name: "葵", hideChar:true, text: "ノーマルエンド（並）：淡い余韻", next: "showEndingResult" },
    end_bad_2:    { name: "葵", hideChar:true, text: "バッドエンド（遠）：すれ違いのまま", next: "showEndingResult" },
    end_bad_1:    { name: "葵", hideChar:true, text: "バッドエンド（近）：言えなかった春", next: "showEndingResult" },
  };

  // ======== シーン描画 ========
  function showScene(key) {
  // --- ENDING_RESOLVE：分岐判定して即エンディング画面へ ---
  if (key === "ENDING_RESOLVE") {
    const resultKey = checkEndingKey();
    // いったんUIを空にし、テキスト描画を完全回避
    textBox.textContent = "";
    nameBox.textContent = "";
    choiceBox.innerHTML = "";
    showEndingResult(resultKey);   // ← 直接エンディング画面へ
    return;
  }

  // --- end_* 系：テキスト欄に出さずに直接エンディング画面へ ---
  if (/^end_(true|normal_1|normal_2|bad_1|bad_2)$/.test(key)) {
    showEndingResult(key);         // ← 直接
    return;
  }

  // --- 旧仕様の保険（呼ばれても直で画面へ） ---
  if (key === "showEndingResult") {
    showEndingResult();            // ← 引数なしでも動くよう後述で実装
    return;
  }

  // ここから通常のシーン描画
  const s = scenes[key];
  if (!s) return;
  current = key;
  gameArea.classList.remove("dim"); // ← 前回の暗転を必ず解除


  // 前の暗転を除去
  const oldDim = document.getElementById("dimOverlay");
  if (oldDim) oldDim.remove();

  // ===== 名前表示ロジック改良（葵を常時反映） =====
  if (s.choices) {
    nameBox.textContent = s.name === "葵" ? "葵" : "";
  } else {
    if (s.name) nameBox.textContent = s.name;
    else nameBox.textContent = "";
  }

  // モノローグ演出
  setMono(!!s.mono);

  // ▼ ここでいったん選択肢をクリア
  choiceBox.innerHTML = "";

  // 背景やキャラの反映
  choiceBox.innerHTML = "";
  applySceneView(s);

  // ======== セリフ／選択肢描画 ========
  if (s.choices) {
    gameArea.classList.add("dim");  // ← 背景＆立ち絵だけ暗転
    textBox.textContent = replaceVars(s.text || "");

    // ここは現在の choices 生成そのままでOK
    s.choices.forEach(c => {
      const b = document.createElement("div");
      b.className = "choice";
      b.textContent = replaceVars(c.text);
      b.onclick = () => {
        if (typeof c.affection === "number") affection += c.affection;
        if (typeof c.trust === "number") trust += c.trust;
        if (typeof c.misstep === "number") misstep += c.misstep;
        if (c.setFlag && flags.hasOwnProperty(c.setFlag)) flags[c.setFlag] = true;

        console.log({ affection, trust, misstep, flags });
        choiceBox.innerHTML = "";
  
        gameArea.classList.remove("dim"); // ← “スッ”と解除（0.15sで戻る）
        showScene(c.next);                // ← 余計な再暗転が起きない
      };
      choiceBox.appendChild(b);
    });
  } else {
    if (key === "ENDING_RESOLVE" || key === "showEndingResult") return;
    typeText(replaceVars(s.text || ""));
  }
}


  // ======== クリック送り（選択肢が無いときのみ） ========
  gameArea.addEventListener("click", () => {
    const s = scenes[current];
    if (!s) return;
    if (typing) { skipTyping = true; return; }
    if (!s.choices && s.next && s.next !== "ENDING_RESOLVE") showScene(s.next);
  });


  // ======== Enterキーでもテキストを進める ========
  document.addEventListener("keydown", e => {
    // 入力欄で押された場合は無視
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;

    if (e.key === "Enter") {
      const s = scenes[current];
      if (!s) return;
      if (typing) { skipTyping = true; return; }
      if (!s.choices && s.next) showScene(s.next);
    }
  });

  // ======== エンディング結果 → タイトル ========
  let lastEndingKey = null;

function showEndingResult(key) {
  // 引数が来ない場合は最後に確定したものを使う（保険）
  if (key) lastEndingKey = key;
  const k = key || lastEndingKey || "end_normal_1";

  // テキスト欄などは非表示 or クリア（チラ見え防止）
  textBox.textContent = "";
  nameBox.textContent = "";
  choiceBox.innerHTML = "";
  gameArea.classList.remove("dim");

  // 表示タイトル（必要なら好みで文言変更）
  const titleMap = {
    end_true:      "トゥルーエンド：夜桜の約束",
    end_normal_2:  "ノーマルエンド（良）：続く春の足音",
    end_normal_1:  "ノーマルエンド（並）：淡い余韻",
    end_bad_2:     "バッドエンド（遠）：すれ違いのまま",
    end_bad_1:     "バッドエンド（近）：言えなかった春",
  };
  const endTitle = titleMap[k] || "エンディング";

  // ここからエンディング用オーバーレイを表示（あなたの既存UIに合わせる）
  const overlay = document.getElementById("endingOverlay") || (() => {
    const ov = document.createElement("div");
    ov.id = "endingOverlay";
    ov.style.position = "fixed";
    ov.style.inset = "0";
    ov.style.background = "rgba(0,0,0,0.85)";
    ov.style.display = "flex";
    ov.style.flexDirection = "column";
    ov.style.alignItems = "center";
    ov.style.justifyContent = "center";
    ov.style.gap = "16px";
    ov.style.zIndex = "99999";
    document.body.appendChild(ov);
    return ov;
  })();

  overlay.innerHTML = `
    <div style="font-size:28px; color:#fff; margin-bottom:8px;">${endTitle}</div>
    <div style="color:#ddd; font-size:14px;">タップ/クリックでタイトルへ</div>
  `;

  // クリックでタイトルに戻る（セーブはしない仕様ならここでリセット）
  const backToTitle = () => {
    overlay.remove();

    // --- レイアウトリセット ---
    document.body.style.display = "flex";
    document.body.style.flexDirection = "column";
    document.body.style.justifyContent = "center";
    document.body.style.alignItems = "center";
    document.body.style.height = "100vh";
    document.body.style.margin = "0";

    // --- タイトル画面を中央に戻す ---
    const titleScreen = document.getElementById("titleScreen");
    const nameScreen = document.getElementById("nameScreen");
    const game = document.getElementById("game");

    titleScreen.style.display = "block";
    nameScreen.classList.add("hidden");
    game.classList.add("hidden");

    // 念のためスクロールも戻す
    window.scrollTo(0, 0);
  };

  overlay.onclick = () => {
    overlay.remove();

    // ゲーム画面を隠す
    document.getElementById("game").classList.add("hidden");

    // 名前入力を非表示（再開時は空）
    document.getElementById("nameScreen").classList.add("hidden");
  
    // タイトルを中央表示
    const title = document.getElementById("titleScreen");
    title.style.display = "flex";
    title.style.justifyContent = "center";
    title.style.alignItems = "center";

    // ページを中央にスクロール（スマホでのズレ防止）
    window.scrollTo(0, 0);
  };
}
  const _origShow = showScene;
  showScene = k => (k === "showEndingResult" ? showEndingResult() : _origShow(k));

  // ======== スロットUI（保存日時・削除・通知） ========
  function openSlotMenu(mode, fromTitle = false) {
    slotOverlay.innerHTML = `
      <div style="
        display:flex;flex-direction:column;align-items:center;
        background:rgba(20,20,30,0.95);border:2px solid #ffb6c1;border-radius:20px;
        padding:40px 60px;box-shadow:0 0 30px rgba(255,182,193,0.5);text-align:center;">
        <h2>${mode === "save" ? "セーブ" : "ロード"}スロット選択</h2>
        <div id="slotButtons"></div>
        <button id="cancelSlot" style="margin-top:20px;background:#ff69b4;border:none;color:white;padding:10px 25px;border-radius:8px;cursor:pointer;">キャンセル</button>
      </div>`;
    slotOverlay.style.display = "flex";

    const slotButtons = document.getElementById("slotButtons");
    for (let i = 1; i <= SLOT_COUNT; i++) {
      const key = `sakura_save_${i}`;
      const data = JSON.parse(localStorage.getItem(key) || "null");
      const card = document.createElement("div");
      card.className = "slotCard";
      if (data) {
        card.innerHTML = makeSlotCardHTML(i, data);
      } else {
        card.innerHTML = `<div style="color:rgba(255,255,255,0.5);font-style:italic;">スロット${i}　（空き）</div>`;
      }

      // クリック（削除以外）でセーブ/ロード
      card.onclick = (e) => {
        if (e.target.classList.contains("slotDelete")) return;
        if (mode === "save") saveToSlot(i);
        else loadFromSlot(i, fromTitle);
      };

      // 削除ボタン
      const delBtn = card.querySelector(".slotDelete");
      if (delBtn) {
        delBtn.onclick = (e) => {
          e.stopPropagation();
          localStorage.removeItem(key);
          notify(`スロット${i}のデータを削除しました`);
          openSlotMenu(mode, fromTitle); // 再描画
        };
      }

      slotButtons.appendChild(card);
    }

    document.getElementById("cancelSlot").onclick = () => {
      slotOverlay.style.display = "none";
      if (fromTitle) titleScreen.style.display = "flex";
    };
  }

  function makeSlotCardHTML(i, data) {
    const date = new Date(data.savedAt);
    const timeString = date.toLocaleString("ja-JP", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    });
    return `
      <div style="font-weight:bold;">スロット${i}　${data.playerName}</div>
      <div style="font-size:0.9em;opacity:0.8;">場所：${data.current}</div>
      <div style="font-size:0.8em;color:#ffb6c1;">保存日時：${timeString}</div>
      <button class="slotDelete">削除</button>
    `;
  }

  function saveToSlot(i) {
    const key = `sakura_save_${i}`;
    const existing = localStorage.getItem(key);

    if (existing) {
      // カスタム上書き確認UI
      const confirmOverlay = document.createElement("div");
      confirmOverlay.style.position = "fixed";
      confirmOverlay.style.inset = "0";
      confirmOverlay.style.background = "rgba(0,0,0,0.6)";
      confirmOverlay.style.display = "flex";
      confirmOverlay.style.alignItems = "center";
      confirmOverlay.style.justifyContent = "center";
      confirmOverlay.style.zIndex = "999";
      confirmOverlay.innerHTML = `
        <div style="
          background: rgba(255,255,255,0.9);
          border: 2px solid #ffb6c1;
          border-radius: 10px;
          padding: 20px 30px;
          text-align: center;
          color: #333;
          font-size: 1.1em;">
          <p>スロット${i}に上書き保存しますか？</p>
          <div style="margin-top: 15px;">
            <button id="confirmYes" style="margin: 0 10px;">はい</button>
            <button id="confirmNo" style="margin: 0 10px;">いいえ</button>
          </div>
        </div>`;
      document.body.appendChild(confirmOverlay);

      document.getElementById("confirmYes").onclick = () => {
        performSave(i);
        confirmOverlay.remove();
      };
      document.getElementById("confirmNo").onclick = () => confirmOverlay.remove();
    } else {
      performSave(i);
    }
  }

  function performSave(i) {
    const now = new Date().toISOString();
    const data = { playerName, current, affection, trust, misstep, flags, savedAt: now };
    localStorage.setItem(`sakura_save_${i}`, JSON.stringify(data));
    notify(`スロット${i}にセーブしました`);
    slotOverlay.style.display = "none";
  }


  function loadFromSlot(i, fromTitle = false) {
    const key = `sakura_save_${i}`;
    const d = JSON.parse(localStorage.getItem(key) || "null");
    if (!d) { notify("セーブデータがありません"); return; }
    playerName = d.playerName;
    current    = d.current;
    affection  = d.affection ?? 0;
    trust      = d.trust ?? 0;
    misstep    = d.misstep ?? 0;
    Object.keys(flags).forEach(k => { flags[k] = d.flags?.[k] ?? false; });

    titleScreen.style.display = "none";
    nameScreen.classList.add("hidden");
    gameArea.classList.remove("hidden");
    menuBtn.style.display = "block";
    slotOverlay.style.display = "none";
    showScene(current);
    if (!fromTitle) notify(`スロット${i}からロードしました`);
  }

  // ======== メニュー操作 ========
  menuBtn.onclick = () => menuOverlay.style.display = "flex";
  closeMenuBtn.onclick = () => menuOverlay.style.display = "none";
  backToTitle.onclick = () => {
    // セーブはしない
    menuOverlay.style.display = "none";
    gameArea.classList.add("hidden");
    titleScreen.style.display = "flex";
    nameScreen.classList.add("hidden");
    menuBtn.style.display = "none";
  };
  saveButton.onclick = () => openSlotMenu("save");
  loadButton.onclick = () => openSlotMenu("load");

  // ======== タイトル → 名前入力 → 開始 ========
  function resetGameState() {
    current = "ch1_intro_1";
    affection = 0;
    trust = 0;
    misstep = 0;
    Object.keys(flags).forEach(k => flags[k] = false); // ← 構造維持して初期化
    localStorage.removeItem("currentSave");
  }


  // ======================
  // 「はじめから」ボタン処理
  // ======================
  startBtn.addEventListener("click", () => {
    resetGameState();

    // UIリセット
    titleScreen.style.display = "none";
    nameScreen.classList.remove("hidden");
    nameInput.value = "";
    nameInput.focus();

    gameArea.classList.add("hidden"); // ← display:none の代わりに一貫して hidden に統一
  });

  function startGame() {
    const v = nameInput.value.trim();
    if (v) playerName = v;
    nameScreen.classList.add("hidden");
    gameArea.classList.remove("hidden");
    menuBtn.style.display = "block";
    showScene(current || "ch1_intro_1"); // ← currentがnullの場合でも確実に開始
  }

  nameBtn.addEventListener("click", startGame);
  nameInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); startGame(); } });

  // ======== タイトルの「つづきから」 → スロット選択 ========
  continueBtn.onclick = () => {
    titleScreen.style.display = "none";
    openSlotMenu("load", true);
  };

});
