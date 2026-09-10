const express = require("express");
const { z } = require("zod");
const prisma = require("../db");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

const authorSelect = { select: { id: true, name: true } };

// GET /api/posts?type=idea|blog|news&cursor=<postId>&limit=20
router.get("/", async (req, res) => {
  const { type, cursor } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  const where = {};
  if (type && ["idea", "blog", "news"].includes(type)) {
    where.type = type.toUpperCase();
  }

  const posts = await prisma.post.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      author: authorSelect,
      _count: { select: { replies: true } },
    },
  });

  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;

  res.json({
    posts: page.map((p) => ({ ...p, replyCount: p._count.replies, _count: undefined })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});

const createPostSchema = z.object({
  type: z.enum(["idea", "blog", "news"]),
  title: z.string().trim().max(200).optional(),
  tag: z.string().trim().max(40).optional(),
  body: z.string().trim().min(1, "Say something first.").max(20000),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { type, title, tag, body } = parsed.data;

  if (type !== "idea" && !title) {
    return res.status(400).json({ error: "Blog posts and news need a title." });
  }

  const post = await prisma.post.create({
    data: { type: type.toUpperCase(), title, tag, body, authorId: req.user.id },
    include: { author: authorSelect, _count: { select: { replies: true } } },
  });

  res.status(201).json({ post: { ...post, replyCount: post._count.replies, _count: undefined } });
});

router.get("/:id", optionalAuth, async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: {
      author: authorSelect,
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: authorSelect },
      },
    },
  });
  if (!post) return res.status(404).json({ error: "That post doesn't exist." });
  res.json({ post });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: "That post doesn't exist." });
  if (post.authorId !== req.user.id) {
    return res.status(403).json({ error: "You can only delete your own posts." });
  }
  await prisma.post.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = router;
