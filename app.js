document.addEventListener('DOMContentLoaded', () => {
    // --- Helper for safe element selection ---
    const getEl = (id) => document.getElementById(id);

    // --- DOM Elements ---
    const aiSearchArea = getEl('ai-search-area');
    const searchForm = getEl('search-form');
    const aiInput = getEl('ai-input');
    const aiSearchBtn = getEl('ai-search-btn');
    const aiLoading = getEl('ai-loading');
    const searchBtn = getEl('search-btn');
    const resetBtn = getEl('reset-btn');
    const resultsSection = document.querySelector('.results-section');
    const diagnosisSection = getEl('diagnosis-section'); 
    const resultsMessage = getEl('results-message');
    const spotsGrid = getEl('spots-grid');
    const noResult = getEl('no-result');
    const modal = getEl('modal');
    const modalCloseBtn = getEl('modal-close');
    const modalBody = getEl('modal-body');
    const pocketBtn = getEl('pocket-btn');
    const pocketCount = getEl('pocket-count');
    const pocketView = getEl('pocket-view');
    const backToSearchBtn = getEl('back-to-search');
    const contactBtn = getEl('contact-btn');
    const heroLinks = document.querySelectorAll('[data-target-tab]');
    const moodTags = document.querySelectorAll('.mood-tag');

    // --- Data: 状態定義 ---
    const mindStates = [
        {
            title: "頑張りすぎてしまったあなたへ",
            msg: "毎日、誰かのために走り続けていませんか。\n\n「休むこと」に罪悪感を持つ必要はありません。\n今はただ、スイッチをオフにする。\nそれこそが、今のあなたに必要な「仕事」です。",
            advice: "何もしない時間を、贅沢に使いましょう。",
            icon: "☕",
            targetTags: ["海", "リラックス", "温泉", "静寂"],
            spotIntro: "何もしない贅沢を許してくれる場所",
            color: "#E0F2F1"
        },
        {
            title: "答えが見つからず迷うあなたへ",
            msg: "白か黒か、すぐに決めなくても大丈夫です。\n\n人生には、あえて「迷子になる」時間が必要です。\n問いを抱えたまま、知らない町を歩く。\nそんな静かな時間が、絡まった糸を解いてくれます。",
            advice: "結論を出さない旅に出かけましょう。",
            icon: "📖",
            targetTags: ["歴史", "散歩", "路地", "レトロ"],
            spotIntro: "時間を忘れて、迷子になれる場所",
            color: "#E6E6FA"
        },
        {
            title: "少し息苦しさを感じるあなたへ",
            msg: "たくさんの情報や期待に、少し疲れてしまいましたか。\n\nあなたは、あなたに戻るだけでいいのです。\n深く息を吸って、吐く。\n広い景色の中で、その単純な喜びを思い出してください。",
            advice: "広い空の下で、深呼吸を取り戻しましょう。",
            icon: "🌿",
            targetTags: ["絶景", "山", "高原", "風"],
            spotIntro: "深く息を吸える、広い場所",
            color: "#F0FFF0"
        },
        {
            title: "区切りをつけたいあなたへ",
            msg: "ひとつの物語を終えて、\n次のページをめくる準備をしているのですね。\n\n焦ることはありません。\n静かな場所で「句読点」を打つことで、\n次の物語は、より鮮やかに始まります。",
            advice: "終わりと始まりの間に、静かな一休みを。",
            icon: "✨",
            targetTags: ["夕日", "神社", "建築", "祈り"],
            spotIntro: "心を整え、区切りをつける場所",
            color: "#FFF5EE"
        },
        {
            title: "ただ、ぼーっとしたいあなたへ",
            msg: "理由なんて、なくていいんです。\n効率や意味から離れて、ただ「在る」ことを感じる。\n\nそんな贅沢が許される場所が、ここにあります。\n重たい荷物は置いて、身軽に行きましょう。",
            advice: "意味のない移動が、心の救いになります。",
            icon: "🌊",
            targetTags: ["海", "島", "電車", "ドライブ"],
            spotIntro: "理由なんてなくても、行っていい場所",
            color: "#F0F8FF"
        }
    ];

    let allSpots = [];
    let savedIds = JSON.parse(localStorage.getItem('toEhime_pocket')) || [];

    // --- Initialization ---
    fetchSpots();
    updatePocketCount();

    // --- Switching Search Mode ---
    function switchSearchMode(modeName) {
        if(pocketView) pocketView.style.display = 'none';
        if(spotsGrid) spotsGrid.innerHTML = '';
        if(resultsMessage) resultsMessage.textContent = '';
        if(noResult) noResult.style.display = 'none';
        if(resultsSection) resultsSection.style.display = 'none'; 
        if(diagnosisSection) diagnosisSection.style.display = 'none';

        if (modeName === 'ai') {
            if(aiSearchArea) aiSearchArea.classList.add('active-tab');
            if(searchForm) searchForm.classList.remove('active-tab');
        } else {
            if(aiSearchArea) aiSearchArea.classList.remove('active-tab');
            if(searchForm) searchForm.classList.add('active-tab');
        }
    }

    // --- Hero Links Handling ---
    heroLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); 
            const targetMode = link.dataset.targetTab;
            switchSearchMode(targetMode);
            const targetSection = document.getElementById('search-section');
            if(targetSection) targetSection.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // --- Mood Tag Handling ---
    if(moodTags) {
        moodTags.forEach(tag => {
            tag.addEventListener('click', () => {
                if(aiInput) {
                    aiInput.value = tag.dataset.text;
                    // Optional: Smooth scroll to button or highlight
                    aiSearchBtn.focus();
                }
            });
        });
    }

    // --- AI Search Logic ---
    async function aiSearch() {
        if (allSpots.length === 0) {
            await fetchSpots();
            if (allSpots.length === 0) {
                alert('データを読み込めませんでした。「data」フォルダに「spots.json」があるか確認してください。');
                return;
            }
        }

        let text = aiInput ? aiInput.value.trim() : "";
        if (!text) text = "おまかせ";

        if(aiLoading) aiLoading.style.display = 'block';
        if(spotsGrid) spotsGrid.innerHTML = '';
        if(resultsMessage) resultsMessage.innerHTML = '';
        if(diagnosisSection) {
            diagnosisSection.innerHTML = ''; 
            diagnosisSection.style.display = 'none';
        }
        
        if(resultsSection) resultsSection.style.display = 'block'; 

        await new Promise(r => setTimeout(r, 1500));

        // 1. Determine "State"
        const stateIndex = Math.floor(Math.random() * mindStates.length);
        const currentState = mindStates[stateIndex];
        
        // 2. Render Diagnosis Card
        renderDiagnosis(currentState);

        // 3. Filter Spots
        const matchedSpots = allSpots.filter(spot => {
            return spot.tags.some(tag => currentState.targetTags.includes(tag)) ||
                   spot.purpose.some(p => currentState.targetTags.includes(p));
        });

        if(aiLoading) aiLoading.style.display = 'none';

        if (matchedSpots.length > 0) {
            const selectedSpots = matchedSpots.sort(() => 0.5 - Math.random()).slice(0, 3);
            if(resultsMessage) resultsMessage.textContent = '手紙に綴った想いと、響き合う場所。';
            renderSpots(selectedSpots, currentState.spotIntro);
        } else {
            if(resultsMessage) resultsMessage.textContent = '言葉にならない気分かもしれません。こんな場所はどうでしょう。';
            const randomSpots = [...allSpots].sort(() => 0.5 - Math.random()).slice(0, 2);
            renderSpots(randomSpots, "ふと、心が動く場所");
        }
        
        if(resultsSection) resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // --- Render Diagnosis Card ---
    function renderDiagnosis(state) {
        if(!diagnosisSection) return;
        diagnosisSection.style.display = 'block';
        
        const siteUrl = "https://to-ehime.com"; 
        const shareText = `今の私へ。「${state.advice}」%0a%0a届いた手紙：${state.title}%0a#ToEhime #静かな旅`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${siteUrl}`;
        const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(siteUrl)}&text=${shareText}`;

        diagnosisSection.innerHTML = `
            <div class="diagnosis-card" style="border-top-color: ${state.color === '#FFF5EE' ? '#D98E32' : state.color};">
                <div class="diagnosis-content">
                    <header class="diagnosis-header">
                        <span class="diagnosis-label">To You</span>
                        <h2 class="diagnosis-title">${state.title}</h2>
                    </header>
                    <div class="diagnosis-body">
                        <p class="diagnosis-text">${state.msg}</p>
                    </div>
                    <div class="prescription-area">
                        <span class="prescription-icon">${state.icon}</span>
                        <p class="prescription-text">
                            処方箋：<br><span class="prescription-highlight">${state.advice}</span>
                        </p>
                    </div>
                    <div class="share-area">
                        <span class="share-msg">この手紙を保存・共有する</span>
                        <div class="share-btns">
                            <a href="${twitterUrl}" target="_blank" class="btn-share x-share">X でつぶやく</a>
                            <a href="${lineUrl}" target="_blank" class="btn-share line-share">LINE で送る</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- Manual Search Logic ---
    function manualSearch() {
        if (allSpots.length === 0) {
            alert('データ読み込み中です。少々お待ちください。');
            return;
        }
        if(diagnosisSection) diagnosisSection.style.display = 'none';

        const criteria = {
            region: document.getElementById('region').value,
            purpose: document.getElementById('purpose').value,
            budget: document.getElementById('budget').value,
            season: document.getElementById('season').value,
            companion: document.getElementById('companion').value
        };

        const filtered = allSpots.filter(spot => {
            if (criteria.region && spot.region !== criteria.region) return false;
            if (criteria.budget && spot.budget !== criteria.budget) return false;
            if (criteria.purpose && !spot.purpose.includes(criteria.purpose)) return false;
            if (criteria.season && !spot.season.includes(criteria.season) && !spot.season.includes('all')) return false;
            if (criteria.companion && !spot.companion.includes(criteria.companion)) return false;
            return true;
        });

        if(resultsSection) resultsSection.style.display = 'block';

        if (filtered.length > 0) {
            if(resultsMessage) resultsMessage.textContent = `${filtered.length}つの場所が、あなたを待っています。`;
            renderSpots(filtered);
        } else {
            if(noResult) noResult.style.display = 'block';
            if(resultsMessage) resultsMessage.textContent = '';
            if(spotsGrid) spotsGrid.innerHTML = '';
        }
        if(resultsSection) resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // --- Render Spots ---
    function renderSpots(spots, introText = null) {
        if(!spotsGrid) return;
        spotsGrid.innerHTML = '';
        spots.forEach(spot => {
            const isSaved = savedIds.includes(spot.id);
            const card = document.createElement('div');
            card.className = 'card';
            const creditHtml = spot.credit ? `<span class="photo-credit">Photo by ${spot.credit}</span>` : '';
            const introHtml = introText ? `<div class="card-intro"><span>${introText}</span></div>` : '';

            card.innerHTML = `
                <div class="card-img-wrapper">
                    <img src="${spot.imageUrl}" alt="${spot.title}" class="card-img" loading="lazy" onerror="this.src='https://placehold.co/600x400?text=No+Image'">
                    ${creditHtml}
                </div>
                <button class="btn-fav ${isSaved ? 'active' : ''}">${isSaved ? '♥' : '♡'}</button>
                <div class="card-body">
                    ${introHtml}
                    <span class="card-pref">${spot.prefecture}</span>
                    <h3 class="card-title">${spot.title}</h3>
                    <p class="card-reason">${spot.reason}</p>
                </div>
            `;
            
            card.querySelector('.card-img-wrapper').addEventListener('click', () => openModal(spot));
            card.querySelector('.card-body').addEventListener('click', () => openModal(spot));
            card.querySelector('.btn-fav').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleSave(spot.id, e.target);
            });
            spotsGrid.appendChild(card);
        });
    }

    // --- Utilities ---
    function toggleSave(id, btnElement) {
        if (savedIds.includes(id)) {
            savedIds = savedIds.filter(itemId => itemId !== id);
            if(btnElement) { btnElement.classList.remove('active'); btnElement.textContent = '♡'; }
        } else {
            savedIds.push(id);
            if(btnElement) { btnElement.classList.add('active'); btnElement.textContent = '♥'; }
        }
        localStorage.setItem('toEhime_pocket', JSON.stringify(savedIds));
        updatePocketCount();
    }

    function updatePocketCount() {
        if(pocketCount) {
            if (savedIds.length > 0) {
                pocketCount.textContent = savedIds.length;
                pocketCount.style.display = 'inline-block';
            } else {
                pocketCount.style.display = 'none';
            }
        }
    }

    function showPocket() {
        if(aiSearchArea) aiSearchArea.classList.remove('active-tab');
        if(searchForm) searchForm.classList.remove('active-tab');
        if(resultsSection) resultsSection.style.display = 'block'; 
        if(pocketView) pocketView.style.display = 'block';
        if(diagnosisSection) diagnosisSection.style.display = 'none'; 
        
        const pocketSpots = allSpots.filter(spot => savedIds.includes(spot.id));
        if (pocketSpots.length > 0) {
            if(resultsMessage) resultsMessage.textContent = '';
            renderSpots(pocketSpots, "あなたのポケットの中身");
        } else {
            if(resultsMessage) resultsMessage.textContent = 'ポケットは空っぽです。';
            if(spotsGrid) spotsGrid.innerHTML = '';
        }
        if(resultsSection) resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // --- Modal Logic ---
    function openModal(spot) {
        const isSaved = savedIds.includes(spot.id);
        const planHtml = spot.plan ? spot.plan.map(p => `<li>${p}</li>`).join('') : '';
        const sensoryHtml = spot.sensory ? `
            <div class="sensory-block">
                <ul class="sensory-list">
                    <li class="sensory-item"><span class="sensory-icon">👃</span> ${spot.sensory.smell}</li>
                    <li class="sensory-item"><span class="sensory-icon">👂</span> ${spot.sensory.sound}</li>
                    <li class="sensory-item"><span class="sensory-icon">✋</span> ${spot.sensory.touch}</li>
                </ul>
            </div>
        ` : '';
        const voiceHtml = spot.curatorVoice ? `
            <div class="curator-voice">
                <p class="curator-text">"${spot.curatorVoice}"</p>
            </div>
        ` : '';
        const notRecommendedHtml = spot.notRecommendedFor ? `
            <p class="not-recommended">※ ${spot.notRecommendedFor.join('、')}には向きません。</p>
        ` : '';

        // Fake Stamp Logic
        const fakeCount1 = (spot.id * 3) % 20 + 2; 
        const fakeCount2 = (spot.id * 7) % 15 + 1;
        const fakeCount3 = (spot.id * 5) % 10 + 0;
        const hasStampedRelax = localStorage.getItem(`toEhime_stamp_${spot.id}_relax`);
        const hasStampedMoved = localStorage.getItem(`toEhime_stamp_${spot.id}_moved`);
        const hasStampedClean = localStorage.getItem(`toEhime_stamp_${spot.id}_clean`);

        if(modalBody) {
            modalBody.innerHTML = `
                <img src="${spot.imageUrl}" alt="${spot.title}" class="modal-img" onerror="this.src='https://placehold.co/600x400?text=No+Image'">
                <div class="modal-details">
                    <span class="modal-pref">${spot.prefecture}</span>
                    <h2 class="modal-title">${spot.title}</h2>
                    
                    <div class="modal-fav-wrapper">
                        <button class="btn-modal-fav ${isSaved ? 'active' : ''}" id="modal-fav-btn">
                            ${isSaved ? '♥ ポケットに入れています' : '♡ ポケットに入れる'}
                        </button>
                    </div>

                    <p class="modal-text">${spot.reason}</p>
                    
                    ${voiceHtml}
                    ${sensoryHtml}

                    <div class="stamp-section">
                        <span class="stamp-label">この場所の気配（みんなの感情）</span>
                        <div class="stamp-container">
                            <button class="stamp-btn ${hasStampedRelax ? 'active' : ''}" onclick="toggleStamp(${spot.id}, 'relax', this)">
                                <span class="stamp-icon">🌿</span><span class="stamp-name">安らぎ</span><span class="stamp-count">${fakeCount1 + (hasStampedRelax ? 1 : 0)}</span>
                            </button>
                            <button class="stamp-btn ${hasStampedMoved ? 'active' : ''}" onclick="toggleStamp(${spot.id}, 'moved', this)">
                                <span class="stamp-icon">🥺</span><span class="stamp-name">感動</span><span class="stamp-count">${fakeCount2 + (hasStampedMoved ? 1 : 0)}</span>
                            </button>
                            <button class="stamp-btn ${hasStampedClean ? 'active' : ''}" onclick="toggleStamp(${spot.id}, 'clean', this)">
                                <span class="stamp-icon">✨</span><span class="stamp-name">浄化</span><span class="stamp-count">${fakeCount3 + (hasStampedClean ? 1 : 0)}</span>
                            </button>
                        </div>
                    </div>

                    <div class="info-block">
                        <h4>静かな過ごし方（例）</h4>
                        <ul>${planHtml}</ul>
                    </div>
                    <div class="modal-meta">
                        <div><strong>時期</strong><br>${spot.bestSeason}</div>
                        <div><strong>アクセス</strong><br>${spot.access}</div>
                    </div>
                    ${notRecommendedHtml}

                    <div class="modal-actions">
                        <a href="${spot.bookingUrl}" target="_blank" class="btn-action book">
                            空室・詳細を見てみる（静寂を予約）
                        </a>
                        <a href="${spot.mapUrl}" target="_blank" class="btn-action map">
                            場所を地図で確認する
                        </a>
                    </div>
                </div>
            `;
            
            const modalFavBtn = document.getElementById('modal-fav-btn');
            if(modalFavBtn) {
                modalFavBtn.addEventListener('click', () => {
                    toggleSave(spot.id, null);
                    if (savedIds.includes(spot.id)) {
                        modalFavBtn.classList.add('active');
                        modalFavBtn.textContent = '♥ ポケットに入れています';
                    } else {
                        modalFavBtn.classList.remove('active');
                        modalFavBtn.textContent = '♡ ポケットに入れる';
                    }
                });
            }
        }

        if(modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal() {
        if(modal) modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // --- Listeners ---
    if(aiSearchBtn) aiSearchBtn.addEventListener('click', aiSearch);
    if(searchBtn) searchBtn.addEventListener('click', manualSearch);
    
    if(resetBtn) {
        resetBtn.addEventListener('click', () => {
            if(searchForm) searchForm.reset();
            if(resultsSection) resultsSection.style.display = 'none';
            if(spotsGrid) spotsGrid.innerHTML = '';
            if(resultsMessage) resultsMessage.textContent = '';
            if(noResult) noResult.style.display = 'none';
        });
    }

    if(modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    if(pocketBtn) pocketBtn.addEventListener('click', showPocket);
    
    if(backToSearchBtn) {
        backToSearchBtn.addEventListener('click', () => {
            switchSearchMode('ai'); 
            const hero = document.querySelector('.hero');
            if(hero) hero.scrollIntoView({ behavior: 'smooth' });
        });
    }

    if(contactBtn) {
        contactBtn.addEventListener('click', () => {
            alert('ありがとうございます！\nまだ検証段階なので、SNSのリプライやDMで感想をいただけると泣いて喜びます🍊');
        });
    }

    // --- Fetch Data ---
    async function fetchSpots() {
        try {
            const response = await fetch('./data/spots.json');
            if (!response.ok) throw new Error('データ読み込みエラー');
            allSpots = await response.json();
        } catch (error) {
            console.error('Error:', error);
        }
    }
    
    // Global Stamp Function
    window.toggleStamp = function(id, type, btn) {
        const key = `toEhime_stamp_${id}_${type}`;
        const countSpan = btn.querySelector('.stamp-count');
        let currentCount = parseInt(countSpan.textContent);

        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            btn.classList.remove('active');
            countSpan.textContent = currentCount - 1;
        } else {
            localStorage.setItem(key, 'true');
            btn.classList.add('active');
            countSpan.textContent = currentCount + 1;
            btn.style.transform = "scale(1.1)";
            setTimeout(() => btn.style.transform = "scale(1)", 200);
        }
    };
});
