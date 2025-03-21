import { useEffect, useRef } from 'react';
import { useBreadcrumbs } from '@/lib/BreadcrumbContext';

type BreadcrumbLink = {
    name: string;
    href: string;
};

export function useBreadcrumbsEffect(
    breadcrumbs: BreadcrumbLink[],
    page: string
) {
    const { setBreadcrumbs, setPage } = useBreadcrumbs();

    // Store the latest props in refs to access them inside the effect
    const breadcrumbsRef = useRef(breadcrumbs);
    const pageRef = useRef(page);

    // Update refs when props change
    breadcrumbsRef.current = breadcrumbs;
    pageRef.current = page;

    useEffect(() => {
        // Use the ref values which will always be current
        setBreadcrumbs(breadcrumbsRef.current);
        setPage(pageRef.current);

        // Reset breadcrumbs when component unmounts
        return () => {
            setBreadcrumbs([]);
            setPage('');
        };
    }, []); // Empty dependency array = run once on mount
}