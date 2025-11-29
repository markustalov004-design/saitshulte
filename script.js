// Система авторизации
let currentUser = null;

// Глобальные игровые данные
const gameData = {
    schulte: {
        classic: {
            times: [],
            bestTime: null
        },
        video: {
            times: [],
            bestTime: null
        }
    },
    gonogo: {
        sessions: [],
        currentSession: { correct: 0, errors: 0 }
    },
    pixel: {
        times: [],
        attempts: [],
        bestTime: 0
    }
};

// Текущие активные игры
let activeGames = {
    schulte: {
        classic: null,
        video: null
    },
    gonogo: null,
    pixel: null
};

// Найди пиксель
let pixelGame = {
    active: false,
    startTime: 0,
    targetPixel: { x: 0, y: 0, size: 3 },
    attempts: 0,
    bestTime: 0,
    history: []
};

// Настройки сложности
const difficultySettings = {
    easy: { size: 4, color: '#ff4444' },
    medium: { size: 3, color: '#ff4444' },
    hard: { size: 2, color: '#ff4444' },
    expert: { size: 1, color: '#ff4444' }
};

// Цвета фона
const backgroundColors = {
    white: '#ffffff',
    black: '#000000',
    gray: '#808080',
    blue: '#87ceeb'
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('Сайт загружен');

    // Проверяем авторизацию
    checkAuthentication();

    // Загружаем данные из localStorage
    loadGameData();

    // Обработчик формы авторизации
    document.getElementById('auth-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });

    // Обработчик кликов по canvas для пиксельной игры
    document.getElementById('pixel-canvas').addEventListener('click', function(event) {
        if (!pixelGame.active) {
            const overlay = document.getElementById('pixel-overlay');
            if (overlay.classList.contains('hidden')) {
                startPixelGame();
            }
            return;
        }

        const rect = this.getBoundingClientRect();
        const scaleX = this.width / rect.width;
        const scaleY = this.height / rect.height;

        const clickX = (event.clientX - rect.left) * scaleX;
        const clickY = (event.clientY - rect.top) * scaleY;

        pixelGame.attempts++;
        document.getElementById('pixel-attempts').textContent = pixelGame.attempts;

        const hit = (
            clickX >= pixelGame.targetPixel.x &&
            clickX <= pixelGame.targetPixel.x + pixelGame.targetPixel.size &&
            clickY >= pixelGame.targetPixel.y &&
            clickY <= pixelGame.targetPixel.y + pixelGame.targetPixel.size
        );

        const feedbackElement = document.getElementById('pixel-feedback');
        const timerElement = document.getElementById('pixel-timer');

        if (hit) {
            const endTime = Date.now();
            const timeTaken = (endTime - pixelGame.startTime) / 1000;

            pixelGame.active = false;
            activeGames.pixel = false;

            // Сохраняем результат
            gameData.pixel.times.push(timeTaken);
            gameData.pixel.attempts.push(pixelGame.attempts);

            // Обновляем лучший результат
            if (gameData.pixel.bestTime === 0 || timeTaken < gameData.pixel.bestTime) {
                gameData.pixel.bestTime = timeTaken;
                document.getElementById('pixel-best').textContent = timeTaken.toFixed(2) + 'с';
            }

            // Добавляем в историю
            pixelGame.history.push({
                time: timeTaken,
                attempts: pixelGame.attempts,
                difficulty: document.getElementById('pixel-difficulty').value,
                timestamp: new Date().toLocaleTimeString()
            });

            updatePixelHistory();

            feedbackElement.textContent = `🎉 Успех! Найдено за ${timeTaken.toFixed(2)} секунд (${pixelGame.attempts} попыток)`;
            feedbackElement.className = 'feedback success';

            const canvas = document.getElementById('pixel-canvas');
            canvas.classList.add('pixel-found');
            setTimeout(() => canvas.classList.remove('pixel-found'), 500);

            // Сохраняем данные и обновляем диаграммы
            saveGameData();
            updateCharts();

        } else {
            feedbackElement.textContent = '❌ Промах! Продолжайте искать...';
            feedbackElement.className = 'feedback fail';

            setTimeout(() => {
                if (feedbackElement.textContent === '❌ Промах! Продолжайте искать...') {
                    feedbackElement.textContent = '';
                }
            }, 1000);
        }
    });

    // Автосохранение каждые 5 секунд
    setInterval(saveGameData, 5000);
});

