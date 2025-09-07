import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Dice6 } from "lucide-react";
import cucumberLogo from "@/assets/cucumber-logo.png";

import { useNavigate } from "react-router-dom";

interface EmptyStateProps {
  onNewGame: () => void;
}

export function EmptyState({ onNewGame }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-lg text-muted-foreground">
        The #1 Game of All Time
      </p>
    </div>
  );
}