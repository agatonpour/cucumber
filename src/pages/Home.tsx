import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/GameCard";
import { EmptyState } from "@/components/EmptyState";
import { getSavedGames, deleteGame, SavedGame } from "@/lib/gameStorage";
import { Plus, Settings, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import cucumberLogo from "@/assets/cucumber-logo.png";

export default function Home() {
  const [games, setGames] = useState<SavedGame[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

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
    navigate(`/lobby/${gameId}`);
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
    navigate("/new");
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
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex flex-col items-center mb-6">
              <img 
                src={cucumberLogo} 
                alt="Cucumber" 
                className="h-20 w-20 rounded-lg mb-4"
              />
              <h1 className="text-4xl font-bold gold-accent">Cucumber</h1>
            </div>
            
            <Button 
              className="elegant-glow" 
              size="lg"
              onClick={handleNewGame}
            >
              <Plus className="h-5 w-5 mr-2" />
              New Game
            </Button>
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