// ========== СИСТЕМА АВТОРИЗАЦИИ ==========
function checkAuthentication() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showUserInfo();
        hideAuthModal();
    } else {
        showAuthModal();
    }
}

function showAuthModal() {
    document.getElementById('auth-modal').style.display = 'flex';
}

function hideAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
}

function handleLogin() {
    const lastName = document.getElementById('last-name').value.trim();
    const firstName = document.getElementById('first-name').value.trim();
    const middleName = document.getElementById('middle-name').value.trim();

    if (!lastName || !firstName) {
        alert('Пожалуйста, заполните обязательные поля (Фамилия и Имя)');
        return;
    }

    currentUser = {
        lastName: lastName,
        firstName: firstName,
        middleName: middleName,
        loginTime: new Date().toISOString()
    };

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showUserInfo();
    hideAuthModal();
    showWelcomeMessage();
}

function showUserInfo() {
    if (!currentUser) return;

    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');

    const fullName = `${currentUser.lastName} ${currentUser.firstName} ${currentUser.middleName || ''}`.trim();
    userName.textContent = fullName;

    const initials = (currentUser.lastName[0] + currentUser.firstName[0]).toUpperCase();
    userAvatar.textContent = initials;

    userInfo.style.display = 'flex';
}

function showWelcomeMessage() {
    const welcomeMessage = `Добро пожаловать, ${currentUser.firstName}!`;

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4caf50, #388e3c);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
        z-index: 1001;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;

    notification.textContent = welcomeMessage;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('user-info').style.display = 'none';
        showAuthModal();
        resetAllGames();
    }
}

// ========== НАВИГАЦИЯ ==========
function showTab(tabName) {
    // Скрыть все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Убрать активный класс со всех кнопок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Показать выбранную вкладку
    document.getElementById(tabName).classList.add('active');

    // Активировать кнопку
    event.target.classList.add('active');

    // Обновить диаграммы при переходе на вкладку результатов
    if (tabName === 'results') {
        updateCharts();
    }
}

function checkAuth(tabName) {
    if (!currentUser) {
        showAuthModal();
        return;
    }
    showTab(tabName);
}

function checkGameAuth(gameFunction, param = null) {
    if (!currentUser) {
        showAuthModal();
        return;
    }
    param ? window[gameFunction](param) : window[gameFunction]();
}

// ========== ТАБЛИЦЫ ШУЛЬТЕ (С РЕЗУЛЬТАТАМИ) ==========
function startSchulteGame(type) {
    console.log('Запуск таблицы Шульте:', type);

    // Останавливаем предыдущую игру если есть
    stopSchulteGame(type);

    const container = document.getElementById(`schulte-${type}`);
    const timerElement = document.getElementById(`timer-${type}`);
    const currentNumberElement = document.getElementById(`current-${type}`);

    // Очищаем контейнер
    container.innerHTML = '';
    timerElement.textContent = 'Время: 0с';
    currentNumberElement.textContent = '1';

    // Создаем перемешанный массив чисел
    let numbers = Array.from({length: 25}, (_, i) => i + 1);
    numbers = shuffleArray(numbers);

    // Создаем ячейки таблицы
    numbers.forEach(num => {
        const cell = document.createElement('div');
        cell.className = 'schulte-cell';
        cell.textContent = num;
        cell.dataset.number = num;
        cell.onclick = () => handleSchulteClick(cell, type);
        container.appendChild(cell);
    });

    // Запускаем видео если это таблица с видео
    if (type === 'video') {
        const video = document.getElementById('distractionVideo');
        video.currentTime = 0;
        video.play().catch(e => console.log('Автовоспроизведение заблокировано'));
    }

    // Запускаем таймер
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerElement.textContent = `Время: ${elapsed}с`;
    }, 1000);

    // Сохраняем состояние игры
    activeGames.schulte[type] = {
        startTime: startTime,
        currentNumber: 1,
        timerElement: timerElement,
        currentNumberElement: currentNumberElement,
        timerInterval: timerInterval,
        container: container
    };

    console.log(`Игра ${type} запущена, текущее число: 1`);
}

