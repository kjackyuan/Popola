"""
Grid and map system for the battle simulator
"""

from typing import List, Tuple, Optional

class Terrain:
    """Terrain type with movement cost and defense bonus"""

    def __init__(self, name: str, movement_cost: int, defense_bonus: int, color: str):
        self.name = name
        self.movement_cost = movement_cost
        self.defense_bonus = defense_bonus
        self.color = color

# Terrain types
TERRAIN_TYPES = {
    'grass': Terrain('Grass', 1, 0, '#27ae60'),
    'forest': Terrain('Forest', 2, 1, '#145a32'),
    'mountain': Terrain('Mountain', 3, 2, '#566573'),
    'water': Terrain('Water', 2, 0, '#3498db'),
    'road': Terrain('Road', 1, 0, '#d5dbdb')
}

class Grid:
    """Tactical grid for the battle simulator"""

    def __init__(self, width: int = 15, height: int = 10):
        self.width = width
        self.height = height
        self.tiles = self._initialize_grid()

    def _initialize_grid(self) -> List[List[Terrain]]:
        """Initialize grid with randomized terrain"""
        import random

        # Set seed for reproducible randomization (optional)
        # random.seed(42)  # Uncomment to get consistent maps for testing

        grid = []
        for y in range(self.height):
            row = []
            for x in range(self.width):
                # Generate random terrain with weighted probabilities
                rand = random.random()

                # Terrain distribution: 60% grass, 20% forest, 10% mountain, 8% water, 2% road
                if rand < 0.02:  # 2% chance
                    terrain = TERRAIN_TYPES['road']
                elif rand < 0.10:  # 8% chance
                    terrain = TERRAIN_TYPES['water']
                elif rand < 0.20:  # 10% chance
                    terrain = TERRAIN_TYPES['mountain']
                elif rand < 0.40:  # 20% chance
                    terrain = TERRAIN_TYPES['forest']
                else:  # 60% chance
                    terrain = TERRAIN_TYPES['grass']

                row.append(terrain)
            grid.append(row)
        return grid

    def is_valid_position(self, x: int, y: int) -> bool:
        """Check if position is within grid bounds"""
        return 0 <= x < self.width and 0 <= y < self.height

    def get_terrain(self, x: int, y: int) -> Optional[Terrain]:
        """Get terrain at position"""
        if self.is_valid_position(x, y):
            return self.tiles[y][x]
        return None

    def get_movement_cost(self, x: int, y: int) -> int:
        """Get movement cost for tile"""
        terrain = self.get_terrain(x, y)
        return terrain.movement_cost if terrain else 999

    def get_defense_bonus(self, x: int, y: int) -> int:
        """Get defense bonus for tile"""
        terrain = self.get_terrain(x, y)
        return terrain.defense_bonus if terrain else 0

    def is_walkable(self, x: int, y: int) -> bool:
        """Check if tile can be walked on"""
        return self.is_valid_position(x, y)

    def get_neighbors(self, x: int, y: int) -> List[Tuple[int, int]]:
        """Get adjacent tiles (4-directional)"""
        neighbors = []
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]

        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            if self.is_valid_position(nx, ny):
                neighbors.append((nx, ny))

        return neighbors

    def calculate_path(self, start: Tuple[int, int], end: Tuple[int, int], movement_range: int) -> List[Tuple[int, int]]:
        """
        Calculate path from start to end within movement range
        Returns list of positions that can be reached
        """
        if not self.is_valid_position(start[0], start[1]) or not self.is_valid_position(end[0], end[1]):
            return []

        # Simple BFS to find reachable tiles
        from collections import deque

        visited = set()
        queue = deque([(start, 0)])  # (position, cost_so_far)
        reachable = []

        while queue:
            (x, y), cost = queue.popleft()

            if (x, y) in visited:
                continue
            visited.add((x, y))

            if cost <= movement_range:
                reachable.append((x, y))

                # Explore neighbors
                for nx, ny in self.get_neighbors(x, y):
                    new_cost = cost + self.get_movement_cost(nx, ny)
                    if new_cost <= movement_range and (nx, ny) not in visited:
                        queue.append(((nx, ny), new_cost))

        return reachable

    def get_attack_range(self, x: int, y: int, attack_range: int = 1) -> List[Tuple[int, int]]:
        """Get tiles within attack range (adjacent by default)"""
        attackable = []
        for dx in range(-attack_range, attack_range + 1):
            for dy in range(-attack_range, attack_range + 1):
                if abs(dx) + abs(dy) <= attack_range and (dx, dy) != (0, 0):
                    nx, ny = x + dx, y + dy
                    if self.is_valid_position(nx, ny):
                        attackable.append((nx, ny))
        return attackable

    def to_dict(self) -> dict:
        """Convert grid to dictionary for JSON serialization"""
        return {
            'width': self.width,
            'height': self.height,
            'tiles': [
                [tile.name for tile in row]
                for row in self.tiles
            ]
        }

def create_battle_map(width: int = 15, height: int = 10) -> Grid:
    """Create a new battle map"""
    return Grid(width, height)
