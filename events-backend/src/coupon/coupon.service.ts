import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Coupon } from './coupon.entity';
import { CouponUsage } from './coupon-usage.entity';
import { Event } from '../event/event.entity';
import { CreateCouponDto } from './coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepo: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private couponUsageRepo: Repository<CouponUsage>,
    @InjectRepository(Event)
    private eventRepo: Repository<Event>,
  ) {}

  async createCoupon(dto: CreateCouponDto) {
    // Check if voucher name already exists
    const existingCoupon = await this.couponRepo.findOne({ 
      where: { name: dto.name } 
    });
    
    if (existingCoupon) {
      throw new BadRequestException('Voucher name already exists');
    }

    // Validate date range: validFrom should be before validTo
    if (dto.validFrom && dto.validTo && new Date(dto.validFrom) > new Date(dto.validTo)) {
      throw new BadRequestException('validFrom date must be before validTo date');
    }

    // Sanitize eventId: empty string or invalid value causes FK violation. Use undefined for global coupon.
    const couponData: Partial<Coupon> = { ...dto };
    const eventId = couponData.eventId;
    if (eventId === '' || eventId === undefined || eventId === null || (typeof eventId === 'string' && !eventId.trim())) {
      couponData.eventId = undefined;
    } else {
      // Validate event exists when eventId is provided
      const eventExists = await this.eventRepo.findOne({ where: { id: eventId } });
      if (!eventExists) {
        throw new BadRequestException(`Event not found for eventId: ${eventId}`);
      }
    }

    const coupon = this.couponRepo.create(couponData);
    return this.couponRepo.save(coupon);
  }

  /** Map coupon to public response (only fields shown to user) */
  private toPublicCouponResponse(coupon: Coupon): {
    id: string;
    name: string;
    actualValue: number;
    discountValue: number;
    discountType: string;
    validFrom: Date;
    validTo: Date;
  } {
    return {
      id: coupon.id,
      name: coupon.name,
      actualValue: coupon.actualValue ?? 0,
      discountValue: coupon.discountValue ?? 0,
      discountType: coupon.discountType,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom) : new Date(),
      validTo: coupon.validTo ? new Date(coupon.validTo) : new Date(),
    };
  }

  async getAllCoupons(eventId?: string, isAdmin = false) {
    let coupons: Coupon[];
    if (eventId) {
      // Get coupons for specific event or global coupons (eventId is null)
      coupons = await this.couponRepo.find({
        where: [
          { eventId: eventId },
          { eventId: IsNull() } // Global coupons
        ],
        relations: ['event']
      });
    } else {
      coupons = await this.couponRepo.find({ relations: ['event'] });
    }
    // Admin sees full data; user sees only public fields
    if (isAdmin) {
      return coupons;
    }
    return coupons.map((c) => this.toPublicCouponResponse(c));
  }

  async getCouponsByEventId(eventId: string) {
    return this.couponRepo.find({
      where: { eventId },
      relations: ['event']
    });
  }

  async getCouponById(id: string) {
    const coupon = await this.couponRepo.findOne({ 
      where: { id },
      relations: ['event']
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async getCouponByName(name: string) {
    const coupon = await this.couponRepo.findOne({ 
      where: { name },
      relations: ['event']
    });
    if (!coupon) {
      throw new NotFoundException('Voucher not found');
    }
    return coupon;
  }

  async validateAndApplyCoupon(name: string, userId: string, orderAmount: number): Promise<any> {
    // 1. Check if voucher exists and is active
    const coupon = await this.couponRepo.findOne({ where: { name } });
    if (!coupon) throw new NotFoundException('Invalid voucher name');
    if (!coupon.isActive) throw new BadRequestException('Voucher is not active');

    // 2. Check validity date range
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day for date comparison
    
    if (coupon.validFrom) {
      const validFrom = new Date(coupon.validFrom);
      validFrom.setHours(0, 0, 0, 0);
      if (now < validFrom) {
        throw new BadRequestException('Voucher is not yet valid');
      }
    }
    
    if (coupon.validTo) {
      const validTo = new Date(coupon.validTo);
      validTo.setHours(0, 0, 0, 0);
      if (now > validTo) {
        throw new BadRequestException('Voucher has expired');
      }
    }

    // 3. Check minimum order value
    if (orderAmount < coupon.actualValue) {
      throw new BadRequestException(`Minimum order value should be ${coupon.actualValue}`);
    }

    // 4. Check usage limit for this user
    const usageCount = await this.couponUsageRepo.count({
      where: { userId, couponId: coupon.id }
    });
    if (usageCount >= coupon.usageLimit) {
      throw new BadRequestException('You have already used this coupon maximum times');
    }

    // 5. Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderAmount * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }

    return {
      coupon,
      discount,
      finalAmount: orderAmount - discount
    };
  }

  async recordCouponUsage(userId: string, couponId: string, orderId: string) {
    const usage = this.couponUsageRepo.create({
      userId,
      couponId,
      orderId
    });
    return this.couponUsageRepo.save(usage);
  }

  async updateCoupon(id: string, dto: Partial<CreateCouponDto>) {
    const coupon = await this.getCouponById(id);
    Object.assign(coupon, dto);
    return this.couponRepo.save(coupon);
  }

  async deleteCoupon(id: string) {
    const coupon = await this.getCouponById(id);
    // Force delete: remove all associated coupon usages first
    await this.couponUsageRepo.delete({ couponId: id });
    await this.couponRepo.remove(coupon);
    return { message: 'Coupon and all associated usages deleted successfully' };
  }
}