function stopSchulteGame(type) {
    if (activeGames.schulte[type]) {
        const game = activeGames.schulte[type];
        clearInterval(game.timerInterval);

        if (type === 'video') {
            const video = document.getElementById('distractionVideo');
            video.pause();
        }

        activeGames.schulte[type] = null;
        console.log(`Игра ${type} остановлена`);
    }
}

function handleSchulteClick(cell, type) {
    const currentGame = activeGames.schulte[type];
    if (!currentGame) {
        console.log('Игра не активна');
        return;
    }

    const clickedNumber = parseInt(cell.dataset.number);
    console.log('Клик по числу:', clickedNumber, 'Ожидается:', currentGame.currentNumber);

    if (clickedNumber === currentGame.currentNumber) {
        // НИКАКОГО ВЫДЕЛЕНИЯ - просто переходим к следующему числу
        currentGame.currentNumber++;
        currentGame.currentNumberElement.textContent = currentGame.currentNumber;

        if (currentGame.currentNumber > 25) {
            // Игра завершена
            const endTime = Date.now();
            const timeTaken = Math.floor((endTime - currentGame.startTime) / 1000);

            clearInterval(currentGame.timerInterval);
            currentGame.timerElement.textContent = `Завершено за ${timeTaken}с`;

            // Сохраняем результат
            gameData.schulte[type].times.push(timeTaken);

            // Обновляем лучшее время
            if (!gameData.schulte[type].bestTime || timeTaken < gameData.schulte[type].bestTime) {
                gameData.schulte[type].bestTime = timeTaken;
                document.getElementById(`best-${type}`).textContent = `${timeTaken}с`;
            }

            // Останавливаем видео
            if (type === 'video') {
                const video = document.getElementById('distractionVideo');
                video.pause();
            }

            // Сбрасываем текущую игру
            activeGames.schulte[type] = null;

            // Сохраняем данные и обновляем диаграммы
            saveGameData();
            updateCharts();

            // Автозапуск следующей игры через 2 секунды
            setTimeout(() => {
                if (confirm(`Отлично! Ваше время: ${timeTaken}с. Хотите сыграть еще раз?`)) {
                    startSchulteGame(type);
                }
            }, 2000);
        }
    }
}

// ========== GO/NO-GO ИГРА ==========
function startGoNoGoGame() {
    console.log('Запуск Go/No-Go игры');

    const timerElement = document.getElementById('gonogo-timer');
    const correctElement = document.getElementById('gonogo-correct');
    const errorsElement = document.getElementById('gonogo-errors');

    // Сброс статистики текущей сессии
    gameData.gonogo.currentSession = { correct: 0, errors: 0 };
    correctElement.textContent = '0';
    errorsElement.textContent = '0';

    let timeLeft = 60;
    timerElement.textContent = `Осталось: ${timeLeft}с`;

    updateGoNoGoArrows();

    // Останавливаем предыдущий таймер если есть
    if (activeGames.gonogo) {
        clearInterval(activeGames.gonogo);
    }

    activeGames.gonogo = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `Осталось: ${timeLeft}с`;

        if (timeLeft <= 0) {
            endGoNoGoGame();
        } else if (timeLeft % 1.5 === 0) {
            updateGoNoGoArrows();
        }
    }, 1000);
}

