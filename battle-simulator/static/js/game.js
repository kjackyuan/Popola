// Game constants
const TILE_SIZE = 32;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 20;
const CANVAS_WIDTH = GRID_WIDTH * TILE_SIZE;
const CANVAS_HEIGHT = GRID_HEIGHT * TILE_SIZE;

// Game state
let gameState = {
    currentTurn: 'player',
    units: [],
    selectedUnit: null,
    viewedUnit: null,  // For viewing enemy unit stats
    inspectedTile: null,  // For viewing terrain info
    movementRange: [],  // Array of reachable tiles for selected unit
    showMovementRange: false,
    showAttackRange: false,
    gameStarted: false
};

// Canvas and context
let canvas, ctx;

// Initialize the game
function initGame() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Failed to get canvas context!');
        return;
    }

    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Set up event listeners
    setupEventListeners();

    // Load initial game state
    loadGameState();

    // Start render loop
    console.log('Starting render loop...');
    render();
}

// Set up event listeners
function setupEventListeners() {
    canvas.addEventListener('click', handleCanvasClick);
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    document.getElementById('move-btn').addEventListener('click', () => enterMoveMode());
    document.getElementById('attack-btn').addEventListener('click', () => enterAttackMode());
    document.getElementById('wait-btn').addEventListener('click', endUnitTurn);
}

// Load game state from server
async function loadGameState() {
    try {
        const response = await fetch('/api/game-state');
        const data = await response.json();
        gameState = { ...gameState, ...data };
        gameState.inspectedTile = null;  // Clear inspected tile on load
        gameState.movementRange = [];  // Clear movement range on load
        updateUI();
    } catch (error) {
        console.error('Error loading game state:', error);
    }
}

// Save game state to server
async function saveGameState() {
    try {
        await fetch('/api/game-state', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gameState)
        });
    } catch (error) {
        console.error('Error saving game state:', error);
    }
}

// Start a new game
async function startGame() {
    try {
        const response = await fetch('/api/start-battle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();
        if (result.status === 'success') {
            gameState = result.game_state;
            console.log('Units received:', gameState.units ? gameState.units.length : 0);
            console.log('Game state received:', gameState);
            console.log('Grid dimensions:', gameState.grid ? `${gameState.grid.width}x${gameState.grid.height}` : 'No grid');
            if (gameState.units) {
                gameState.units.forEach((unit, index) => {
                    console.log(`Unit ${index}: ${unit.name} at (${unit.x}, ${unit.y}) team: ${unit.team}`);
                });
            }
            gameState.viewedUnit = null;  // Clear viewed unit on game start
            gameState.inspectedTile = null;  // Clear inspected tile on game start
            gameState.movementRange = [];  // Clear movement range on game start
            updateUI();
            addToBattleLog('Battle started! Player turn.');
        } else {
            console.log('Start battle failed');
            addToBattleLog('Failed to start battle.');
        }
    } catch (error) {
        console.error('Error starting game:', error);
        addToBattleLog('Error starting battle.');
    }
}

// Reset the game
async function resetGame() {
    try {
        await fetch('/api/reset-game', { method: 'POST' });
        gameState = {
            currentTurn: 'player',
            units: [],
            selectedUnit: null,
            viewedUnit: null,
            inspectedTile: null,
            movementRange: [],
            showMovementRange: false,
            showAttackRange: false,
            gameStarted: false
        };
        updateUI();
        addToBattleLog('Game reset.');
    } catch (error) {
        console.error('Error resetting game:', error);
    }
}

// Handle canvas clicks
function handleCanvasClick(event) {
    if (!gameState.gameStarted) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((event.clientY - rect.top) / TILE_SIZE);

    // Check if clicked on a unit
    const clickedUnit = gameState.units.find(unit => unit.x === x && unit.y === y);

    if (clickedUnit) {
        if (clickedUnit.team === gameState.currentTurn) {
            // Clicking on own unit
            if (clickedUnit === gameState.selectedUnit) {
                // Clicking on already selected unit - deselect it
                deselectUnit();
            } else {
                // Select different unit
                selectUnit(clickedUnit);
            }
        } else if (gameState.selectedUnit && gameState.showAttackRange) {
            // Attack enemy unit if in attack range
            attackUnit(clickedUnit);
        } else {
            // View enemy unit stats
            viewUnit(clickedUnit);
        }
    } else {
        // Clicked on empty tile
        if (gameState.selectedUnit && gameState.showMovementRange) {
            moveUnit(x, y);
        } else {
            // Inspect terrain if clicking on empty tile
            inspectTerrain(x, y);
        }
    }
}

// Select a unit
async function selectUnit(unit) {
    gameState.selectedUnit = unit;
    gameState.viewedUnit = null;  // Clear viewed unit when selecting
    gameState.inspectedTile = null;  // Clear inspected tile when selecting
    gameState.showAttackRange = false;

    // Fetch movement range from server
    try {
        const response = await fetch('/api/get-movement-range', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unit_id: unit.id })
        });

        const data = await response.json();
        if (data.status === 'success') {
            gameState.movementRange = data.reachable_tiles;
            gameState.showMovementRange = true;
        } else {
            console.error('Failed to get movement range:', data.message);
            gameState.movementRange = [];
            gameState.showMovementRange = false;
        }
    } catch (error) {
        console.error('Error fetching movement range:', error);
        gameState.movementRange = [];
        gameState.showMovementRange = false;
    }

    updateUI();
    addToBattleLog(`Selected ${unit.name} (${unit.type}, range ${unit.minAttackRange}-${unit.maxAttackRange})`);
}

