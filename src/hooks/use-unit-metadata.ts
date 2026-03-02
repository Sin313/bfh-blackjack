
import { useQuery } from '@tanstack/react-query';
import { UnitMetadata, METADATA_BASE_URL } from '@/lib/constants';

export const fetchUnitMetadata = async (heroId: string | number): Promise<UnitMetadata> => {
    const cleanId = String(heroId).replace('#', '');
    const proxyUrl = new URL(`${window.location.origin}/api/proxy`);
    proxyUrl.searchParams.append('path', `/metadata/units/${cleanId}`);
    proxyUrl.searchParams.append('base', 'https://core.bravefrontierheroes.com');

    const response = await fetch(proxyUrl.toString());
    if (!response.ok) {
        throw new Error('Failed to fetch unit metadata');
    }
    return response.json();
};

export function useUnitMetadata(heroId: string | number) {
    const cleanId = String(heroId).replace('#', '');

    return useQuery({
        queryKey: ['unitMetadata', cleanId],
        queryFn: () => fetchUnitMetadata(cleanId),
        enabled: !!cleanId,
    });
}
