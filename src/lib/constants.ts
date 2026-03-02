
export const METADATA_BASE_URL = 'https://core.bravefrontierheroes.com/metadata/units';
export const SKILLS_JSON_URL = 'https://rsc.bravefrontierheroes.com/data/skills_v2.json';
export const HERO_TYPES_JSON_URL = 'https://rsc.bravefrontierheroes.com/data/hero_types_v2.json';
export const BATTLE_RSC_BASE_URL = 'https://rsc.bravefrontierheroes.com/battle/duel';

export type UnitMetadata = {
    name: string;
    description: string;
    image: string;
    timestamp: number;
    attributes: {
        type_name: string;
        rarity: string;
        lv: number;
        hp: number;
        phy: number;
        int: number;
        agi: number;
        spr: number;
        def: number;
        ex_ascension_phase: number;
        ex_ascension_level: number;
        brave_burst: string;
        art_skill: string;
    };
};

export type HeroType = {
    id: number;
    name: string;
    element: number;
    rarity: number;
    // ... more fields if needed
};
