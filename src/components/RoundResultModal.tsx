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
    const isUSD = game.settings.currency === 'usd';

    if (winners.length === 1 && losers.length === 1) {
      // 1 vs 1
      const loser = losers[0];
      const tokenChange = isUSD ? 
        parseFloat((loser.exitValue / currentMultiplier).toFixed(2)) :
        loser.exitValue * currentMultiplier;
      result.push({ playerId: winners[0], change: tokenChange });
      result.push({ playerId: loser.playerId, change: -tokenChange });
    } else if (winners.length === 1 && losers.length === 2) {
      // 1 vs 2
      let totalGain = 0;
      losers.forEach(loser => {
        const tokenChange = isUSD ? 
          parseFloat((loser.exitValue / currentMultiplier).toFixed(2)) :
          loser.exitValue * currentMultiplier;
        totalGain += tokenChange;
        result.push({ playerId: loser.playerId, change: -tokenChange });
      });
      result.push({ playerId: winners[0], change: isUSD ? parseFloat(totalGain.toFixed(2)) : totalGain });
    } else if (winners.length === 2 && losers.length === 2) {
      // 2 vs 2 - pair off one-to-one
      losers.forEach((loser, index) => {
        const winnerId = winners[index] || winners[0];
        const tokenChange = isUSD ? 
          parseFloat((loser.exitValue / currentMultiplier).toFixed(2)) :
          loser.exitValue * currentMultiplier;
        result.push({ playerId: winnerId, change: tokenChange });
        result.push({ playerId: loser.playerId, change: -tokenChange });
      });
    } else {
      // Multiple winners - each winner gets full exit value from each loser
      losers.forEach(loser => {
        const tokenChange = isUSD ? 
          parseFloat((loser.exitValue / currentMultiplier).toFixed(2)) :
          loser.exitValue * currentMultiplier;
        const totalLoss = tokenChange * winners.length;
        result.push({ playerId: loser.playerId, change: -totalLoss });
        
        winners.forEach(winnerId => {
          result.push({ playerId: winnerId, change: tokenChange });
        });
      });
    }

    return result;
  }, [selectedWinners, selectedLosers, exitValues, currentMultiplier, game.settings.currency]);

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
    const minValue = game.settings.currency === 'usd' ? 0.01 : 1;
    setExitValues(prev => ({ ...prev, [playerId]: Math.max(minValue, value) }));
  };

  const canSubmit = selectedWinners.size > 0 && selectedLosers.size > 0 && 
    Array.from(selectedLosers).every(id => {
      const value = exitValues[id];
      return game.settings.currency === 'usd' ? value >= 0.01 : value > 0;
    });

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
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gold-accent text-center">
            Round {game.currentRound} Results
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Multiplier Info */}
          <Card className="felt-card p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-gold" />
                <span className="text-sm font-medium">
                  {game.settings.currency === 'usd' ? 'Current Divider' : 'Current Multiplier'}
                </span>
              </div>
              <Badge variant="default" className="bg-gold text-rich-black px-2 py-1">
                {game.settings.currency === 'usd' ? '÷' : '×'}{currentMultiplier}
              </Badge>
            </div>
          </Card>

          {/* Winner Selection */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-gold" />
              <Label className="text-sm font-medium gold-accent">Winner</Label>
            </div>
            <div className="space-y-1 max-w-xs mx-auto">
              {activePlayers.map(player => (
                <div key={player.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`winner-${player.id}`}
                    checked={selectedWinners.has(player.id)}
                    onCheckedChange={() => toggleWinner(player.id)}
                    disabled={selectedLosers.has(player.id)}
                  />
                  <Label htmlFor={`winner-${player.id}`} className="flex-1 cursor-pointer text-sm">
                    {player.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Loser Selection */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-4 w-4 text-destructive" />
              <Label className="text-sm font-medium gold-accent">Loser & Exit Values</Label>
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              {activePlayers.map(player => (
                <div 
                  key={player.id} 
                  className="flex items-center gap-2 p-2 rounded felt-card cursor-pointer"
                  onClick={() => toggleLoser(player.id)}
                >
                  <Checkbox
                    id={`loser-${player.id}`}
                    checked={selectedLosers.has(player.id)}
                    onCheckedChange={() => toggleLoser(player.id)}
                    disabled={selectedWinners.has(player.id)}
                  />
                  <Label htmlFor={`loser-${player.id}`} className="cursor-pointer flex-1 text-sm">
                    {player.name}
                  </Label>
                  {selectedLosers.has(player.id) && (
                    <Input
                      ref={(input) => {
                        if (input && selectedLosers.has(player.id) && !exitValues[player.id]) {
                          setTimeout(() => input.focus(), 0);
                        }
                      }}
                      type="number"
                      min={game.settings.currency === 'usd' ? "0.01" : "1"}
                      step={game.settings.currency === 'usd' ? "0.01" : "1"}
                      placeholder="Exit"
                      value={exitValues[player.id] || ''}
                      onChange={(e) => {
                        const value = game.settings.currency === 'usd' ? 
                          parseFloat(e.target.value) || 0 :
                          parseInt(e.target.value) || 0;
                        setExitValue(player.id, value);
                      }}
                      className="w-16 text-center text-xs"
                      onClick={(e) => e.stopPropagation()}
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
                <Label className="text-sm font-medium gold-accent mb-2 block text-center">Preview</Label>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {adjustments.map(adj => {
                    const player = activePlayers.find(p => p.id === adj.playerId);
                    const isPositive = adj.change > 0;
                    return (
                      <div key={adj.playerId} className="flex justify-between items-center py-1">
                        <span className="text-sm">{player?.name}</span>
                        <Badge 
                          variant={isPositive ? "default" : "destructive"}
                          className={`text-xs ${isPositive ? "bg-gold text-rich-black" : ""}`}
                        >
                          {isPositive ? '+' : ''}{game.settings.currency === 'usd' ? adj.change.toFixed(2) : adj.change} {game.settings.currency === 'usd' ? '$' : 'tokens'}
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
