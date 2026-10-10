import { siteRepository } from '../repositories/siteRepository';
import { cameraRepository } from '../repositories/cameraRepository';
import { alertRepository } from '../repositories/alertRepository';
import { riskRepository } from '../repositories/riskRepository';
import { DashboardSummary } from '../models';

export class DashboardService {
  async getSummary(): Promise<DashboardSummary> {
    const [totalSites, activeCameras, openAlerts, criticalAlerts, todayEvents] = await Promise.all([
      siteRepository.count(),
      cameraRepository.countActive(),
      alertRepository.countOpen(),
      alertRepository.countCritical(),
      riskRepository.countTodayEvents(),
    ]);

    return {
      totalSites,
      activeCameras,
      openAlerts,
      criticalAlerts,
      todayEvents,
    };
  }

  async getRiskTrends(days = 7) {
    return riskRepository.getDailyTrends(days);
  }

  async getSiteSummary() {
    const [sites, siteRisks, alerts] = await Promise.all([
      siteRepository.findAll(),
      riskRepository.getLatestRiskPerSite(),
      alertRepository.findAll({ status: 'OPEN' }),
    ]);

    const riskMap = new Map(siteRisks.map((r) => [r.site_id, r]));
    const alertCountMap = new Map<string, number>();

    for (const a of alerts) {
      const siteId = (a as any).site_id;
      if (siteId) {
        alertCountMap.set(siteId, (alertCountMap.get(siteId) || 0) + 1);
      }
    }

    return sites.map((site) => {
      const latestRisk = riskMap.get(site.id);
      return {
        ...site,
        latestRiskLevel: latestRisk?.risk_level || 'LOW',
        latestRiskScore: latestRisk?.overall_score || 0,
        latestRiskExplanation: latestRisk?.explanation || 'Routine monitoring active.',
        openAlertCount: alertCountMap.get(site.id) || 0,
      };
    });
  }
}

export const dashboardService = new DashboardService();


