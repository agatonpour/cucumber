import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Dice6 } from "lucide-react";
import cucumberLogo from "@/assets/cucumber-logo.png";

import { useNavigate } from "react-router-dom";

interface EmptyStateProps {
  onNewGame: () => void;
}

export function EmptyState({ onNewGame }: EmptyStateProps) {
  const navigate = useNavigate();

  const handleNewGame = () => {
    navigate("/new-game");
  };
  return (
    <Card className="felt-card p-12 text-center max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <img 
          src={cucumberLogo} 
          alt="Cucumber Logo" 
          className="h-20 w-20 opacity-80 rounded-lg"
        />
      </div>
      
      <h2 className="text-3xl font-bold mb-6 gold-accent">
        Cucumber
      </h2>
      
      <Button 
        size="lg" 
        className="w-full elegant-glow mb-6"
        onClick={handleNewGame}
      >
        <Plus className="h-5 w-5 mr-2" />
        New Game
      </Button>
      
      <p className="text-lg text-muted-foreground">
        The #1 game of all time
      </p>
    </Card>
  );
}