function updateGoNoGoArrows() {
    const directions = ['left', 'up', 'down', 'right'];
    const arrows = {
        'left': '←',
        'up': '↑',
        'down': '↓',
        'right': '→'
    };

    directions.forEach(dir => {
        const arrowElement = document.getElementById(`arrow-${dir}`);
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        arrowElement.textContent = arrows[randomDir];
        arrowElement.dataset.direction = randomDir;
    });

    const centerDirection = directions[Math.floor(Math.random() * directions.length)];
    const centerArrow = document.getElementById('arrow-center');
    centerArrow.textContent = arrows[centerDirection];
    centerArrow.dataset.direction = centerDirection;
}

function handleArrowPress(direction) {
    if (!activeGames.gonogo) return;

    const centerDirection = document.getElementById('arrow-center').dataset.direction;
    const correctElement = document.getElementById('gonogo-correct');
    const errorsElement = document.getElementById('gonogo-errors');

    if (direction === centerDirection) {
        gameData.gonogo.currentSession.correct++;
        correctElement.textContent = gameData.gonogo.currentSession.correct;
    } else {
        gameData.gonogo.currentSession.errors++;
        errorsElement.textContent = gameData.gonogo.currentSession.errors;
    }

    updateGoNoGoArrows();
}

function endGoNoGoGame() {
    if (activeGames.gonogo) {
        clearInterval(activeGames.gonogo);
        activeGames.gonogo = null;

        // Сохраняем сессию
        gameData.gonogo.sessions.push({...gameData.gonogo.currentSession});

        console.log('Go/No-Go игра завершена');
        saveGameData();
        updateCharts();
    }
}

// ========== НАЙДИ ПИКСЕЛЬ ==========
function startPixelGame() {
    console.log('Запуск игры "Найди пиксель"');

    const canvas = document.getElementById('pixel-canvas');
    const overlay = document.getElementById('pixel-overlay');
    const timerElement = document.getElementById('pixel-timer');
    const feedbackElement = document.getElementById('pixel-feedback');

    overlay.classList.add('hidden');
    pixelGame.active = true;
    activeGames.pixel = true;
    pixelGame.attempts = 0;
    pixelGame.startTime = Date.now();

    document.getElementById('pixel-attempts').textContent = '0';
    timerElement.textContent = 'Время: 0.00с';
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback';

    const difficulty = document.getElementById('pixel-difficulty').value;
    const backgroundColor = document.getElementById('pixel-background').value;

    pixelGame.targetPixel.size = difficultySettings[difficulty].size;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = backgroundColors[backgroundColor];
    ctx.fillRect(0, 0, width, height);

    const padding = 20;
    pixelGame.targetPixel.x = Math.floor(Math.random() * (width - padding * 2 - pixelGame.targetPixel.size)) + padding;
    pixelGame.targetPixel.y = Math.floor(Math.random() * (height - padding * 2 - pixelGame.targetPixel.size)) + padding;

    ctx.fillStyle = difficultySettings[difficulty].color;
    ctx.fillRect(
        pixelGame.targetPixel.x,
        pixelGame.targetPixel.y,
        pixelGame.targetPixel.size,
        pixelGame.targetPixel.size
    );

    // Запускаем таймер
    const pixelTimer = setInterval(() => {
        if (!pixelGame.active) {
            clearInterval(pixelTimer);
            return;
        }
        const currentTime = Date.now() - pixelGame.startTime;
        const seconds = (currentTime / 1000).toFixed(2);
        timerElement.textContent = `Время: ${seconds}с`;
    }, 10);
}

