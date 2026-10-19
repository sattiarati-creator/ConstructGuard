import { siteRepository, CreateSiteDTO } from '../repositories/siteRepository';
import { Site } from '../models';
import { auditService } from './auditService';

export class SiteService {
  async getAllSites(): Promise<Site[]> {
    return siteRepository.findAll();
  }

  async getSiteById(id: string): Promise<Site | null> {
    return siteRepository.findById(id);
  }

  async createSite(data: CreateSiteDTO, userId?: string): Promise<Site> {
    const site = await siteRepository.create(data);
    await auditService.log({
      userId,
      action: 'SITE_CREATED',
      entityType: 'SITE',
      entityId: site.id,
      metadata: { name: site.name, address: site.address },
    });
    return site;
  }

  async updateSite(id: string, data: Partial<CreateSiteDTO>, userId?: string): Promise<Site | null> {
    const site = await siteRepository.update(id, data);
    if (site) {
      await auditService.log({
        userId,
        action: 'SITE_UPDATED',
        entityType: 'SITE',
        entityId: site.id,
        metadata: data as Record<string, unknown>,
      });
    }
    return site;
  }

  async deleteSite(id: string, userId?: string): Promise<boolean> {
    const deleted = await siteRepository.delete(id);
    if (deleted) {
      await auditService.log({
        userId,
        action: 'SITE_DELETED',
        entityType: 'SITE',
        entityId: id,
      });
    }
    return deleted;
  }
}

export const siteService = new SiteService();
