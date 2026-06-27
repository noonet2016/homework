export type RoomTheme = { chip: string; bar: string };

export const ROOM_THEMES: RoomTheme[] = [
  {
    chip: "bg-gradient-to-br from-[#F97316] to-[#EA580C]", // Orange family
    bar: "bg-gradient-to-r from-[#F97316] to-[#EA580C]",
  },
  {
    chip: "bg-gradient-to-br from-[#10B981] to-[#047857]", // Green family
    bar: "bg-gradient-to-r from-[#10B981] to-[#047857]",
  },
  {
    chip: "bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED]", // Violet family
    bar: "bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED]",
  },
  {
    chip: "bg-gradient-to-br from-[#F59E0B] to-[#D97706]", // Amber family
    bar: "bg-gradient-to-r from-[#F59E0B] to-[#D97706]",
  },
  {
    chip: "bg-gradient-to-br from-[#EC4899] to-[#DB2777]", // Rose family
    bar: "bg-gradient-to-r from-[#EC4899] to-[#DB2777]",
  },
  {
    chip: "bg-gradient-to-br from-[#06B6D4] to-[#0891B2]", // Cyan family
    bar: "bg-gradient-to-r from-[#06B6D4] to-[#0891B2]",
  },
  {
    chip: "bg-gradient-to-br from-[#20B2AA] to-[#008B8B]", // Teal family
    bar: "bg-gradient-to-r from-[#20B2AA] to-[#008B8B]",
  },
  {
    chip: "bg-gradient-to-br from-[#60A5FA] to-[#3B82F6]", // Blue family
    bar: "bg-gradient-to-r from-[#60A5FA] to-[#3B82F6]",
  },
];

export function themeFor(index: number): RoomTheme {
  return ROOM_THEMES[((index % ROOM_THEMES.length) + ROOM_THEMES.length) % ROOM_THEMES.length];
}