function resetPixelGame() {
    const overlay = document.getElementById('pixel-overlay');
    const feedbackElement = document.getElementById('pixel-feedback');

    pixelGame.active = false;
    activeGames.pixel = false;
    overlay.classList.remove('hidden');
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback';

    const canvas = document.getElementById('pixel-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updatePixelHistory() {
    const historyElement = document.getElementById('pixel-history');
    const recentHistory = pixelGame.history.slice(-6).reverse();

    historyElement.innerHTML = '';

    recentHistory.forEach((result, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        if (result.time === gameData.pixel.bestTime) {
            item.classList.add('best');
        }

        item.innerHTML = `
            <div>${result.time.toFixed(2)}с</div>
            <small>${result.attempts} попыток</small>
            <small>${result.timestamp}</small>
        `;

        historyElement.appendChild(item);
    });
}

// ========== ДИАГРАММЫ РЕЗУЛЬТАТОВ ==========
function updateCharts() {
    updateSchulteChart('classic');
    updateSchulteChart('video');
    updateGoNoGoChart();
    updatePixelChart();
    updateOverallStats();
}

function updateSchulteChart(type) {
    const canvas = document.getElementById(`chart-schulte-${type}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const statsElement = document.getElementById(`stats-schulte-${type}`);
    const times = gameData.schulte[type].times;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (times.length === 0) {
        ctx.fillStyle = '#2e7d32';
        ctx.font = '14px Arial';
        ctx.fillText('Нет данных', canvas.width/2 - 30, canvas.height/2);
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="stat-line">Игр: <span>0</span></div>
                <div class="stat-line">Среднее: <span>-</span></div>
                <div class="stat-line">Лучшее: <span>-</span></div>
            `;
        }
        return;
    }

    const maxTime = Math.max(...times, 1);
    const barWidth = 30;
    const spacing = 10;
    const maxBarHeight = 120;

    times.forEach((time, index) => {
        const barHeight = (time / maxTime) * maxBarHeight;
        const x = 30 + index * (barWidth + spacing);
        const y = canvas.height - barHeight - 20;

        ctx.fillStyle = '#4caf50';
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = '#1b5e20';
        ctx.font = '10px Arial';
        ctx.fillText(time + 'с', x + 5, canvas.height - 5);
        ctx.fillText((index + 1).toString(), x + 12, canvas.height - 15);
    });

    const avgTime = times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : 0;
    const bestTime = times.length > 0 ? Math.min(...times) : 0;

    if (statsElement) {
        statsElement.innerHTML = `
            <div class="stat-line">Игр: <span>${times.length}</span></div>
            <div class="stat-line">Среднее: <span>${avgTime}с</span></div>
            <div class="stat-line">Лучшее: <span>${bestTime}с</span></div>
        `;
    }
}

