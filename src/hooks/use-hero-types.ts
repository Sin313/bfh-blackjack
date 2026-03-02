
import { useQuery } from '@tanstack/react-query';
import { HERO_TYPES_JSON_URL } from '@/lib/constants';

export interface HeroType {
    hero_type: number;
    name: {
        en: string;
        ja: string;
    };
    rarity: number;
    attribute: number;
    // ... other fields as needed
}

export function useHeroTypes() {
    return useQuery({
        queryKey: ['heroTypes'],
        queryFn: async (): Promise<HeroType[]> => {
            const response = await fetch(HERO_TYPES_JSON_URL);
            if (!response.ok) throw new Error('Failed to fetch hero types');
            return response.json();
        },
        staleTime: 24 * 60 * 60 * 1000,
    });
}

export function useUnitNames(typeName: string) {
    const { data: heroTypes } = useHeroTypes();

    if (!heroTypes || !typeName) return { ja: typeName, en: '' };

    // Attempt to find the hero type by matching the name
    const hero = heroTypes.find(h => h.name.ja === typeName || h.name.en === typeName);

    if (!hero) return { ja: typeName, en: '' };

    return {
        ja: hero.name.ja,
        en: hero.name.en
    };
}
