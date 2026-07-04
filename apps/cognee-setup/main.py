import cognee
import asyncio



async def push_repo_to_cogne(repo_id: str, content: str):
    print(content)
    print(repo_id)
    result = await cognee.remember(
        content,
        dataset_name=f"repo_{repo_id}",
        self_improvment=True,
    )
    return result

async def ask_cognee(repo_id: str, question: str):
    results =  await cognree.recall(
        query_text=question,
        datasets=[f"repo_{repo_id}"],
        top_k=5
    )
    return result


if __name__ == '__main__':
    asyncio.run(main())