function updateGoNoGoChart() {
    const canvas = document.getElementById('chart-gonogo');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const statsElement = document.getElementById('stats-gonogo');
    const sessions = gameData.gonogo.sessions;

    if (sessions.length === 0) {
        ctx.fillStyle = '#2e7d32';
        ctx.font = '14px Arial';
        ctx.fillText('Нет данных', canvas.width/2 - 30, canvas.height/2);
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="stat-line">Сессий: <span>0</span></div>
                <div class="stat-line">Точность: <span>-</span></div>
                <div class="stat-line">Всего ответов: <span>0</span></div>
            `;
        }
        return;
    }

    // Берем последние 5 сессий
    const recentSessions = sessions.slice(-5);
    const maxCorrect = Math.max(...recentSessions.map(s => s.correct), 1);

    const barWidth = 40;
    const spacing = 20;
    const maxBarHeight = 120;

    recentSessions.forEach((session, index) => {
        const barHeight = (session.correct / maxCorrect) * maxBarHeight;
        const x = 40 + index * (barWidth + spacing);
        const y = canvas.height - barHeight - 30;

        // Правильные ответы
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Ошибки (меньшие столбцы)
        const errorsHeight = (session.errors / maxCorrect) * maxBarHeight;
        ctx.fillStyle = '#f44336';
        ctx.fillRect(x, canvas.height - errorsHeight - 30, barWidth, errorsHeight);

        // Подписи
        ctx.fillStyle = '#1b5e20';
        ctx.font = '10px Arial';
        ctx.fillText(`✓${session.correct}`, x + 5, canvas.height - 10);
        ctx.fillText(`✗${session.errors}`, x + 5, canvas.height - 20);
    });

    const totalCorrect = sessions.reduce((sum, session) => sum + session.correct, 0);
    const totalErrors = sessions.reduce((sum, session) => sum + session.errors, 0);
    const totalResponses = totalCorrect + totalErrors;
    const accuracy = totalResponses > 0 ? ((totalCorrect / totalResponses) * 100).toFixed(1) : 0;

    if (statsElement) {
        statsElement.innerHTML = `
            <div class="stat-line">Сессий: <span>${sessions.length}</span></div>
            <div class="stat-line">Точность: <span>${accuracy}%</span></div>
            <div class="stat-line">Всего ответов: <span>${totalResponses}</span></div>
        `;
    }
}

function updatePixelChart() {
    const canvas = document.getElementById('chart-pixel');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const statsElement = document.getElementById('stats-pixel');
    const times = gameData.pixel.times;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (times.length === 0) {
        ctx.fillStyle = '#2e7d32';
        ctx.font = '14px Arial';
        ctx.fillText('Нет данных', canvas.width/2 - 30, canvas.height/2);
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="stat-line">Игр: <span>0</span></div>
                <div class="stat-line">Среднее: <span>-</span></div>
                <div class="stat-line">Лучшее: <span>-</span></div>
                <div class="stat-line">Попыток/игра: <span>-</span></div>
            `;
        }
        return;
    }

    const maxTime = Math.max(...times, 1);
    const pointRadius = 4;
    const padding = 30;

    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 2;
    ctx.beginPath();

    times.forEach((time, index) => {
        const x = padding + (index * (canvas.width - padding * 2)) / (times.length - 1 || 1);
        const y = canvas.height - padding - (time / maxTime) * (canvas.height - padding * 2);

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    times.forEach((time, index) => {
        const x = padding + (index * (canvas.width - padding * 2)) / (times.length - 1 || 1);
        const y = canvas.height - padding - (time / maxTime) * (canvas.height - padding * 2);

        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
        ctx.fill();

        if (times.length <= 5) {
            ctx.fillStyle = '#1b5e20';
            ctx.font = '10px Arial';
            ctx.fillText(time.toFixed(1) + 'с', x - 15, y - 8);
        }
    });

    const avgTime = times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2) : 0;
    const bestTime = times.length > 0 ? Math.min(...times).toFixed(2) : 0;
    const totalAttempts = gameData.pixel.attempts.reduce((a, b) => a + b, 0);
    const avgAttempts = times.length > 0 ? (totalAttempts / times.length).toFixed(1) : 0;

    if (statsElement) {
        statsElement.innerHTML = `
            <div class="stat-line">Игр: <span>${times.length}</span></div>
            <div class="stat-line">Среднее: <span>${avgTime}с</span></div>
            <div class="stat-line">Лучшее: <span>${bestTime}с</span></div>
            <div class="stat-line">Попыток/игра: <span>${avgAttempts}</span></div>
        `;
    }
}

// ========== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РЕЗУЛЬТАТОВ ==========
function updateOverallStats() {
    // Общее количество игр
    const totalSchulteGames = gameData.schulte.classic.times.length + gameData.schulte.video.times.length;
    const totalPixelGames = gameData.pixel.times.length;
    const totalGonogoSessions = gameData.gonogo.sessions.length;
    const totalGames = totalSchulteGames + totalPixelGames + totalGonogoSessions;

    document.getElementById('total-games').textContent = totalGames;

    // Общее время тренировок (приблизительно)
    const totalTime = (
        gameData.schulte.classic.times.reduce((a, b) => a + b, 0) +
        gameData.schulte.video.times.reduce((a, b) => a + b, 0) +
        gameData.pixel.times.reduce((a, b) => a + b, 0) +
        (totalGonogoSessions * 60) // Каждая сессия Go/No-Go длится 60 секунд
    );
    const totalMinutes = Math.floor(totalTime / 60);
    document.getElementById('total-time').textContent = `${totalMinutes} мин`;

    // Лучший общий результат
    const bestTimes = [
        gameData.schulte.classic.bestTime,
        gameData.schulte.video.bestTime,
        gameData.pixel.bestTime
    ].filter(time => time !== null && time > 0);

    if (bestTimes.length > 0) {
        const bestOverall = Math.min(...bestTimes);
        document.getElementById('best-overall').textContent = `${bestOverall}с`;
    }

    // Обновляем детальную статистику для каждой игры
    updateDetailedStats();
}

