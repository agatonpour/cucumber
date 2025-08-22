import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X, Users } from "lucide-react";
import { createNewGame, saveGame } from "@/lib/gameStorage";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Player {
  name: string;
  active: boolean;
}

export default function NewGame() {
  const [gameName, setGameName] = useState("");
  const [players, setPlayers] = useState<Player[]>([
    { name: "", active: true },
    { name: "", active: true },
    { name: "", active: true }
  ]);
  const [multiplierMode, setMultiplierMode] = useState<"simple" | "advanced">("simple");
  const [simpleMultiplier, setSimpleMultiplier] = useState(1);
  const [advancedSequence, setAdvancedSequence] = useState("2,5,2,5");
  const [gameMode, setGameMode] = useState<"social" | "arena">("social");
  const { toast } = useToast();
  const navigate = useNavigate();

  const addPlayer = () => {
    setPlayers([...players, { name: "", active: false }]);
  };

  const removePlayer = (index: number) => {
    if (players.length > 3) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const updatePlayer = (index: number, name: string) => {
    const updated = [...players];
    updated[index].name = name;
    setPlayers(updated);
  };

  const togglePlayerActive = (index: number) => {
    const updated = [...players];
    const activePlayers = updated.filter(p => p.active).length;
    
    if (!updated[index].active && activePlayers >= 4) {
      toast({
        title: "Maximum Active Players",
        description: "Only 4 players can be active for a round.",
        variant: "destructive"
      });
      return;
    }
    
    if (updated[index].active && activePlayers <= 3) {
      toast({
        title: "Minimum Active Players",
        description: "At least 3 players must be active.",
        variant: "destructive"
      });
      return;
    }

    updated[index].active = !updated[index].active;
    setPlayers(updated);
  };

  const getSequencePreview = () => {
    if (multiplierMode === "simple") return [simpleMultiplier];
    
    try {
      const sequence = advancedSequence.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
      return sequence.length > 0 ? sequence : [1];
    } catch {
      return [1];
    }
  };

  const generateGameName = () => {
    const playerNames = players.filter(p => p.name.trim()).map(p => p.name.trim());
    return playerNames.length > 0 ? playerNames.join(", ") : "New Game";
  };

  const handleStartGame = () => {
    const validPlayers = players.filter(p => p.name.trim());
    const activePlayers = validPlayers.filter(p => p.active);

    if (validPlayers.length < 3) {
      toast({
        title: "Not Enough Players",
        description: "You need at least 3 players to start a game.",
        variant: "destructive"
      });
      return;
    }

    if (activePlayers.length < 3) {
      toast({
        title: "Not Enough Active Players",
        description: "You need at least 3 active players for a round.",
        variant: "destructive"
      });
      return;
    }

    const finalGameName = gameName.trim() || generateGameName();
    const playerNames = validPlayers.map(p => p.name.trim());
    
    const newGame = createNewGame(finalGameName, playerNames);
    
    // Set player active states
    newGame.players.forEach((player, index) => {
      if (index < validPlayers.length) {
        player.active = validPlayers[index].active;
      }
    });

    // Set multiplier settings
    newGame.settings.gameMode = gameMode;
    if (multiplierMode === "simple") {
      newGame.settings.multiplier = simpleMultiplier;
      newGame.settings.mode = 'simple';
    } else {
      newGame.settings.mode = 'advanced';
      newGame.settings.multiplierSequence = getSequencePreview();
    }

    try {
      saveGame(newGame);
      toast({
        title: "Game Created",
        description: `${finalGameName} is ready to play!`
      });
      
      // Navigate to game lobby
      navigate(`/lobby/${newGame.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create game. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen casino-gradient">
      <header className="border-b border-border/20 bg-card/10 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold gold-accent">New Game Setup</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="felt-card p-8">
            <div className="space-y-8">
              {/* Game Name */}
              <div className="space-y-2">
                <Label htmlFor="gameName" className="text-lg font-medium">Game Name</Label>
                <Input
                  id="gameName"
                  placeholder={generateGameName()}
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  className="bg-card/50 border-border/50 focus:border-primary"
                />
                <p className="text-sm text-muted-foreground">
                  Leave blank to use player names
                </p>
              </div>

              {/* Players */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-medium">Players</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={addPlayer}
                    disabled={players.length >= 8}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Player
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {players.map((player, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder={`Player ${index + 1}`}
                          value={player.name}
                          onChange={(e) => updatePlayer(index, e.target.value)}
                          className="bg-card/50 border-border/50 focus:border-primary"
                        />
                      </div>
                      <Badge 
                        variant={player.active ? "default" : "secondary"}
                        className="cursor-pointer min-w-[60px] justify-center"
                        onClick={() => togglePlayerActive(index)}
                      >
                        {player.active ? "Active" : "Bench"}
                      </Badge>
                      {players.length > 3 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePlayer(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {players.filter(p => p.active).length} active players 
                    (3-4 required for rounds)
                  </span>
                </div>
              </div>

              {/* Multiplier Setup */}
              <div className="space-y-4">
                <Label className="text-lg font-medium">Token Multiplier</Label>
                <Tabs value={multiplierMode} onValueChange={(v) => setMultiplierMode(v as "simple" | "advanced")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="simple">Simple</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="simple" className="space-y-3 mt-4">
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={simpleMultiplier}
                      onChange={(e) => setSimpleMultiplier(parseInt(e.target.value) || 1)}
                      className="bg-card/50 border-border/50 focus:border-primary"
                    />
                    <p className="text-sm text-muted-foreground">
                      Fixed multiplier for all rounds
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="space-y-3 mt-4">
                    <Input
                      placeholder="2,5,2,5"
                      value={advancedSequence}
                      onChange={(e) => setAdvancedSequence(e.target.value)}
                      className="bg-card/50 border-border/50 focus:border-primary"
                    />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Comma-separated sequence that cycles each round
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Preview:</span>
                        <div className="flex gap-1">
                          {getSequencePreview().slice(0, 6).map((val, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {val}
                            </Badge>
                          ))}
                          {getSequencePreview().length > 6 && (
                            <span className="text-xs text-muted-foreground">...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Game Mode */}
              <div className="space-y-4">
                <Label className="text-lg font-medium">Game Mode</Label>
                <Tabs value={gameMode} onValueChange={(v) => setGameMode(v as "social" | "arena")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="social">Social</TabsTrigger>
                    <TabsTrigger value="arena">Arena</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Start Game */}
              <Button 
                size="lg" 
                className="w-full elegant-glow"
                onClick={handleStartGame}
              >
                Start Game
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}