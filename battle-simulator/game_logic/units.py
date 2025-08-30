"""
Unit system for the battle simulator
"""

class Unit:
    """Base unit class with stats and properties"""

    def __init__(self, unit_id, name, x, y, team, unit_type):
        self.id = unit_id
        self.name = name
        self.x = x
        self.y = y
        self.team = team  # 'player' or 'enemy'
        self.type = unit_type
        self.has_moved = False
        self.has_acted = False

        # Base stats (will be overridden by subclasses)
        self.max_hp = 20
        self.hp = self.max_hp
        self.attack = 5
        self.defense = 3
        self.movement = 4

    def to_dict(self):
        """Convert unit to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'name': self.name,
            'x': self.x,
            'y': self.y,
            'hp': self.hp,
            'maxHp': self.max_hp,
            'attack': self.attack,
            'defense': self.defense,
            'movement': self.movement,
            'team': self.team,
            'type': self.type
        }

    def take_damage(self, damage):
        """Apply damage to unit"""
        actual_damage = max(0, damage - self.defense)
        self.hp -= actual_damage
        return actual_damage

    def is_alive(self):
        """Check if unit is still alive"""
        return self.hp > 0

    def reset_turn(self):
        """Reset unit's turn status"""
        self.has_moved = False
        self.has_acted = False

    def can_attack(self, target):
        """Check if this unit can attack the target"""
        if self.team == target.team:
            return False

        # Check if adjacent
        distance = abs(self.x - target.x) + abs(self.y - target.y)
        return distance <= 1

class Warrior(Unit):
    """Melee fighter unit"""

    def __init__(self, unit_id, name, x, y, team):
        super().__init__(unit_id, name, x, y, team, 'warrior')
        self.max_hp = 25
        self.hp = self.max_hp
        self.attack = 8
        self.defense = 6
        self.movement = 4

class Archer(Unit):
    """Ranged fighter unit"""

    def __init__(self, unit_id, name, x, y, team):
        super().__init__(unit_id, name, x, y, team, 'archer')
        self.max_hp = 16
        self.hp = self.max_hp
        self.attack = 6
        self.defense = 3
        self.movement = 5

class Mage(Unit):
    """Magic user unit"""

    def __init__(self, unit_id, name, x, y, team):
        super().__init__(unit_id, name, x, y, team, 'mage')
        self.max_hp = 14
        self.hp = self.max_hp
        self.attack = 9
        self.defense = 2
        self.movement = 4

class Knight(Unit):
    """Heavy armored unit"""

    def __init__(self, unit_id, name, x, y, team):
        super().__init__(unit_id, name, x, y, team, 'knight')
        self.max_hp = 30
        self.hp = self.max_hp
        self.attack = 7
        self.defense = 8
        self.movement = 3

def create_unit(unit_id, name, x, y, team, unit_type):
    """Factory function to create units by type"""
    unit_classes = {
        'warrior': Warrior,
        'archer': Archer,
        'mage': Mage,
        'knight': Knight
    }

    unit_class = unit_classes.get(unit_type, Unit)
    return unit_class(unit_id, name, x, y, team)

def get_unit_types():
    """Get list of available unit types"""
    return ['warrior', 'archer', 'mage', 'knight']