// View unit stats (for enemy units)
function viewUnit(unit) {
    gameState.viewedUnit = unit;
    gameState.selectedUnit = null;  // Clear selection when viewing enemy
    gameState.inspectedTile = null;  // Clear inspected tile when viewing unit
    gameState.movementRange = [];  // Clear movement range when viewing unit
    gameState.showMovementRange = false;
    gameState.showAttackRange = false;
    updateUI();
    addToBattleLog(`Viewing ${unit.name} (${unit.team} ${unit.type}, range ${unit.minAttackRange}-${unit.maxAttackRange})`);
}

// Inspect terrain at coordinates
function inspectTerrain(x, y) {
    // If clicking on the same terrain tile, deselect it
    if (gameState.inspectedTile && gameState.inspectedTile.x === x && gameState.inspectedTile.y === y) {
        deselectUnit();
        return;
    }

    gameState.inspectedTile = { x, y };
    gameState.selectedUnit = null;  // Clear selection when inspecting terrain
    gameState.viewedUnit = null;  // Clear viewed unit when inspecting terrain
    gameState.movementRange = [];  // Clear movement range when inspecting terrain
    gameState.showMovementRange = false;
    gameState.showAttackRange = false;
    updateUI();
    addToBattleLog(`Inspecting terrain at (${x}, ${y})`);
}

// Deselect current unit
function deselectUnit() {
    gameState.selectedUnit = null;
    gameState.viewedUnit = null;
    gameState.inspectedTile = null;
    gameState.movementRange = [];
    gameState.showMovementRange = false;
    gameState.showAttackRange = false;
    updateUI();
    addToBattleLog('Unit deselected');
}

// Enter move mode
async function enterMoveMode() {
    if (!gameState.selectedUnit) return;

    // Refetch movement range in case unit moved
    try {
        const response = await fetch('/api/get-movement-range', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unit_id: gameState.selectedUnit.id })
        });

        const data = await response.json();
        if (data.status === 'success') {
            gameState.movementRange = data.reachable_tiles;
        }
    } catch (error) {
        console.error('Error refetching movement range:', error);
    }

    gameState.showMovementRange = true;
    gameState.showAttackRange = false;
}

// Enter attack mode
function enterAttackMode() {
    if (!gameState.selectedUnit) return;
    gameState.showMovementRange = false;
    gameState.showAttackRange = true;
}

// Move unit to new position
async function moveUnit(x, y) {
    if (!gameState.selectedUnit) return;

    // Check if destination is in reachable tiles (considering terrain costs)
    const isReachable = gameState.movementRange.some(([rx, ry]) => rx === x && ry === y);
    if (!isReachable) {
        addToBattleLog('Cannot reach that tile!');
        return;
    }

    // Check if tile is occupied
    const occupyingUnit = gameState.units.find(unit => unit.x === x && unit.y === y);
    if (occupyingUnit) {
        addToBattleLog('That tile is occupied!');
        return;
    }

    // Update unit position
    gameState.selectedUnit.x = x;
    gameState.selectedUnit.y = y;

    // Save to server
    await fetch('/api/move-unit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            unit_id: gameState.selectedUnit.id,
            x: x,
            y: y
        })
    });

    addToBattleLog(`${gameState.selectedUnit.name} moved to (${x}, ${y})`);
    gameState.movementRange = [];  // Clear movement range after moving
    gameState.inspectedTile = null;  // Clear inspected tile after moving
    gameState.showMovementRange = false;
    updateUI();
}

