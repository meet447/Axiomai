
import { LucideIcon, Globe, GraduationCap, Youtube, MessageCircle, FileText } from "lucide-react";

export type FocusMode = 'web' | 'academic' | 'writing' | 'video' | 'social';

export interface FocusModeConfig {
    id: FocusMode;
    name: string;
    description: string;
    icon: LucideIcon;
}

export const FOCUS_MODES: FocusModeConfig[] = [
    {
        id: 'web',
        name: 'Web',
        description: 'Search the entire internet',
        icon: Globe,
    },
    {
        id: 'academic',
        name: 'Academic',
        description: 'Search published papers',
        icon: GraduationCap,
    },
    {
        id: 'video',
        name: 'Video',
        description: 'Search YouTube transcripts',
        icon: Youtube,
    },
    {
        id: 'social',
        name: 'Social',
        description: 'Search discussions (Reddit, Twitter)',
        icon: MessageCircle,
    },
    {
        id: 'writing',
        name: 'Writing',
        description: 'Generate text without searching',
        icon: FileText,
    },
];
