from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import json
import os
from game_logic.units import create_unit, Unit
from game_logic.grid import create_battle_map, Grid
from game_logic.battle import BattleSystem

app = Flask(__name__)
CORS(app)  # Enable CORS for API calls from frontend

# Game state management
class GameState:
    def __init__(self):
        self.current_turn = 'player'
        self.units = []
        self.grid = create_battle_map()
        self.battle_system = BattleSystem()
        self.game_started = False
        self.unit_id_counter = 1

    def to_dict(self):
        return {
            'currentTurn': self.current_turn,
            'units': [unit.to_dict() for unit in self.units],
            'grid': self.grid.to_dict(),
            'gameStarted': self.game_started
        }

    def add_unit(self, name, x, y, team, unit_type):
        unit = create_unit(self.unit_id_counter, name, x, y, team, unit_type)
        self.units.append(unit)
        self.unit_id_counter += 1
        return unit

    def get_unit(self, unit_id):
        return next((u for u in self.units if u.id == unit_id), None)

    def move_unit(self, unit_id, x, y):
        unit = self.get_unit(unit_id)
        if unit:
            unit.x = x
            unit.y = y
            unit.has_moved = True
            return True
        return False

    def reset(self):
        self.__init__()

# Global game state instance
game_state = GameState()

@app.route('/')
def index():
    """Serve the main game page"""
    return render_template('index.html')

@app.route('/api/game-state', methods=['GET'])
def get_game_state():
    """Get the current game state"""
    return jsonify(game_state.to_dict())

@app.route('/api/game-state', methods=['POST'])
def update_game_state():
    """Update the game state"""
    data = request.get_json()
    # Update game state properties
    for key, value in data.items():
        if hasattr(game_state, key):
            setattr(game_state, key, value)
    return jsonify({'status': 'success'})

@app.route('/api/reset-game', methods=['POST'])
def reset_game():
    """Reset the game to initial state"""
    global game_state
    game_state.reset()
    return jsonify({'status': 'success'})

@app.route('/api/move-unit', methods=['POST'])
def move_unit():
    """Handle unit movement"""
    data = request.get_json()
    unit_id = data.get('unit_id')
    new_x = data.get('x')
    new_y = data.get('y')

    success = game_state.move_unit(unit_id, new_x, new_y)

    if success:
        return jsonify({'status': 'success'})
    else:
        return jsonify({'status': 'error', 'message': 'Unit not found or invalid move'})

@app.route('/api/get-movement-range', methods=['POST'])
def get_movement_range():
    """Get all tiles reachable by a unit considering terrain costs"""
    data = request.get_json()
    unit_id = data.get('unit_id')

    unit = game_state.get_unit(unit_id)
    if not unit:
        return jsonify({'status': 'error', 'message': 'Unit not found'})

    # Get reachable tiles considering terrain movement costs
    reachable_tiles = game_state.grid.find_all_reachable_tiles(
        (unit.x, unit.y),
        unit.movement
    )

    # Filter out the current position and occupied tiles
    occupied_positions = [(u.x, u.y) for u in game_state.units if u.id != unit_id]
    available_tiles = [
        (x, y) for x, y in reachable_tiles
        if (x, y) != (unit.x, unit.y) and (x, y) not in occupied_positions
    ]

    return jsonify({
        'status': 'success',
        'reachable_tiles': available_tiles,
        'unit_position': (unit.x, unit.y)
    })

@app.route('/api/attack', methods=['POST'])
def attack():
    """Handle combat between units"""
    data = request.get_json()
    attacker_id = data.get('attacker_id')
    target_id = data.get('target_id')

    attacker = game_state.get_unit(attacker_id)
    target = game_state.get_unit(target_id)

    if attacker and target:
        # Execute attack using battle system
        result = game_state.battle_system.execute_attack(attacker, target, game_state.grid)

        if result['success']:
            # Remove defeated units
            if not result['defender_alive']:
                game_state.units = [u for u in game_state.units if u.id != target_id]

            return jsonify({
                'status': 'success',
                'damage': result['damage'],
                'target_hp': result['defender_hp'],
                'critical': result.get('critical', False)
            })
        else:
            return jsonify({'status': 'error', 'message': result['message']})

    return jsonify({'status': 'error', 'message': 'Units not found'})

@app.route('/api/start-battle', methods=['POST'])
def start_battle():
    """Initialize a new battle with default units"""
    global game_state
    game_state.reset()

    # Add player units
    game_state.add_unit('Hero', 2, 3, 'player', 'warrior')
    game_state.add_unit('Archer', 3, 4, 'player', 'archer')

    # Add enemy units
    game_state.add_unit('Orc', 12, 3, 'enemy', 'warrior')
    game_state.add_unit('Goblin', 11, 5, 'enemy', 'archer')

    game_state.game_started = True

    return jsonify({'status': 'success', 'game_state': game_state.to_dict()})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