function updateDetailedStats() {
    // Таблица Шульте - Классическая
    const classicTimes = gameData.schulte.classic.times;
    document.getElementById('count-classic').textContent = classicTimes.length;
    if (classicTimes.length > 0) {
        const avg = (classicTimes.reduce((a, b) => a + b, 0) / classicTimes.length).toFixed(1);
        document.getElementById('avg-classic').textContent = `${avg}с`;
        document.getElementById('best-classic-result').textContent = `${gameData.schulte.classic.bestTime}с`;
    }

    // Таблица Шульте - С видео
    const videoTimes = gameData.schulte.video.times;
    document.getElementById('count-video').textContent = videoTimes.length;
    if (videoTimes.length > 0) {
        const avg = (videoTimes.reduce((a, b) => a + b, 0) / videoTimes.length).toFixed(1);
        document.getElementById('avg-video').textContent = `${avg}с`;
        document.getElementById('best-video-result').textContent = `${gameData.schulte.video.bestTime}с`;
    }

    // Go/No-Go
    const gonogoSessions = gameData.gonogo.sessions;
    document.getElementById('count-gonogo').textContent = gonogoSessions.length;
    if (gonogoSessions.length > 0) {
        const totalCorrect = gonogoSessions.reduce((sum, session) => sum + session.correct, 0);
        const totalErrors = gonogoSessions.reduce((sum, session) => sum + session.errors, 0);
        const totalResponses = totalCorrect + totalErrors;
        const accuracy = totalResponses > 0 ? ((totalCorrect / totalResponses) * 100).toFixed(1) : 0;

        document.getElementById('accuracy-gonogo').textContent = `${accuracy}%`;
        document.getElementById('total-gonogo').textContent = totalResponses;
    }

    // Найди пиксель
    const pixelTimes = gameData.pixel.times;
    document.getElementById('count-pixel').textContent = pixelTimes.length;
    if (pixelTimes.length > 0) {
        const avg = (pixelTimes.reduce((a, b) => a + b, 0) / pixelTimes.length).toFixed(2);
        const totalAttempts = gameData.pixel.attempts.reduce((a, b) => a + b, 0);
        const avgAttempts = (totalAttempts / pixelTimes.length).toFixed(1);

        document.getElementById('avg-pixel').textContent = `${avg}с`;
        document.getElementById('best-pixel-result').textContent = `${gameData.pixel.bestTime.toFixed(2)}с`;
        document.getElementById('attempts-pixel').textContent = avgAttempts;
    }

    // Обновляем список активностей
    updateActivityList();
}

