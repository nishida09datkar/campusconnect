import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { Material, Attachment } from '@/types';

export const materialService = {
  async getClassMaterials(classId: string): Promise<Material[]> {
    await delay(100, 200);
    return db.materials
      .filter((m) => m.classId === classId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  },

  async getMaterialById(id: string): Promise<Material | null> {
    await delay(60, 120);
    const material = db.materials.find((m) => m.id === id);
    return material ? { ...material } : null;
  },

  async createMaterial(
    classId: string,
    authorId: string,
    data: {
      title: string;
      description?: string;
      attachments?: Attachment[];
    }
  ): Promise<Material> {
    await delay(150, 300);
    const newMaterial: Material = {
      id: `mat-${Date.now()}`,
      classId,
      authorId,
      title: data.title.trim(),
      description: data.description?.trim(),
      attachments: data.attachments || [],
      uploadedAt: new Date().toISOString(),
    };

    db.materials.unshift(newMaterial);
    return { ...newMaterial };
  },

  async deleteMaterial(materialId: string): Promise<boolean> {
    await delay(100, 200);
    const index = db.materials.findIndex((m) => m.id === materialId);
    if (index !== -1) {
      db.materials.splice(index, 1);
      return true;
    }
    return false;
  },
};
