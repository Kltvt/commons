const express = require("express");
const { z } = require("zod");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");

// mergeParams lets this router read :id from the parent /api/posts/:id mount
const router = express.Router({ mergeParams: true });

const replySchema = z.object({
  body: z.string().trim().min(1, "Write a reply first.").max(5000),
});

router.get("/", async (req, res) => {
  const replies = await prisma.reply.findMany({
    where: { postId: req.params.id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true } } },
  });
  res.json({ replies });
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = replySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: "That post doesn't exist." });

  const reply = await prisma.reply.create({
    data: { body: parsed.data.body, postId: req.params.id, authorId: req.user.id },
    include: { author: { select: { id: true, name: true } } },
  });

  res.status(201).json({ reply });
});

router.delete("/:replyId", requireAuth, async (req, res) => {
  const reply = await prisma.reply.findUnique({ where: { id: req.params.replyId } });
  if (!reply) return res.status(404).json({ error: "That reply doesn't exist." });
  if (reply.authorId !== req.user.id) {
    return res.status(403).json({ error: "You can only delete your own replies." });
  }
  await prisma.reply.delete({ where: { id: req.params.replyId } });
  res.status(204).send();
});

module.exports = router;