// Attack another unit
async function attackUnit(targetUnit) {
    if (!gameState.selectedUnit) return;

    // Check if attack is valid (adjacent tiles)
    const distance = Math.abs(gameState.selectedUnit.x - targetUnit.x) + Math.abs(gameState.selectedUnit.y - targetUnit.y);
    if (distance > gameState.selectedUnit.maxAttackRange) {
        addToBattleLog('Target is too far away!');
        return;
    } else if (distance < gameState.selectedUnit.minAttackRange) {
        addToBattleLog('Target is too close!');
        return;
    }

    try {
        const response = await fetch('/api/attack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                attacker_id: gameState.selectedUnit.id,
                target_id: targetUnit.id
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            // Update target HP in local state
            targetUnit.hp = result.target_hp;

            addToBattleLog(`${gameState.selectedUnit.name} attacked ${targetUnit.name} for ${result.damage} damage!`);

            if (targetUnit.hp <= 0) {
                // Remove defeated unit
                gameState.units = gameState.units.filter(unit => unit.id !== targetUnit.id);
                addToBattleLog(`${targetUnit.name} was defeated!`);
            }

            gameState.showAttackRange = false;
            updateUI();
        }
    } catch (error) {
        console.error('Error attacking:', error);
    }
}

// End unit's turn
function endUnitTurn() {
    gameState.selectedUnit = null;
    gameState.viewedUnit = null;
    gameState.inspectedTile = null;
    gameState.movementRange = [];
    gameState.showMovementRange = false;
    gameState.showAttackRange = false;
    updateUI();
    addToBattleLog('Unit turn ended');
}

// Get terrain information at coordinates
function getTerrainAt(x, y) {
    if (!gameState.grid || !gameState.grid.tiles) return null;

    // Make sure coordinates are within bounds
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
        return null;
    }

    const terrainName = gameState.grid.tiles[y][x];

    // Define terrain properties based on name
    const terrainProperties = {
        'Grass': { name: 'Grass', movementCost: 1, defenseBonus: 0, color: '#27ae60' },
        'Forest': { name: 'Forest', movementCost: 2, defenseBonus: 1, color: '#145a32' },
        'Mountain': { name: 'Mountain', movementCost: 3, defenseBonus: 2, color: '#566573' },
        'Water': { name: 'Water', movementCost: 2, defenseBonus: 0, color: '#3498db' },
        'Road': { name: 'Road', movementCost: 1, defenseBonus: 0, color: '#d5dbdb' }
    };

    return terrainProperties[terrainName] || null;
}

