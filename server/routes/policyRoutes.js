import express from "express";
import { GoogleGenAI } from "@google/genai";
import Policy from "../models/Policy.js";

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Generate a security policy
router.post("/generate", async (req, res) => {
  try {
    const { organization, policyType, requirements } = req.body;

    if (!organization || !policyType || !requirements) {
      return res.status(400).json({
        success: false,
        message:
          "Organization, policy type, and requirements are required.",
      });
    }

    const prompt = `You are a cybersecurity policy expert.
Generate a professional security policy draft using the details below.

Organization: ${organization}
Policy Type: ${policyType}
Requirements: ${requirements}

Include sections:
1. Purpose
2. Scope
3. Policy Rules
4. Roles and Responsibilities
5. Security Controls
6. Incident Reporting
7. Compliance and Review

Use clear, professional language. Do not claim that the draft guarantees compliance with any law or standard.`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
      contents: prompt,
    });

    res.json({
      success: true,
      policy: response.text,
    });
  } catch (error) {
    console.error("Policy generation failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to generate the security policy. Please try again.",
    });
  }
});

// Save a generated policy
router.post("/save", async (req, res) => {
  try {
    const {
      organization,
      policyType,
      requirements,
      generatedPolicy,
    } = req.body;

    if (
      !organization?.trim() ||
      !policyType?.trim() ||
      !requirements?.trim() ||
      !generatedPolicy?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All policy fields are required.",
      });
    }

    const savedPolicy = await Policy.create({
      organization: organization.trim(),
      policyType: policyType.trim(),
      requirements: requirements.trim(),
      generatedPolicy: generatedPolicy.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Policy saved successfully.",
      policy: savedPolicy,
    });
  } catch (error) {
    console.error("Policy save failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to save the policy. Please try again.",
    });
  }
});
// Get all saved policies
router.get("/saved", async (req, res) => {
  try {
    const policies = await Policy.find()
      .sort({ createdAt: -1 })
      .select("-__v");

    res.json({
      success: true,
      policies,
    });
  } catch (error) {
    console.error("Fetching policies failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch saved policies.",
    });
  }
});

router.delete("/saved/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid policy ID.",
      });
    }

    const deletedPolicy = await Policy.findByIdAndDelete(id);

    if (!deletedPolicy) {
      return res.status(404).json({
        success: false,
        message: "Policy not found.",
      });
    }

    res.json({
      success: true,
      message: "Policy deleted successfully.",
    });
  } catch (error) {
    console.error("Policy deletion failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to delete the policy.",
    });
  }
});


 // Update an existing saved policy
router.put("/saved/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      organization,
      policyType,
      requirements,
      generatedPolicy,
    } = req.body;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid policy ID.",
      });
    }

    if (
      [organization, policyType, requirements, generatedPolicy]
        .some((value) => typeof value !== "string" || !value.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "All policy fields are required.",
      });
    }

    const updatedPolicy = await Policy.findByIdAndUpdate(
      id,
      {
        organization: organization.trim(),
        policyType: policyType.trim(),
        requirements: requirements.trim(),
        generatedPolicy: generatedPolicy.trim(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedPolicy) {
      return res.status(404).json({
        success: false,
        message: "Policy not found.",
      });
    }

    return res.json({
      success: true,
      message: "Policy updated successfully.",
      policy: updatedPolicy,
    });
  } catch (error) {
    console.error("Policy update failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update the policy.",
    });
  }
});

export default router;