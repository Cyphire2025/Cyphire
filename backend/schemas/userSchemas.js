import { z } from "zod";

export const updateMeSchema = z.object({
  name: z.string().min(2).max(40).optional(),
  country: z.string().max(64).optional(),
  phone: z.string().max(32).optional(),
  skills: z.union([
    z.array(z.string().max(32)),
    z.string(), // allow comma-separated string
  ]).optional(),
  bio: z.string().max(300).optional(),
});

export const saveProjectsSchema = z.object({
  projects: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      link: z.string().optional(),
    })
  ),
});

export const uploadProjectMediaSchema = z.object({});

export const updateProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  link: z.string().optional(),
});

export const setUserPlanSchema = z.object({
  plan: z.enum(["free", "plus", "ultra"]),
});
