"use client";

import React, { useEffect, useRef } from 'react';

interface CodeBlockProps {
    code: string;
    language: string;
    className?: string;
}

export function CodeBlock({ code, language, className = '' }: CodeBlockProps) {
    const codeRef = useRef<HTMLElement>(null);

    useEffect(() => {
        // Dynamically import Prism only on the client side
        const loadPrism = async () => {
            // Import core first
            const Prism = (await import('prismjs')).default;

            // Then import languages
            await import('prismjs/components/prism-clike');
            await import('prismjs/components/prism-javascript');
            await import('prismjs/components/prism-typescript');
            await import('prismjs/components/prism-jsx');
            await import('prismjs/components/prism-tsx');
            await import('prismjs/components/prism-json');

            // Only import C++ if specifically needed
            if (language === 'cpp') {
                await import('prismjs/components/prism-c');
                await import('prismjs/components/prism-cpp');
            }

            // Then import plugins
            await import('prismjs/plugins/line-numbers/prism-line-numbers');
            await import('prismjs/plugins/toolbar/prism-toolbar');
            await import('prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard');

            // Finally highlight the code
            if (codeRef.current) {
                Prism.highlightElement(codeRef.current);
            }
        };

        loadPrism();
    }, [code, language]);

    return (
        <pre className={`${className} language-${language} line-numbers`} data-prismjs-copy="Copy code" data-prismjs-toolbar="true">
            <code ref={codeRef} className={`language-${language}`}>{code}</code>
        </pre>
    );
}

// This component is just to initialize Prism globally
export function PrismInitializer() {
    useEffect(() => {
        // Dynamic import ensures this only runs on client
        import('prismjs').then(module => {
            const Prism = module.default;
            Prism.highlightAll();
        });
    }, []);

    return null;
}