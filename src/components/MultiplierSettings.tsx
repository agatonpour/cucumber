import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Calculator, Plus, X } from "lucide-react";

interface MultiplierSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: {
    mode: 'simple' | 'advanced';
    multiplier: number;
    multiplierSequence?: number[];
  };
  onSave: (settings: {
    mode: 'simple' | 'advanced';
    multiplier: number;
    multiplierSequence?: number[];
  }) => void;
}

export default function MultiplierSettings({ open, onOpenChange, currentSettings, onSave }: MultiplierSettingsProps) {
  const [mode, setMode] = useState<'simple' | 'advanced'>(currentSettings.mode);
  const [simpleMultiplier, setSimpleMultiplier] = useState(currentSettings.multiplier);
  const [sequence, setSequence] = useState<number[]>(currentSettings.multiplierSequence || [2, 5]);
  const [newValue, setNewValue] = useState("");

  const addToSequence = () => {
    const value = parseInt(newValue);
    if (value > 0) {
      setSequence([...sequence, value]);
      setNewValue("");
    }
  };

  const removeFromSequence = (index: number) => {
    setSequence(sequence.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const settings = {
      mode,
      multiplier: simpleMultiplier,
      multiplierSequence: mode === 'advanced' ? sequence : undefined
    };
    onSave(settings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="gold-accent flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Multiplier Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'simple' | 'advanced')}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="simple" id="simple" />
                <Label htmlFor="simple" className="font-medium">Simple Mode</Label>
              </div>
              
              {mode === 'simple' && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="simple-multiplier" className="text-sm">Fixed Multiplier</Label>
                  <Input
                    id="simple-multiplier"
                    type="number"
                    min="1"
                    value={simpleMultiplier}
                    onChange={(e) => setSimpleMultiplier(parseInt(e.target.value) || 1)}
                    className="w-32"
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="advanced" id="advanced" />
                <Label htmlFor="advanced" className="font-medium">Advanced Mode</Label>
              </div>
              
              {mode === 'advanced' && (
                <div className="ml-6 space-y-4">
                  <div>
                    <Label className="text-sm">Multiplier Sequence</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {sequence.map((value, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          ×{value}
                          <button
                            type="button"
                            onClick={() => removeFromSequence(index)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Add value"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addToSequence()}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addToSequence}
                      disabled={!newValue || parseInt(newValue) <= 0}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Preview: {sequence.join(' → ')} → {sequence[0] || 1} (cycles)
                  </p>
                </div>
              )}
            </div>
          </RadioGroup>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            className="elegant-glow"
            onClick={handleSave}
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}