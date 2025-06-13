import { getDocById, getDocsContent } from "@/lib/docs";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import GraphRenderer from '@/components/GraphRenderer';

export async function generateStaticParams() {
    const docs = getDocsContent();
    return docs.map(doc => ({
        slug: doc.id,
    }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const doc = getDocById(slug);

    if (!doc) {
        return <div>Document not found</div>;
    }

    return (
        <article className="prose lg:prose-xl max-w-none">
            <ReactMarkdown
                components={{
                    code(props) {
                        const { children, className } = props;
                        const match = /language-(\w+)/.exec(className || '');
                        const content = String(children).replace(/\n$/, '');
                        
                        // Check if this is a graph (contains arrow notation)
                        const isGraph = content.includes('-->') && (
                            match?.[1] === 'graph' || 
                            match?.[1] === 'mermaid' ||
                            /^[A-Z]\s*-->\s*[A-Z]/.test(content.trim())
                        );
                        
                        if (isGraph) {
                            return <GraphRenderer content={content} className="my-6" />;
                        }
                        
                        return match ? (
                            <SyntaxHighlighter
                                PreTag="div"
                                language={match[1]}
                                style={oneDark}
                                customStyle={{
                                    margin: '1.5rem 0',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    lineHeight: '1.5',
                                }}
                            >
                                {content}
                            </SyntaxHighlighter>
                        ) : (
                            <code className={`${className} bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm`}>
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {doc.content}
            </ReactMarkdown>
        </article>
    );
} 