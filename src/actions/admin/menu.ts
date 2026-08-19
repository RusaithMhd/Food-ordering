'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/permissions/withAuth';
import { revalidatePath } from 'next/cache';

export const createMenuItem = withAuth(
  async (formData: FormData) => {
    try {
      const name = formData.get('name') as string;
      const realDescription = formData.get('description') as string || '';
      const base_price = parseFloat(formData.get('base_price') as string);
      const branch_id = formData.get('branch_id') as string;
      const category_id = formData.get('category_id') as string;
      const preparation_time = parseInt(formData.get('preparation_time') as string) || 15;
      const image_url = formData.get('image_url') as string;

      if (!name || !base_price || !branch_id || !category_id) {
        return { success: false, error: 'Missing required fields' };
      }

      const selectedMeals: string[] = [];
      if (formData.get('meal_breakfast') === 'on') selectedMeals.push('breakfast');
      if (formData.get('meal_lunch') === 'on') selectedMeals.push('lunch');
      if (formData.get('meal_dinner') === 'on') selectedMeals.push('dinner');
      const description = `${realDescription}||meals:${selectedMeals.join(',')}`;

      const supabase = await createAdminClient();

      const { error } = await supabase.from('menu_items').insert({
        name,
        description,
        base_price,
        branch_id,
        category_id,
        preparation_time_minutes: preparation_time,
        image_url: image_url || null,
        is_active: true,
        is_vegetarian: formData.get('is_vegetarian') === 'on',
      });

      if (error) throw error;

      revalidatePath('/admin/menu');
      revalidatePath('/'); // Revalidate customer menu too
      return { success: true };
    } catch (error) {
      console.error('Failed to create menu item:', error);
      return { success: false, error: 'Failed to create menu item' };
    }
  },
  { requiredRoles: ['ADMIN', 'MANAGER', 'SUPER_ADMIN'] }
);

export const deleteMenuItem = withAuth(
  async (id: string) => {
    try {
      const supabase = await createAdminClient();
      const { error } = await supabase.from('menu_items').delete().eq('id', id);

      if (error) throw error;

      revalidatePath('/admin/menu');
      revalidatePath('/');
      return { success: true };
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      return { success: false, error: 'Failed to delete menu item' };
    }
  },
  { requiredRoles: ['ADMIN', 'MANAGER', 'SUPER_ADMIN'] }
);

export const updateMenuItem = withAuth(
  async (formData: FormData) => {
    try {
      const id = formData.get('id') as string;
      const name = formData.get('name') as string;
      const realDescription = formData.get('description') as string || '';
      const base_price = parseFloat(formData.get('base_price') as string);
      const category_id = formData.get('category_id') as string;
      const preparation_time = parseInt(formData.get('preparation_time') as string) || 15;
      const image_url = formData.get('image_url') as string;

      if (!id || !name || !base_price || !category_id) {
        return { success: false, error: 'Missing required fields' };
      }

      const selectedMeals: string[] = [];
      if (formData.get('meal_breakfast') === 'on') selectedMeals.push('breakfast');
      if (formData.get('meal_lunch') === 'on') selectedMeals.push('lunch');
      if (formData.get('meal_dinner') === 'on') selectedMeals.push('dinner');
      const description = `${realDescription}||meals:${selectedMeals.join(',')}`;

      const supabase = await createAdminClient();

      const { error } = await supabase.from('menu_items').update({
        name,
        description,
        base_price,
        category_id,
        preparation_time_minutes: preparation_time,
        image_url: image_url || null,
        is_vegetarian: formData.get('is_vegetarian') === 'on',
      }).eq('id', id);

      if (error) throw error;

      revalidatePath('/admin/menu');
      revalidatePath('/'); 
      return { success: true };
    } catch (error) {
      console.error('Failed to update menu item:', error);
      return { success: false, error: 'Failed to update menu item' };
    }
  },
  { requiredRoles: ['ADMIN', 'MANAGER', 'SUPER_ADMIN'] }
);
