import HelpQuestion from "../models/helpQuestionModel.js";

// User: ask a question
export const askQuestion = async (req, res) => {
  try {
    const q = await HelpQuestion.create({
      userId: req.user._id,
      question: req.body.question,
    });
    res.json(q);
  } catch (err) {
    res.status(500).json({ error: "Failed to submit question" });
  }
};

// User: list all answered questions
export const listQuestions = async (_req, res) => {
  try {
    const qs = await HelpQuestion.find().populate("userId", "name").sort({ createdAt: -1 });
    res.json(qs);
  } catch {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

// Admin: answer a question
export const answerQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;
    const q = await HelpQuestion.findByIdAndUpdate(
      id,
      { answer, status: "answered" },
      { new: true }
    );
    res.json(q);
  } catch {
    res.status(500).json({ error: "Failed to answer question" });
  }
};
