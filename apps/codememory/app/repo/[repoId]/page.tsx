import { RepoMain } from "@/components/customs/Repo-Card";
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

    return <RepoMain repo={content} />
}
