import { prismaClient } from "../lib/db";
import { contextMiddleware } from "./user";

export class NewsService {
  public static async getAllNews(
    context: any,
    query: string,
    limit: number,
    offset: number,
  ) {
    let id = null;
    try {
      const { id: userid } = contextMiddleware(context);
      id = userid;
    } catch (error) {
      console.log("fetching news without logging in!");
    }

    let initialNews = null;
    if (query?.trim() === "") {
      console.log("offset:", offset, "limit:", limit);

      initialNews = await prismaClient.miniNews.findMany({
        where: {
          youtube: false,
          twitter: false,
        },
        orderBy: {
          pubDate: "desc",
        },
        skip: offset,
        take: limit,
      });

      console.log("initialNews length:", initialNews.length);
    } else {
      initialNews = await prismaClient.miniNews.findMany({
        where: {
          youtube: false,
          twitter: false,
          OR: [
            {
              title: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              category: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
        orderBy: {
          pubDate: "desc",
        },
        skip: offset,
        take: limit,
      });
    }

    if (!initialNews) throw new Error("error in fetching news!");
    if (id) {
      const userBookmarkedData = await prismaClient.bookmark.findMany({
        where: { userId: id },
      });
      initialNews = (initialNews as { id: string }[]).map(
        (news: { id: string }) => {
          const isBookmarked = userBookmarkedData.some(
            (bookmark: { miniNewsId: string }) =>
              bookmark.miniNewsId === news.id,
          );
          return {
            ...news,
            isBookmarked,
          };
        },
      );
    }

    return initialNews;
  }

  public static async getSpecificNews(
    context: any,
    timestampInSeconds: String,
    category: string,
    limit: number,
    offset: number,
  ) {
    const date = new Date(+timestampInSeconds);
    let id = null;
    try {
      const { id: userid } = contextMiddleware(context);
      id = userid;
    } catch (error) {
      console.log("fetching news without logging in!");
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const news = await prismaClient.miniNews.findMany({
      where: {
        youtube: false,
        twitter: false,
        pubDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        category,
      },
      orderBy: {
        pubDate: "desc",
      },
      skip: offset,
      take: limit,
    });

    if (id) {
      const userBookmarkedData = await prismaClient.bookmark.findMany({
        where: { userId: id },
      });
      const finalNews = (news as { id: string }[]).map(
        (news: { id: string }) => {
          const isBookmarked = userBookmarkedData.some(
            (bookmark: { miniNewsId: string }) =>
              bookmark.miniNewsId === news.id,
          );
          return {
            ...news,
            isBookmarked,
          };
        },
      );
      return finalNews;
    } else return news;
  }

  public static async getNewsByCategory(
    context: any,
    query: string,
    category: string,
    limit: number,
    offset: number,
  ) {
    let initialNews = null;
    let id = null;
    try {
      const { id: userid } = contextMiddleware(context);
      id = userid;
    } catch (error) {
      console.log("fetching news without logging in!");
    }

    if (query?.trim() === "") {
      initialNews = await prismaClient.miniNews.findMany({
        orderBy: {
          pubDate: "desc",
        },
        where: {
          youtube: false,
          twitter: false,
          category,
        },
        skip: offset,
        take: limit,
      });
    } else {
      initialNews = await prismaClient.miniNews.findMany({
        where: {
          youtube: false,
          twitter: false,
          category,
          OR: [
            {
              title: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
        orderBy: {
          pubDate: "desc",
        },
        skip: offset,
        take: limit,
      });
    }

    if (!initialNews) throw new Error("error in fetching news!");

    if (id) {
      const userBookmarkedData = await prismaClient.bookmark.findMany({
        where: { userId: id },
      });
      initialNews = (initialNews as { id: string }[]).map(
        (news: { id: string }) => {
          const isBookmarked = userBookmarkedData.some(
            (bookmark: { miniNewsId: string }) =>
              bookmark.miniNewsId === news.id,
          );
          return {
            ...news,
            isBookmarked,
          };
        },
      );
    }
    return initialNews;
  }

  public static async getNewsOfSameParent(
    context: any,
    query: string,
    parentNewsId: string,
    limit: number,
    offset: number,
  ) {
    let initialNews = null;
    let id = null;
    try {
      const { id: userid } = contextMiddleware(context);
      id = userid;
    } catch (error) {
      console.log("fetching news without logging in!");
    }

    if (query?.trim() === "") {
      initialNews = await prismaClient.miniNews.findMany({
        orderBy: {
          pubDate: "desc",
        },
        where: {
          youtube: false,
          twitter: false,
          newsId: parentNewsId,
        },
        skip: offset,
        take: limit,
      });
    } else {
      initialNews = await prismaClient.miniNews.findMany({
        where: {
          youtube: false,
          twitter: false,
          newsId: parentNewsId,
          OR: [
            {
              title: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
        orderBy: {
          pubDate: "desc",
        },
        skip: offset,
        take: limit,
      });
    }

    if (!initialNews) throw new Error("error in fetching news!");
    if (id) {
      const userBookmarkedData = await prismaClient.bookmark.findMany({
        where: { userId: id },
      });
      initialNews = (initialNews as { id: string }[]).map(
        (news: { id: string }) => {
          const isBookmarked = userBookmarkedData.some(
            (bookmark: { miniNewsId: string }) =>
              bookmark.miniNewsId === news.id,
          );
          return {
            ...news,
            isBookmarked,
          };
        },
      );
    }
    return initialNews;
  }

  public static async getNewsById(context: any, miniNewsId: string) {
    let id = null;
    try {
      const { id: userid } = contextMiddleware(context);
      id = userid;
    } catch (error) {
      console.log("fetching news without logging in!");
    }

    const news = await prismaClient.miniNews.findUnique({
      where: {
        id: miniNewsId,
        youtube: false,
        twitter: false,
      },
    });

    if (!news) throw new Error("error in fetching news!");
    if (id) {
      const userBookmarkedData = await prismaClient.bookmark.findMany({
        where: { userId: id },
      });
      const isBookmarked = userBookmarkedData.some(
        (bookmark: { miniNewsId: string }) => bookmark.miniNewsId === news.id,
      );
      return {
        ...news,
        isBookmarked,
      };
    }
    return news;
  }
}
