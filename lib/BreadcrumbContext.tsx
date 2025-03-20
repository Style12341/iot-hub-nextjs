"use client";
// contexts/BreadcrumbContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Breadcrumb = {
    name: string;
    href: string;
};

type BreadcrumbContextType = {
    breadcrumbs: Breadcrumb[];
    page: string;
    setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
    setPage: (page: string) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export const BreadcrumbProvider = ({ children }: { children: ReactNode }) => {
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
    const [page, setPage] = useState<string>('');

    return (
        <BreadcrumbContext.Provider value={{ breadcrumbs, page, setBreadcrumbs, setPage }}>
            {children}
        </BreadcrumbContext.Provider>
    );
};

export const useBreadcrumbs = () => {
    const context = useContext(BreadcrumbContext);
    if (context === undefined) {
        throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider');
    }
    return context;
};