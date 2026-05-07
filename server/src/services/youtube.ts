import { prismaClient } from "../lib/db";
import { contextMiddleware } from "./user";

type Platform = "youtube" | "twitter";

export class YoutubeService {
  private static async getContentOfSameParent(
    context: any,
    query: string,
    parentNewsId: string,
    limit: number,
    offset: number,
    platform: Platform,
  ) {
    console.log(`fetching ${platform} content`, {
      query,
      parentNewsId,
      limit,
      offset,
    });

    let userId: string | null = null;

    try {
      const { id } = contextMiddleware(context);
      userId = id;
    } catch {
      console.log(`fetching ${platform} content without login`);
    }

    const trimmedQuery = query?.trim();

    const initialNews = await prismaClient.miniNews.findMany({
      where: {
        newsId: parentNewsId,

        [platform]: true,

        ...(trimmedQuery
          ? {
              OR: [
                {
                  title: {
                    contains: trimmedQuery,
                    mode: "insensitive",
                  },
                },
                {
                  content: {
                    contains: trimmedQuery,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },

      orderBy: {
        pubDate: "desc",
      },
      skip: offset,
      take: limit,
    });

    if (!initialNews) {
      throw new Error(`Error fetching ${platform} news`);
    }

    if (!userId) {
      return initialNews.map((news) => ({
        ...news,
        isBookmarked: false,
      }));
    }

    const bookmarks = await prismaClient.bookmark.findMany({
      where: {
        userId,

        miniNewsId: {
          in: initialNews.map((news) => news.id),
        },
      },

      select: {
        miniNewsId: true,
      },
    });

    const bookmarkedSet = new Set(
      bookmarks.map((bookmark) => bookmark.miniNewsId),
    );

    return initialNews.map((news) => ({
      ...news,
      isBookmarked: bookmarkedSet.has(news.id),
    }));
  }

  public static async getYtOfSameParent(
    context: any,
    query: string,
    parentNewsId: string,
    limit: number,
    offset: number,
  ) {
    return this.getContentOfSameParent(
      context,
      query,
      parentNewsId,
      limit,
      offset,
      "youtube",
    );
  }

  public static async getXOfSameParent(
    context: any,
    query: string,
    parentNewsId: string,
    limit: number,
    offset: number,
  ) {
    return this.getContentOfSameParent(
      context,
      query,
      parentNewsId,
      limit,
      offset,
      "twitter",
    );
  }
}
