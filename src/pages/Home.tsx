import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/GameCard";
import { EmptyState } from "@/components/EmptyState";
import { getSavedGames, deleteGame, SavedGame } from "@/lib/gameStorage";
import { Plus, Settings, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import cucumberLogo from "@/assets/cucumber-logo.png";

export default function Home() {
  const [games, setGames] = useState<SavedGame[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = () => {
    const savedGames = getSavedGames();
    // Sort by last played, most recent first
    savedGames.sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime());
    setGames(savedGames);
  };

  const handleResumeGame = (gameId: string) => {
    toast({
      title: "Game Loading",
      description: "Resume functionality coming soon!",
    });
    console.log("Resume game:", gameId);
  };

  const handleDeleteGame = (gameId: string) => {
    try {
      deleteGame(gameId);
      loadGames();
      toast({
        title: "Game Deleted",
        description: "Game has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete game.",
        variant: "destructive",
      });
    }
  };

  const handleNewGame = () => {
    toast({
      title: "New Game",
      description: "Game setup coming soon!",
    });
    console.log("Start new game");
  };

  const filteredGames = games.filter(game => 
    game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.players.some(player => 
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen casino-gradient">
      {/* Header */}
      <header className="border-b border-border/20 bg-card/10 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={cucumberLogo} 
                alt="Cucumber" 
                className="h-10 w-10"
              />
              <div>
                <h1 className="text-2xl font-bold gold-accent">Cucumber</h1>
                <p className="text-sm text-muted-foreground">Elegant Scorekeeper</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                className="elegant-glow"
                onClick={handleNewGame}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Game
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {games.length === 0 ? (
          <EmptyState onNewGame={handleNewGame} />
        ) : (
          <>
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search games or players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-card/50 border-border/50 focus:border-primary"
                />
              </div>
            </div>

            {/* Games Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onResume={handleResumeGame}
                  onDelete={handleDeleteGame}
                />
              ))}
            </div>

            {/* No Results */}
            {filteredGames.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No games found matching "{searchTerm}"
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}