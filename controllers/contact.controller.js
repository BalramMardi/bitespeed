import { identifyContact } from "../services/contact.service.js";

const identify = async (req, res) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({
      error: "Either email or phoneNumber must be provided.",
    });
  }

  try {
    const result = await identifyContact(email, String(phoneNumber || ""));
    return res.status(200).json({ contact: result });
  } catch (error) {
    console.error("Error in identify controller:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export { identify };