// Update the UI elements
function updateUI() {
    // Update turn indicator
    document.getElementById('turn-indicator').textContent =
        gameState.currentTurn === 'player' ? 'Player Turn' : 'Enemy Turn';

    // Update unit info or terrain info
    const unitStats = document.getElementById('unit-stats');
    const unitToShow = gameState.selectedUnit || gameState.viewedUnit;
    const terrainToShow = gameState.inspectedTile;

    if (terrainToShow) {
        // Show terrain information
        const terrain = getTerrainAt(terrainToShow.x, terrainToShow.y);
        if (terrain) {
            unitStats.innerHTML = `
                <p><span class="stat-label">Terrain:</span> <span class="stat-value">${terrain.name}</span></p>
                <p><span class="stat-label">Position:</span> <span class="stat-value">(${terrainToShow.x}, ${terrainToShow.y})</span></p>
                <p><span class="stat-label">Movement Cost:</span> <span class="stat-value">${terrain.movementCost}</span></p>
                <p><span class="stat-label">Defense Bonus:</span> <span class="stat-value">+${terrain.defenseBonus}</span></p>
                <p style="color: #27ae60; font-weight: bold;">Terrain Info</p>
            `;
        } else {
            unitStats.innerHTML = `
                <p><span class="stat-label">Position:</span> <span class="stat-value">(${terrainToShow.x}, ${terrainToShow.y})</span></p>
                <p>Invalid terrain position</p>
            `;
        }

        // Disable action buttons when viewing terrain
        document.getElementById('move-btn').disabled = true;
        document.getElementById('attack-btn').disabled = true;
        document.getElementById('wait-btn').disabled = true;
    } else if (unitToShow) {
        const isEnemy = unitToShow.team !== 'player';
        const canControl = unitToShow.team === gameState.currentTurn;

        // Get terrain information for the unit's position
        const terrain = getTerrainAt(unitToShow.x, unitToShow.y);
        const terrainInfo = terrain ? `
            <p><span class="stat-label">Terrain:</span> <span class="stat-value">${terrain.name}</span></p>
            <p><span class="stat-label">Position:</span> <span class="stat-value">(${unitToShow.x}, ${unitToShow.y})</span></p>
            <p><span class="stat-label">Movement Cost:</span> <span class="stat-value">${terrain.movementCost}</span></p>
            <p><span class="stat-label">Defense Bonus:</span> <span class="stat-value">+${terrain.defenseBonus}</span></p>
        ` : '';

        unitStats.innerHTML = `
            <p><span class="stat-label">Name:</span> <span class="stat-value">${unitToShow.name}</span></p>
            <p><span class="stat-label">Team:</span> <span class="stat-value">${unitToShow.team}</span></p>
            <p><span class="stat-label">HP:</span> <span class="stat-value">${unitToShow.hp}/${unitToShow.maxHp}</span></p>
            <p><span class="stat-label">Attack:</span> <span class="stat-value">${unitToShow.attack}</span></p>
            <p><span class="stat-label">Defense:</span> <span class="stat-value">${unitToShow.defense}</span></p>
            <p><span class="stat-label">Movement:</span> <span class="stat-value">${unitToShow.movement}</span></p>
            <p><span class="stat-label">Attack Range:</span> <span class="stat-value">${unitToShow.minAttackRange}-${unitToShow.maxAttackRange}</span></p>
            ${terrainInfo}
            ${isEnemy ? '<p style="color: #e74c3c; font-weight: bold;">Enemy Unit - Cannot Control</p>' : '<p style="color: #27ae60; font-weight: bold;">Unit Info</p>'}
        `;

        // Enable/disable action buttons based on whether we can control this unit
        if (canControl && gameState.selectedUnit) {
            document.getElementById('move-btn').disabled = false;
            document.getElementById('attack-btn').disabled = false;
            document.getElementById('wait-btn').disabled = false;
        } else {
            document.getElementById('move-btn').disabled = true;
            document.getElementById('attack-btn').disabled = true;
            document.getElementById('wait-btn').disabled = true;
        }
    } else {
        unitStats.innerHTML = '<p>No unit selected</p>';

        // Disable action buttons
        document.getElementById('move-btn').disabled = true;
        document.getElementById('attack-btn').disabled = true;
        document.getElementById('wait-btn').disabled = true;
    }
}

// Add message to battle log
function addToBattleLog(message) {
    const log = document.getElementById('battle-log');
    const p = document.createElement('p');
    p.textContent = message;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
}

// Render the game
function render() {
    // Clear canvas completely
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw terrain (fills entire canvas with terrain colors)
    drawTerrain();

    // Draw grid
    drawGrid();

    // Draw terrain inspection highlight
    if (gameState.inspectedTile) {
        drawTerrainInspection();
    }

    // Draw movement/attack ranges
    if (gameState.showMovementRange && gameState.selectedUnit) {
        drawMovementRange();
    }
    if (gameState.showAttackRange && gameState.selectedUnit) {
        drawAttackRange();
    }

    // Draw units
    drawUnits();

    // Request next frame
    requestAnimationFrame(render);
}

// Draw terrain tiles
function drawTerrain() {
    if (!gameState.grid || !gameState.grid.tiles) return;

    // Ensure we don't go beyond the actual grid bounds
    const maxY = Math.min(GRID_HEIGHT, gameState.grid.tiles.length);

    for (let y = 0; y < maxY; y++) {
        const row = gameState.grid.tiles[y];
        if (!row) continue;

        const maxX = Math.min(GRID_WIDTH, row.length);

        for (let x = 0; x < maxX; x++) {
            const terrainName = row[x];
            let terrainColor = '#27ae60'; // Default grass color

            // Set color based on terrain type
            switch (terrainName) {
                case 'Grass':
                    terrainColor = '#27ae60'; // Light green
                    break;
                case 'Forest':
                    terrainColor = '#145a32'; // Dark green
                    break;
                case 'Mountain':
                    terrainColor = '#566573'; // Gray
                    break;
                case 'Water':
                    terrainColor = '#3498db'; // Blue
                    break;
                case 'Road':
                    terrainColor = '#d5dbdb'; // Light gray
                    break;
            }

            // Draw terrain tile
            ctx.fillStyle = terrainColor;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}

// Draw grid lines
function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= GRID_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE_SIZE, 0);
        ctx.lineTo(x * TILE_SIZE, CANVAS_HEIGHT);
        ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= GRID_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE_SIZE);
        ctx.lineTo(CANVAS_WIDTH, y * TILE_SIZE);
        ctx.stroke();
    }
}

