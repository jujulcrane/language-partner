import express from "express";
import { db } from "../firebaseAdmin";          // already initialised admin SDK
import admin from "firebase-admin";             // for FieldValue
import { verifyFirebaseToken } from '../middleware/auth';

const router = express.Router();
const { FieldValue } = admin.firestore;

// Middleware to verify the user owns the resource
const verifyUserOwnership = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { uid } = req.params;

  if (!req.uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (uid !== req.uid) {
    return res.status(403).json({ error: 'Forbidden: You can only access your own data' });
  }

  next();
};

// GET name from Firestore
router.get("/api/users/:uid/name", verifyFirebaseToken, verifyUserOwnership, async (req, res) => {
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

/* PUT /api/users/:uid/name  { name: "Alice" } */
router.put('/api/users/:uid/name', verifyFirebaseToken, verifyUserOwnership, async (req, res) => {
  try {
    const { uid }   = req.params;
    const { name }  = req.body as { name?: string };

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Missing “name” in body' });
    }

    await db.collection('users').doc(uid).set({ name }, { merge: true });
    res.status(200).json({ name });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMessage });
  }
});

/* ───────────────────────────────────────────────
   1)  START a new session
   POST /api/users/:uid/sessions
   body: { jlptLevel: "N4", grammarPrompt: "てもいい" }
   returns: { sessionId }
───────────────────────────────────────────────── */
router.post("/api/users/:uid/sessions", verifyFirebaseToken, verifyUserOwnership, async (req, res) => {
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
router.post("/api/users/:uid/sessions/:sid/turns", verifyFirebaseToken, verifyUserOwnership, async (req, res) => {
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
router.get("/api/users/:uid/sessions", verifyFirebaseToken, verifyUserOwnership, async (req, res) => {
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
router.get("/api/users/:uid/sessions/:sid/turns", verifyFirebaseToken, verifyUserOwnership, async (req, res) => {
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

/* ───────────────────────────────────────────────
   5)  DELETE a session (and its turns)
   DELETE /api/users/:uid/sessions/:sid
───────────────────────────────────────────────── */
router.delete("/api/users/:uid/sessions/:sid", verifyFirebaseToken, verifyUserOwnership, async (req, res) => {
  try {
    const { uid, sid } = req.params;

    const sessionRef = db
      .collection("users")
      .doc(uid)
      .collection("sessions")
      .doc(sid);

    // 1 delete every turn under the session
    const turnsSnap = await sessionRef.collection("turns").get();
    const batch = db.batch();
    turnsSnap.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    // 2 delete the session document itself
    await sessionRef.delete();

    res.status(204).send();   // no-content success
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});


export default router;
