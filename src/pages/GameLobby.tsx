import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ArrowLeft, 
  Play, 
  Plus, 
  Crown, 
  Users, 
  History, 
  ChevronDown,
  UserCheck,
  UserX,
  Settings,
  Trash2,
  Edit
} from "lucide-react";
import { getGameById, saveGame, updateLastPlayed, SavedGame, Player } from "@/lib/gameStorage";
import { useToast } from "@/hooks/use-toast";
import cucumberLogo from "@/assets/cucumber-logo.png";
import RoundResultModal, { RoundResult } from "@/components/RoundResultModal";
import PlayerNameDialog from "@/components/PlayerNameDialog";
import MultiplierSettings from "@/components/MultiplierSettings";
import ScoreEditDialog from "@/components/ScoreEditDialog";

export default function GameLobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [game, setGame] = useState<SavedGame | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [roundModalOpen, setRoundModalOpen] = useState(false);
  const [playerNameDialogOpen, setPlayerNameDialogOpen] = useState(false);
  const [multiplierSettingsOpen, setMultiplierSettingsOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [scoreEditDialogOpen, setScoreEditDialogOpen] = useState(false);
  const [editingScore, setEditingScore] = useState<Player | null>(null);

  useEffect(() => {
    if (!gameId) {
      navigate("/");
      return;
    }

    const savedGame = getGameById(gameId);
    if (!savedGame) {
      toast({
        title: "Game Not Found",
        description: "The requested game could not be found.",
        variant: "destructive"
      });
      navigate("/");
      return;
    }

    setGame(savedGame);
    updateLastPlayed(gameId);
  }, [gameId, navigate, toast]);

  const activePlayers = game?.players.filter(p => p.active) || [];
  const inactivePlayers = game?.players.filter(p => !p.active) || [];

  // Calculate current multiplier
  const currentMultiplier = game ? (
    game.settings.mode === 'simple' ? 
      game.settings.multiplier : 
      (game.settings.multiplierSequence || [1])[(game.currentRound - 1) % (game.settings.multiplierSequence || [1]).length]
  ) : 1;

  const togglePlayerActive = (playerId: string) => {
    if (!game) return;

    const updated = { ...game };
    const player = updated.players.find(p => p.id === playerId);
    if (!player) return;

    const currentActivePlayers = updated.players.filter(p => p.active);
    
    if (!player.active && currentActivePlayers.length >= 6) {
      toast({
        title: "Maximum Active Players",
        description: "Only 6 players can be active for a round.",
        variant: "destructive",
        duration: 4000
      });
      return;
    }
    
    if (player.active && currentActivePlayers.length <= 3) {
      toast({
        title: "Minimum Active Players", 
        description: "At least 3 players must be active.",
        variant: "destructive",
        duration: 4000
      });
      return;
    }

    player.active = !player.active;
    setGame(updated);
    saveGame(updated);
  };

  const addPlayer = (name: string) => {
    if (!game) return;

    if (editingPlayer) {
      // Rename existing player
      const updated = { ...game };
      const player = updated.players.find(p => p.id === editingPlayer.id);
      if (player) {
        player.name = name;
        setGame(updated);
        saveGame(updated);
        
        toast({
          title: "Player Renamed",
          description: `Player renamed to ${name}.`,
          duration: 4000
        });
      }
      setEditingPlayer(null);
    } else {
      // Add new player
      const newPlayer: Player = {
        id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        tally: 0,
        active: false
      };

      const updated = { ...game, players: [...game.players, newPlayer] };
      setGame(updated);
      saveGame(updated);
      
      toast({
        title: "Player Added",
        description: `${newPlayer.name} joined the game.`,
        duration: 4000
      });
    }
  };

  const removePlayer = (playerId: string) => {
    if (!game) return;

    const updated = { ...game, players: game.players.filter(p => p.id !== playerId) };
    setGame(updated);
    saveGame(updated);
    
    toast({
      title: "Player Removed",
      description: "Player has been removed from the game.",
      duration: 4000
    });
  };

  const editPlayer = (player: Player) => {
    setEditingPlayer(player);
    setPlayerNameDialogOpen(true);
  };

  const editScore = (player: Player) => {
    setEditingScore(player);
    setScoreEditDialogOpen(true);
  };

  const handleScoreSave = (playerId: string, newScore: number) => {
    if (!game) return;

    const updated = { ...game };
    const player = updated.players.find(p => p.id === playerId);
    if (player) {
      player.tally = newScore;
      setGame(updated);
      saveGame(updated);
      
      toast({
        title: "Score Updated",
        description: `${player.name}'s score updated to ${game.settings.currency === 'usd' ? '$' + newScore.toFixed(2) : newScore + ' tokens'}.`,
        duration: 4000
      });
    }
  };

  const startNextRound = () => {
    setRoundModalOpen(true);
  };

  const handleMultiplierSettings = (settings: {
    mode: 'simple' | 'advanced';
    multiplier: number;
    multiplierSequence?: number[];
  }) => {
    if (!game) return;

    const updated = {
      ...game,
      settings: {
        ...game.settings,
        ...settings
      }
    };
    setGame(updated);
    saveGame(updated);
    
    toast({
      title: "Settings Updated",
      description: "Multiplier settings have been saved.",
      duration: 4000
    });
  };

  const handleRoundResult = (result: RoundResult) => {
    if (!game) return;

    // Apply token adjustments
    const updatedPlayers = game.players.map(player => {
      const adjustment = result.adjustments.find(adj => adj.playerId === player.id);
      if (adjustment) {
        return { ...player, tally: player.tally + adjustment.change };
      }
      return player;
    });

    // Create round record
    const winnerNames = result.winners.map(id => 
      game.players.find(p => p.id === id)?.name || 'Unknown'
    );
    const loserEntries = result.losers.map(loser => {
      const player = game.players.find(p => p.id === loser.playerId);
      return `${player?.name || 'Unknown'} (${loser.exitValue})`;
    });

    const roundRecord = {
      round: game.currentRound,
      timestamp: new Date(),
      winners: result.winners,
      losers: result.losers.map(l => l.playerId),
      multiplier: result.multiplier,
      adjustments: result.adjustments,
      notes: `Winners: ${winnerNames.join(', ')} • Losers: ${loserEntries.join(', ')} • ×${result.multiplier}`
    };

    // Update game
    const updatedGame = {
      ...game,
      players: updatedPlayers,
      currentRound: game.currentRound + 1,
      history: [...game.history, roundRecord],
      lastPlayed: new Date()
    };

    setGame(updatedGame);
    saveGame(updatedGame);
    setRoundModalOpen(false);

    toast({
      title: "Round Completed",
      description: `Round ${game.currentRound} results applied successfully.`,
      duration: 4000
    });
  };

  const getPlayerPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radius = 160;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return {
      transform: `translate(${x}px, ${y}px)`,
      position: 'absolute' as const,
      left: '50%',
      top: '50%',
      marginLeft: '-60px',
      marginTop: '-40px'
    };
  };

  if (!game) {
    return (
      <div className="min-h-screen casino-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading game...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen casino-gradient">
      {/* Header */}
      <header className="border-b border-border/20 bg-card/10 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold gold-accent">{game.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {game.currentRound} Rounds • {activePlayers.length} active players
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline"
              onClick={() => setMultiplierSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Multiplier
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Table Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Casino Table with Detailed Graphics */}
          <div className="absolute inset-0 bg-gradient-to-br from-felt-green to-felt-green/80">
            
            {/* Enhanced Table with Graphics */}
            <div className="absolute inset-8 game-table-container">
              {/* Players positioned around the table */}
              <div className="relative w-full h-full">
                {activePlayers.map((player, index) => (
                  <div 
                    key={player.id}
                    style={getPlayerPosition(index, activePlayers.length)}
                  >
                    <Card className="felt-card p-4 text-center min-w-[120px] bg-card/90 backdrop-blur-sm">
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-medium text-sm">{player.name}</span>
                        </div>
                        <div 
                          className="text-2xl font-bold gold-accent cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => editScore(player)}
                        >
                          {game.settings.currency === 'usd' ? '$' + player.tally.toFixed(2) : (player.tally === 0 ? '0' : player.tally)}
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
                
                {/* Start Next Round Button in Center */}
                {activePlayers.length >= 3 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <Button 
                      className="elegant-glow pointer-events-auto rounded-full w-36 h-36 relative z-20"
                      onClick={startNextRound}
                    >
                      <div className="text-center">
                        <Play className="h-6 w-6 mx-auto mb-1" />
                        <div className="text-sm leading-tight">
                          Start Next<br />Round
                        </div>
                        <div className="text-xs mt-1 opacity-90">
                          {game.settings.currency === 'usd' ? 'Divider' : 'Multiplier'}: {game.settings.currency === 'usd' ? '÷' : '×'}{currentMultiplier}
                        </div>
                      </div>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-border/20 bg-card/10 backdrop-blur-sm p-6 space-y-6 overflow-y-auto">
          {/* Active Players Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium gold-accent">Active Players</h3>
            <div className="space-y-2">
              {activePlayers.map((player) => (
                <Card key={player.id} className="felt-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{player.name}</div>
                      <div 
                        className="text-sm text-muted-foreground cursor-pointer hover:opacity-75"
                        onClick={() => editScore(player)}
                      >
                        {game.settings.currency === 'usd' ? 'Score: $' + player.tally.toFixed(2) : 'Tokens: ' + (player.tally === 0 ? '0' : player.tally)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editPlayer(player)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePlayer(player.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePlayerActive(player.id)}
                        disabled={activePlayers.length <= 3}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Inactive Players */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium gold-accent">Lobby</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPlayerNameDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </div>
            
            {inactivePlayers.length > 0 ? (
              <div className="space-y-2">
                {inactivePlayers.map((player) => (
                  <Card key={player.id} className="felt-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{player.name}</div>
                        <div 
                          className="text-sm text-muted-foreground cursor-pointer hover:opacity-75"
                          onClick={() => editScore(player)}
                        >
                          {game.settings.currency === 'usd' ? 'Score: $' + player.tally.toFixed(2) : 'Tokens: ' + (player.tally === 0 ? '0' : player.tally)}
                        </div>
                        <Badge variant="secondary" className="bg-gold/20 text-gold text-xs mt-1">
                          Sitting Out
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editPlayer(player)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePlayer(player.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePlayerActive(player.id)}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No players sitting out</p>
              </div>
            )}
          </div>

          <Separator />

          {/* History Panel */}
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <span>Round History</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {game.history.length > 0 ? (
                game.history.slice(-5).reverse().map((round, index) => (
                  <Card key={round.round} className="felt-card p-3">
                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                         <span className="font-medium">{round.round} Rounds</span>
                         <span className="text-xs text-muted-foreground">
                           {new Date(round.timestamp).toLocaleDateString()}
                         </span>
                       </div>
                      {round.notes && (
                        <p className="text-sm text-muted-foreground">{round.notes}</p>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">No rounds played yet</p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Player Name Dialog */}
      <PlayerNameDialog
        open={playerNameDialogOpen}
        onOpenChange={(open) => {
          setPlayerNameDialogOpen(open);
          if (!open) setEditingPlayer(null);
        }}
        onConfirm={addPlayer}
        initialName={editingPlayer?.name || ""}
        title={editingPlayer ? "Rename Player" : "Add New Player"}
      />

      {/* Multiplier Settings Dialog */}
      {game && (
        <MultiplierSettings
          open={multiplierSettingsOpen}
          onOpenChange={setMultiplierSettingsOpen}
          currentSettings={game.settings}
          onSave={handleMultiplierSettings}
          currency={game.settings.currency}
        />
      )}

      {/* Round Result Modal */}
      {game && (
        <RoundResultModal
          game={game}
          open={roundModalOpen}
          onOpenChange={setRoundModalOpen}
          onSubmit={handleRoundResult}
        />
      )}

      {/* Score Edit Dialog */}
      {game && (
        <ScoreEditDialog
          player={editingScore}
          open={scoreEditDialogOpen}
          onOpenChange={(open) => {
            setScoreEditDialogOpen(open);
            if (!open) setEditingScore(null);
          }}
          onSave={handleScoreSave}
          currency={game.settings.currency}
        />
      )}
    </div>
  );
}