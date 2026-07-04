import { RepoTabs } from "@/components/customs/repo-tabs";
import { FetchRepoContent } from "@/lib/fetch-projects";


export default async function RepoContent({
  params,
}: {
  params: Promise<{ repoId: string }>
}) {
    const { repoId } = await params
    const content = await FetchRepoContent(repoId)

    if (!content) {
      return null
    }

    return <RepoTabs repo={content} />
}
