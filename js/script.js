
/**
 * Universal Jump
 * Sistema de vidas, pontuação, ranking MySQL e Sobre Nós
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // ELEMENTOS DO JOGO
    // ==========================================

    const mario = document.querySelector('.mario');
    const pipe = document.querySelector('.pipe');
    const gameBoard = document.getElementById('game-board');
    const hudPlayerName = document.getElementById('hud-player-name');
    const scoreDisplay = document.getElementById('score-display');
    const jumpTip = document.getElementById('jump-tip');
    const coinsContainer = document.getElementById('coins-container');

    if (!mario || !pipe || !gameBoard) {
        console.error('Não foi possível encontrar os elementos principais do jogo.');
        return;
    }

    const levelDisplay = document.createElement('div');
    levelDisplay.className = 'difficulty-indicator';
    gameBoard.appendChild(levelDisplay);

    // ==========================================
    // TELA INICIAL
    // ==========================================

    const startModal = document.getElementById('start-modal');
    const startForm = document.getElementById('start-form');
    const playerInput = document.getElementById('player-input');
    const btnViewRanking = document.getElementById('btn-view-ranking');

    // ==========================================
    // TELA DE PERDA DE VIDA
    // ==========================================

    const lifeModal = document.getElementById('life-modal');
    const lifeMessage = document.getElementById('life-message');
    const livesDisplay = document.getElementById('lives-display');
    const btnContinue = document.getElementById('btn-continue');
    const btnLifeRestart = document.getElementById('btn-life-restart');

    // ==========================================
    // GAME OVER E RANKING
    // ==========================================

    const gameoverModal = document.getElementById('gameover-modal');
    const finalScoreValue = document.getElementById('final-score-value');
    const saveStatusMsg = document.getElementById('save-status-msg');
    const rankingBody = document.getElementById('ranking-body');
    const btnRestart = document.getElementById('btn-restart');
    const btnChangePlayer = document.getElementById('btn-change-player');

    // ==========================================
    // SOBRE NÓS
    // ==========================================

    const aboutModal = document.getElementById('about-modal');
    const btnAboutUs = document.getElementById('btn-about-us');
    const btnCloseAbout = document.getElementById('btn-close-about');
    const btnBackAbout = document.getElementById('btn-back-about');

    // ==========================================
    // VARIÁVEIS DO JOGO
    // ==========================================

    let currentPlayer = '';
    let score = 0;
    let lives = 3;
    let isPlaying = false;

    let gameLoop = null;
    let scoreLoop = null;
    let coinLoop = null;
    let pipeMoveFrame = null;

    let lastPipeTime = 0;
    let pipeDuration = 1.6;
    let selectedCharacter = 'assets/mario.gif';

    // ==========================================
    // TEMA DO JOGO
    // ==========================================

    function isSonicTheme() {
        return selectedCharacter !== 'assets/mario.gif';
    }

    function updateGameTheme() {
        const sonicTheme = isSonicTheme();

        gameBoard.classList.toggle('sonic-theme', sonicTheme);

        pipe.src = sonicTheme
            ? 'assets/espinhos.webp'
            : 'assets/pipe.png';

        pipe.alt = sonicTheme ? 'Espinhos' : 'Cano';
    }

    const savedName = localStorage.getItem('mario_jump_player');

    if (savedName && playerInput) {
        playerInput.value = savedName;
    }

    // ==========================================
    // DIFICULDADE
    // ==========================================

    function updateDifficulty() {
        if (score < 500) {
            levelDisplay.textContent = 'NÍVEL: FÁCIL';
            pipeDuration = 1.6;
        } else if (score < 1000) {
            levelDisplay.textContent = 'NÍVEL: MÉDIO';
            pipeDuration = 1.3;
        } else {
            levelDisplay.textContent = 'NÍVEL: DIFÍCIL';
            pipeDuration = 1.0;
        }
    }

    // ==========================================
    // SISTEMA DE VIDAS - CORAÇÕES PIXEL ART
    // ==========================================

    function updateLivesDisplay() {
        if (!livesDisplay) return;

        livesDisplay.innerHTML = '';

        const desenho = [
            '00111100111100',
            '01111111111110',
            '11111111111111',
            '11111111111111',
            '11111111111111',
            '01111111111110',
            '00111111111100',
            '00011111111000',
            '00001111110000',
            '00000111100000',
            '00000011000000'
        ];

        for (let i = 0; i < 3; i++) {
            const heart = document.createElement('span');
            heart.className = 'pixel-heart';

            heart.style.setProperty(
                '--heart-color',
                i < lives ? '#ff3030' : '#555555'
            );

            heart.style.setProperty(
                '--heart-shadow',
                i < lives ? '#a80000' : '#333333'
            );

            heart.setAttribute(
                'aria-label',
                i < lives ? 'Vida disponível' : 'Vida perdida'
            );

            desenho.forEach((linha) => {
                [...linha].forEach((pixel) => {
                    const quadrado = document.createElement('span');
                    quadrado.className =
                        pixel === '1' ? 'heart-pixel' : 'heart-blank';

                    heart.appendChild(quadrado);
                });
            });

            livesDisplay.appendChild(heart);
        }
    }

    // ==========================================
    // POP-UP +25 AO PEGAR UMA MOEDA
    // ==========================================

    function showCoinPopup(coin) {
        const popup = document.createElement('div');

        popup.className = 'coin-popup';
        popup.textContent = '+25';

        const coinRect = coin.getBoundingClientRect();
        const boardRect = gameBoard.getBoundingClientRect();

        popup.style.left =
            `${coinRect.left - boardRect.left + gameBoard.scrollLeft}px`;

        popup.style.top =
            `${coinRect.top - boardRect.top + gameBoard.scrollTop}px`;

        gameBoard.appendChild(popup);

        setTimeout(() => popup.remove(), 900);
    }

    // ==========================================
    // PARAR LOOPS
    // ==========================================

    function stopGameLoops() {
        clearInterval(gameLoop);
        clearInterval(scoreLoop);
        clearInterval(coinLoop);

        gameLoop = null;
        scoreLoop = null;
        coinLoop = null;

        if (pipeMoveFrame !== null) {
            cancelAnimationFrame(pipeMoveFrame);
            pipeMoveFrame = null;
        }
    }

    // ==========================================
    // INICIAR PARTIDA
    // ==========================================

    function startGame(newGame = true) {
        stopGameLoops();

        if (lifeModal) lifeModal.classList.remove('active');
        if (gameoverModal) gameoverModal.classList.remove('active');

        if (newGame) {
            score = 0;
            lives = 3;
        }

        updateLivesDisplay();
        updateGameTheme();
        resetElements();

        isPlaying = true;
        lastPipeTime = 0;

        pipe.style.animation = 'none';
        pipe.style.right = 'auto';
        pipe.style.left = `${gameBoard.clientWidth}px`;

        pipeMoveFrame = requestAnimationFrame(movePipe);

        if (scoreDisplay) scoreDisplay.textContent = score;

        if (hudPlayerName) {
            hudPlayerName.textContent = currentPlayer || 'Jogador';
        }

        updateDifficulty();
        gameBoard.classList.add('running');

        scoreLoop = setInterval(() => {
            if (isPlaying) {
                score++;
                if (scoreDisplay) scoreDisplay.textContent = score;
                updateDifficulty();
            }
        }, 100);

        gameLoop = setInterval(checkCollision, 10);
        coinLoop = setInterval(spawnCoin, 1800);

        spawnCoin();
    }

    // ==========================================
    // MOVIMENTO DOS OBSTÁCULOS
    // ==========================================

    function movePipe(timestamp) {
        if (!isPlaying) return;

        if (lastPipeTime === 0) lastPipeTime = timestamp;

        const deltaTime = (timestamp - lastPipeTime) / 1000;
        lastPipeTime = timestamp;

        const distance = gameBoard.clientWidth + pipe.offsetWidth;
        const pixelsPerSecond = distance / pipeDuration;

        let currentLeft = parseFloat(pipe.style.left);

        if (isNaN(currentLeft)) currentLeft = gameBoard.clientWidth;

        currentLeft -= pixelsPerSecond * deltaTime;

        if (currentLeft < -pipe.offsetWidth) {
            currentLeft = gameBoard.clientWidth;
        }

        pipe.style.left = `${currentLeft}px`;
        pipeMoveFrame = requestAnimationFrame(movePipe);
    }

    // ==========================================
    // REINICIAR ELEMENTOS VISUAIS
    // ==========================================

    function resetElements() {
        if (coinsContainer) coinsContainer.innerHTML = '';

        gameBoard.querySelectorAll('.coin-popup').forEach(popup => popup.remove());

        pipe.style.animation = '';
        pipe.style.left = '';
        pipe.style.right = '';
        pipe.style.animationDuration = '';

        mario.src = selectedCharacter;
        mario.style.animation = '';
        mario.style.bottom = '0px';
        mario.style.width = '';
        mario.style.marginLeft = '';
        mario.classList.remove('jump');

        if (jumpTip) jumpTip.style.opacity = '1';
    }

    // ==========================================
    // GERAR MOEDAS
    // ==========================================

    function spawnCoin() {
        if (!isPlaying || !coinsContainer) return;

        const coin = document.createElement('div');
        coin.classList.add('coin');

        if (isSonicTheme()) coin.classList.add('sonic-ring');

        coin.style.bottom = `${150 + Math.random() * 30}px`;
        coinsContainer.appendChild(coin);

        coin.addEventListener('animationend', () => coin.remove());
    }

    // ==========================================
    // PULO
    // ==========================================

    function jump() {
        if (!isPlaying || mario.classList.contains('jump')) return;

        mario.classList.add('jump');

        if (jumpTip) jumpTip.style.opacity = '0';

        setTimeout(() => mario.classList.remove('jump'), 500);
    }

    // ==========================================
    // COLISÕES E MOEDAS
    // ==========================================

    function checkCollision() {
        if (!isPlaying) return;

        const pipePosition = pipe.offsetLeft;
        const marioPosition = parseFloat(
            window.getComputedStyle(mario).bottom
        ) || 0;

        if (
            pipePosition <= 120 &&
            pipePosition > 0 &&
            marioPosition < 80
        ) {
            loseLife(pipePosition, marioPosition);
            return;
        }

        if (coinsContainer) {
            const marioRect = mario.getBoundingClientRect();

            coinsContainer.querySelectorAll('.coin').forEach(coin => {
                const coinRect = coin.getBoundingClientRect();

                const collided =
                    marioRect.left < coinRect.right &&
                    marioRect.right > coinRect.left &&
                    marioRect.top < coinRect.bottom &&
                    marioRect.bottom > coinRect.top;

                if (collided && mario.classList.contains('jump')) {
                    showCoinPopup(coin);
                    coin.remove();

                    score += 25;

                    if (scoreDisplay) scoreDisplay.textContent = score;

                    updateDifficulty();
                }
            });
        }
    }

    // ==========================================
    // PERDA DE VIDA
    // ==========================================

    function loseLife(pipePosition, marioPosition) {
        if (!isPlaying) return;

        isPlaying = false;
        lives--;

        stopGameLoops();

        if (coinsContainer) coinsContainer.innerHTML = '';

        gameBoard.classList.remove('running');

        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`;

        mario.style.animation = 'none';
        mario.style.bottom = `${marioPosition}px`;

        updateLivesDisplay();

        if (lives > 0) {
            if (lifeMessage) {
                lifeMessage.textContent =
                    `Você perdeu uma vida! Restam ${lives} ` +
                    `${lives === 1 ? 'vida' : 'vidas'}. ` +
                    'Deseja continuar de onde parou ou jogar novamente?';
            }

            if (lifeModal) lifeModal.classList.add('active');
        } else {
            if (lifeModal) lifeModal.classList.remove('active');
            triggerGameOver(pipePosition, marioPosition);
        }
    }

    // ==========================================
    // GAME OVER
    // ==========================================

    function triggerGameOver(pipePosition, marioPosition) {
        isPlaying = false;
        stopGameLoops();

        if (coinsContainer) coinsContainer.innerHTML = '';

        gameBoard.classList.remove('running');

        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`;

        mario.style.animation = 'none';
        mario.style.bottom = `${marioPosition}px`;
        mario.src = 'assets/game-over.gif';
        mario.style.width = '75px';
        mario.style.marginLeft = '50px';

        if (finalScoreValue) finalScoreValue.textContent = score;

        if (saveStatusMsg) {
            saveStatusMsg.textContent = 'Salvando pontuação no banco...';
            saveStatusMsg.style.color = '#ffcc00';
        }

        if (gameoverModal) gameoverModal.classList.add('active');

        saveScore(currentPlayer, score);
    }

    // ==========================================
    // BOTÕES DE VIDAS
    // ==========================================

    if (btnContinue) {
        btnContinue.addEventListener('click', () => {
            if (lives > 0) startGame(false);
        });
    }

    if (btnLifeRestart) {
        btnLifeRestart.addEventListener('click', () => startGame(true));
    }

    // ==========================================
    // SALVAR PONTUAÇÃO NO MYSQL
    // ==========================================

    function saveScore(playerName, finalScore) {
        fetch('salvar_ranking.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: playerName,
                pontos: finalScore
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                if (saveStatusMsg) {
                    saveStatusMsg.textContent = 'Pontuação registrada no banco!';
                    saveStatusMsg.style.color = '#10b981';
                }

                if (data.ranking) {
                    renderRanking(data.ranking, playerName, finalScore);
                } else {
                    fetchRanking();
                }
            } else if (saveStatusMsg) {
                saveStatusMsg.textContent =
                    '⚠️ ' + (data.message || 'Erro ao registrar.');
                saveStatusMsg.style.color = '#ef4444';
            }
        })
        .catch(err => {
            console.error('Erro na requisição:', err);

            if (saveStatusMsg) {
                saveStatusMsg.textContent =
                    '⚠️ Erro ao conectar ao servidor Laragon.';
                saveStatusMsg.style.color = '#ef4444';
            }
        });
    }

    // ==========================================
    // BUSCAR RANKING
    // ==========================================

    function fetchRanking() {
        fetch('obter_ranking.php')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.ranking) {
                    renderRanking(data.ranking);
                }
            })
            .catch(err => console.error('Erro ao buscar ranking:', err));
    }

    // ==========================================
    // RENDERIZAR RANKING
    // ==========================================

    function renderRanking(list, highlightName = null, highlightScore = null) {
        if (!rankingBody) return;

        rankingBody.innerHTML = '';

        if (!list || list.length === 0) {
            rankingBody.innerHTML =
                '<tr><td colspan="3" class="loading-cell">' +
                'Nenhuma pontuação gravada ainda. Jogue para ser o 1º!' +
                '</td></tr>';
            return;
        }

        let highlighted = false;

        list.forEach((item, index) => {
            const tr = document.createElement('tr');

            if (
                !highlighted &&
                highlightName &&
                item.nome === highlightName &&
                parseInt(item.pontos, 10) === highlightScore
            ) {
                tr.classList.add('highlight-current');
                highlighted = true;
            }

            let medal = `${index + 1}º`;

            if (index === 0) medal = '🥇 1º';
            else if (index === 1) medal = '🥈 2º';
            else if (index === 2) medal = '🥉 3º';

            tr.innerHTML = `
                <td class="ranking-pos">${medal}</td>
                <td><strong>${escapeHtml(item.nome)}</strong></td>
                <td>${parseInt(item.pontos, 10)} pts</td>
            `;

            rankingBody.appendChild(tr);
        });
    }

    function escapeHtml(str) {
        if (!str) return '';

        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ==========================================
    // INICIAR PARTIDA
    // ==========================================

    if (startForm) {
        startForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameValue = playerInput ? playerInput.value.trim() : '';

            if (!nameValue) {
                if (playerInput) playerInput.focus();
                return;
            }

            const characterChoice = document.querySelector(
                'input[name="character"]:checked'
            );

            if (characterChoice) selectedCharacter = characterChoice.value;

            currentPlayer = nameValue;

            localStorage.setItem('mario_jump_player', currentPlayer);

            if (startModal) startModal.classList.remove('active');

            startGame(true);
        });
    }

    // ==========================================
    // BOTÃO VER RANKING
    // ==========================================

    if (btnViewRanking) {
        btnViewRanking.addEventListener('click', () => {
            fetchRanking();

            if (finalScoreValue) finalScoreValue.textContent = '---';
            if (saveStatusMsg) saveStatusMsg.textContent = '';
            if (startModal) startModal.classList.remove('active');
            if (gameoverModal) gameoverModal.classList.add('active');
        });
    }

    // ==========================================
    // JOGAR NOVAMENTE
    // ==========================================

    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            if (gameoverModal) gameoverModal.classList.remove('active');

            if (!currentPlayer) {
                if (startModal) startModal.classList.add('active');
                if (playerInput) playerInput.focus();
            } else {
                startGame(true);
            }
        });
    }

    // ==========================================
    // TROCAR JOGADOR
    // ==========================================

    if (btnChangePlayer) {
        btnChangePlayer.addEventListener('click', () => {
            if (gameoverModal) gameoverModal.classList.remove('active');
            if (lifeModal) lifeModal.classList.remove('active');

            stopGameLoops();
            isPlaying = false;
            resetElements();

            if (startModal) startModal.classList.add('active');

            if (playerInput) {
                playerInput.value = '';
                playerInput.focus();
            }
        });
    }

    // ==========================================
    // CONTROLES DO TECLADO
    // ==========================================

    document.addEventListener('keydown', (e) => {
        if (aboutModal && aboutModal.style.display === 'flex') return;

        if (e.code === 'Space' || e.key === ' ') {
            if (isPlaying) {
                e.preventDefault();
                jump();
                return;
            }

            if (gameoverModal && gameoverModal.classList.contains('active')) {
                e.preventDefault();
                gameoverModal.classList.remove('active');

                if (currentPlayer) startGame(true);
                else if (startModal) startModal.classList.add('active');
            }

            return;
        }

        if (e.code === 'ArrowUp' && isPlaying) {
            e.preventDefault();
            jump();
        }
    });

    // ==========================================
    // PULAR CLICANDO NO TABULEIRO
    // ==========================================

    gameBoard.addEventListener('click', () => {
        if (isPlaying) jump();
    });

    // ==========================================
    // BOTÕES VOLTAR AO MENU
    // ==========================================

    document.querySelectorAll('.btn-menu-voltar').forEach((botao) => {
        botao.addEventListener('click', () => {
            isPlaying = false;
            stopGameLoops();

            if (lifeModal) lifeModal.classList.remove('active');
            if (gameoverModal) gameoverModal.classList.remove('active');

            gameBoard.classList.remove('running');
            resetElements();

            if (startModal) startModal.classList.add('active');
        });
    });

    // ==========================================
    // SOBRE NÓS - LGBT SOFTWARE
    // ==========================================

    function openAboutModal() {
        if (!aboutModal) {
            console.error('Modal Sobre Nós não encontrado no HTML.');
            return;
        }

        aboutModal.style.display = 'flex';
        aboutModal.classList.add('active');
    }

    function closeAboutModal() {
        if (!aboutModal) return;

        aboutModal.style.display = 'none';
        aboutModal.classList.remove('active');
    }

    if (btnAboutUs) {
        btnAboutUs.addEventListener('click', (event) => {
            event.preventDefault();
            openAboutModal();
        });
    }

    if (btnCloseAbout) btnCloseAbout.addEventListener('click', closeAboutModal);
    if (btnBackAbout) btnBackAbout.addEventListener('click', closeAboutModal);

    if (aboutModal) {
        aboutModal.addEventListener('click', (event) => {
            if (event.target === aboutModal) closeAboutModal();
        });
    }

    document.addEventListener('keydown', (event) => {
        if (
            event.key === 'Escape' &&
            aboutModal &&
            aboutModal.style.display === 'flex'
        ) {
            closeAboutModal();
        }
    });

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================

    updateLivesDisplay();
});
