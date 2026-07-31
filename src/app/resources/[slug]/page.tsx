import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ResourceArticle } from "@/components/ResourceArticle";
import {
  getResourceBySlug,
  resourcePages,
} from "@/data/resources";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { breadcrumbSchema } from "@/lib/seo/structuredData";

type ResourceDetailProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return resourcePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: ResourceDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getResourceBySlug(slug);
  if (!page) {
    return { title: "Resource not found", robots: { index: false } };
  }
  return pageMetadata({
    title: page.title,
    description: page.description,
    path: `/resources/${page.slug}`,
  });
}

export default async function ResourceDetailPage({
  params,
}: ResourceDetailProps) {
  const { slug } = await params;
  const page = getResourceBySlug(slug);
  if (!page) {
    notFound();
  }

  return (
    <div>
      <JsonLd
        data={breadcrumbSchema(getSiteUrl(), [
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
          { name: page.title, path: `/resources/${page.slug}` },
        ])}
      />
      <ResourceArticle page={page} />
    </div>
  );
}