function updateActivityList() {
    const activityList = document.getElementById('activity-list');
    const activities = [];

    // Собираем активности из всех игр
    gameData.schulte.classic.times.forEach((time, index) => {
        activities.push({
            type: 'Таблица Шульте (Классическая)',
            result: `${time}с`,
            timestamp: new Date(Date.now() - (index * 60000)).toLocaleString()
        });
    });

    gameData.schulte.video.times.forEach((time, index) => {
        activities.push({
            type: 'Таблица Шульте (С видео)',
            result: `${time}с`,
            timestamp: new Date(Date.now() - (index * 60000)).toLocaleString()
        });
    });

    gameData.gonogo.sessions.forEach((session, index) => {
        activities.push({
            type: 'Go/No-Go тест',
            result: `✓${session.correct} ✗${session.errors}`,
            timestamp: new Date(Date.now() - (index * 60000)).toLocaleString()
        });
    });

    gameData.pixel.times.forEach((time, index) => {
        activities.push({
            type: 'Найди пиксель',
            result: `${time.toFixed(2)}с`,
            timestamp: new Date(Date.now() - (index * 60000)).toLocaleString()
        });
    });

    // Сортируем по времени (новые сверху)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Показываем только последние 10 активностей
    const recentActivities = activities.slice(0, 10);

    if (recentActivities.length === 0) {
        activityList.innerHTML = '<div class="no-data">Пока нет данных об активностях</div>';
        return;
    }

    activityList.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-type">${activity.type}</div>
            <div class="activity-result">${activity.result}</div>
            <div class="activity-time">${activity.timestamp}</div>
        </div>
    `).join('');
}

function exportResults() {
    const dataStr = JSON.stringify(gameData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `результаты_тренировок_${new Date().toLocaleDateString()}.json`;
    link.click();

    alert('Результаты успешно экспортированы в JSON файл!');
}

function clearAllResults() {
    if (confirm('Вы уверены, что хотите удалить все результаты? Это действие нельзя отменить.')) {
        // Сбрасываем все данные
        gameData.schulte.classic = { times: [], bestTime: null };
        gameData.schulte.video = { times: [], bestTime: null };
        gameData.gonogo = { sessions: [], currentSession: { correct: 0, errors: 0 } };
        gameData.pixel = { times: [], attempts: [], bestTime: 0 };

        pixelGame.history = [];

        // Обновляем UI
        document.getElementById('best-classic').textContent = '-';
        document.getElementById('best-video').textContent = '-';
        document.getElementById('pixel-best').textContent = '0.00с';

        // Сохраняем и обновляем диаграммы
        saveGameData();
        updateCharts();
        updateOverallStats();

        alert('Все результаты успешно очищены!');
    }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function resetAllGames() {
    // Останавливаем таблицы Шульте
    ['classic', 'video'].forEach(type => {
        if (activeGames.schulte[type]) {
            clearInterval(activeGames.schulte[type].timerInterval);
            activeGames.schulte[type] = null;
        }
    });

    // Останавливаем Go/No-Go
    if (activeGames.gonogo) {
        clearInterval(activeGames.gonogo);
        activeGames.gonogo = null;
    }

    // Останавливаем пиксельную игру
    if (activeGames.pixel) {
        pixelGame.active = false;
        activeGames.pixel = false;
    }
}

function loadGameData() {
    try {
        // Загружаем общие результаты игр
        const savedResults = localStorage.getItem('gameData');
        if (savedResults) {
            const results = JSON.parse(savedResults);
            if (typeof results === 'object') {
                Object.assign(gameData, results);

                // Обновляем лучшие времена для таблиц Шульте
                if (gameData.schulte.classic.bestTime) {
                    document.getElementById('best-classic').textContent = `${gameData.schulte.classic.bestTime}с`;
                }
                if (gameData.schulte.video.bestTime) {
                    document.getElementById('best-video').textContent = `${gameData.schulte.video.bestTime}с`;
                }

                // Обновляем лучший результат для пиксельной игры
                if (gameData.pixel.bestTime) {
                    document.getElementById('pixel-best').textContent = gameData.pixel.bestTime.toFixed(2) + 'с';
                }
            }
        }

        // Загружаем историю пиксельной игры
        const savedHistory = localStorage.getItem('pixelHistory');
        if (savedHistory) {
            const history = JSON.parse(savedHistory);
            if (Array.isArray(history)) {
                pixelGame.history = history;
                updatePixelHistory();
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

function saveGameData() {
    try {
        localStorage.setItem('gameData', JSON.stringify(gameData));
        localStorage.setItem('pixelHistory', JSON.stringify(pixelGame.history));
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
    }
}

// Добавляем CSS для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }

    .unlimited-notice {
        color: #4caf50;
        font-weight: bold;
        margin-top: 10px;
    }

    .current-number {
        color: #2c3e50;
        font-weight: bold;
        margin-top: 5px;
    }

    .best-time {
        color: #27ae60;
        font-weight: bold;
        margin-top: 5px;
    }
`;
document.head.appendChild(style);