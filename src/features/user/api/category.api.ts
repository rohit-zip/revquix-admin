import { apiClient } from "@/lib/axios"
import type {
  CategoryWithSkills,
  CurrentUserResponse,
  RemoveCategoryWarning,
  UpdateUserCategoriesRequest,
  UpdateUserSkillsRequest,
} from "./user.types"

/**
 * Fetches the complete catalogue of active categories with their nested skills.
 * Used to render the category/skill picker.
 */
export const getAllCategoriesWithSkills = (): Promise<CategoryWithSkills[]> =>
  apiClient.get<CategoryWithSkills[]>("/user/categories").then((r) => r.data)

/**
 * Replaces the user's category selection.
 * Any skills belonging to removed categories are also removed server-side.
 */
export const updateUserCategories = (
  data: UpdateUserCategoriesRequest,
): Promise<CurrentUserResponse> =>
  apiClient.put<CurrentUserResponse>("/user/me/categories", data).then((r) => r.data)

/**
 * Gets a warning about which skills will be removed if a category is deleted.
 * Call this before showing the remove-category confirmation dialog.
 */
export const getCategoryRemovalWarning = (
  categoryId: string,
): Promise<RemoveCategoryWarning> =>
  apiClient
    .get<RemoveCategoryWarning>(`/user/me/categories/${categoryId}/remove-warning`)
    .then((r) => r.data)

/**
 * Removes a single category from the user's selection.
 * All skills under that category are also removed from the user's skill set.
 */
export const removeUserCategory = (categoryId: string): Promise<CurrentUserResponse> =>
  apiClient
    .delete<CurrentUserResponse>(`/user/me/categories/${categoryId}`)
    .then((r) => r.data)

/**
 * Replaces the user's skill selection.
 * Each skill must belong to a category already in the user's selection.
 */
export const updateUserSkills = (
  data: UpdateUserSkillsRequest,
): Promise<CurrentUserResponse> =>
  apiClient.put<CurrentUserResponse>("/user/me/skills", data).then((r) => r.data)

/**
 * Removes a single skill from the user's skill set.
 */
export const removeUserSkill = (skillId: string): Promise<CurrentUserResponse> =>
  apiClient.delete<CurrentUserResponse>(`/user/me/skills/${skillId}`).then((r) => r.data)

