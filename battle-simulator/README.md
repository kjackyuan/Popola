# 🔥 Fire Emblem Style Battle Simulator

A tactical RPG battle simulator built with Python Flask backend and HTML5 Canvas frontend.

## 🎮 Features

- **Tactical Grid Combat**: 15x10 grid-based battlefield
- **Unit Classes**: Warriors, Archers, Mages, and Knights with unique stats
- **Turn-Based System**: Player vs Enemy alternating turns
- **Real-time Canvas Rendering**: Smooth pixel-perfect graphics
- **Terrain System**: Different tiles affect movement and defense
- **Combat Mechanics**: Adjacent attacks with damage calculation

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Modern web browser

### Installation & Setup

1. **Clone and navigate to the project:**
   ```bash
   cd /Users/jackyuan/Projects/Popola/battle-simulator
   ```

2. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```

3. **Run the application:**
   ```bash
   python run.py
   ```

4. **Open your browser:**
   Navigate to: http://localhost:5000

## 🎯 How to Play

1. **Click "Start Battle"** to begin with default units
2. **Click on your units** to select them
3. **Use action buttons** to Move, Attack, or Wait
4. **Move**: Click on highlighted tiles to move your unit
5. **Attack**: Click on enemy units within range (adjacent tiles)
6. **Wait**: End your unit's turn

### Unit Stats
- **HP**: Health Points
- **ATK**: Attack Power
- **DEF**: Defense (reduces incoming damage)
- **MOV**: Movement Range (tiles per turn)

### Unit Classes
- **Warrior**: High HP and DEF, melee specialist
- **Archer**: High MOV, ranged specialist
- **Mage**: High ATK, magic specialist
- **Knight**: High DEF, armored tank

## 🏗️ Project Structure

```
battle-simulator/
├── app.py                 # Flask application & API routes
├── run.py                 # Development server runner
├── requirements.txt       # Python dependencies
├── game_logic/           # Python game logic modules
│   ├── __init__.py
│   ├── units.py          # Unit classes & stats
│   ├── grid.py           # Map & terrain system
│   └── battle.py         # Combat mechanics
├── templates/
│   └── index.html        # Main game page
├── static/
│   ├── js/
│   │   └── game.js       # Canvas rendering & input
│   ├── css/
│   │   └── styles.css    # Game styling
│   └── assets/           # Future: pixel art sprites
└── venv/                 # Python virtual environment
```

## 🔧 API Endpoints

- `GET /api/game-state` - Get current game state
- `POST /api/start-battle` - Initialize new battle
- `POST /api/move-unit` - Move unit to new position
- `POST /api/attack` - Execute attack between units
- `POST /api/reset-game` - Reset game state

## 🎨 Technical Stack

- **Backend**: Python Flask with REST API
- **Frontend**: HTML5 Canvas + JavaScript
- **Styling**: CSS with responsive design
- **Architecture**: MVC pattern with clear separation

## 🚧 Development Roadmap

- [x] Phase 1: Project setup & planning
- [x] Phase 2: Basic Flask + Canvas framework
- [ ] Phase 3: Pixel art assets creation
- [ ] Phase 4: Enhanced grid system & pathfinding
- [ ] Phase 5: Advanced unit system & abilities
- [ ] Phase 6: Turn system refinements
- [ ] Phase 7: Enemy AI implementation
- [ ] Phase 8: UI/UX improvements
- [ ] Phase 9: Input handling enhancements
- [ ] Phase 10: Polish & testing

## 📝 Development Notes

### Current Implementation
- ✅ Basic unit movement on grid
- ✅ Adjacent tile combat system
- ✅ Turn-based structure
- ✅ Real-time Canvas rendering
- ✅ Terrain-aware grid system
- ✅ RESTful API communication

### Known Limitations
- No pixel art sprites (using colored rectangles)
- Basic enemy AI (static positioning)
- Simple terrain generation
- No sound effects or animations

## 🤝 Contributing

This is a learning project! Feel free to:
- Add new unit classes
- Implement pixel art sprites
- Enhance the AI system
- Add special abilities
- Improve the UI/UX

## 📄 License

This project is for educational purposes. Feel free to use and modify as needed.
