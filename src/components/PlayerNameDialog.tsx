import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PlayerNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string) => void;
  initialName?: string;
  title?: string;
}

export default function PlayerNameDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  initialName = "", 
  title = "Add New Player" 
}: PlayerNameDialogProps) {
  const [name, setName] = useState(initialName);

  const handleSubmit = () => {
    if (name.trim()) {
      onConfirm(name.trim());
      setName(initialName);
      onOpenChange(false);
    }
  };

  // Update name when initialName changes
  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="gold-accent">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="player-name" className="text-sm font-medium">
              Player Name
            </Label>
            <Input
              id="player-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter player name..."
              className="mt-1"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            className="elegant-glow"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            {initialName ? "Rename" : "Add Player"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}