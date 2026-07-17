import {
  Search,
  Swords,
  ClipboardCheck,
  MessagesSquare,
  Gift,
  Calculator,
  Lightbulb,
  Palette,
  PenLine,
  Clapperboard,
  LayoutTemplate,
  Megaphone,
  TrendingUp,
  Globe,
  Wallet,
  Circle,
  type LucideProps,
} from "lucide-react";
import { STEP_META, DEFAULT_STEP_META } from "@/lib/pipeline/steps";

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  Search,
  Swords,
  ClipboardCheck,
  MessagesSquare,
  Gift,
  Calculator,
  Lightbulb,
  Palette,
  PenLine,
  Clapperboard,
  LayoutTemplate,
  Megaphone,
  TrendingUp,
  Globe,
  Wallet,
  Circle,
};

export function StepIcon({
  stepKey,
  ...props
}: { stepKey: string } & LucideProps) {
  const meta = STEP_META[stepKey] ?? DEFAULT_STEP_META;
  const Icon = ICONS[meta.icon] ?? Circle;
  return <Icon {...props} />;
}
