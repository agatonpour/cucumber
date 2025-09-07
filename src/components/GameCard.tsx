import { SavedGame } from "@/lib/gameStorage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Users, Calendar, Trophy, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface GameCardProps {
  game: SavedGame;
  onResume: (gameId: string) => void;
  onDelete: (gameId: string) => void;
}

export function GameCard({ game, onResume, onDelete }: GameCardProps) {
  const activePlayers = game.players.filter(p => p.active);
  const topPlayer = game.players.reduce((top, player) => 
    player.tally > (top?.tally || 0) ? player : top
  , game.players[0]);

  return (
    <Card className="felt-card p-6 cursor-pointer group" onClick={() => onResume(game.id)}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
            {game.name}
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{activePlayers.length} players</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(game.lastPlayed, 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground mb-1">{game.currentRound} Rounds</div>
          {topPlayer && (
            <div className="flex items-center gap-1 gold-accent text-sm">
              <Trophy className="h-4 w-4" />
              <span>{topPlayer.name}: {game.settings.currency === 'usd' ? topPlayer.tally.toFixed(2) : topPlayer.tally}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex gap-2 text-xs">
          {activePlayers.slice(0, 3).map((player) => (
            <span 
              key={player.id}
              className="px-2 py-1 rounded-full bg-secondary/20 text-secondary-foreground"
            >
              {player.name}: {game.settings.currency === 'usd' ? player.tally.toFixed(2) : player.tally}
            </span>
          ))}
          {activePlayers.length > 3 && (
            <span className="px-2 py-1 rounded-full bg-muted/20 text-muted-foreground">
              +{activePlayers.length - 3} more
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(game.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="elegant-glow"
            onClick={(e) => {
              e.stopPropagation();
              onResume(game.id);
            }}
          >
            <Play className="h-4 w-4 mr-1" />
            Resume
          </Button>
        </div>
      </div>
    </Card>
  );
}