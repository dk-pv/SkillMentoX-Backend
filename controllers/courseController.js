import { courseCategories } from "../data/courseCategories.js";
import { coursePlans } from "../data/coursePlans.js";

export const getAllCourses = (req, res) => {
  res.json(courseCategories);
};

export const getCoursePlan = (req, res) => {
  const { stackName } = req.params;
const course = coursePlans[stackName];
  
  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  res.json(course);
};