// Draw movement range
function drawMovementRange() {
    if (!gameState.selectedUnit || gameState.movementRange.length === 0) return;

    ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;

    // Draw all reachable tiles
    gameState.movementRange.forEach(([x, y]) => {
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });
}

// Draw attack range
function drawAttackRange() {
    const unit = gameState.selectedUnit;
    if (!unit || !unit.minAttackRange || !unit.maxAttackRange) return;

    ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;

    // Draw all tiles within attack range
    for (let x = Math.max(0, unit.x - unit.maxAttackRange);
         x <= Math.min(GRID_WIDTH - 1, unit.x + unit.maxAttackRange);
         x++) {
        for (let y = Math.max(0, unit.y - unit.maxAttackRange);
             y <= Math.min(GRID_HEIGHT - 1, unit.y + unit.maxAttackRange);
             y++) {

            const distance = Math.abs(unit.x - x) + Math.abs(unit.y - y);

            // Check if within attack range (inclusive of min and max)
            if (distance >= unit.minAttackRange && distance <= unit.maxAttackRange) {
                const enemyUnit = gameState.units.find(u => u.x === x && u.y === y && u.team !== unit.team);
                if (enemyUnit) {
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
}

// Draw terrain inspection highlight
function drawTerrainInspection() {
    if (!gameState.inspectedTile) return;

    const { x, y } = gameState.inspectedTile;
    ctx.fillStyle = 'rgba(52, 152, 219, 0.4)';  // Light blue highlight
    ctx.strokeStyle = '#3498db';  // Blue border
    ctx.lineWidth = 3;

    // Draw highlight
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

    // Add a small indicator in the corner to show it's being inspected
    ctx.fillStyle = '#f39c12';  // Orange indicator
    ctx.beginPath();
    ctx.arc(x * TILE_SIZE + TILE_SIZE - 8, y * TILE_SIZE + 8, 4, 0, 2 * Math.PI);
    ctx.fill();
}

// Draw units
function drawUnits() {
    if (!gameState.units || gameState.units.length === 0) {
        console.log('drawUnits: No units to draw');
        return;
    }

    console.log(`drawUnits: Drawing ${gameState.units.length} units`);
    gameState.units.forEach((unit, index) => {
        console.log(`Drawing unit ${index}: ${unit.name} at (${unit.x}, ${unit.y})`);
        // Unit body
        ctx.fillStyle = unit.team === 'player' ? '#3498db' : '#e74c3c';
        ctx.fillRect(unit.x * TILE_SIZE + 2, unit.y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);

        // Unit border
        ctx.strokeStyle = unit === gameState.selectedUnit ? '#f39c12' : 'white';
        ctx.lineWidth = unit === gameState.selectedUnit ? 3 : 2;
        ctx.strokeRect(unit.x * TILE_SIZE + 2, unit.y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);

        // Unit type indicator
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        let typeIndicator = 'U'; // Default unknown
        switch (unit.type) {
            case 'warrior':
                typeIndicator = 'W';
                break;
            case 'archer':
                typeIndicator = 'A';
                break;
            case 'mage':
                typeIndicator = 'M';
                break;
            case 'knight':
                typeIndicator = 'K';
                break;
        }

        ctx.fillText(
            typeIndicator,
            unit.x * TILE_SIZE + TILE_SIZE / 2,
            unit.y * TILE_SIZE + TILE_SIZE / 2 + 4
        );

        // HP bar
        const hpPercent = unit.hp / unit.maxHp;
        const barWidth = TILE_SIZE - 4;
        const barHeight = 4;

        // Background
        ctx.fillStyle = 'red';
        ctx.fillRect(unit.x * TILE_SIZE + 2, unit.y * TILE_SIZE + TILE_SIZE - 6, barWidth, barHeight);

        // HP
        ctx.fillStyle = hpPercent > 0.5 ? 'green' : hpPercent > 0.25 ? 'yellow' : 'red';
        ctx.fillRect(unit.x * TILE_SIZE + 2, unit.y * TILE_SIZE + TILE_SIZE - 6, barWidth * hpPercent, barHeight);
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initGame);
