import mongoose from "mongoose";

const policySchema = new mongoose.Schema(
  {
    organization: {
      type: String,
      required: true,
      trim: true,
    },
    policyType: {
      type: String,
      required: true,
    },
    requirements: {
      type: String,
      required: true,
    },
    generatedPolicy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Policy = mongoose.model("Policy", policySchema);

export default Policy;