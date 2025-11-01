import HelpQuestion from "../models/helpQuestionModel.js";
import User from "../models/userModel.js";

/** POST /api/help/questions — User asks question */
export const askQuestion = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || question.trim().length < 8) {
      return res.status(400).json({ error: "Question must be at least 8 characters" });
    }
    const q = await HelpQuestion.create({
      user: req.user._id,
      question: question.trim(),
      status: "open",
      auditLog: [{
        action: "asked",
        user: req.user._id,
        at: new Date(),
      }]
    });
    res.status(201).json({ question: q });
  } catch (e) {
    res.status(500).json({ error: "Failed to submit question" });
  }
};

/** PATCH /api/help/questions/:id/answer — Admin answers/edits */
export const answerQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;
    const q = await HelpQuestion.findById(id);
    if (!q) return res.status(404).json({ error: "Not found" });

    const prevAnswer = q.answer;
    q.answer = answer || "";
    q.status = "answered";
    q.answeredBy = req.user._id;
    q.answeredAt = new Date();
    q.auditLog.push({
      action: prevAnswer ? "edited" : "answered",
      user: req.user._id,
      prevAnswer,
      newAnswer: answer,
      at: new Date(),
    });
    await q.save();

    res.json({ question: q });
  } catch (e) {
    res.status(500).json({ error: "Failed to answer question" });
  }
};

/** PATCH /api/help/questions/:id/show — Admin toggles show/hide */
export const toggleShowOnHelpPage = async (req, res) => {
  try {
    const { id } = req.params;
    const q = await HelpQuestion.findById(id);
    if (!q) return res.status(404).json({ error: "Not found" });
    const prevShow = !!q.showOnHelpPage;
    q.showOnHelpPage = !prevShow;
    q.auditLog.push({
      action: "showToggled",
      user: req.user._id,
      prevShow,
      newShow: q.showOnHelpPage,
      at: new Date(),
    });
    await q.save();
    res.json({ question: q });
  } catch (e) {
    res.status(500).json({ error: "Failed to toggle show" });
  }
};

/** GET /api/help/questions — User: fetch only "answered" & showOnHelpPage */
export const getRecentQuestions = async (req, res) => {
  try {
    const qs = await HelpQuestion.find({ status: "answered", showOnHelpPage: true })
      .sort({ answeredAt: -1 })
      .limit(20)
      .select("question answer answeredAt")
      .lean();
    res.json({ items: qs });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

/** GET /api/admin/questions — Admin: all questions with user info */
export const getAllQuestionsAdmin = async (req, res) => {
  try {
    const qs = await HelpQuestion.find({})
      .populate("user", "email name")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items: qs });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

/** GET /api/admin/questions/audit/:id — Admin: audit log for question */
export const getQuestionAuditLog = async (req, res) => {
  try {
    const { id } = req.params;
    const q = await HelpQuestion.findById(id).select("auditLog").lean();
    if (!q) return res.status(404).json({ error: "Not found" });
    res.json({ auditLog: q.auditLog });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
};
