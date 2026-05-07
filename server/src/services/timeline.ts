import { prismaClient } from "../lib/db";

const monthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

type MonthName = (typeof monthNames)[number];

const monthMap: Record<MonthName, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

export class TimeLineService {
  public static async getTimeLine() {
    const news = await prismaClient.miniNews.findMany({
      select: {
        pubDate: true,
      },
    });

    const grouped: Record<string, number> = {};

    for (const item of news) {
      const year = item.pubDate.getFullYear().toString();

      grouped[year] = (grouped[year] || 0) + 1;
    }

    return Object.fromEntries(
      Object.entries(grouped).sort(([a], [b]) => Number(b) - Number(a)),
    );
  }

  public static async getTimeLineOfYear(year: number) {
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    const news = await prismaClient.miniNews.findMany({
      where: {
        pubDate: {
          gte: start,
          lt: end,
        },
      },
      select: {
        pubDate: true,
      },
    });

    const grouped: Record<string, number> = {};

    for (const item of news) {
      const month = monthNames[item.pubDate.getMonth()];

      grouped[month] = (grouped[month] || 0) + 1;
    }

    return grouped;
  }

  public static async getTimeLineOfMonth(month: string) {
    const lowerMonth = month.toLowerCase() as MonthName;
    const monthNum = monthMap[lowerMonth];

    if (!monthNum) {
      throw new Error("Invalid month name");
    }

    const news = await prismaClient.miniNews.findMany({
      where: {
        pubDate: {
          gte: new Date(`2000-${String(monthNum).padStart(2, "0")}-01`),
          lt: new Date(`2000-${String(monthNum + 1).padStart(2, "0")}-01`),
        },
      },
      select: {
        pubDate: true,
        category: true,
      },
    });

    const grouped: Record<string, Record<string, number>> = {};

    for (const item of news) {
      const day = item.pubDate.getDate().toString();

      if (!grouped[day]) {
        grouped[day] = {};
      }

      for (const category of item.category) {
        grouped[day][category] = (grouped[day][category] || 0) + 1;
      }
    }

    return grouped;
  }

  public static async getTimeLineOfDay(dateInt: number) {
    const date = new Date(dateInt);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const news = await prismaClient.miniNews.findMany({
      where: {
        pubDate: {
          gte: start,
          lte: end,
        },
      },
      select: {
        category: true,
      },
    });

    const grouped: Record<string, number> = {};

    for (const item of news) {
      for (const category of item.category) {
        grouped[category] = (grouped[category] || 0) + 1;
      }
    }

    return grouped;
  }
}
