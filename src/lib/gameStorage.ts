/**
 * Local storage utilities for Cucumber scorekeeper app
 */

export interface Player {
  id: string;
  name: string;
  tally: number;
  active: boolean;
}

export interface GameSettings {
  gameMode: 'social' | 'arena';
  mode: 'simple' | 'advanced';
  multiplier: number;
  multiplierSequence?: number[];
}

export interface RoundRecord {
  round: number;
  timestamp: Date;
  winners?: string[];
  losers?: string[];
  multiplier?: number;
  adjustments?: { playerId: string; change: number }[];
  playerScores?: Record<string, number>;
  notes?: string;
}

export interface SavedGame {
  id: string;
  name: string;
  createdAt: Date;
  lastPlayed: Date;
  players: Player[];
  currentRound: number;
  settings: GameSettings;
  history: RoundRecord[];
}

const STORAGE_KEY = 'cucumber_saves';

/**
 * Get all saved games from localStorage
 */
export const getSavedGames = (): SavedGame[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const games = JSON.parse(data);
    // Convert date strings back to Date objects
    return games.map((game: any) => ({
      ...game,
      createdAt: new Date(game.createdAt),
      lastPlayed: new Date(game.lastPlayed),
      history: game.history?.map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp)
      })) || []
    }));
  } catch (error) {
    console.error('Failed to load saved games:', error);
    return [];
  }
};

/**
 * Save a game to localStorage
 */
export const saveGame = (game: SavedGame): void => {
  try {
    const existingGames = getSavedGames();
    const gameIndex = existingGames.findIndex(g => g.id === game.id);
    
    if (gameIndex >= 0) {
      existingGames[gameIndex] = game;
    } else {
      existingGames.push(game);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingGames));
  } catch (error) {
    console.error('Failed to save game:', error);
    throw new Error('Unable to save game data');
  }
};

/**
 * Get a specific game by ID
 */
export const getGameById = (gameId: string): SavedGame | null => {
  const games = getSavedGames();
  return games.find(game => game.id === gameId) || null;
};

/**
 * Delete a game by ID
 */
export const deleteGame = (gameId: string): void => {
  try {
    const games = getSavedGames();
    const filteredGames = games.filter(game => game.id !== gameId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredGames));
  } catch (error) {
    console.error('Failed to delete game:', error);
    throw new Error('Unable to delete game');
  }
};

/**
 * Update a game's last played time
 */
export const updateLastPlayed = (gameId: string): void => {
  try {
    const games = getSavedGames();
    const game = games.find(g => g.id === gameId);
    
    if (game) {
      game.lastPlayed = new Date();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    }
  } catch (error) {
    console.error('Failed to update last played:', error);
  }
};

/**
 * Generate a unique game ID
 */
export const generateGameId = (): string => {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a new game template
 */
export const createNewGame = (name: string, players: string[]): SavedGame => {
  const gameId = generateGameId();
  const now = new Date();
  
  return {
    id: gameId,
    name,
    createdAt: now,
    lastPlayed: now,
    currentRound: 1,
    settings: {
      gameMode: 'social',
      mode: 'simple',
      multiplier: 1
    },
    players: players.map((playerName, index) => ({
      id: `player_${index}_${Date.now()}`,
      name: playerName,
      tally: 0,
      active: true
    })),
    history: []
  };
};