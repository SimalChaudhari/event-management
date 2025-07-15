import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

import { Event } from '../event/event.entity';
import { Order } from '../order/order.entity';
import { OrderItemEntity } from '../order/event.item.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { UserEntity, UserRole } from 'user/users.entity';

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
} 