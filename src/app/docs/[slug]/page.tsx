import { getDocById, getDocsContent } from "@/lib/docs";
import ReactMarkdown from 'react-markdown';

export async function generateStaticParams() {
    const docs = getDocsContent();
    return docs.map(doc => ({
        slug: doc.id,
    }));
}

export default function DocPage({ params }: { params: { slug: string } }) {
    const doc = getDocById(params.slug);

    if (!doc) {
        return <div>Document not found</div>;
    }

    return (
        <article className="prose lg:prose-xl">
            <ReactMarkdown>{doc.content}</ReactMarkdown>
        </article>
    );
} 