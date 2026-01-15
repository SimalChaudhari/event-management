import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

import { Event } from '../event/event.entity';
import { EventExhibitor } from '../event/event.entity';
import { Order } from '../order/order.entity';
import { OrderItemEntity } from '../order/event.item.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { UserEntity, UserRole } from 'user/users.entity';
import { Exhibitor } from '../exhibitor/exhibitor.entity';
import { EventBooth } from '../event/event-booth.entity';
import { ExhibitorLead } from '../exhibitor/exhibitor-lead.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItemEntity)
    private orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(Exhibitor)
    private exhibitorRepository: Repository<Exhibitor>,
    @InjectRepository(EventExhibitor)
    private eventExhibitorRepository: Repository<EventExhibitor>,
    @InjectRepository(EventBooth)
    private eventBoothRepository: Repository<EventBooth>,
    @InjectRepository(ExhibitorLead)
    private exhibitorLeadRepository: Repository<ExhibitorLead>,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalEvents,
      upcomingEvents,
      completedEvents,
      eventsThisMonth,
      totalOrders,
      totalRevenue,
      totalParticipants,
    ] = await Promise.all([
      this.userRepository.count({ where: { role: UserRole.User } }),
      this.userRepository.count({ where: {  isVerify: true } }),
      this.eventRepository.count(),
      this.eventRepository.count({
        where: { startDate: new Date() },
      }),
      this.eventRepository.count({
        where: { endDate: new Date() },
      }),
      this.eventRepository.count({
        where: {
          createdAt: Between(
            new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999)
          ),
        },
      }),
      this.orderRepository.count(),
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.price)', 'total')
        .getRawOne(),
      this.registerEventRepository.count(),
    ]);

    const revenue = totalRevenue?.total || 0;

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      events: {
        total: totalEvents,
        upcoming: upcomingEvents,
        thisMonth: eventsThisMonth,
      },
      revenue: {
        total: revenue,
      },
      participants: {
        total: totalParticipants
      },

    };
  }

  async getRecentActivities() {
    const recentEvents = await this.eventRepository.find({
      order: { createdAt: 'DESC' },
      take: 2,
    });

    const recentUsers = await this.userRepository.find({
      order: { createdAt: 'DESC' },
      take: 2,
    });

    const recentOrders = await this.orderRepository.find({
      order: { createdAt: 'DESC' },
      take: 2,
    });

    const activities: any[] = [];

    // Add recent events
    recentEvents.forEach((event) => {
      activities.push({
        id: `event-${event.id}`,
        type: 'event',
        action: 'New event created',
        title: event.name,
        time: event.createdAt,
        status: 'success',
      });
    });

    // Add recent users
    recentUsers.forEach((user) => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user',
        action: 'New user registered',
        title: user.firstName,
        time: user.createdAt,
        status: 'info',
      });
    });

    // Add recent orders
    recentOrders.forEach((order) => {
      activities.push({
        id: `order-${order.id}`,
        type: 'payment',
        action: 'Payment received',
        title: `₹${order.price}`,
        time: order.createdAt,
        status: 'success',
      });
    });
    

    // activities sort getTime() use
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
  }

  async getSystemHealth() {
    return {
      server: 'Online',
      database: 'Active',
      api: 'Running',
      ssl: 'Secure',
      uptime: 99.9,
      responseTime: 2.3,
      satisfactionScore: 4.6,
    };
  }

  async getTopEvents() {
    // Get all events (both upcoming and past)
    const allEvents = await this.eventRepository.find({
      order: { startDate: 'DESC' }
    });

    // for each event calculate attendance count and revenue
    const eventsWithStats = await Promise.all(
      allEvents.map(async (event) => {
        // Attendance count
        const attendanceCount = await this.registerEventRepository.count({
          where: { eventId: event.id }
        });

        // Revenue calculation (OrderItemEntity from event orders revenue)
        const eventRevenue = await this.orderRepository
          .createQueryBuilder('order')
          .leftJoin('order.orderItems', 'orderItem')
          .leftJoin('orderItem.event', 'event')
          .where('event.id = :eventId', { eventId: event.id })
          .andWhere('order.status = :status', { status: 'Completed' })
          .select('SUM(order.price)', 'totalRevenue')
          .getRawOne();
        
        const totalRevenue = eventRevenue?.totalRevenue || 0;
        const isUpcoming = new Date(event.startDate) > new Date();

        return {
          id: event.id,
          name: event.name,
          totalAttendance: attendanceCount,
          totalRevenue: parseFloat(totalRevenue),
          isUpcoming: isUpcoming,
          startDate: event.startDate
        };
      })
    );

    // Sort by priority: High Revenue + Upcoming events first
    const sortedEvents = eventsWithStats
      .sort((a, b) => {
        // Priority 1: High Revenue (70% weight)
        const revenueScoreA = a.totalRevenue * 0.7;
        const revenueScoreB = b.totalRevenue * 0.7;
        
        // Priority 2: Upcoming events (30% weight)
        const upcomingScoreA = a.isUpcoming ? 1000 : 0; // Bonus for upcoming
        const upcomingScoreB = b.isUpcoming ? 1000 : 0;
        
        // Combined score
        const totalScoreA = revenueScoreA + upcomingScoreA;
        const totalScoreB = revenueScoreB + upcomingScoreB;
        
        return totalScoreB - totalScoreA; // Highest score first
      })
      .slice(0, 5); // Only top 5

    return sortedEvents;
  }

  async getPerformanceData() {
    // Get total counts
    const [
      totalExhibitors,
      activeExhibitors,
      totalBooths,
      activeBooths,
      totalCompaniesResult,
      totalUsers,
      activeUsers,
    ] = await Promise.all([
      this.exhibitorRepository.count(),
      this.exhibitorRepository.count({ where: { isActive: true } }),
      this.eventBoothRepository.count(),
      this.eventBoothRepository.count({ where: { isActive: true } }),
      this.exhibitorRepository
        .createQueryBuilder('exhibitor')
        .select('COUNT(DISTINCT exhibitor.companyName)', 'count')
        .getRawOne(),
      this.userRepository.count({ where: { role: UserRole.User } }),
      this.userRepository.count({ where: { role: UserRole.User, isVerify: true } }),
    ]);

    const totalCompanies = parseInt(totalCompaniesResult?.count || '0', 10);

    // Get leads/scans count
    const totalLeads = await this.exhibitorLeadRepository.count();

    // Get top performing exhibitors (by leads)
    const topExhibitors = await this.exhibitorLeadRepository
      .createQueryBuilder('lead')
      .select('lead.exhibitorId', 'exhibitorId')
      .addSelect('COUNT(lead.id)', 'leadCount')
      .groupBy('lead.exhibitorId')
      .orderBy('COUNT(lead.id)', 'DESC') // Use actual expression instead of alias for PostgreSQL compatibility
      .limit(5)
      .getRawMany();

    const exhibitorIds = topExhibitors.map((e) => e.exhibitorId).filter((id) => id);
    let exhibitorDetails: Exhibitor[] = [];
    if (exhibitorIds.length > 0) {
      exhibitorDetails = await this.exhibitorRepository.find({
        where: exhibitorIds.map((id) => ({ id })),
        select: ['id', 'companyName'],
      });
    }

    const topExhibitorsWithNames = topExhibitors.map((exhibitor) => {
      const details = exhibitorDetails.find((e) => e.id === exhibitor.exhibitorId);
      return {
        exhibitorId: exhibitor.exhibitorId,
        companyName: details?.companyName || 'Unknown',
        leadCount: parseInt(exhibitor.leadCount || exhibitor.leadcount || '0', 10), // Handle case sensitivity
      };
    });

    // Get top performing booths (by leads)
    // Use a more efficient query with proper joins
    let topBooths: { boothCode: string; leadCount: number }[] = [];
    try {
      const topBoothsRaw = await this.exhibitorLeadRepository
        .createQueryBuilder('lead')
        .innerJoin(EventBooth, 'booth', 'booth.exhibitorId = lead.exhibitorId AND booth.eventId = lead.eventId')
        .select('booth.uniqueCode', 'boothCode')
        .addSelect('COUNT(lead.id)', 'leadCount')
        .where('booth.uniqueCode IS NOT NULL')
        .andWhere('booth.uniqueCode != :empty', { empty: '' })
        .groupBy('booth.uniqueCode')
        .orderBy('COUNT(lead.id)', 'DESC') // Use the actual expression instead of alias
        .limit(5)
        .getRawMany();

      topBooths = topBoothsRaw.map((b) => ({
        boothCode: b.boothCode || b.boothCode,
        leadCount: parseInt(b.leadCount || b.leadcount || '0', 10), // Handle case sensitivity
      }));
    } catch (error) {
      console.error('Error fetching top booths:', error);
      // Fallback: return empty array if query fails
      topBooths = [];
    }

    // Get user activity (registrations by month for last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    
    // Get all users created in last 6 months and group by month manually
    const allUsers = await this.userRepository.find({
      where: {
        role: UserRole.User,
        createdAt: Between(sixMonthsAgo, new Date()),
      },
      select: ['createdAt'],
    });

    const userRegistrationsByMonth: { [key: string]: number } = {};
    allUsers.forEach((user) => {
      const monthKey = `${user.createdAt.getFullYear()}-${String(user.createdAt.getMonth() + 1).padStart(2, '0')}`;
      userRegistrationsByMonth[monthKey] = (userRegistrationsByMonth[monthKey] || 0) + 1;
    });

    const userRegistrations = Object.entries(userRegistrationsByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Get exhibitor leads by month for last 6 months
    const allLeads = await this.exhibitorLeadRepository.find({
      where: {
        createdAt: Between(sixMonthsAgo, new Date()),
      },
      select: ['createdAt'],
    });

    const leadsByMonth: { [key: string]: number } = {};
    allLeads.forEach((lead) => {
      const monthKey = `${lead.createdAt.getFullYear()}-${String(lead.createdAt.getMonth() + 1).padStart(2, '0')}`;
      leadsByMonth[monthKey] = (leadsByMonth[monthKey] || 0) + 1;
    });

    const exhibitorLeadsByMonth = Object.entries(leadsByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      exhibitors: {
        total: totalExhibitors,
        active: activeExhibitors,
        topPerformers: topExhibitorsWithNames,
      },
      booths: {
        total: totalBooths,
        active: activeBooths,
        topPerformers: topBooths.map((b) => ({
          boothCode: b.boothCode,
          leadCount: b.leadCount,
        })),
      },
      companies: {
        total: totalCompanies,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        registrationsByMonth: userRegistrations,
      },
      leads: {
        total: totalLeads,
        byMonth: exhibitorLeadsByMonth,
      },
    };
  }
} 