import express from "express";
import { db } from "../firebaseAdmin";

const router = express.Router();

// GET document(s) from Firestore
router.get("/api/items", async (req, res) => {
  try {
    const snapshot = await db.collection("items").get();
    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(docs);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// POST a new document
router.post("/api/items", async (req, res) => {
  try {
    const data = req.body;
    const docRef = await db.collection("items").add(data);
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
