# 📰 EventMesh: AI-Driven News Aggregation & Timeline Backend

**EventMesh** is a backend system that crawls news from the internet, analyzes each article using LLMs + vector embeddings, and automatically builds **timelines of related events**.  
It exposes all processed data through a production-ready **GraphQL** and **REST API**.

The project contains two major modules:

```
.
├── cron/      # Scraping + embedding + event/timeline clustering
└── server/    # GraphQL + REST API backend
```

---

# 🚀 Features (Complete + Accurate)

## **1. Multi-source News Scraping**
The cron module pulls articles from **three independent sources**:

### ✔ Website News (RSS Feeds)
- Uses multiple RSS URLs  
- Parses XML → JSON  
- Normalizes (title, content, pubDate, link, image)

### ✔ YouTube News (YouTube Channel RSS)
- Scrapes YouTube RSS feed using channel IDs  
- Useful for speech-based news, political events, briefings

### ✔ Twitter/X News (Nitter RSS)
- Uses Nitter instance RSS feed  
- Gets tweet text, media, and timestamps  
- Converts tweets to article-like objects

All scraped raw articles are written to:

```
articles.json          # website news
yt-articles.json       # YouTube news
twitter-articles.json  # Twitter/Nitter news
```

Each file then goes into the AI pipeline.

---

## **2. AI-Powered Event Understanding**

Every article passes through **three intelligent steps**:

### ✔ A) Semantic Embedding + Vector Search (Pinecone)
- Build `queryText = title + content`
- Generate embedding
- Search Pinecone for **top 10 most similar articles**
- Fetch MiniNews for each similar ID

This forms the candidate set for LLM comparison.

---

### ✔ B) LLM Relationship Detection  
LLM decides how the current article relates to existing timelines.

It outputs JSON:

```json
{
  "matchType": "same-event" | "timeline" | "unrelated",
  "id": "<miniNewsId or 'none'>",
  "title": "<matched article title>"
}
```

#### Meaning:
- **same-event** → same real-world incident  
- **timeline** → different update of the same story  
- **unrelated** → new story

LLM uses:
- title  
- content/excerpts  
- pubDate  
- 10 similar articles  

---

### ✔ C) LLM Category Classification  
LLM chooses the category index from a fixed array:

```
["Politics", "Business", "Crime", ...]
```

If no match → category = `"Others"`.

---

## **3. Timeline Construction Logic**

Based on LLM output:

### ✔ `unrelated`
- Create new `News` root timeline
- Add a new `MiniNews` under it

### ✔ `timeline`
- Create new `MiniNews`
- Set parent timeline ID = relatedId from LLM
- Append as new update to an existing story

### ✔ `same-event`
- Update existing MiniNews:
  - Append link
  - Append source
  - Avoid duplicates

This gradually forms **clusters of related events**.

---

## **4. Database + Vector Setup**

### ✔ Postgres ORM (Prisma)
Main storage for:
- News  
- MiniNews  
- Users  
- Bookmarks  
- Timelines  

### ✔ Pinecone
Stores text embeddings → enables similarity search.

### ✔ Cloudinary
Handles profile image uploads.

---

## **5. GraphQL API (Primary Interface)**

### Queries:
- `getNews` → search + pagination  
- `getNewsByCategory`  
- `getNewsOfSameParent`  
- `getTimeLine` (yearly count)  
- `getTimeLineOfYear`  
- `getTimeLineOfMonth`  
- `getTimeLineOfDay`  
- `getBookmarks`

### Mutations:
- `createUser` / login  
- `updateUserName`  
- `createBookmark`  
- `deleteBookmark`  
- `deleteAllBookmarks`

### Subscriptions:
- `newlyAddedNews`

Everything secured with JWT.

---

## **6. REST API**

Base:
```
backend_base_url/api/v1
```

### Endpoints include:
- Google OAuth login URL  
- Google OAuth callback  
- Update profile image (with multer + Cloudinary)  
- Bookmark operations (create/delete/deleteAll)  

JWT required for protected routes.

---

# 🏗 Architecture Overview

```
          +----------------------------------+
          |              cron                 |
          |----------------------------------|
Sources → | RSS / YouTube RSS / Nitter RSS    |
          | Save as JSON                      |
          | processNewsFromFile()             |
          |  → embed + Pinecone search        |
          |  → LLM match-type classification  |
          |  → LLM category classification    |
          |  → DB insert / merge logic        |
          |  → Pinecone upsert                |
          +--------------------+--------------+
                               |
        (processed news)       v
          +--------------------+--------------+
          |                  server           |
          |----------------------------------|
          | GraphQL API (query/mutation/sub) |
          | REST API                         |
          | Prisma → Postgres                |
          | Cloudinary uploads               |
          +----------------------------------+
```

---

# 🔧 Tech Stack

- **Node.js**, **TypeScript**
- **GraphQL**
- **Express REST**
- **Prisma (Postgres)**
- **Pinecone**
- **Cloudinary**
- **LLMs (OpenAI/Groq/Cohere depending on env)**

---

# 📂 Folder Structure

```
.
├── cron/
│   ├── src/
│   │   ├── index.ts              # Scraper entry
│   │   ├── embed.ts              # Vector search + clustering
│   │   ├── processArticle.ts     # Category + match logic
│   │   └── utils/
│   └── *.json                    # Raw scraped data
│
└── server/
    ├── src/
    │   ├── graphql/              # Schemas + resolvers
    │   ├── services/             # Timeline, news, bookmarks
    │   ├── routes/               # REST routing
    │   └── utils/
    └── prisma/schema.prisma
```

---

# ⚙️ Setup

### **1. Clone**

```bash
git clone https://github.com/midsane/EventMesh
cd EventMesh
```

### **2. Install**

```bash
npm install
```

### **3. Environment Variables**

Requires:
- Postgres URL  
- Pinecone API key + index  
- OAuth client + secret  
- Cloudinary credentials  
- JWT secret  

### **4. Run scraper (cron)**

```
cd cron
npm run start
```

### **5. Run server**

```
cd server
npm run dev
```

---

# 🧪 Example GraphQL Queries

### Timeline by Year
```graphql
query {
  getTimeLine
}
```

### Category Search
```graphql
query {
  getNewsByCategory(category: "Politics", lim: 20, offset: 0)
}
```

---

# ⏳ Cron Pipeline Summary

1. Fetch RSS/YouTube/Twitter news  
2. Save raw JSON  
3. For each item:
   - embedding → Pinecone  
   - similarity search  
   - LLM match decision  
   - LLM category classification  
   - DB create/update  
   - Pinecone upsert  

System improves as DB and vector store grow.

---

# 📘 For Details  
Check:
- `cron/src/embed.ts`
- `cron/src/processArticle.ts`
- `server/prisma/schema.prisma`
- All resolvers in `server/src/graphql/*`
- All REST routes in `server/src/routes/*`

