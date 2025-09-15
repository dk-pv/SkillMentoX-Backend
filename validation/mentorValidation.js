

import Joi from "joi";
import { courseCategories } from "../data/courseCategories.js";

const courseValidation = Joi.object({
  category: Joi.string()
    .valid(...Object.keys(courseCategories))
    .required(),
  courseName: Joi.string()
    .required()
    .custom((value, helpers) => {
      const { category } = helpers.state.ancestors[0];
      const availableCourses =
        courseCategories[category]?.Stacks ||
        courseCategories[category]?.Languages ||
        [];
      if (!availableCourses.includes(value)) {
        return helpers.error("any.invalid", {
          message: `Invalid course name "${value}" for category "${category}"`,
        });
      }
      return value;
    }, "CourseName validation"),
  _id: Joi.string().optional(),
});

export const mentorProfileSchema = Joi.object({
  fullName: Joi.string().min(3).max(100).required(),
  headline: Joi.string().max(150).required(),
  bio: Joi.string().max(1000).allow(""),
  currentRole: Joi.string().max(100).allow(""),
  company: Joi.string().max(100).allow(""),
  yearsOfExperience: Joi.number().min(0).max(50).optional(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .allow("")
    .optional(),
  gender: Joi.string().valid("Male", "Female").allow("").optional(),
  linkedin: Joi.string().uri().allow(""),
  github: Joi.string().uri().allow(""),
  portfolio: Joi.string().uri().allow(""),
  education: Joi.array()
    .items(
      Joi.object({
        degree: Joi.string().required(),
        institution: Joi.string().required(),
        year: Joi.string().required(),
        _id: Joi.string().optional(),
      })
    )
    .optional(),
  certifications: Joi.array().items(Joi.string()).optional(),
  courses: Joi.array().items(courseValidation).min(1).required(),
  documents: Joi.object({
    idProof: Joi.array().items(Joi.string().uri()).optional(),
    qualificationProof: Joi.array().items(Joi.string().uri()).optional(),
    cv: Joi.array().items(Joi.string().uri()).optional(),
  }).optional(),
});
