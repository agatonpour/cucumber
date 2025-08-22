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
  Settings
} from "lucide-react";
import { getGameById, saveGame, updateLastPlayed, SavedGame, Player } from "@/lib/gameStorage";
import { useToast } from "@/hooks/use-toast";
import cucumberLogo from "@/assets/cucumber-logo.png";
import RoundResultModal, { RoundResult } from "@/components/RoundResultModal";
import PlayerNameDialog from "@/components/PlayerNameDialog";
import MultiplierSettings from "@/components/MultiplierSettings";

export default function GameLobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [game, setGame] = useState<SavedGame | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [roundModalOpen, setRoundModalOpen] = useState(false);
  const [playerNameDialogOpen, setPlayerNameDialogOpen] = useState(false);
  const [multiplierSettingsOpen, setMultiplierSettingsOpen] = useState(false);

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

  const togglePlayerActive = (playerId: string) => {
    if (!game) return;

    const updated = { ...game };
    const player = updated.players.find(p => p.id === playerId);
    if (!player) return;

    const currentActivePlayers = updated.players.filter(p => p.active);
    
    if (!player.active && currentActivePlayers.length >= 4) {
      toast({
        title: "Maximum Active Players",
        description: "Only 4 players can be active for a round.",
        variant: "destructive"
      });
      return;
    }
    
    if (player.active && currentActivePlayers.length <= 3) {
      toast({
        title: "Minimum Active Players", 
        description: "At least 3 players must be active.",
        variant: "destructive"
      });
      return;
    }

    player.active = !player.active;
    setGame(updated);
    saveGame(updated);
  };

  const addPlayer = (name: string) => {
    if (!game) return;

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
      description: `${newPlayer.name} joined the game.`
    });
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
      description: "Multiplier settings have been saved."
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
      description: `Round ${game.currentRound} results applied successfully.`
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
                  Round {game.currentRound} • {activePlayers.length} active players
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
          {/* Felt Table Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-felt-green to-felt-green/80">
            {/* Cucumber Logo Watermark */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={cucumberLogo}
                alt="Cucumber Watermark"
                className="w-64 h-64 opacity-10 select-none pointer-events-none"
              />
            </div>
            
            {/* Table Border */}
            <div className="absolute inset-8 rounded-full border-4 border-gold/30 shadow-inner">
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
                        <div className="text-2xl font-bold gold-accent">
                          {player.tally}
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
                
                {/* Start Next Round Button in Center */}
                {activePlayers.length >= 3 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Button 
                      className="elegant-glow pointer-events-auto"
                      onClick={startNextRound}
                      size="lg"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Start Next Round
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
                      <div className="text-sm text-muted-foreground">
                        Tokens: {player.tally}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                        <div className="text-sm text-muted-foreground">
                          Tokens: {player.tally}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-gold/20 text-gold">
                          Sitting Out
                        </Badge>
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
                        <span className="font-medium">Round {round.round}</span>
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

      {/* Round Result Modal */}
      {game && (
        <RoundResultModal
          game={game}
          open={roundModalOpen}
          onOpenChange={setRoundModalOpen}
          onSubmit={handleRoundResult}
        />
      )}

      {/* Player Name Dialog */}
      <PlayerNameDialog
        open={playerNameDialogOpen}
        onOpenChange={setPlayerNameDialogOpen}
        onConfirm={addPlayer}
      />

      {/* Multiplier Settings Dialog */}
      {game && (
        <MultiplierSettings
          open={multiplierSettingsOpen}
          onOpenChange={setMultiplierSettingsOpen}
          currentSettings={game.settings}
          onSave={handleMultiplierSettings}
        />
      )}
    </div>
  );
}