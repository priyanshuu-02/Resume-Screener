import Job from "../models/Job.js";

export async function createJob(title, description, userId = null) {
  return Job.create({ userId: userId || null, title, description });
}

export async function getAllJobs(userId = null) {
  const query = userId ? { userId } : {};
  return Job.find(query).sort({ createdAt: -1 });
}

export async function getJobById(id, userId = null) {
  const query = { _id: id };
  if (userId) query.userId = userId;
  return Job.findOne(query);
}

export async function deleteJob(id, userId = null) {
  const query = { _id: id };
  if (userId) query.userId = userId;
  const result = await Job.findOneAndDelete(query);
  return !!result;
}
