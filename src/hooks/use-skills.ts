
import { useQuery } from '@tanstack/react-query';

export interface Skill {
    skill_id: number;
    name: {
        en: string;
        ja: string;
    };
    description: {
        ja: {
            effects: string[];
        };
        en: {
            effects: string[];
        };
    };
}

const SKILLS_JSON_URL = 'https://rsc.bravefrontierheroes.com/data/skills_v2.json';

export function useSkills() {
    return useQuery({
        queryKey: ['skills'],
        queryFn: async (): Promise<Skill[]> => {
            const response = await fetch(SKILLS_JSON_URL);
            if (!response.ok) throw new Error('Failed to fetch skills data');
            return response.json();
        },
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
    });
}

export function useBBDescription(bbName: string) {
    const { data: skills } = useSkills();

    if (!skills || !bbName) return null;

    // The BB name in metadata might have Japanese or English.
    // We try to match both.
    const skill = skills.find(s =>
        s.name.ja === bbName ||
        s.name.en === bbName ||
        bbName.includes(s.name.ja) ||
        bbName.includes(s.name.en)
    );

    return skill?.description.ja.effects.join(' / ') || null;
}
