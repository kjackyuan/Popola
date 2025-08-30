"""
Battle and combat system for the simulator
"""

from typing import List, Optional, Tuple
from .units import Unit
from .grid import Grid

class BattleSystem:
    """Handles combat mechanics and turn management"""

    def __init__(self):
        self.current_turn = 'player'
        self.turn_count = 1

    def switch_turn(self):
        """Switch between player and enemy turns"""
        self.current_turn = 'enemy' if self.current_turn == 'player' else 'player'
        if self.current_turn == 'player':
            self.turn_count += 1

    def calculate_damage(self, attacker: Unit, defender: Unit, grid: Grid) -> int:
        """
        Calculate damage from attacker to defender
        Includes terrain bonuses and basic combat formula
        """
        # Base damage
        base_damage = attacker.attack

        # Terrain defense bonus
        terrain_bonus = grid.get_defense_bonus(defender.x, defender.y)
        total_defense = defender.defense + terrain_bonus

        # Calculate final damage
        damage = max(0, base_damage - total_defense)

        # Critical hit chance (5% for now)
        import random
        if random.random() < 0.05:
            damage *= 2

        return damage

    def execute_attack(self, attacker: Unit, defender: Unit, grid: Grid) -> dict:
        """
        Execute an attack between two units
        Returns battle result information
        """
        if not attacker.can_attack(defender):
            return {'success': False, 'message': 'Cannot attack target'}

        # Calculate damage
        damage = self.calculate_damage(attacker, defender, grid)

        # Apply damage
        actual_damage = defender.take_damage(damage)

        # Mark attacker as having acted
        attacker.has_acted = True

        result = {
            'success': True,
            'attacker': attacker.name,
            'defender': defender.name,
            'damage': actual_damage,
            'defender_hp': defender.hp,
            'defender_alive': defender.is_alive(),
            'critical': damage > attacker.attack  # Simple critical detection
        }

        return result

    def is_game_over(self, units: List[Unit]) -> Optional[str]:
        """
        Check if game is over
        Returns winning team or None if game continues
        """
        player_units = [u for u in units if u.team == 'player' and u.is_alive()]
        enemy_units = [u for u in units if u.team == 'enemy' and u.is_alive()]

        if not player_units:
            return 'enemy'
        elif not enemy_units:
            return 'player'

        return None

    def get_valid_attacks(self, unit: Unit, grid: Grid, enemy_units: List[Unit]) -> List[Unit]:
        """
        Get all valid attack targets for a unit
        """
        attack_range = grid.get_attack_range(unit.x, unit.y, 1)  # Adjacent attacks
        valid_targets = []

        for enemy in enemy_units:
            if (enemy.x, enemy.y) in attack_range:
                valid_targets.append(enemy)

        return valid_targets

class CombatResult:
    """Container for combat results"""

    def __init__(self, attacker: Unit, defender: Unit, damage: int, critical: bool = False):
        self.attacker = attacker
        self.defender = defender
        self.damage = damage
        self.critical = critical

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON"""
        return {
            'attacker_name': self.attacker.name,
            'defender_name': self.defender.name,
            'damage': self.damage,
            'defender_hp': self.defender.hp,
            'critical': self.critical
        }

def calculate_hit_chance(attacker: Unit, defender: Unit, distance: int) -> float:
    """
    Calculate hit chance based on distance and unit stats
    """
    base_accuracy = 0.85  # 85% base accuracy

    # Distance penalty
    if distance > 1:
        base_accuracy -= 0.1 * (distance - 1)

    # Unit type bonuses
    if attacker.type == 'archer' and distance > 1:
        base_accuracy += 0.1  # Archers better at range
    elif attacker.type == 'mage' and distance > 1:
        base_accuracy += 0.15  # Mages better at range

    return max(0.1, min(1.0, base_accuracy))  # Clamp between 10% and 100%

def calculate_critical_chance(attacker: Unit) -> float:
    """
    Calculate critical hit chance
    """
    base_crit = 0.05  # 5% base critical chance

    # Unit type bonuses
    if attacker.type == 'warrior':
        base_crit += 0.05  # Warriors get bonus crit chance

    return min(0.25, base_crit)  # Max 25% crit chance
