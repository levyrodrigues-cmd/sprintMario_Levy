
<?php

require_once 'conexao.php';

$rankingInicial = [];

try {
    $stmt = $pdo->query("
        SELECT id, nome, pontos,
        DATE_FORMAT(data_registro, '%d/%m/%Y %H:%i') as data
        FROM ranking
        ORDER BY pontos DESC, id ASC
        LIMIT 10
    ");

    $rankingInicial = $stmt->fetchAll();
} catch (Exception $e) {
    $rankingInicial = [];
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Mario Jump - Jogo com Ranking MySQL</title>

    <link rel="stylesheet" href="css/style.css">
</head>

<body>

<div class="game-container">

    <header class="hud-bar">

        <div class="player-info">
            <span class="label">JOGADOR:</span>
            <span class="value" id="hud-player-name">---</span>
        </div>

        <div class="lives-info">
            <span class="label">VIDAS:</span>
            <span class="value" id="lives-display"></span>
        </div>

        <div class="score-info">
            <span class="label">PONTOS:</span>
            <span class="value" id="score-display">0</span>
        </div>

    </header>

    <main class="game-board" id="game-board">

        <!-- Cenário do Sonic -->
        <div class="greenhill-background" aria-hidden="true">
            <img src="assets/greenhills.gif" alt="">
            <img src="assets/greenhills.gif" alt="">
        </div>

        <!-- Elementos do jogo -->
        <img src="assets/clouds.png" class="clouds" alt="Nuvens">

        <img
            src="assets/mario.gif"
            class="mario"
            alt="Personagem"
        >

        <img
            src="assets/pipe.png"
            class="pipe"
            alt="Obstáculo"
        >

        <div id="coins-container" aria-label="Moedas"></div>

        <span class="jump-tip" id="jump-tip">
            Pressione ESPAÇO ou clique para pular
        </span>

    </main>

</div>

<!-- 1. TELA DE INÍCIO -->
<div class="modal-overlay active" id="start-modal">

    <div class="modal-card">

        <div class="modal-header">
            <h1 class="game-title">UNIVERSAL JUMP - BETA</h1>

            <p class="game-subtitle">
                Corra, desvie dos obstáculos e dispute o topo do ranking!
            </p>
        </div>

        <form class="start-form" id="start-form">

            <div class="input-group">
                <label>ESCOLHA SEU PERSONAGEM:</label>

                <div class="character-selection">

                    <label class="character-option">
                        <input
                            type="radio"
                            name="character"
                            value="assets/mario.gif"
                            checked
                        >
                        <img src="assets/mario.gif" alt="Mario">
                        <span>Mario</span>
                    </label>

                    <label class="character-option">
                        <input
                            type="radio"
                            name="character"
                            value="assets/sonic_correndo.gif"
                        >
                        <img src="assets/sonic_correndo.gif" alt="Sonic">
                        <span>Sonic</span>
                    </label>

                    <label class="character-option">
                        <input
                            type="radio"
                            name="character"
                            value="assets/amy_correndo.gif"
                        >
                        <img src="assets/amy_correndo.gif" alt="Amy">
                        <span>Amy</span>
                    </label>

                    <label class="character-option">
                        <input
                            type="radio"
                            name="character"
                            value="assets/knuckles_correndo.gif"
                        >
                        <img src="assets/knuckles_correndo.gif" alt="Knuckles">
                        <span>Knuckles</span>
                    </label>

                    <label class="character-option">
                        <input
                            type="radio"
                            name="character"
                            value="assets/tails_correndo.gif"
                        >
                        <img src="assets/tails_correndo.gif" alt="Tails">
                        <span>Tails</span>
                    </label>

                    <label class="character-option">
                        <input
                            type="radio"
                            name="character"
                            value="assets/shadow_correndo.gif"
                        >
                        <img src="assets/shadow_correndo.gif" alt="Shadow">
                        <span>Shadow</span>
                    </label>

                </div>
            </div>

            <div class="input-group">
                <label for="player-input">DIGITE SEU NOME:</label>

                <input
                    type="text"
                    id="player-input"
                    placeholder="Ex: Seu Nome"
                    maxlength="30"
                    required
                    autocomplete="off"
                    autofocus
                >
            </div>

            <div class="modal-actions">

                <button
                    type="submit"
                    class="btn btn-primary"
                    id="btn-start"
                >
                    INICIAR JOGO
                </button>

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="btn-view-ranking"
                >
                    VER RANKING
                </button>

                
                <button id="btn-about-us" type="button">
                    SOBRE NÓS
                </button>


            </div>

        </form>

    </div>
</div>

<!-- 2. TELA DE PERDA DE VIDA -->
<div class="modal-overlay" id="life-modal">

    <div class="modal-card">

        <div class="modal-header">
            <h2 class="game-title">VOCÊ PERDEU UMA VIDA!</h2>

            <p class="game-subtitle" id="life-message">
                Você ainda pode continuar jogando!
            </p>
        </div>

        <div class="modal-actions">

            <button
                type="button"
                class="btn btn-primary"
                id="btn-continue"
            >
                CONTINUAR
            </button>

            <button
                type="button"
                class="btn btn-secondary"
                id="btn-life-restart"
            >
                JOGAR NOVAMENTE
            </button>

            <button class="btn btn-secondary btn-menu-voltar">
                VOLTAR AO MENU
            </button> 

        </div>

    </div>
</div>

<!-- 3. TELA DE GAME OVER E RANKING -->
<div class="modal-overlay" id="gameover-modal">

    <div class="modal-card gameover-card">

        <div class="modal-header">
            <h2 class="gameover-title">GAME OVER</h2>

            <div class="final-score-box">
                <div class="final-score-label">
                    SUA PONTUAÇÃO
                </div>

                <div class="final-score-num" id="final-score-value">
                    0
                </div>

                <div class="save-status" id="save-status-msg"></div>
            </div>
        </div>

        <!-- Tabela do TOP 10 -->
        <div class="ranking-container">

            <h3 class="ranking-title">
                🏆 TOP 10 MELHORES PONTUAÇÕES
            </h3>

            <div class="table-wrapper">

                <table class="ranking-table">

                    <thead>
                        <tr>
                            <th>POS</th>
                            <th>JOGADOR</th>
                            <th>PONTUAÇÃO</th>
                        </tr>
                    </thead>

                    <tbody id="ranking-body">

                        <?php if (!empty($rankingInicial)): ?>

                            <?php foreach ($rankingInicial as $i => $row): ?>

                                <tr>
                                    <td class="ranking-pos">
                                        <?= $i === 0 ? '🥇 1º' : ($i === 1 ? '🥈 2º' : ($i === 2 ? '🥉 3º' : ($i + 1) . 'º')) ?>
                                    </td>

                                    <td>
                                        <strong>
                                            <?= htmlspecialchars($row['nome']) ?>
                                        </strong>
                                    </td>

                                    <td>
                                        <?= (int)$row['pontos'] ?> pts
                                    </td>
                                </tr>

                            <?php endforeach; ?>

                        <?php else: ?>

                            <tr>
                                <td colspan="3" class="loading-cell">
                                    Nenhuma pontuação gravada ainda.
                                    Jogue para ser o 1º!
                                </td>
                            </tr>

                        <?php endif; ?>

                    </tbody>

                </table>

            </div>
        </div>

        <div class="modal-actions">

            <button
                type="button"
                class="btn btn-primary"
                id="btn-restart"
            >
                JOGAR NOVAMENTE
            </button>

            <button
                type="button"
                class="btn btn-secondary"
                id="btn-change-player"
            >
                TROCAR JOGADOR
            </button>

        </div>

    </div>
</div>

<!-- Modal Sobre Nós - LGBT Software -->
<div id="about-modal" class="modal-overlay" style="display: none;">
    <div class="modal-card about-card">

        <button
            id="btn-close-about"
            class="about-close"
            type="button"
            aria-label="Fechar Sobre Nós"
        >✕</button>

        <img
            src="assets/logo.png"
            alt="Logo da LGBT Software"
            class="about-logo"
        >

        <h2 class="about-title">LGBT SOFTWARE</h2>

        <p class="about-subtitle">
            Tecnologia, criatividade e inovação.
        </p>

        <div class="about-content">
            <h3>QUEM SOMOS?</h3>

            <p>
                A LGBT Software é uma empresa de desenvolvimento
                de software formada por um grupo de estudantes.
                Nosso nome representa a junção das iniciais dos
                nomes dos integrantes da nossa equipe.
            </p>

            <p>
                Trabalhamos com desenvolvimento de sistemas,
                criação de jogos digitais e soluções que utilizam
                Inteligência Artificial (IA), sempre buscando
                transformar ideias em experiências interativas.
            </p>

            <h3>NOSSA MISSÃO</h3>

            <p>
                Criar soluções tecnológicas criativas, funcionais
                e acessíveis, unindo programação, inovação e
                criatividade para desenvolver experiências digitais
                cada vez melhores.
            </p>

            <h3>O QUE FAZEMOS?</h3>

            <ul>
                <li>Desenvolvimento de softwares e sistemas web</li>
                <li>Criação de jogos digitais</li>
                <li>Soluções com Inteligência Artificial</li>
                <li>Interfaces modernas e experiências interativas</li>
            </ul>
        </div>

        <button
            id="btn-back-about"
            class="about-back"
            type="button"
        >
            VOLTAR AO JOGO
        </button>

    </div>
</div>

<script src="js/script.js?v=3.0" defer></script>

</body>
</html>
