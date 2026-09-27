import {
  TrainFront,
  Snowflake,
  Leaf,
  Mountain,
  Waves,
  Landmark,
  Route,
  BookOpen,
  ChartNoAxesCombined,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  Settings2,
  Clock3,
  Sun,
  Moon,
  Sunrise,
  MoveUp,
  MoveDown,
  Flag,
  Coffee,
  CircleHelp,
  Expand,
  Minus,
  CheckCheck,
  Sprout,
  Circle,
  MapPin,
} from "lucide-react";
const icons = {
  snowflake: Snowflake,
  train: TrainFront,
  leaf: Leaf,
  mountain: Mountain,
  waves: Waves,
  village: Landmark,
  route: Route,
  book: BookOpen,
  chart: ChartNoAxesCombined,
  plus: Plus,
  arrow: ArrowUpRight,
  right: ArrowRight,
  play: Play,
  pause: Pause,
  reset: RotateCcw,
  sound: Volume2,
  mute: VolumeX,
  check: Check,
  close: X,
  chevron: ChevronRight,
  down: ChevronDown,
  edit: Pencil,
  delete: Trash2,
  settings: Settings2,
  clock: Clock3,
  sun: Sun,
  moon: Moon,
  sunrise: Sunrise,
  up: MoveUp,
  moveDown: MoveDown,
  flag: Flag,
  coffee: Coffee,
  help: CircleHelp,
  expand: Expand,
  minus: Minus,
  checks: CheckCheck,
  sprout: Sprout,
  circle: Circle,
  pin: MapPin,
};
export type IconName = keyof typeof icons;
export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const Component = icons[name];
  return (
    <Component
      size={size}
      strokeWidth={1.7}
      className={className}
      aria-hidden="true"
    />
  );
}
export const biomeIcon = {
  forest: "leaf",
  mountains: "mountain",
  coast: "waves",
  village: "village",
  tundra: "snowflake",
} as const;
