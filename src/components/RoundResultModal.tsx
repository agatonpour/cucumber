import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Calculator } from "lucide-react";
import { SavedGame, Player } from "@/lib/gameStorage";

interface RoundResultModalProps {
  game: SavedGame;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (result: RoundResult) => void;
}

export interface RoundResult {
  winners: string[];
  losers: { playerId: string; exitValue: number }[];
  multiplier: number;
  adjustments: { playerId: string; change: number }[];
}

export default function RoundResultModal({ game, open, onOpenChange, onSubmit }: RoundResultModalProps) {
  const activePlayers = game.players.filter(p => p.active);
  const [selectedWinners, setSelectedWinners] = useState<Set<string>>(new Set());
  const [selectedLosers, setSelectedLosers] = useState<Set<string>>(new Set());
  const [exitValues, setExitValues] = useState<Record<string, number>>({});

  // Calculate current multiplier
  const currentMultiplier = useMemo(() => {
    if (game.settings.mode === 'simple') {
      return game.settings.multiplier;
    } else {
      const sequence = game.settings.multiplierSequence || [1];
      const index = (game.currentRound - 1) % sequence.length;
      return sequence[index];
    }
  }, [game.settings, game.currentRound]);

  // Calculate next multiplier for preview
  const nextMultiplier = useMemo(() => {
    if (game.settings.mode === 'simple') {
      return game.settings.multiplier;
    } else {
      const sequence = game.settings.multiplierSequence || [1];
      const index = game.currentRound % sequence.length;
      return sequence[index];
    }
  }, [game.settings, game.currentRound]);

  // Calculate token adjustments
  const adjustments = useMemo(() => {
    const winners = Array.from(selectedWinners);
    const losers = Array.from(selectedLosers).map(id => ({
      playerId: id,
      exitValue: exitValues[id] || 0
    }));

    if (winners.length === 0 || losers.length === 0) return [];

    const result: { playerId: string; change: number }[] = [];

    if (winners.length === 1 && losers.length === 1) {
      // 1 vs 1
      const loser = losers[0];
      const tokenChange = loser.exitValue * currentMultiplier;
      result.push({ playerId: winners[0], change: tokenChange });
      result.push({ playerId: loser.playerId, change: -tokenChange });
    } else if (winners.length === 1 && losers.length === 2) {
      // 1 vs 2
      let totalGain = 0;
      losers.forEach(loser => {
        const tokenChange = loser.exitValue * currentMultiplier;
        totalGain += tokenChange;
        result.push({ playerId: loser.playerId, change: -tokenChange });
      });
      result.push({ playerId: winners[0], change: totalGain });
    } else if (winners.length === 2 && losers.length === 2) {
      // 2 vs 2 - pair off one-to-one
      losers.forEach((loser, index) => {
        const winnerId = winners[index] || winners[0];
        const tokenChange = loser.exitValue * currentMultiplier;
        result.push({ playerId: winnerId, change: tokenChange });
        result.push({ playerId: loser.playerId, change: -tokenChange });
      });
    } else {
      // Other cases - split proportionally among winners
      const totalLoss = losers.reduce((sum, loser) => sum + (loser.exitValue * currentMultiplier), 0);
      const perWinner = Math.floor(totalLoss / winners.length);
      
      losers.forEach(loser => {
        const tokenChange = loser.exitValue * currentMultiplier;
        result.push({ playerId: loser.playerId, change: -tokenChange });
      });
      
      winners.forEach(winnerId => {
        result.push({ playerId: winnerId, change: perWinner });
      });
    }

    return result;
  }, [selectedWinners, selectedLosers, exitValues, currentMultiplier]);

  const toggleWinner = (playerId: string) => {
    const newWinners = new Set(selectedWinners);
    if (newWinners.has(playerId)) {
      newWinners.delete(playerId);
    } else {
      newWinners.add(playerId);
    }
    setSelectedWinners(newWinners);
    
    // Remove from losers if selected as winner
    if (newWinners.has(playerId)) {
      const newLosers = new Set(selectedLosers);
      newLosers.delete(playerId);
      setSelectedLosers(newLosers);
    }
  };

  const toggleLoser = (playerId: string) => {
    const newLosers = new Set(selectedLosers);
    if (newLosers.has(playerId)) {
      newLosers.delete(playerId);
      // Clear exit value when deselecting
      const newExitValues = { ...exitValues };
      delete newExitValues[playerId];
      setExitValues(newExitValues);
    } else {
      newLosers.add(playerId);
    }
    setSelectedLosers(newLosers);
    
    // Remove from winners if selected as loser
    if (newLosers.has(playerId)) {
      const newWinners = new Set(selectedWinners);
      newWinners.delete(playerId);
      setSelectedWinners(newWinners);
    }
  };

  const setExitValue = (playerId: string, value: number) => {
    setExitValues(prev => ({ ...prev, [playerId]: Math.max(0, value) }));
  };

  const canSubmit = selectedWinners.size > 0 && selectedLosers.size > 0 && 
    Array.from(selectedLosers).every(id => exitValues[id] > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;

    const result: RoundResult = {
      winners: Array.from(selectedWinners),
      losers: Array.from(selectedLosers).map(id => ({
        playerId: id,
        exitValue: exitValues[id]
      })),
      multiplier: currentMultiplier,
      adjustments
    };

    onSubmit(result);
    
    // Reset form
    setSelectedWinners(new Set());
    setSelectedLosers(new Set());
    setExitValues({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gold-accent text-center">
            {game.currentRound} Rounds Result
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Multiplier Info */}
          <Card className="felt-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-gold" />
                <span className="font-medium">Current Multiplier</span>
              </div>
              <Badge variant="default" className="bg-gold text-rich-black text-lg px-3 py-1">
                ×{currentMultiplier}
              </Badge>
            </div>
            {game.settings.mode === 'advanced' && (
              <p className="text-sm text-muted-foreground mt-2">
                Next round: ×{nextMultiplier}
              </p>
            )}
          </Card>

          {/* Winner Selection */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-gold" />
              <Label className="text-base font-medium gold-accent">Winner</Label>
            </div>
            <div className="space-y-2 max-w-xs mx-auto">
              {activePlayers.map(player => (
                <div key={player.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`winner-${player.id}`}
                    checked={selectedWinners.has(player.id)}
                    onCheckedChange={() => toggleWinner(player.id)}
                    disabled={selectedLosers.has(player.id)}
                  />
                  <Label htmlFor={`winner-${player.id}`} className="flex-1 cursor-pointer">
                    {player.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Loser Selection */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Target className="h-5 w-5 text-destructive" />
              <Label className="text-base font-medium gold-accent">Loser & Exit Values</Label>
            </div>
            <div className="space-y-2 max-w-xs mx-auto">
              {activePlayers.map(player => (
                <div key={player.id} className="flex items-center gap-2 p-2 rounded felt-card">
                  <Checkbox
                    id={`loser-${player.id}`}
                    checked={selectedLosers.has(player.id)}
                    onCheckedChange={() => toggleLoser(player.id)}
                    disabled={selectedWinners.has(player.id)}
                  />
                  <Label htmlFor={`loser-${player.id}`} className="cursor-pointer flex-1">
                    {player.name}
                  </Label>
                  {selectedLosers.has(player.id) && (
                    <Input
                      type="number"
                      min="1"
                      placeholder="Exit"
                      value={exitValues[player.id] || ''}
                      onChange={(e) => setExitValue(player.id, parseInt(e.target.value) || 0)}
                      className="w-16 text-center"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {adjustments.length > 0 && (
            <>
              <Separator />
              <div>
                <Label className="text-base font-medium gold-accent mb-3 block text-center">Token Adjustments Preview</Label>
                <div className="space-y-1">
                  {adjustments.map(adj => {
                    const player = activePlayers.find(p => p.id === adj.playerId);
                    const isPositive = adj.change > 0;
                    return (
                      <div key={adj.playerId} className="flex justify-between items-center py-1">
                        <span>{player?.name}</span>
                        <Badge 
                          variant={isPositive ? "default" : "destructive"}
                          className={isPositive ? "bg-gold text-rich-black" : ""}
                        >
                          {isPositive ? '+' : ''}{adj.change} tokens
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              className="elegant-glow" 
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              Apply Results
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
