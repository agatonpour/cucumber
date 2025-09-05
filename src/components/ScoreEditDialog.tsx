import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Player } from "@/lib/gameStorage";

interface ScoreEditDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (playerId: string, newScore: number) => void;
  currency: 'sek' | 'usd';
}

export default function ScoreEditDialog({ 
  player, 
  open, 
  onOpenChange, 
  onSave, 
  currency 
}: ScoreEditDialogProps) {
  const [score, setScore] = useState<string>("");

  const handleSave = () => {
    if (!player) return;
    
    const numericScore = currency === 'usd' ? 
      parseFloat(score) || 0 : 
      parseInt(score) || 0;
    
    onSave(player.id, numericScore);
    onOpenChange(false);
    setScore("");
  };

  const resetScore = () => {
    if (player) {
      setScore(player.tally.toString());
    }
  };

  // Reset score when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && player) {
      setScore(currency === 'usd' ? player.tally.toFixed(2) : player.tally.toString());
    }
    onOpenChange(newOpen);
  };

  if (!player) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="gold-accent text-center">
            Edit Score: {player.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="score">
              {currency === 'usd' ? 'Score ($)' : 'Score (tokens)'}
            </Label>
            <Input
              id="score"
              type="number"
              min={currency === 'usd' ? "0" : "0"}
              step={currency === 'usd' ? "0.01" : "1"}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="text-center text-lg"
              autoFocus
            />
          </div>

          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={resetScore}>
              Reset
            </Button>
            <Button 
              className="elegant-glow" 
              onClick={handleSave}
              disabled={!score}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}