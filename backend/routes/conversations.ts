import express from "express";
import { db } from "../firebaseAdmin";          // already initialised admin SDK
import admin from "firebase-admin";             // for FieldValue

const router = express.Router();
const { FieldValue } = admin.firestore;

// GET name from Firestore
router.get("/api/users/:uid/name", async (req, res) => {
  const { uid } = req.params;
  try {
    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    const userData = userSnap.data();
    res.status(200).json({ name: userData?.name || "Unknown" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/* ───────────────────────────────────────────────
   1)  START a new session
   POST /api/users/:uid/sessions
   body: { jlptLevel: "N4", grammarPrompt: "てもいい" }
   returns: { sessionId }
───────────────────────────────────────────────── */
router.post("/api/users/:uid/sessions", async (req, res) => {
  try {
    const { uid } = req.params;
    const { jlptLevel, grammarPrompt } = req.body;

    const doc = await db
      .collection("users")
      .doc(uid)
      .collection("sessions")
      .add({
        jlptLevel,
        grammarPrompt,
        createdAt: FieldValue.serverTimestamp(),
        lastTurnAt: FieldValue.serverTimestamp(),
      });

    res.status(201).json({ sessionId: doc.id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ───────────────────────────────────────────────
   2)  ADD a turn to an existing session
   POST /api/users/:uid/sessions/:sid/turns
   body: { userText, partnerReply, feedback, jlptLevel, grammarPrompt }
───────────────────────────────────────────────── */
router.post("/api/users/:uid/sessions/:sid/turns", async (req, res) => {
  try {
    const { uid, sid } = req.params;
    const { userText, partnerReply, feedback, jlptLevel, grammarPrompt } =
      req.body;

    const turnsRef = db
      .collection("users")
      .doc(uid)
      .collection("sessions")
      .doc(sid)
      .collection("turns");

    await turnsRef.add({
      userText,
      partnerReply,
      feedback,
      jlptLevel,
      grammarPrompt,
      createdAt: FieldValue.serverTimestamp(),
    });

    // keep session's lastTurnAt fresh
    await db
      .collection("users")
      .doc(uid)
      .collection("sessions")
      .doc(sid)
      .update({ lastTurnAt: FieldValue.serverTimestamp() });

    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ───────────────────────────────────────────────
   3)  LIST sessions (history overview)
   GET /api/users/:uid/sessions
───────────────────────────────────────────────── */
router.get("/api/users/:uid/sessions", async (req, res) => {
  try {
    const { uid } = req.params;

    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("sessions")
      .orderBy("lastTurnAt", "desc")
      .get();

    const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ───────────────────────────────────────────────
   4)  GET full turns of one session
   GET /api/users/:uid/sessions/:sid/turns
───────────────────────────────────────────────── */
router.get("/api/users/:uid/sessions/:sid/turns", async (req, res) => {
  try {
    const { uid, sid } = req.params;

    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("sessions")
      .doc(sid)
      .collection("turns")
      .orderBy("createdAt")
      .get();

    const turns = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(turns);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
