import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Dice6 } from "lucide-react";
import cucumberLogo from "@/assets/cucumber-logo.png";

interface EmptyStateProps {
  onNewGame: () => void;
}

export function EmptyState({ onNewGame }: EmptyStateProps) {
  return (
    <Card className="felt-card p-12 text-center max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <img 
          src={cucumberLogo} 
          alt="Cucumber Logo" 
          className="h-20 w-20 opacity-80"
        />
      </div>
      
      <h2 className="text-2xl font-bold mb-4 gold-accent">
        Welcome to Cucumber
      </h2>
      
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Your elegant scorekeeper for card games and competitions. 
        Track tallies and tokens with sophisticated style.
      </p>
      
      <div className="space-y-4">
        <Button 
          size="lg" 
          className="w-full elegant-glow"
          onClick={onNewGame}
        >
          <Plus className="h-5 w-5 mr-2" />
          Start New Game
        </Button>
        
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <Dice6 className="h-4 w-4 mr-2" />
          <span>All games are saved locally in your browser</span>
        </div>
      </div>
    </Card>
  );
}