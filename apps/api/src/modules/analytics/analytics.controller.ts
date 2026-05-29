import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('analytics')
@Roles('admin')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.analytics.getDashboardSummary();
  }

  @Get('trending')
  getTrending(@Query('limit') limit?: string) {
    return this.analytics.getTrending(limit ? parseInt(limit) : 20);
  }

  @Get('searches')
  getTopSearches(@Query('limit') limit?: string) {
    return this.analytics.getTopSearches(limit ? parseInt(limit) : 10);
  }

  @Get('live-users')
  getLiveUsers() {
    return this.analytics.getLiveUserCount().then((count) => ({ count }));
  }

  @Get('revenue')
  getRevenue(@Query('date') date?: string) {
    return this.analytics.getDailyRevenue(date).then((amount) => ({ date, amount }));
  }
}
